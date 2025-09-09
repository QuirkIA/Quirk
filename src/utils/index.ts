import {
  DownloadableMessage,
  downloadContentFromMessage,
  MediaType,
  proto,
  WASocket,
} from 'baileys';
import { general } from '../configuration/general';
import path from 'path';
import {
  IDefaultCommand,
  ICommandImports,
  ICommand,
} from '../interfaces/ICommand';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { logger } from './logger';

let commandCache: ICommandImports | null = null;

export function extractDataFromMessage(baileysMessage: proto.IWebMessageInfo) {
  // Extract text from various message types with more robust handling
  const textMessage: string =
    baileysMessage.message?.conversation ||
    baileysMessage.message?.ephemeralMessage?.message?.conversation ||
    '';
  
  const extendedTextMessage: string =
    baileysMessage.message?.extendedTextMessage?.text ||
    baileysMessage.message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
    '';
    
  const imageTextMessage: string =
    baileysMessage.message?.imageMessage?.caption ||
    baileysMessage.message?.ephemeralMessage?.message?.imageMessage?.caption ||
    '';
    
  const videoTextMessage: string =
    baileysMessage.message?.videoMessage?.caption ||
    baileysMessage.message?.ephemeralMessage?.message?.videoMessage?.caption ||
    '';
    
  // Handle additional message types that might contain commands
  const documentTextMessage: string =
    baileysMessage.message?.documentMessage?.caption ||
    baileysMessage.message?.ephemeralMessage?.message?.documentMessage?.caption ||
    '';
    
  const audioTextMessage: string =
    baileysMessage.message?.audioMessage?.caption ||
    baileysMessage.message?.ephemeralMessage?.message?.audioMessage?.caption ||
    '';
    
  // Handle viewOnce messages
  const viewOnceTextMessage: string =
    baileysMessage.message?.viewOnceMessage?.message?.imageMessage?.caption ||
    baileysMessage.message?.viewOnceMessage?.message?.videoMessage?.caption ||
    baileysMessage.message?.viewOnceMessageV2?.message?.imageMessage?.caption ||
    baileysMessage.message?.viewOnceMessageV2?.message?.videoMessage?.caption ||
    '';

  // Combine all possible text sources
  const fullMessage = textMessage || 
                     extendedTextMessage || 
                     imageTextMessage || 
                     videoTextMessage || 
                     documentTextMessage || 
                     audioTextMessage || 
                     viewOnceTextMessage;

  // Debug logging for message extraction issues
  if (!fullMessage && baileysMessage.message) {
    logger.debug('Message extraction failed for message type:', {
      messageKeys: Object.keys(baileysMessage.message),
      remoteJid: baileysMessage?.key?.remoteJid,
      messageId: baileysMessage?.key?.id
    });
  }

  if (!fullMessage) {
    return {
      fullMessage: '',
      remoteJid: baileysMessage?.key?.remoteJid,
      prefix: '',
      isGroup: baileysMessage?.key?.remoteJid?.endsWith('@g.us'),
      nickName: baileysMessage?.pushName,
      fromMe: baileysMessage?.key?.fromMe,
      commandName: '',
      idMessage: baileysMessage?.key?.id,
      participant: baileysMessage?.key?.participant,
      args: [],
      argsJoined: '',
    };
  }

  const [command, ...args] = fullMessage.split(' ');

  const prefix = command.charAt(0);
  const arg = args.reduce((acc, arg) => acc + ' ' + arg, '').trim();

  const commandWithoutPrefix = command.replace(
    new RegExp(`^[${general.PREFIX}]+`),
    '',
  );

  return {
    fullMessage,
    remoteJid: baileysMessage?.key?.remoteJid!,
    prefix,
    isGroup: baileysMessage?.key?.remoteJid?.endsWith('@g.us')!,
    nickName: baileysMessage?.pushName!,
    fromMe: baileysMessage?.key?.fromMe!,
    commandName: formatCommand(commandWithoutPrefix),
    idMessage: baileysMessage?.key?.id!,
    participant: baileysMessage?.key?.participant!,
    args: splitByCharacters(args.join(' '), ['\\', '|', '/']),
    argsJoined: arg,
  };
}

export const splitByCharacters = (str: string, characters: string[]) => {
  characters = characters.map((char: string) =>
    char === '\\' ? '\\\\' : char,
  );
  const regex = new RegExp(`[${characters.join('')}]`);

  return str
    .split(regex)
    .map((str) => str.trim())
    .filter(Boolean);
};

