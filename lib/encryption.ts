// lib/encryption.ts
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-this';

export function encrypt(text: string): string {
  try {
    if (!text) return '';
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
}

export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText) return '';
    const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || encryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText;
  }
}