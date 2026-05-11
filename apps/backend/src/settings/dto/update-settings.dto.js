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
exports.UpdateSettingsDto = exports.updateSettingsSchema = void 0;
var nestjs_zod_1 = require("nestjs-zod");
var zod_1 = require("zod");
exports.updateSettingsSchema = zod_1.z.object({
    evolutionApiUrlInternal: zod_1.z.string().url().optional(),
    evolutionApiUrlPublic: zod_1.z.string().url().optional(),
    evolutionApiKeyHint: zod_1.z.string().nullable().optional(),
    evolutionWebhookBaseUrl: zod_1.z.string().url().nullable().optional(),
    evolutionTimeoutMs: zod_1.z.coerce.number().int().min(1000).max(120000).optional(),
    evolutionMaxRetries: zod_1.z.coerce.number().int().min(0).max(10).optional(),
    defaultDailyLimitPerInstance: zod_1.z.coerce.number().int().min(0).max(5000).optional(),
    defaultAllowedStartTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
    defaultAllowedEndTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
    defaultIntervalMinSeconds: zod_1.z.coerce.number().int().min(0).max(3600).optional(),
    defaultIntervalMaxSeconds: zod_1.z.coerce.number().int().min(0).max(3600).optional(),
    maxErrorRatePercent: zod_1.z.coerce.number().int().min(0).max(100).optional(),
    maxOptOutRatePercent: zod_1.z.coerce.number().int().min(0).max(100).optional(),
    maxMediaSizeMb: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    autoPauseOnInstability: zod_1.z.coerce.boolean().optional(),
});
var UpdateSettingsDto = /** @class */ (function (_super) {
    __extends(UpdateSettingsDto, _super);
    function UpdateSettingsDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UpdateSettingsDto;
}((0, nestjs_zod_1.createZodDto)(exports.updateSettingsSchema)));
exports.UpdateSettingsDto = UpdateSettingsDto;
