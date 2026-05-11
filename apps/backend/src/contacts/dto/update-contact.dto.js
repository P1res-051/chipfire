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
exports.UpdateContactDto = exports.updateContactSchema = void 0;
var nestjs_zod_1 = require("nestjs-zod");
var zod_1 = require("zod");
exports.updateContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    tag: zod_1.z.string().nullable().optional(),
    optIn: zod_1.z.coerce.boolean().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'OPTOUT']).optional(),
});
var UpdateContactDto = /** @class */ (function (_super) {
    __extends(UpdateContactDto, _super);
    function UpdateContactDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UpdateContactDto;
}((0, nestjs_zod_1.createZodDto)(exports.updateContactSchema)));
exports.UpdateContactDto = UpdateContactDto;