export const formatCommand = (text: string) => {
  return onlyLettersAndNumbers(
    removeAccentsAndSpecialCharacters(text.toLocaleLowerCase().trim()),
  );
};

export const onlyLettersAndNumbers = (text: string) => {
  return text.replace(/[^a-zA-Z0-9]/g, '');
};

export const removeAccentsAndSpecialCharacters = (text: string) => {
  if (!text) return '';

  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export const baileysIs = (
  baileysMessage: proto.IWebMessageInfo,
  context: string,
) => {
  return (
    !!baileysMessage.message?.[
      `${context}Message` as keyof typeof baileysMessage.message
    ] ||
    !!baileysMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[
      `${context}Message` as keyof typeof baileysMessage.message
    ]
  );
};

export const getContent = (
  baileysMessage: proto.IWebMessageInfo,
  type: string,
) => {
  return (
    baileysMessage.message?.[
      `${type}Message` as keyof typeof baileysMessage.message
    ] ??
    baileysMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[
      `${type}Message` as keyof typeof baileysMessage.message
    ]
  );
};

export const getContentUnique = (
  baileysMessage: proto.IWebMessageInfo,
  type: string,
) => {
  return (
    baileysMessage.message?.viewOnceMessageV2?.message?.[
      `${type}Message` as keyof typeof baileysMessage.message
    ] ??
    baileysMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[
      `${type}Message` as keyof typeof baileysMessage.message
    ]
  );
};

export const downloadVideo = async (baileysMessage: proto.IWebMessageInfo) => {
  return await downloadContent(baileysMessage, `${uuidv4()}`, 'video', 'mp4');
};

export const downloadImage = async (baileysMessage: proto.IWebMessageInfo) => {
  return await downloadContent(baileysMessage, `${uuidv4()}`, 'image', 'png');
};

export const downloadSticker = async (
  baileysMessage: proto.IWebMessageInfo,
) => {
  return await downloadContent(
    baileysMessage,
    `${uuidv4()}`,
    'sticker',
    'webp',
  );
};

export const downloadFile = async (
  baileysMessage: proto.IWebMessageInfo,
  fileType: string,
) => {
  return await downloadContent(
    baileysMessage,
    `${uuidv4()}`,
    'document',
    fileType,
  );
};

export const downloadAudio = async (baileysMessage: proto.IWebMessageInfo) => {
  return await downloadContent(baileysMessage, `${uuidv4()}`, 'audio', 'mp3');
};

const downloadContent = async (
  baileysMessage: proto.IWebMessageInfo,
  fileName: string,
  context: MediaType,
  extension: string,
) => {
  const content = getContent(baileysMessage, context) as DownloadableMessage;
  const contentUnique = getContentUnique(
    baileysMessage,
    context,
  ) as DownloadableMessage;

  if (content) {
    const stream = await downloadContentFromMessage(content, context);

    let buffer = Buffer.from([]);

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const filePath = path.resolve(general.TEMP_DIR, `${fileName}.${extension}`);
    fs.writeFileSync(filePath, buffer, { encoding: 'binary' });

    return filePath;
  }

  if (contentUnique) {
    const stream = await downloadContentFromMessage(contentUnique, context);

    let buffer = Buffer.from([]);

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const filePath = path.resolve(general.TEMP_DIR, `${fileName}.${extension}`);
    fs.writeFileSync(filePath, buffer, { encoding: 'binary' });

    return filePath;
  }

  if (!content || !contentUnique) return null;
};

export const extractCommandAndArgs = (message: string) => {
  if (!message) return { command: '', args: '' };

  const [command, ...tempArgs] = message.trim().split(' ');

  const args = tempArgs.reduce((acc, arg) => acc + ' ' + arg, '').trim();

  return { command, args };
};

export const isCommand = (message: string): boolean => {
  if (typeof message !== 'string') return false;
  return message.length > 1 && message.startsWith(general.PREFIX);
};

export const getRandomName = (extension?: string) => {
  const fileName = Math.floor(Math.random() * 10000);

  if (!extension) return fileName.toString();

  return `${fileName}.${extension}`;
};

export const findCommandImport: (commandName: string) => Promise<{
  type: string;
  command: IDefaultCommand | null;
}> = async (commandName: string) => {
  const command = await readCommandImports();

  let typeReturn = '';
  let targetCommandReturn: IDefaultCommand | null = null;

  for (const [type, commands] of Object.entries(command)) {
    if (!commands.length || type == 'auto') {
      continue;
    }

    const targetCommand: IDefaultCommand | undefined = commands.find((cmd) =>
      cmd?.default?.commands
        .map((cmd: string) => formatCommand(cmd))
        .includes(commandName),
    );

    if (targetCommand) {
      typeReturn = type;
      targetCommandReturn = targetCommand;
      break;
    }
  }

  return {
    type: typeReturn,
    command: targetCommandReturn,
  };
};

export const choiceRandomCommand: () => Promise<{
  type: string;
  command: ICommand | null;
}> = async () => {
  const command = await readCommandImports();

  let typeReturn = 'auto';

  const autoCommands = command[typeReturn];

  if (autoCommands && autoCommands.length > 0) {
    const randomIndex = Math.floor(Math.random() * autoCommands.length);
    const randomAutoCommand: ICommand = autoCommands[randomIndex].default;

    return {
      type: typeReturn,
      command: randomAutoCommand,
    };
  } else {
    return {
      type: typeReturn,
      command: null,
    };
  }
};

async function readCommandsRecursively(dir: string): Promise<any[]> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: any[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await readCommandsRecursively(fullPath)));
    } else if (
      !entry.name.startsWith('_') &&
      (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))
    ) {
      try {
        delete require.cache[require.resolve(fullPath)];

        const mod = require(fullPath);
        results.push(mod);

        logger.debug(`✅ Command loaded successfully: ${fullPath}`);
      } catch (err) {
        logger.error(`📛 Failed to load command ${fullPath}: ${err}`);
      }
    }
  }
  return results;
}

