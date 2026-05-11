"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBrazilPhone = normalizeBrazilPhone;
exports.isValidBrazilPhoneWithDDI55 = isValidBrazilPhoneWithDDI55;
function normalizeBrazilPhone(input) {
    var digits = (input !== null && input !== void 0 ? input : '').replace(/\D/g, '');
    if (!digits)
        return '';
    // Aceita:
    // - 55 + DDD + número (10/11 dígitos após DDI)
    // - DDD + número (assume 55)
    // - número local (não recomendado) -> inválido
    if (digits.startsWith('55')) {
        return digits;
    }
    // Se tiver 10 ou 11 dígitos, assume Brasil sem DDI
    if (digits.length === 10 || digits.length === 11) {
        return "55".concat(digits);
    }
    return digits;
}
function isValidBrazilPhoneWithDDI55(normalized) {
    var d = (normalized !== null && normalized !== void 0 ? normalized : '').replace(/\D/g, '');
    if (!d.startsWith('55'))
        return false;
    // 55 + (10 ou 11)
    return d.length === 12 || d.length === 13;
}
