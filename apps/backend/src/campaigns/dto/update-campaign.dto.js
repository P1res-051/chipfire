"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCampaignSchema = void 0;
var zod_1 = require("zod");
exports.updateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório').optional(),
    description: zod_1.z.string().optional(),
    allowedStartTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm').optional(),
    allowedEndTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:mm').optional(),
    dailyLimitPerInstance: zod_1.z.number().int().min(1).max(10000).optional(),
    intervalMinSeconds: zod_1.z.number().int().min(5).max(300).optional(),
    intervalMaxSeconds: zod_1.z.number().int().min(5).max(300).optional(),
    maxErrorRatePercent: zod_1.z.number().int().min(0).max(100).optional(),
    maxOptOutRatePercent: zod_1.z.number().int().min(0).max(100).optional(),
});
