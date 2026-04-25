// assets/js/security.js
/**
 * Security Module - AES-GCM encryption with PBKDF2 key derivation
 * All secrets are derived from PIN + salt, master key never stored.
 */

class CryptoVault {
  constructor() {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  // Generate random salt (16 bytes)
  generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  // Derive a CryptoKey from PIN + salt using PBKDF2
  async deriveKey(pin, salt) {
    const enc = new TextEncoder();
    const pinBuffer = enc.encode(pin);
    const saltBuffer = salt instanceof Uint8Array ? salt : new Uint8Array(salt);
    
    const baseKey = await crypto.subtle.importKey(
      'raw',
      pinBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    return key;
  }

  // Encrypt any JSON-serializable data
  async encryptData(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
    const encodedData = this.encoder.encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedData
    );
    
    return {
      ciphertext: this._arrayBufferToBase64(encrypted),
      iv: this._arrayBufferToBase64(iv)
    };
  }

  // Decrypt data using key and encrypted object
  async decryptData(encryptedObj, key) {
    try {
      const ciphertext = this._base64ToArrayBuffer(encryptedObj.ciphertext);
      const iv = this._base64ToArrayBuffer(encryptedObj.iv);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );
      
      const decoded = this.decoder.decode(decrypted);
      return JSON.parse(decoded);
    } catch (err) {
      console.error('Decryption failed:', err);
      throw new Error('PIN incorrect o datos corruptos');
    }
  }

  // Helper: ArrayBuffer -> Base64
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Helper: Base64 -> ArrayBuffer
  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // secure wipe of sensitive data from memory
  secureWipe(obj) {
    if (!obj) return;
    // for strings
    if (typeof obj === 'string') {
      return '•••••';
    }
    // for arrays/objects, we nullify references (GC will clean)
    if (Array.isArray(obj)) {
      obj.length = 0;
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(k => {
        try { delete obj[k]; } catch(e) {}
      });
    }
    return null;
  }
}

// Expose globally
window.CryptoVault = CryptoVault;
