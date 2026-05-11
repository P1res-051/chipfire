export function normalizeBrazilPhone(input: string): string {
  const digits = (input ?? '').replace(/\D/g, '');
  if (!digits) return '';

  // Aceita:
  // - 55 + DDD + número (10/11 dígitos após DDI)
  // - DDD + número (assume 55)
  // - número local (não recomendado) -> inválido
  if (digits.startsWith('55')) {
    return digits;
  }

  // Se tiver 10 ou 11 dígitos, assume Brasil sem DDI
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function isValidBrazilPhoneWithDDI55(normalized: string): boolean {
  const d = (normalized ?? '').replace(/\D/g, '');
  if (!d.startsWith('55')) return false;
  // 55 + (10 ou 11)
  return d.length === 12 || d.length === 13;
}

