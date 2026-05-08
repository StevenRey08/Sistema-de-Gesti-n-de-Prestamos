export type TipoDocumentoFormato = 'Cédula' | 'Matrícula';

export const CEDULA_RE = /^\d{3}-\d{7}-\d{1}$/;
export const MATRICULA_RE = /^\d{4}-\d{4}$/;
export const TELEFONO_RE = /^\d{3}-\d{3}-\d{4}$/;

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function normalizeTipoDocumento(value?: string | null): TipoDocumentoFormato {
  return value?.toLowerCase().includes('matr') ? 'Matrícula' : 'Cédula';
}

export function formatDocumento(value: string, tipo: TipoDocumentoFormato) {
  return tipo === 'Cédula' ? formatCedula(value) : formatMatricula(value);
}

export function formatCedula(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 10);
  const third = digits.slice(10, 11);

  if (digits.length > 10) return `${first}-${second}-${third}`;
  if (digits.length > 3) return `${first}-${second}`;
  return first;
}

export function formatMatricula(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  const first = digits.slice(0, 4);
  const second = digits.slice(4, 8);

  if (digits.length > 4) return `${first}-${second}`;
  return first;
}

export function formatTelefono(value: string) {
  const digits = onlyDigits(value).slice(0, 10);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 10);

  if (digits.length > 6) return `${first}-${second}-${third}`;
  if (digits.length > 3) return `${first}-${second}`;
  return first;
}
