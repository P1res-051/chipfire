"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMediaSchema = void 0;
var zod_1 = require("zod");
exports.updateMediaSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório').optional(),
    tags: zod_1.z.string().optional(),
});
