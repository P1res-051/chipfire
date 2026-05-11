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
exports.UpdateUserStatusDto = exports.updateUserStatusSchema = void 0;
var nestjs_zod_1 = require("nestjs-zod");
var zod_1 = require("zod");
exports.updateUserStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']),
});
var UpdateUserStatusDto = /** @class */ (function (_super) {
    __extends(UpdateUserStatusDto, _super);
    function UpdateUserStatusDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UpdateUserStatusDto;
}((0, nestjs_zod_1.createZodDto)(exports.updateUserStatusSchema)));
exports.UpdateUserStatusDto = UpdateUserStatusDto;