export const readCommandImports = async (): Promise<ICommandImports> => {
  if (commandCache) return commandCache;
  const commandImports: ICommandImports = {};
  const subdirectories = fs
    .readdirSync(general.COMMANDS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const subdir of subdirectories) {
    const subdirectoryPath = path.join(general.COMMANDS_DIR, subdir);
    const modules = await readCommandsRecursively(subdirectoryPath);
    commandImports[subdir] = modules;
  }

  commandCache = commandImports;
  return commandImports;
};

export const isAdminGroup: (
  bot: WASocket,
  baileysMessage: proto.IWebMessageInfo,
) => Promise<boolean> = async (
  bot: WASocket,
  baileysMessage: proto.IWebMessageInfo,
) => {
  if (extractDataFromMessage(baileysMessage).isGroup!) {
    const metadata = await bot.groupMetadata(
      extractDataFromMessage(baileysMessage).remoteJid!,
    );
    const admins = metadata.participants.filter(
      (participant) => participant?.admin != null,
    );
    const adminsIds = admins.map((admin) => admin.id);
    const isAdmin = adminsIds.includes(
      extractDataFromMessage(baileysMessage).participant!,
    );
    return isAdmin;
  }
  return false;
};

export const verifyIfIsAdmin: (
  type: string,
  bot: WASocket,
  baileysMessage: proto.IWebMessageInfo,
) => Promise<boolean> = async (
  type: string,
  bot: WASocket,
  baileysMessage: proto.IWebMessageInfo,
) => {
  if (type === 'admin') {
    const isAdmin = await isAdminGroup(bot, baileysMessage);
    return (
      !!isAdmin ||
      general.NUMBERS_HOSTS.includes(
        extractDataFromMessage(baileysMessage).participant!,
      ) ||
      general.NUMBER_BOT.includes(
        extractDataFromMessage(baileysMessage).remoteJid!,
      )
    );
  }
  return true;
};

export const verifyIfIsOwner: (
  type: string,
  baileysMessage: proto.IWebMessageInfo,
) => Promise<boolean> = async (
  type: string,
  baileysMessage: proto.IWebMessageInfo,
) => {
  if (type === 'owner') {
    if (extractDataFromMessage(baileysMessage).isGroup!) {
      return general.NUMBERS_HOSTS.includes(
        extractDataFromMessage(baileysMessage).participant!,
      );
    }
    return general.NUMBERS_HOSTS.includes(
      extractDataFromMessage(baileysMessage).remoteJid!,
    );
  }
  return true;
};

export const verifyIfIsGroupSecure: (
  type: string,
  baileysMessage: proto.IWebMessageInfo,
) => Promise<boolean> = async (
  type: string,
  baileysMessage: proto.IWebMessageInfo,
) => {
  if (type === 'secure' && extractDataFromMessage(baileysMessage).isGroup!) {
    return general.GROUP_SECURE.includes(
      extractDataFromMessage(baileysMessage).remoteJid!,
    );
  }
  return true;
};
