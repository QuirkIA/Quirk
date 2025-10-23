import { logger } from './logger';


class RateLimiter {
 private static requests = new Map<string, number[]>();
 private static readonly WINDOW_MS = 60000;
 private static readonly MAX_REQUESTS = 30;

 public static canSend(recipient: string): boolean {
  const now = Date.now();
  const requests = RateLimiter.requests.get(recipient) || [];


  const validRequests = requests.filter(time => now - time < RateLimiter.WINDOW_MS);

  if (validRequests.length >= RateLimiter.MAX_REQUESTS) {
   logger.warn(`🚫 Rate limit atingido para ${recipient}`);
   return false;
  }


  validRequests.push(now);
  RateLimiter.requests.set(recipient, validRequests);

  return true;
 }

 public static getDelay(totalRecipients: number): number {

  if (totalRecipients <= 10) return 500;
  if (totalRecipients <= 50) return 750;
  if (totalRecipients <= 100) return 1000;
  return 1500;
 }

 public static cleanup(): void {
  const now = Date.now();
  for (const [recipient, requests] of RateLimiter.requests.entries()) {
   const validRequests = requests.filter(time => now - time < RateLimiter.WINDOW_MS);
   if (validRequests.length === 0) {
    RateLimiter.requests.delete(recipient);
   } else {
    RateLimiter.requests.set(recipient, validRequests);
   }
  }
 }
}


export class DataValidator {
 public static isValidJid(jid: string): boolean {
  if (!jid || typeof jid !== 'string') return false;


  const jidRegex = /^\d+@(s\.whatsapp\.net|g\.us)$/;
  return jidRegex.test(jid);
 }

 public static isValidGroupJid(jid: string): boolean {
  return this.isValidJid(jid) && jid.endsWith('@g.us');
 }

 public static isValidUserJid(jid: string): boolean {
  return this.isValidJid(jid) && jid.endsWith('@s.whatsapp.net');
 } public static sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';



  return text
   .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
   .substring(0, 4096)
   .trim();
 }

 public static isValidAction(action: string): boolean {
  const validActions = ['on', 'off', 'status', 'ativar', 'ativa', 'ligar',
   'desativar', 'desativa', 'desligar', 'verificar', 'check'];
  return validActions.includes(action.toLowerCase());
 }
}


export class ErrorRecovery {
 public static async retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
 ): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
   try {
    return await operation();
   } catch (error) {
    lastError = error as Error;
    logger.warn(`⚠️ Tentativa ${attempt}/${maxRetries} falhou: ${error}`);

    if (attempt < maxRetries) {
     await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
   }
  }

  throw new Error(`Operação falhou após ${maxRetries} tentativas: ${lastError!.message}`);
 }

 public static async safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage: string = 'Operação falhou'
 ): Promise<T> {
  try {
   return await operation();
  } catch (error) {
    logger.error({ error }, `❌ ${errorMessage}:`);
    return fallback;
  }
 }
}

export default RateLimiter;
