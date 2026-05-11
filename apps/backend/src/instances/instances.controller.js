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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstancesController = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
var roles_decorator_1 = require("../auth/roles.decorator");
var roles_guard_1 = require("../auth/roles.guard");
var InstancesController = function () {
    var _classDecorators = [(0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, common_1.Controller)('instances')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _list_decorators;
    var _create_decorators;
    var _adminCreate_decorators;
    var _getQr_decorators;
    var _getStatus_decorators;
    var _reconnect_decorators;
    var _disconnect_decorators;
    var _delete_decorators;
    var InstancesController = _classThis = /** @class */ (function () {
        function InstancesController_1(instances, audit) {
            this.instances = (__runInitializers(this, _instanceExtraInitializers), instances);
            this.audit = audit;
        }
        InstancesController_1.prototype.list = function (user, userId, status) {
            if (user.role === client_1.UserRole.ADMIN) {
                return this.instances.listAdmin({ userId: userId, status: status });
            }
            return this.instances.listForUser(user);
        };
        InstancesController_1.prototype.create = function (req, user, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var created;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.instances.createForUser(user.sub, {
                                instanceName: dto.instanceName,
                                phoneNumber: dto.phoneNumber,
                            })];
                        case 1:
                            created = _a.sent();
                            return [4 /*yield*/, this.audit.log({
                                    userId: user.sub,
                                    action: 'USER_INSTANCE_CREATE',
                                    entity: 'WhatsAppInstance',
                                    entityId: created.id,
                                    ipAddress: req.ip,
                                    userAgent: req.headers['user-agent'],
                                    meta: { instanceName: created.instanceName },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, created];
                    }
                });
            });
        };
        InstancesController_1.prototype.adminCreate = function (req, actor, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var created;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.instances.adminCreateForUser({
                                userId: dto.userId,
                                instanceName: dto.instanceName,
                                phoneNumber: dto.phoneNumber,
                            })];
                        case 1:
                            created = _a.sent();
                            return [4 /*yield*/, this.audit.log({
                                    userId: actor.sub,
                                    action: 'ADMIN_INSTANCE_CREATE',
                                    entity: 'WhatsAppInstance',
                                    entityId: created.id,
                                    ipAddress: req.ip,
                                    userAgent: req.headers['user-agent'],
                                    meta: { userId: dto.userId, instanceName: created.instanceName },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, created];
                    }
                });
            });
        };
        InstancesController_1.prototype.getQr = function (user, id) {
            return this.instances.getQRCode(user, id);
        };
        InstancesController_1.prototype.getStatus = function (user, id) {
            return this.instances.getStatus(user, id);
        };
        InstancesController_1.prototype.reconnect = function (user, id) {
            return this.instances.reconnect(user, id);
        };
        InstancesController_1.prototype.disconnect = function (user, id) {
            return this.instances.disconnect(user, id);
        };
        InstancesController_1.prototype.delete = function (user, id) {
            return this.instances.delete(user, id);
        };
        return InstancesController_1;
    }());
    __setFunctionName(_classThis, "InstancesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _list_decorators = [(0, common_1.Get)()];
        _create_decorators = [(0, roles_decorator_1.Roles)(client_1.UserRole.USER), (0, common_1.Post)()];
        _adminCreate_decorators = [(0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN), (0, common_1.Post)('admin')];
        _getQr_decorators = [(0, common_1.Get)(':id/qrcode')];
        _getStatus_decorators = [(0, common_1.Get)(':id/status')];
        _reconnect_decorators = [(0, common_1.Put)(':id/reconnect')];
        _disconnect_decorators = [(0, common_1.Put)(':id/disconnect')];
        _delete_decorators = [(0, common_1.Delete)(':id')];
        __esDecorate(_classThis, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: function (obj) { return "list" in obj; }, get: function (obj) { return obj.list; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _adminCreate_decorators, { kind: "method", name: "adminCreate", static: false, private: false, access: { has: function (obj) { return "adminCreate" in obj; }, get: function (obj) { return obj.adminCreate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getQr_decorators, { kind: "method", name: "getQr", static: false, private: false, access: { has: function (obj) { return "getQr" in obj; }, get: function (obj) { return obj.getQr; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStatus_decorators, { kind: "method", name: "getStatus", static: false, private: false, access: { has: function (obj) { return "getStatus" in obj; }, get: function (obj) { return obj.getStatus; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reconnect_decorators, { kind: "method", name: "reconnect", static: false, private: false, access: { has: function (obj) { return "reconnect" in obj; }, get: function (obj) { return obj.reconnect; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _disconnect_decorators, { kind: "method", name: "disconnect", static: false, private: false, access: { has: function (obj) { return "disconnect" in obj; }, get: function (obj) { return obj.disconnect; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _delete_decorators, { kind: "method", name: "delete", static: false, private: false, access: { has: function (obj) { return "delete" in obj; }, get: function (obj) { return obj.delete; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InstancesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InstancesController = _classThis;
}();
exports.InstancesController = InstancesController;
