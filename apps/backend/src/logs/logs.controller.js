"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
function parseDateOrUndefined(v) {
    if (!v)
        return undefined;
    var d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
}
var LogsController = function () {
    var _classDecorators = [(0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, common_1.Controller)('logs')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _listMessageLogs_decorators;
    var _listAuditLogs_decorators;
    var LogsController = _classThis = /** @class */ (function () {
        function LogsController_1(logs) {
            this.logs = (__runInitializers(this, _instanceExtraInitializers), logs);
        }
        LogsController_1.prototype.listMessageLogs = function (user, userId, instanceId, campaignId, contactId, status, direction, from, to) {
            return this.logs.listMessageLogs(user, {
                userId: userId,
                instanceId: instanceId,
                campaignId: campaignId,
                contactId: contactId,
                status: status,
                direction: direction,
                from: parseDateOrUndefined(from),
                to: parseDateOrUndefined(to),
            });
        };
        LogsController_1.prototype.listAuditLogs = function (user, userId, action, from, to) {
            return this.logs.listAuditLogs(user, {
                userId: userId,
                action: action,
                from: parseDateOrUndefined(from),
                to: parseDateOrUndefined(to),
            });
        };
        return LogsController_1;
    }());
    __setFunctionName(_classThis, "LogsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _listMessageLogs_decorators = [(0, common_1.Get)()];
        _listAuditLogs_decorators = [(0, common_1.Get)('audit')];
        __esDecorate(_classThis, null, _listMessageLogs_decorators, { kind: "method", name: "listMessageLogs", static: false, private: false, access: { has: function (obj) { return "listMessageLogs" in obj; }, get: function (obj) { return obj.listMessageLogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listAuditLogs_decorators, { kind: "method", name: "listAuditLogs", static: false, private: false, access: { has: function (obj) { return "listAuditLogs" in obj; }, get: function (obj) { return obj.listAuditLogs; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LogsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LogsController = _classThis;
}();
exports.LogsController = LogsController;
