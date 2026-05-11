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
exports.ChangePasswordDto = exports.changePasswordSchema = void 0;
var nestjs_zod_1 = require("nestjs-zod");
var zod_1 = require("zod");
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(8),
    newPassword: zod_1.z
        .string()
        .min(8)
        .regex(/[A-Z]/, 'Deve conter pelo menos 1 letra maiúscula')
        .regex(/[a-z]/, 'Deve conter pelo menos 1 letra minúscula')
        .regex(/[0-9]/, 'Deve conter pelo menos 1 número'),
});
var ChangePasswordDto = /** @class */ (function (_super) {
    __extends(ChangePasswordDto, _super);
    function ChangePasswordDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ChangePasswordDto;
}((0, nestjs_zod_1.createZodDto)(exports.changePasswordSchema)));
exports.ChangePasswordDto = ChangePasswordDto;
