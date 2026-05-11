"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = exports.updateUserSchema = void 0;
var nestjs_zod_1 = require("nestjs-zod");
var zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
    role: zod_1.z.enum(['USER', 'ADMIN']).optional(),
    instanceLimit: zod_1.z.coerce.number().int().min(0).max(100).optional(),
    notes: zod_1.z.string().nullable().optional(),
});
var UpdateUserDto = /** @class */ (function (_super) {
    __extends(UpdateUserDto, _super);
    function UpdateUserDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UpdateUserDto;
}((0, nestjs_zod_1.createZodDto)(exports.updateUserSchema)));
exports.UpdateUserDto = UpdateUserDto;
