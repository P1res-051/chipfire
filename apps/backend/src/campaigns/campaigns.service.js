"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.CampaignsService = void 0;
var common_1 = require("@nestjs/common");
var CampaignsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CampaignsService = _classThis = /** @class */ (function () {
        function CampaignsService_1(prisma, campaignExecution) {
            this.prisma = prisma;
            this.campaignExecution = campaignExecution;
        }
        CampaignsService_1.prototype.listCampaigns = function (userId, isAdmin, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var where, limit, offset, _a, campaigns, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            where = {};
                            if (!isAdmin) {
                                where.userId = userId;
                            }
                            if (filters === null || filters === void 0 ? void 0 : filters.status) {
                                where.status = filters.status;
                            }
                            limit = Math.min((filters === null || filters === void 0 ? void 0 : filters.limit) || 50, 100);
                            offset = (filters === null || filters === void 0 ? void 0 : filters.offset) || 0;
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.campaign.findMany({
                                        where: where,
                                        include: {
                                            template: {
                                                select: { id: true, name: true },
                                            },
                                            contacts: {
                                                select: { contactId: true },
                                            },
                                            instances: {
                                                select: { instanceId: true },
                                            },
                                            messageLogs: {
                                                select: {
                                                    id: true,
                                                    status: true,
                                                    errorType: true,
                                                },
                                            },
                                            user: {
                                                select: { id: true, name: true, email: true },
                                            },
                                        },
                                        orderBy: { createdAt: 'desc' },
                                        take: limit,
                                        skip: offset,
                                    }),
                                    this.prisma.campaign.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), campaigns = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    items: campaigns.map(function (c) { return (__assign(__assign({}, c), { contactCount: c.contacts.length, instanceCount: c.instances.length, sentCount: c.messageLogs.filter(function (ml) { return ml.status === 'SUCCESS'; }).length, errorCount: c.messageLogs.filter(function (ml) { return ml.status === 'ERROR'; }).length })); }),
                                    total: total,
                                    limit: limit,
                                    offset: offset,
                                }];
                    }
                });
            });
        };
        CampaignsService_1.prototype.createCampaign = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var template, media, instances, contacts, campaign;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.messageTemplate.findUnique({
                                where: { id: dto.templateId },
                            })];
                        case 1:
                            template = _a.sent();
                            if (!template || template.userId !== userId) {
                                throw new common_1.BadRequestException('Template invalido ou nao pertence a voce');
                            }
                            if (!dto.mediaId) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.mediaLibrary.findUnique({
                                    where: { id: dto.mediaId },
                                })];
                        case 2:
                            media = _a.sent();
                            if (!media || media.userId !== userId) {
                                throw new common_1.BadRequestException('Midia invalida ou nao pertence a voce');
                            }
                            _a.label = 3;
                        case 3: return [4 /*yield*/, this.prisma.whatsAppInstance.findMany({
                                where: { id: { in: dto.instanceIds }, userId: userId },
                            })];
                        case 4:
                            instances = _a.sent();
                            if (instances.length !== dto.instanceIds.length) {
                                throw new common_1.BadRequestException('Uma ou mais instancias nao existem ou nao pertencem a voce');
                            }
                            return [4 /*yield*/, this.prisma.contact.findMany({
                                    where: {
                                        userId: userId,
                                        tag: dto.contactTag,
                                        status: 'ACTIVE',
                                        optIn: true,
                                    },
                                })];
                        case 5:
                            contacts = _a.sent();
                            if (contacts.length === 0) {
                                throw new common_1.BadRequestException("Nenhum contato com opt-in confirmado encontrado para a etiqueta \"".concat(dto.contactTag, "\""));
                            }
                            if (dto.intervalMinSeconds > dto.intervalMaxSeconds) {
                                throw new common_1.BadRequestException('Intervalo minimo nao pode ser maior que maximo');
                            }
                            return [4 /*yield*/, this.prisma.campaign.create({
                                    data: {
                                        userId: userId,
                                        name: dto.name,
                                        description: dto.description,
                                        contactTag: dto.contactTag,
                                        templateId: dto.templateId,
                                        mediaId: dto.mediaId,
                                        allowedStartTime: dto.allowedStartTime,
                                        allowedEndTime: dto.allowedEndTime,
                                        dailyLimitPerInstance: dto.dailyLimitPerInstance,
                                        intervalMinSeconds: dto.intervalMinSeconds,
                                        intervalMaxSeconds: dto.intervalMaxSeconds,
                                        maxErrorRatePercent: dto.maxErrorRatePercent,
                                        maxOptOutRatePercent: dto.maxOptOutRatePercent,
                                        status: 'DRAFT',
                                    },
                                })];
                        case 6:
                            campaign = _a.sent();
                            return [4 /*yield*/, this.prisma.campaignInstance.createMany({
                                    data: dto.instanceIds.map(function (instanceId) { return ({
                                        campaignId: campaign.id,
                                        instanceId: instanceId,
                                    }); }),
                                })];
                        case 7:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.campaignContact.createMany({
                                    data: contacts.map(function (contact) { return ({
                                        campaignId: campaign.id,
                                        contactId: contact.id,
                                    }); }),
                                })];
                        case 8:
                            _a.sent();
                            return [2 /*return*/, this.getCampaignById(campaign.id, userId)];
                    }
                });
            });
        };
        CampaignsService_1.prototype.getCampaignById = function (id_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (id, userId, isAdmin) {
                var campaign;
                if (isAdmin === void 0) { isAdmin = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.campaign.findUnique({
                                where: { id: id },
                                include: {
                                    template: true,
                                    contacts: {
                                        include: {
                                            contact: {
                                                select: { id: true, name: true, phone: true, status: true },
                                            },
                                        },
                                    },
                                    instances: {
                                        include: {
                                            instance: {
                                                select: { id: true, instanceName: true, phoneNumber: true },
                                            },
                                        },
                                    },
                                    messageLogs: {
                                        select: {
                                            id: true,
                                            status: true,
                                            errorType: true,
                                            createdAt: true,
                                        },
                                        orderBy: { createdAt: 'desc' },
                                        take: 100,
                                    },
                                    user: {
                                        select: { id: true, name: true, email: true },
                                    },
                                },
                            })];
                        case 1:
                            campaign = _a.sent();
                            if (!campaign) {
                                throw new common_1.NotFoundException('Campanha nao encontrada');
                            }
                            if (!isAdmin && campaign.userId !== userId) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            return [2 /*return*/, campaign];
                    }
                });
            });
        };
        CampaignsService_1.prototype.updateCampaign = function (id_1, userId_1, dto_1) {
            return __awaiter(this, arguments, void 0, function (id, userId, dto, isAdmin) {
                var campaign, updated;
                if (isAdmin === void 0) { isAdmin = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getCampaignById(id, userId, isAdmin)];
                        case 1:
                            campaign = _a.sent();
                            if (campaign.status !== 'DRAFT') {
                                throw new common_1.BadRequestException('So e possivel editar campanhas em estado DRAFT');
                            }
                            return [4 /*yield*/, this.prisma.campaign.update({
                                    where: { id: id },
                                    data: {
                                        name: dto.name,
                                        description: dto.description,
                                        allowedStartTime: dto.allowedStartTime,
                                        allowedEndTime: dto.allowedEndTime,
                                        dailyLimitPerInstance: dto.dailyLimitPerInstance,
                                        intervalMinSeconds: dto.intervalMinSeconds,
                                        intervalMaxSeconds: dto.intervalMaxSeconds,
                                        maxErrorRatePercent: dto.maxErrorRatePercent,
                                        maxOptOutRatePercent: dto.maxOptOutRatePercent,
                                    },
                                    include: {
                                        template: true,
                                        contacts: { include: { contact: true } },
                                        instances: { include: { instance: true } },
                                        messageLogs: { take: 100, orderBy: { createdAt: 'desc' } },
                                    },
                                })];
                        case 2:
                            updated = _a.sent();
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        CampaignsService_1.prototype.deleteCampaign = function (id_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (id, userId, isAdmin) {
                var campaign;
                if (isAdmin === void 0) { isAdmin = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getCampaignById(id, userId, isAdmin)];
                        case 1:
                            campaign = _a.sent();
                            if (campaign.status !== 'DRAFT') {
                                throw new common_1.BadRequestException('So e possivel deletar campanhas em estado DRAFT');
                            }
                            return [4 /*yield*/, this.prisma.campaign.delete({
                                    where: { id: id },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        CampaignsService_1.prototype.startCampaign = function (id_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (id, userId, isAdmin) {
                var campaign, updated;
                if (isAdmin === void 0) { isAdmin = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getCampaignById(id, userId, isAdmin)];
                        case 1:
                            campaign = _a.sent();
                            if (campaign.status !== 'DRAFT') {
                                throw new common_1.BadRequestException('So campanhas em DRAFT podem ser iniciadas');
                            }
                            return [4 /*yield*/, this.prisma.campaign.update({
                                    where: { id: id },
                                    data: { status: 'ACTIVE' },
                                    include: {
                                        template: true,
                                        contacts: { include: { contact: true } },
                                        instances: { include: { instance: true } },
                                    },
                                })];
                        case 2:
                            updated = _a.sent();
                            return [4 /*yield*/, this.campaignExecution.enqueueCampaignMessages(id)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        CampaignsService_1.prototype.pauseCampaign = function (id_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (id, userId, isAdmin) {
                var campaign, updated;
                if (isAdmin === void 0) { isAdmin = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getCampaignById(id, userId, isAdmin)];
                        case 1:
                            campaign = _a.sent();
                            if (campaign.status !== 'ACTIVE') {
                                throw new common_1.BadRequestException('So campanhas em ACTIVE podem ser pausadas');
                            }
                            return [4 /*yield*/, this.prisma.campaign.update({
                                    where: { id: id },
                                    data: { status: 'PAUSED' },
                                    include: {
                                        template: true,
                                        contacts: { include: { contact: true } },
                                        instances: { include: { instance: true } },
                                    },
                                })];
                        case 2:
                            updated = _a.sent();
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        CampaignsService_1.prototype.stopCampaign = function (id_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (id, userId, isAdmin) {
                var campaign, updated;
                if (isAdmin === void 0) { isAdmin = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getCampaignById(id, userId, isAdmin)];
                        case 1:
                            campaign = _a.sent();
                            if (!['ACTIVE', 'PAUSED'].includes(campaign.status)) {
                                throw new common_1.BadRequestException('So campanhas em ACTIVE ou PAUSED podem ser paradas');
                            }
                            return [4 /*yield*/, this.campaignExecution.cancelCampaignMessages(id)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.campaign.update({
                                    where: { id: id },
                                    data: { status: 'FINISHED' },
                                    include: {
                                        template: true,
                                        contacts: { include: { contact: true } },
                                        instances: { include: { instance: true } },
                                    },
                                })];
                        case 3:
                            updated = _a.sent();
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        CampaignsService_1.prototype.getCampaignMetrics = function (id_1, userId_1) {
            return __awaiter(this, arguments, void 0, function (id, userId, isAdmin) {
                var campaign, logs, totalContacts, sent, failed, errorRate;
                if (isAdmin === void 0) { isAdmin = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getCampaignById(id, userId, isAdmin)];
                        case 1:
                            campaign = _a.sent();
                            logs = campaign.messageLogs;
                            totalContacts = campaign.contacts.length;
                            sent = logs.filter(function (l) { return l.status === 'SUCCESS'; }).length;
                            failed = logs.filter(function (l) { return l.status === 'ERROR'; }).length;
                            errorRate = totalContacts > 0 ? (failed / totalContacts) * 100 : 0;
                            return [2 /*return*/, {
                                    campaignId: campaign.id,
                                    name: campaign.name,
                                    status: campaign.status,
                                    totalContacts: totalContacts,
                                    sent: sent,
                                    failed: failed,
                                    pending: totalContacts - sent - failed,
                                    errorRate: Math.round(errorRate),
                                    logs: logs.slice(0, 50).map(function (l) { return ({
                                        id: l.id,
                                        status: l.status,
                                        errorType: l.errorType,
                                        createdAt: l.createdAt,
                                    }); }),
                                }];
                    }
                });
            });
        };
        CampaignsService_1.prototype.checkAndPauseCampaign = function (campaignId) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign, logs, totalContacts, errorCount, errorRate;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.campaign.findUnique({
                                where: { id: campaignId },
                                include: { messageLogs: true, contacts: true },
                            })];
                        case 1:
                            campaign = _a.sent();
                            if (!campaign || campaign.status !== 'ACTIVE') {
                                return [2 /*return*/, false];
                            }
                            logs = campaign.messageLogs;
                            totalContacts = campaign.contacts.length;
                            if (totalContacts === 0)
                                return [2 /*return*/, false];
                            errorCount = logs.filter(function (l) { return l.status === 'ERROR'; }).length;
                            errorRate = (errorCount / totalContacts) * 100;
                            if (!(errorRate > campaign.maxErrorRatePercent)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.campaign.update({
                                    where: { id: campaignId },
                                    data: { status: 'PAUSED' },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3: return [2 /*return*/, false];
                    }
                });
            });
        };
        return CampaignsService_1;
    }());
    __setFunctionName(_classThis, "CampaignsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CampaignsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CampaignsService = _classThis;
}();
exports.CampaignsService = CampaignsService;
