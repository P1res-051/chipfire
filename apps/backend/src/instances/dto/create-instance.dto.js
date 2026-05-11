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
exports.CreateInstanceDto = exports.createInstanceSchema = void 0;
var nestjs_zod_1 = require("nestjs-zod");
var zod_1 = require("zod");
exports.createInstanceSchema = zod_1.z.object({
    instanceName: zod_1.z
        .string()
        .min(3)
        .regex(/^[a-zA-Z0-9-_]+$/, 'Use apenas letras, números, - e _'),
    phoneNumber: zod_1.z.string().optional(),
});
var CreateInstanceDto = /** @class */ (function (_super) {
    __extends(CreateInstanceDto, _super);
    function CreateInstanceDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CreateInstanceDto;
}((0, nestjs_zod_1.createZodDto)(exports.createInstanceSchema)));
exports.CreateInstanceDto = CreateInstanceDto;
