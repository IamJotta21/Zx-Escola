/**
 * Input masks for Brazilian document and phone formats.
 * All functions return the formatted string given a raw input value.
 */

/** CPF: 000.000.000-00 */
export const maskCPF = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/** CNPJ: 00.000.000/0000-00 */
export const maskCNPJ = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

/** CEP: 00000-000 */
export const maskCEP = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};

/** Phone (mobile): (00) 00000-0000 or (00) 0000-0000 */
export const maskPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    // landline: (00) 0000-0000
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  // mobile: (00) 00000-0000
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

/** Strip all non-digit characters (for sending to backend) */
export const unmask = (value: string): string => value.replace(/\D/g, '');
