"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMediaSchema = void 0;
var zod_1 = require("zod");
exports.uploadMediaSchema = zod_1.z.object({
    tags: zod_1.z.string().optional(),
});
