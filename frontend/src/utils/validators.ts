/**
 * Frontend validators for Brazilian documents and common fields.
 */

/** Validate CPF using official modulus-11 algorithm */
export const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  // Reject sequences of identical digits (000.000.000-00 etc.)
  if (/^(\d)\1+$/.test(digits)) return false;

  const calcDigit = (base: string, factor: number): number => {
    let sum = 0;
    for (const ch of base) {
      sum += parseInt(ch) * factor--;
    }
    const remainder = (sum * 10) % 11;
    return remainder >= 10 ? 0 : remainder;
  };

  const d1 = calcDigit(digits.slice(0, 9), 10);
  const d2 = calcDigit(digits.slice(0, 10), 11);
  return d1 === parseInt(digits[9]) && d2 === parseInt(digits[10]);
};

/** Validate CNPJ using official modulus-11 algorithm */
export const isValidCNPJ = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calcDigit = (base: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigit(digits.slice(0, 12), w1);
  const d2 = calcDigit(digits.slice(0, 13), w2);
  return d1 === parseInt(digits[12]) && d2 === parseInt(digits[13]);
};

/** Basic email format validation */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/** CEP must have exactly 8 digits */
export const isValidCEP = (cep: string): boolean => {
  return /^\d{5}-?\d{3}$/.test(cep.trim());
};

/** Phone must have 10 or 11 digits */
export const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
};

/** File size validator — maxSizeInMB default 10 */
export const isValidFileSize = (file: File, maxSizeMB = 10): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

/** Allowed MIME types for uploads */
export const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const isValidFileType = (file: File): boolean => {
  return ALLOWED_UPLOAD_TYPES.includes(file.type);
};
