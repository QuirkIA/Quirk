import fs from "fs";
import path from "path";
import { WASocket, proto } from "baileys";
import autoCommand from "../utils/autoCommand";
import { logger } from "../utils/logger";

export async function sendRandomAutoCommandFromCache(bot: WASocket): Promise<void> {
  const cachePath = path.resolve(__dirname, "../../cache/cache.json");
  let cache: string[] = [];
  try {
    const raw = fs.readFileSync(cachePath, "utf-8");
    cache = JSON.parse(raw);
  } catch (err) {
    logger.error({ err }, "Erro ao ler cache.json:");
    return;
  }
  if (!Array.isArray(cache) || cache.length === 0) {
    logger.warn("Nenhum destino encontrado em cache.json");
    return;
  }
  const randomIndex = Math.floor(Math.random() * cache.length);
  const randomDest = cache[randomIndex];

  if (!randomDest || typeof randomDest !== 'string' || !randomDest.includes('@g.us')) {
    logger.warn(`JID sorteado inválido: ${randomDest}`);
    return;
  }

  const newMessage: proto.IWebMessageInfo = {
    key: {
      remoteJid: randomDest,
      id: Math.random().toString(36).slice(2),
      fromMe: true,
    },
  };

  try {
    await autoCommand(bot, newMessage);
  } catch (err) {
    logger.error({ err, randomDest }, 'Erro ao executar autoCommand para JID');
  }
}
