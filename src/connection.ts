import { Boom } from '@hapi/boom';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  WASocket,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isJidStatusBroadcast,
  useMultiFileAuthState,
} from 'baileys';
import { general } from './configuration/general';
import qrcode from 'qrcode-terminal';
import { logger } from './utils/logger';
import fs from 'fs';
import { shouldIgnoreSpamHard } from './middlewares/onAntiSpam';

export const connect: () => Promise<WASocket> = async () => {
  try {
    console.log('🟢 Iniciando conexão com Whatsapp\n');
    const defaultVersion = [2, 3000, 1028397221];
    const envVer = process.env.WA_VERSION;
    const cliVer = process.argv[2];
    const parseVer = (v: string) =>
      v
        .split(',')
        .map((x) => parseInt(x.trim(), 10))
        .filter((n) => !Number.isNaN(n));

    let versionArr = defaultVersion.slice();
    if (cliVer) versionArr = parseVer(cliVer);
    else if (envVer) versionArr = parseVer(envVer);

    const version: [number, number, number] = [
      versionArr[0] ?? defaultVersion[0],
      versionArr[1] ?? defaultVersion[1],
      versionArr[2] ?? defaultVersion[2],
    ];

    logger.info(`Using WA Web version: ${version.join(',')}`);

    const { state, saveCreds } = await useMultiFileAuthState(
      './assets/auth/baileys',
    );
    const bot = makeWASocket({
      browser: Browsers.appropriate('Desktop'),
      logger: logger,
      printQRInTerminal: true,
      version,
      defaultQueryTimeoutMs: 30 * 1000,
      auth: state,
      shouldIgnoreJid: (jid) => {
        const timestamp = new Date().toISOString();
        logger.debug(
          `🔍 [${timestamp}] shouldIgnoreJid called with: ${jid} | general.NUMBER_BOT: ${general.NUMBER_BOT}`,
        );

        if (shouldIgnoreSpamHard(jid)) {
          logger.debug(
            `🚫 Anti-spam: Ignoring JID ${jid} due to spam detection (warning already sent)`,
          );
          return true;
        }

        if (isJidBroadcast(jid) || isJidStatusBroadcast(jid)) {
          logger.debug(`🚫 Ignoring broadcast/status JID: ${jid}`);
          return true;
        }

        if (isJidNewsletter(jid)) {
          logger.debug(`✅ Processing newsletter JID: ${jid} - NEVER IGNORE`);
          return false;
        }

        if (jid === general.NUMBER_BOT) {
          const isDev = process.env.NODE_ENV?.toLowerCase() === 'development';
          logger.debug(
            `${isDev ? '✅' : '🚫'} ${
              isDev ? 'Development' : 'Production'
            } mode: ${
              isDev ? 'Processing' : 'Ignoring'
            } self message from: ${jid}`,
          );
          return !isDev;
        }

        const isDev = process.env.NODE_ENV?.toLowerCase() === 'development';

        if (isDev) {
          logger.debug(`🔧 Development mode: Processing JID ${jid}`);

          if (isJidGroup(jid)) {
            const shouldProcess = general.GROUP_SECURE.includes(jid);
            logger.debug(
              `👥 Group JID ${jid} - Should process (not ignore): ${shouldProcess}`,
            );
            return !shouldProcess;
          }

          const isAuthorizedHost = general.NUMBERS_HOSTS.includes(jid);
          logger.debug(
            `👤 Individual JID ${jid} - Is authorized host: ${isAuthorizedHost}, Should ignore: ${!isAuthorizedHost}`,
          );
          return !isAuthorizedHost;
        } else {
          if (isJidGroup(jid)) {
            logger.debug(`🚀 Production mode: Processing group JID ${jid}`);
            return false;
          }

          logger.debug(`🚀 Production mode: Processing individual JID ${jid}`);
          return false;
        }
      },
      keepAliveIntervalMs: 30 * 1000,
      markOnlineOnConnect: true,
    });

    bot.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      try {
        logger.debug(
          'connection.update full payload: ' + JSON.stringify(update),
        );
        if (update) {
          Object.keys(update).forEach((key) => {
            logger.debug(
              `Update-Key: ${key}, Value: ${JSON.stringify(
                (update as any)[key],
              )}`,
            );
          });
        }
      } catch (err) {
        logger.debug(
          'Failed to stringify connection.update payload: ' + String(err),
        );
      }
      switch (connection) {
        case 'close': {
          const statusCode =
            lastDisconnect?.error instanceof Boom
              ? lastDisconnect.error.output?.statusCode
              : undefined;

          if (statusCode === DisconnectReason.loggedOut) {
            logger.error(
              '🔴 Bot desconectado! Por conta disso, vamos remover a pasta de autenticação e você terá que conectar novamente o bot',
            );

            try {
              await fs.promises.rm('./assets/auth/baileys', {
                recursive: true,
                force: true,
              });
              logger.info(
                '\n\n🗑️✨ Pasta de autenticação removida com sucesso! Faça login novamente para continuar. 🔑📲\n\n',
              );
            } catch (err) {
              logger.error(
                '❌🚫 Erro ao remover a pasta de autenticação: ' + String(err),
              );
            }
          } else {
            switch (statusCode) {
              case DisconnectReason.badSession:
                logger.warn('❌ Sessão inválida!');
                break;
              case DisconnectReason.connectionClosed:
                logger.warn('🔒 Conexão fechada!');
                break;
              case DisconnectReason.connectionLost:
                logger.warn('📡 Conexão perdida!');
                break;
              case DisconnectReason.connectionReplaced:
                logger.warn('♻️ Conexão substituída!');
                break;
              case DisconnectReason.multideviceMismatch:
                logger.warn('📱 Dispositivo incompatível!');
                break;
              case DisconnectReason.forbidden:
                logger.warn('🚫 Conexão proibida!');
                break;
              case DisconnectReason.restartRequired:
                logger.info(
                  '\n\n\n🔄 Me reinicie por favor! Digite "npm start" ou caso esteja em modo de desenvolvimento, Digite "npm run dev".\n\n\n',
                );
                break;
              case DisconnectReason.unavailableService:
                logger.warn('⛔ Serviço indisponível!');
                break;
            }

            logger.debug('🔒 Conexão fechada');
            const shouldReconnect =
              (lastDisconnect?.error as Boom)?.output?.statusCode !==
              DisconnectReason.loggedOut;

            if (shouldReconnect) {
              logger.info('🔄 Tentando reconectar...');
              setTimeout(() => {
                connect().catch((error) => {
                  logger.error('❌ Erro na reconexão:', error);
                  process.exit(1);
                });
              }, 5000);
            }
            break;
          }
          break;
        }
        case 'open':
          logger.debug('🔥 Bot Conectado');
          break;
        case 'connecting':
          logger.debug('🔄 Conectando...');
          break;
      }

      if (qr !== undefined) {
        logger.debug('🔑 QR Code gerado');
        qrcode.generate(qr, { small: true });
      }
    });

    bot.ev.on('creds.update', saveCreds);

    bot.ev.on('call', async (calls) => {
      for (const call of calls) {
        if (call.status === 'offer') {
          try {
            await bot.rejectCall(call.id, call.from);
            logger.info(
              `📞❌ Chamada recusada automaticamente de: ${call.from}`,
            );
          } catch (error) {
            logger.error(
              `❌ Erro ao recusar chamada de ${call.from}: ` + String(error),
            );
          }
        }
      }
    });

    return bot;
  } catch (error) {
    logger.error('❌ Erro na conexão com WhatsApp: ' + String(error));
    throw error;
  }
};
