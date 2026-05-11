"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConversationSchema = void 0;
var zod_1 = require("zod");
exports.updateConversationSchema = zod_1.z.object({
    tag: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
