"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCampaignSchema = void 0;
var zod_1 = require("zod");
exports.createCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    description: zod_1.z.string().optional(),
    contactTag: zod_1.z.string().min(1, 'Etiqueta de contatos é obrigatória'),
    templateId: zod_1.z.string().min(1, 'Template é obrigatório'),
    mediaId: zod_1.z.string().optional(),
    instanceIds: zod_1.z.array(zod_1.z.string()).min(1, 'Selecione pelo menos uma instância'),
    allowedStartTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm').default('08:00'),
    allowedEndTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm').default('20:00'),
    dailyLimitPerInstance: zod_1.z.number().int().min(1).max(10000).default(200),
    intervalMinSeconds: zod_1.z.number().int().min(5).max(300).default(15),
    intervalMaxSeconds: zod_1.z.number().int().min(5).max(300).default(60),
    maxErrorRatePercent: zod_1.z.number().int().min(0).max(100).default(5),
    maxOptOutRatePercent: zod_1.z.number().int().min(0).max(100).default(2),
});
