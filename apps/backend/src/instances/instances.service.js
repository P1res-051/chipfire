"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
exports.InstancesService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var InstancesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var InstancesService = _classThis = /** @class */ (function () {
        function InstancesService_1(prisma, evolution) {
            this.prisma = prisma;
            this.evolution = evolution;
        }
        InstancesService_1.prototype.listForUser = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (user.role === client_1.UserRole.ADMIN) {
                        return [2 /*return*/, this.prisma.whatsAppInstance.findMany({
                                orderBy: { createdAt: 'desc' },
                                include: { user: { select: { id: true, name: true, email: true } } },
                            })];
                    }
                    return [2 /*return*/, this.prisma.whatsAppInstance.findMany({
                            where: { userId: user.sub },
                            orderBy: { createdAt: 'desc' },
                        })];
                });
            });
        };
        InstancesService_1.prototype.listAdmin = function () {
            return __awaiter(this, arguments, void 0, function (filters) {
                if (filters === void 0) { filters = {}; }
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.whatsAppInstance.findMany({
                            where: {
                                userId: filters.userId,
                                status: filters.status,
                            },
                            orderBy: { createdAt: 'desc' },
                            include: {
                                user: { select: { id: true, name: true, email: true, status: true, role: true } },
                            },
                        })];
                });
            });
        };
        InstancesService_1.prototype.createForUser = function (userId, input) {
            return __awaiter(this, void 0, void 0, function () {
                var user, existingByName, e_1, existingCount, e_2, e_3, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({ where: { id: userId } })];
                        case 1:
                            user = _b.sent();
                            if (!user)
                                throw new common_1.NotFoundException('Usuário não encontrado');
                            return [4 /*yield*/, this.prisma.whatsAppInstance.findUnique({
                                    where: { userId_instanceName: { userId: userId, instanceName: input.instanceName } },
                                })];
                        case 2:
                            existingByName = _b.sent();
                            if (!existingByName) return [3 /*break*/, 8];
                            if (!(existingByName.status === client_1.InstanceStatus.ERROR)) return [3 /*break*/, 7];
                            _b.label = 3;
                        case 3:
                            _b.trys.push([3, 6, , 7]);
                            return [4 /*yield*/, this.evolution.createInstance({
                                    instanceName: existingByName.instanceName,
                                    number: input.phoneNumber,
                                    qrcode: true,
                                })];
                        case 4:
                            _b.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.update({
                                    where: { id: existingByName.id },
                                    data: { status: client_1.InstanceStatus.WAITING_QR },
                                })];
                        case 5: return [2 /*return*/, _b.sent()];
                        case 6:
                            e_1 = _b.sent();
                            throw new common_1.BadRequestException('Falha ao criar instância na Evolution API');
                        case 7: throw new common_1.BadRequestException('Já existe uma instância com esse nome para este usuário');
                        case 8: return [4 /*yield*/, this.prisma.whatsAppInstance.count({ where: { userId: userId } })];
                        case 9:
                            existingCount = _b.sent();
                            if (existingCount >= user.instanceLimit) {
                                throw new common_1.ForbiddenException('Limite de instâncias atingido para este usuário');
                            }
                            _b.label = 10;
                        case 10:
                            _b.trys.push([10, 12, , 13]);
                            return [4 /*yield*/, this.evolution.createInstance({
                                    instanceName: input.instanceName,
                                    number: input.phoneNumber,
                                    qrcode: true,
                                })];
                        case 11:
                            _b.sent();
                            return [3 /*break*/, 13];
                        case 12:
                            e_2 = _b.sent();
                            throw new common_1.BadRequestException('Falha ao criar instância na Evolution API');
                        case 13:
                            _b.trys.push([13, 15, , 20]);
                            return [4 /*yield*/, this.prisma.whatsAppInstance.create({
                                    data: {
                                        userId: userId,
                                        instanceName: input.instanceName,
                                        phoneNumber: input.phoneNumber,
                                        status: client_1.InstanceStatus.WAITING_QR,
                                    },
                                })];
                        case 14: return [2 /*return*/, _b.sent()];
                        case 15:
                            e_3 = _b.sent();
                            _b.label = 16;
                        case 16:
                            _b.trys.push([16, 18, , 19]);
                            return [4 /*yield*/, this.evolution.deleteInstance(input.instanceName)];
                        case 17:
                            _b.sent();
                            return [3 /*break*/, 19];
                        case 18:
                            _a = _b.sent();
                            return [3 /*break*/, 19];
                        case 19: throw e_3;
                        case 20: return [2 /*return*/];
                    }
                });
            });
        };
        InstancesService_1.prototype.adminCreateForUser = function (input) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.createForUser(input.userId, {
                            instanceName: input.instanceName,
                            phoneNumber: input.phoneNumber,
                        })];
                });
            });
        };
        InstancesService_1.prototype.getQRCode = function (user, instanceId) {
            return __awaiter(this, void 0, void 0, function () {
                var instance, qr;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } })];
                        case 1:
                            instance = _b.sent();
                            if (!instance)
                                throw new common_1.NotFoundException('Instância não encontrada');
                            if (user.role !== client_1.UserRole.ADMIN && instance.userId !== user.sub) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            return [4 /*yield*/, this.evolution.getQRCode(instance.instanceName)];
                        case 2:
                            qr = _b.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.update({
                                    where: { id: instanceId },
                                    data: { qrCode: (_a = qr.code) !== null && _a !== void 0 ? _a : null, status: client_1.InstanceStatus.WAITING_QR },
                                })];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, qr];
                    }
                });
            });
        };
        InstancesService_1.prototype.getStatus = function (user, instanceId) {
            return __awaiter(this, void 0, void 0, function () {
                var instance, state;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } })];
                        case 1:
                            instance = _c.sent();
                            if (!instance)
                                throw new common_1.NotFoundException('Instância não encontrada');
                            if (user.role !== client_1.UserRole.ADMIN && instance.userId !== user.sub) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            return [4 /*yield*/, this.evolution.getConnectionState(instance.instanceName)];
                        case 2:
                            state = _c.sent();
                            return [2 /*return*/, { instanceId: instanceId, providerState: (_b = (_a = state === null || state === void 0 ? void 0 : state.instance) === null || _a === void 0 ? void 0 : _a.state) !== null && _b !== void 0 ? _b : 'unknown' }];
                    }
                });
            });
        };
        InstancesService_1.prototype.reconnect = function (user, instanceId) {
            return __awaiter(this, void 0, void 0, function () {
                var instance, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } })];
                        case 1:
                            instance = _a.sent();
                            if (!instance)
                                throw new common_1.NotFoundException('Instância não encontrada');
                            if (user.role !== client_1.UserRole.ADMIN && instance.userId !== user.sub) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            return [4 /*yield*/, this.evolution.restartInstance(instance.instanceName)];
                        case 2:
                            result = _a.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.update({
                                    where: { id: instanceId },
                                    data: { status: client_1.InstanceStatus.WAITING_QR },
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        InstancesService_1.prototype.disconnect = function (user, instanceId) {
            return __awaiter(this, void 0, void 0, function () {
                var instance, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } })];
                        case 1:
                            instance = _a.sent();
                            if (!instance)
                                throw new common_1.NotFoundException('Instância não encontrada');
                            if (user.role !== client_1.UserRole.ADMIN && instance.userId !== user.sub) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            return [4 /*yield*/, this.evolution.logoutInstance(instance.instanceName)];
                        case 2:
                            result = _a.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.update({
                                    where: { id: instanceId },
                                    data: { status: client_1.InstanceStatus.DISCONNECTED, disconnectedAt: new Date() },
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        InstancesService_1.prototype.delete = function (user, instanceId) {
            return __awaiter(this, void 0, void 0, function () {
                var instance, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } })];
                        case 1:
                            instance = _b.sent();
                            if (!instance)
                                throw new common_1.NotFoundException('Instância não encontrada');
                            if (user.role !== client_1.UserRole.ADMIN && instance.userId !== user.sub) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.evolution.deleteInstance(instance.instanceName)];
                        case 3:
                            _b.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            _a = _b.sent();
                            return [3 /*break*/, 5];
                        case 5: return [4 /*yield*/, this.prisma.whatsAppInstance.delete({ where: { id: instanceId } })];
                        case 6:
                            _b.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        return InstancesService_1;
    }());
    __setFunctionName(_classThis, "InstancesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InstancesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InstancesService = _classThis;
}();
exports.InstancesService = InstancesService;
