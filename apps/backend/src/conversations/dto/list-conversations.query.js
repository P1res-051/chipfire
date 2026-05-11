"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listConversationsQuerySchema = void 0;
var zod_1 = require("zod");
exports.listConversationsQuerySchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    instanceId: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'OPTOUT']).optional(),
    tag: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(), // busca por nome ou telefone
    dateStart: zod_1.z.string().datetime().optional(),
    dateEnd: zod_1.z.string().datetime().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().min(0).default(0),
    sortBy: zod_1.z.enum(['lastMessageAt', 'createdAt']).default('lastMessageAt'),
    order: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
