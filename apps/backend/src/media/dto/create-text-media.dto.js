"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTextMediaSchema = void 0;
var zod_1 = require("zod");
exports.createTextMediaSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    content: zod_1.z.string().min(1, 'Conteúdo é obrigatório'),
    tags: zod_1.z.string().optional(),
});
