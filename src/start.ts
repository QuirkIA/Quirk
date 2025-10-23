import "./polyfill-crypto";

import onMessagesUpsert from "./middlewares/onMessagesUpsert";
import { logger } from "./utils/logger";
import { connect } from "./connection";
import { sendRandomAutoCommandFromCache } from "./middlewares/sendRandomAutoCommand";
require("dotenv").config();

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Erro não capturado:');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason }, 'Promise rejeitada não tratada:');
  process.exit(1);
});

async function start(): Promise<void> {
  try {
    logger.info("🟡 Iniciando...\n");
    const bot = await connect();

    function scheduleRandomExecution() {
      const min = 1_500_000;
      const max = 3_600_000;
      const randomDelay = Math.floor(Math.random() * (max - min)) + min;
      setTimeout(async () => {
        await sendRandomAutoCommandFromCache(bot);
        scheduleRandomExecution();
      }, randomDelay);
    }
    scheduleRandomExecution();

    await onMessagesUpsert(bot);
  } catch (error) {
    logger.error({ error }, 'Erro durante a inicialização:');
    process.exit(1);
  }
}

start();
