/**
 * Barcode Service
 * Handles barcode validation, auto-generation, checksum calculations, and formatting.
 */

class BarcodeService {
  /**
   * Calculate EAN-13 Checksum digit from 12 numeric characters
   */
  static calculateEan13Checksum(str12) {
    if (!/^\d{12}$/.test(str12)) return null;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(str12[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    return (10 - (sum % 10)) % 10;
  }

  /**
   * Calculate UPC-A Checksum digit from 11 numeric characters
   */
  static calculateUpcChecksum(str11) {
    if (!/^\d{11}$/.test(str11)) return null;
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(str11[i], 10);
      sum += (i % 2 === 0) ? digit * 3 : digit;
    }
    return (10 - (sum % 10)) % 10;
  }

  /**
   * Validate a barcode against its symbology type
   */
  static validateBarcode(barcode, type = 'CODE128') {
    if (!barcode || typeof barcode !== 'string') return false;
    const clean = barcode.trim();
    const upperType = (type || 'CODE128').toUpperCase();

    switch (upperType) {
      case 'EAN13':
      case 'EAN-13':
        if (!/^\d{13}$/.test(clean)) return false;
        const eanCheck = this.calculateEan13Checksum(clean.slice(0, 12));
        return parseInt(clean[12], 10) === eanCheck;

      case 'UPC':
      case 'UPC-A':
        if (!/^\d{12}$/.test(clean)) return false;
        const upcCheck = this.calculateUpcChecksum(clean.slice(0, 11));
        return parseInt(clean[11], 10) === upcCheck;

      case 'CODE128':
      case 'CODE-128':
        // ASCII printable characters 32 to 126
        return /^[\x20-\x7E]{2,80}$/.test(clean);

      case 'QR':
      case 'QRCODE':
        return clean.length >= 1 && clean.length <= 1000;

      default:
        return clean.length >= 1 && clean.length <= 100;
    }
  }

  /**
   * Generate a unique barcode candidate for a given symbology type
   */
  static generateBarcodeValue(type = 'CODE128', prefix = '') {
    const upperType = (type || 'CODE128').toUpperCase();

    if (upperType === 'EAN13' || upperType === 'EAN-13') {
      // 12 numeric digits: prefix (or 200 internal) + timestamp suffix + random
      const countryPrefix = '200'; // Standard in-store restricted circulation prefix
      const ts = Date.now().toString().slice(-6); // 6 digits
      const rnd = Math.floor(100 + Math.random() * 900).toString(); // 3 digits
      const base12 = (countryPrefix + ts + rnd).slice(0, 12);
      const check = this.calculateEan13Checksum(base12);
      return `${base12}${check}`;
    }

    if (upperType === 'UPC' || upperType === 'UPC-A') {
      // 11 numeric digits
      const ts = Date.now().toString().slice(-7);
      const rnd = Math.floor(1000 + Math.random() * 9000).toString().slice(0, 4);
      const base11 = (ts + rnd).slice(0, 11);
      const check = this.calculateUpcChecksum(base11);
      return `${base11}${check}`;
    }

    if (upperType === 'QR' || upperType === 'QRCODE') {
      const code = prefix ? `${prefix}-${Date.now()}` : `PROD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return code;
    }

    // Default CODE128: alphanumeric code e.g. AURA-83492-4912
    const cleanPrefix = prefix ? prefix.toUpperCase().replace(/[^A-Z0-9]/g, '') : 'AUR';
    const randPart = Math.floor(100000 + Math.random() * 900000);
    return `${cleanPrefix}-${Date.now().toString().slice(-4)}${randPart}`;
  }

  /**
   * Format currency price
   */
  static formatPrice(price, currency = 'USD') {
    const num = parseFloat(price) || 0;
    if (currency === 'KHR') {
      return `${Math.round(num).toLocaleString()} ៛`;
    }
    if (currency === 'BAHT' || currency === 'THB') {
      return `฿${num.toFixed(2)}`;
    }
    return `$${num.toFixed(2)}`;
  }
}

module.exports = BarcodeService;
