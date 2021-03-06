import * as crypto from 'crypto';
import { ParsedQs } from 'qs';

const SENTENCE_SALT = '8hd3e8sddFSdfj';

/**
 * Needs to behave like the client side hash() in /web/src/utility.ts
 */
export function hashClientId(text: string) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Used to hash sentences in import-sentences.ts
 */
export function hashSentence(str: string) {
  return crypto.createHmac('sha256', SENTENCE_SALT).update(str).digest('hex');
}

/**
 * Get elapsed seconds from timestamp.
 */
export function getElapsedSeconds(timestamp: number): number {
  return Math.round((Date.now() - timestamp) / 1000);
}

/**
 * Returns the first defined argument. Returns null if there are no defined
 * arguments.
 */
export function getFirstDefined(...options: any[]) {
  for (let i = 0; i < options.length; i++) {
    if (options[i] !== undefined) {
      return options[i];
    }
  }
  return null;
}

export const queryCursor = (query: ParsedQs) => (query.cursor ? JSON.parse(<string>query.cursor) : null);

export class APIError extends Error {
  constructor(message?: string) {
    // 'Error' breaks prototype chain here
    super(message);

    // restore prototype chain
    const actualProto = new.target.prototype;

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      (this as any).__proto__ = new.target.prototype;
    }
  }
}

export class ServerError extends APIError {}

export class ClientError extends APIError {}

export class ClientParameterError extends ClientError {
  constructor() {
    super('Invalid Parameters');
  }
}
