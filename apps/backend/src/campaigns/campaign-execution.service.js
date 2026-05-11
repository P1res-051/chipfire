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
exports.CampaignExecutionService = void 0;
var common_1 = require("@nestjs/common");
var CampaignExecutionService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CampaignExecutionService = _classThis = /** @class */ (function () {
        function CampaignExecutionService_1(prisma, evolution, campaignQueue) {
            this.prisma = prisma;
            this.evolution = evolution;
            this.campaignQueue = campaignQueue;
            this.logger = new common_1.Logger(CampaignExecutionService.name);
        }
        CampaignExecutionService_1.prototype.enqueueCampaignMessages = function (campaignId) {
            return __awaiter(this, void 0, void 0, function () {
                var campaign, contactsByInstance, _i, _a, inst, contactIds, index, i, instanceId, list, jobs, _loop_1, _b, contactsByInstance_1, _c, instanceId, contacts, _d, jobs_1, job, delay;
                var _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0: return [4 /*yield*/, this.prisma.campaign.findUnique({
                                where: { id: campaignId },
                                include: {
                                    template: true,
                                    contacts: { include: { contact: true } },
                                    instances: { include: { instance: true } },
                                },
                            })];
                        case 1:
                            campaign = _g.sent();
                            if (!campaign) {
                                throw new common_1.BadRequestException('Campanha nao encontrada');
                            }
                            if (campaign.status !== 'ACTIVE') {
                                throw new common_1.BadRequestException('Campanha deve estar em ACTIVE');
                            }
                            contactsByInstance = new Map();
                            for (_i = 0, _a = campaign.instances; _i < _a.length; _i++) {
                                inst = _a[_i];
                                contactsByInstance.set(inst.instanceId, []);
                            }
                            contactIds = campaign.contacts.map(function (c) { return c.contact.id; });
                            index = 0;
                            for (i = 0; i < contactIds.length; i++) {
                                if (campaign.instances.length === 0)
                                    break;
                                instanceId = campaign.instances[index % campaign.instances.length].instanceId;
                                list = contactsByInstance.get(instanceId);
                                if (list)
                                    list.push(contactIds[i]);
                                index++;
                            }
                            jobs = [];
                            _loop_1 = function (instanceId, contacts) {
                                var inst = (_e = campaign.instances.find(function (x) { return x.instanceId === instanceId; })) === null || _e === void 0 ? void 0 : _e.instance;
                                if (!inst)
                                    return "continue";
                                var _loop_2 = function (i) {
                                    var contactId = contacts[i];
                                    var contact = (_f = campaign.contacts.find(function (c) { return c.contact.id === contactId; })) === null || _f === void 0 ? void 0 : _f.contact;
                                    if (!contact)
                                        return "continue";
                                    var delay = Math.random() * (campaign.intervalMaxSeconds - campaign.intervalMinSeconds) + campaign.intervalMinSeconds;
                                    jobs.push({
                                        campaignId: campaignId,
                                        contactId: contactId,
                                        instanceId: instanceId,
                                        phone: contact.phone,
                                        templateId: campaign.templateId,
                                        mediaId: campaign.mediaId,
                                        delay: Math.floor((i * delay * 1000) + Math.random() * 5000),
                                    });
                                };
                                for (var i = 0; i < contacts.length; i++) {
                                    _loop_2(i);
                                }
                            };
                            for (_b = 0, contactsByInstance_1 = contactsByInstance; _b < contactsByInstance_1.length; _b++) {
                                _c = contactsByInstance_1[_b], instanceId = _c[0], contacts = _c[1];
                                _loop_1(instanceId, contacts);
                            }
                            _d = 0, jobs_1 = jobs;
                            _g.label = 2;
                        case 2:
                            if (!(_d < jobs_1.length)) return [3 /*break*/, 5];
                            job = jobs_1[_d];
                            delay = this.calculateDelay(campaign.allowedStartTime, campaign.allowedEndTime, job.delay);
                            return [4 /*yield*/, this.campaignQueue.add("campaign-".concat(campaignId), { campaignId: job.campaignId, contactId: job.contactId, instanceId: job.instanceId, phone: job.phone, templateId: job.templateId, mediaId: job.mediaId, attempt: 0 }, { delay: delay, jobId: "campaign-".concat(campaignId, "-contact-").concat(job.contactId), removeOnComplete: true, removeOnFail: false })];
                        case 3:
                            _g.sent();
                            _g.label = 4;
                        case 4:
                            _d++;
                            return [3 /*break*/, 2];
                        case 5:
                            this.logger.log("[".concat(campaignId, "] Enfileirados ").concat(jobs.length, " mensagens"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        CampaignExecutionService_1.prototype.processCampaignMessage = function (job) {
            return __awaiter(this, void 0, void 0, function () {
                var campaignId, contactId, instanceId, phone, templateId, mediaId, campaign, instance, today, sent, template, media, text, result, typeMap, err_1, campaign;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            campaignId = job.campaignId, contactId = job.contactId, instanceId = job.instanceId, phone = job.phone, templateId = job.templateId, mediaId = job.mediaId;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 14, , 18]);
                            return [4 /*yield*/, this.prisma.campaign.findUnique({ where: { id: campaignId } })];
                        case 2:
                            campaign = _a.sent();
                            if (!campaign || campaign.status !== 'ACTIVE') {
                                this.logger.warn("[".concat(campaignId, "] Campanha nao ativa, pulando"));
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.prisma.whatsAppInstance.findUnique({ where: { id: instanceId } })];
                        case 3:
                            instance = _a.sent();
                            if (!instance)
                                throw new Error('Instancia nao encontrada');
                            today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return [4 /*yield*/, this.prisma.messageLog.count({
                                    where: { campaignId: campaignId, instanceId: instanceId, status: 'SUCCESS', createdAt: { gte: today } },
                                })];
                        case 4:
                            sent = _a.sent();
                            if (sent >= campaign.dailyLimitPerInstance) {
                                throw new Error('DAILY_LIMIT_REACHED');
                            }
                            return [4 /*yield*/, this.prisma.messageTemplate.findUnique({ where: { id: templateId } })];
                        case 5:
                            template = _a.sent();
                            media = null;
                            if (!mediaId) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.prisma.mediaLibrary.findUnique({ where: { id: mediaId } })];
                        case 6:
                            media = _a.sent();
                            _a.label = 7;
                        case 7:
                            text = (template === null || template === void 0 ? void 0 : template.content) || '';
                            text = text.replace(/\{\{[^}]+\}\}/g, '');
                            result = void 0;
                            if (!(media && media.type && media.type !== 'TEXT')) return [3 /*break*/, 9];
                            typeMap = { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio', DOCUMENT: 'document', PDF: 'document' };
                            return [4 /*yield*/, this.evolution.sendMedia({
                                    instanceName: instance.instanceName,
                                    toNumber: phone,
                                    mediaType: typeMap[media.type] || 'document',
                                    fileName: media.fileName || 'media',
                                    caption: text,
                                    mediaBase64OrUrl: media.publicUrl || media.filePath || '',
                                })];
                        case 8:
                            result = _a.sent();
                            return [3 /*break*/, 11];
                        case 9: return [4 /*yield*/, this.evolution.sendText(instance.instanceName, phone, text)];
                        case 10:
                            result = _a.sent();
                            _a.label = 11;
                        case 11: return [4 /*yield*/, this.prisma.messageLog.create({
                                data: { userId: campaign.userId, campaignId: campaignId, contactId: contactId, instanceId: instanceId, direction: 'OUTBOUND', status: 'SUCCESS', meta: { id: result === null || result === void 0 ? void 0 : result.id } },
                            })];
                        case 12:
                            _a.sent();
                            this.logger.log("[".concat(campaignId, "] Mensagem OK para ").concat(phone));
                            return [4 /*yield*/, this.checkPause(campaignId)];
                        case 13:
                            _a.sent();
                            return [3 /*break*/, 18];
                        case 14:
                            err_1 = _a.sent();
                            return [4 /*yield*/, this.prisma.campaign.findUnique({ where: { id: campaignId } })];
                        case 15:
                            campaign = _a.sent();
                            return [4 /*yield*/, this.prisma.messageLog.create({
                                    data: {
                                        userId: (campaign === null || campaign === void 0 ? void 0 : campaign.userId) || '',
                                        campaignId: campaignId,
                                        contactId: contactId,
                                        instanceId: instanceId,
                                        direction: 'OUTBOUND',
                                        status: 'ERROR',
                                        errorType: (err_1 instanceof Error ? err_1.message : 'UNKNOWN').substring(0, 100),
                                    },
                                })];
                        case 16:
                            _a.sent();
                            this.logger.error("[".concat(campaignId, "] Erro para ").concat(phone, ": ").concat(err_1));
                            return [4 /*yield*/, this.checkPause(campaignId)];
                        case 17:
                            _a.sent();
                            throw err_1;
                        case 18: return [2 /*return*/];
                    }
                });
            });
        };
        CampaignExecutionService_1.prototype.checkPause = function (campaignId) {
            return __awaiter(this, void 0, void 0, function () {
                var c, logs, total, errors, rate;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.campaign.findUnique({
                                where: { id: campaignId },
                                include: { messageLogs: true, contacts: true },
                            })];
                        case 1:
                            c = _a.sent();
                            if (!c || c.status !== 'ACTIVE')
                                return [2 /*return*/];
                            logs = c.messageLogs;
                            total = c.contacts.length;
                            if (total === 0)
                                return [2 /*return*/];
                            errors = logs.filter(function (l) { return l.status === 'ERROR'; }).length;
                            rate = (errors / total) * 100;
                            if (!(rate > c.maxErrorRatePercent)) return [3 /*break*/, 3];
                            this.logger.warn("[".concat(campaignId, "] Taxa ").concat(rate.toFixed(2), "% excedeu, pausando"));
                            return [4 /*yield*/, this.prisma.campaign.update({ where: { id: campaignId }, data: { status: 'PAUSED' } })];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CampaignExecutionService_1.prototype.cancelCampaignMessages = function (campaignId) {
            return __awaiter(this, void 0, void 0, function () {
                var jobs, _i, jobs_2, job;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.campaignQueue.getJobs(['waiting', 'delayed', 'active'])];
                        case 1:
                            jobs = _a.sent();
                            _i = 0, jobs_2 = jobs;
                            _a.label = 2;
                        case 2:
                            if (!(_i < jobs_2.length)) return [3 /*break*/, 5];
                            job = jobs_2[_i];
                            if (!(job.data.campaignId === campaignId)) return [3 /*break*/, 4];
                            return [4 /*yield*/, job.remove()];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5:
                            this.logger.log("[".concat(campaignId, "] Mensagens canceladas"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        CampaignExecutionService_1.prototype.calculateDelay = function (start, end, extra) {
            var now = new Date();
            var _a = start.split(':').map(Number), sh = _a[0], sm = _a[1];
            var _b = end.split(':').map(Number), eh = _b[0], em = _b[1];
            var startDate = new Date(now);
            startDate.setHours(sh, sm, 0, 0);
            var endDate = new Date(now);
            endDate.setHours(eh, em, 0, 0);
            var next;
            if (now > endDate) {
                next = new Date(now);
                next.setDate(next.getDate() + 1);
                next.setHours(sh, sm, 0, 0);
            }
            else if (now < startDate) {
                next = startDate;
            }
            else {
                next = now;
            }
            next.setMilliseconds(next.getMilliseconds() + extra);
            return Math.max(0, next.getTime() - now.getTime());
        };
        return CampaignExecutionService_1;
    }());
    __setFunctionName(_classThis, "CampaignExecutionService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CampaignExecutionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CampaignExecutionService = _classThis;
}();
exports.CampaignExecutionService = CampaignExecutionService;
