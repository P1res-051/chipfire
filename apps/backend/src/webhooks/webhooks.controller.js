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
exports.WebhooksController = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var phone_1 = require("../common/phone");
function pickInstanceName(payload) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return ((_h = (_f = (_d = (_b = (_a = payload === null || payload === void 0 ? void 0 : payload.instance) !== null && _a !== void 0 ? _a : payload === null || payload === void 0 ? void 0 : payload.instanceName) !== null && _b !== void 0 ? _b : (_c = payload === null || payload === void 0 ? void 0 : payload.instance) === null || _c === void 0 ? void 0 : _c.instanceName) !== null && _d !== void 0 ? _d : (_e = payload === null || payload === void 0 ? void 0 : payload.data) === null || _e === void 0 ? void 0 : _e.instance) !== null && _f !== void 0 ? _f : (_g = payload === null || payload === void 0 ? void 0 : payload.data) === null || _g === void 0 ? void 0 : _g.instanceName) !== null && _h !== void 0 ? _h : null);
}
function pickEventType(headers, payload) {
    var _a, _b, _c, _d, _e;
    return ((_e = (_d = (_c = (_b = (_a = headers['x-evolution-event']) !== null && _a !== void 0 ? _a : headers['x-webhook-event']) !== null && _b !== void 0 ? _b : payload === null || payload === void 0 ? void 0 : payload.event) !== null && _c !== void 0 ? _c : payload === null || payload === void 0 ? void 0 : payload.eventType) !== null && _d !== void 0 ? _d : payload === null || payload === void 0 ? void 0 : payload.type) !== null && _e !== void 0 ? _e : 'UNKNOWN');
}
var WebhooksController = function () {
    var _classDecorators = [(0, common_1.Controller)('webhooks')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _evolution_decorators;
    var WebhooksController = _classThis = /** @class */ (function () {
        function WebhooksController_1(prisma, config) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.config = config;
        }
        WebhooksController_1.prototype.evolution = function (req, headers, body) {
            return __awaiter(this, void 0, void 0, function () {
                var secret, expected, instanceName, eventType, instance, _a, webhook, code, state, status_1, msg, key, remoteJid, fromMe, providerMessageId, phone, occurredAt, contactId, contact, conv, direction, text, _b;
                var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13;
                return __generator(this, function (_14) {
                    switch (_14.label) {
                        case 0:
                            secret = (_c = headers['x-evo-secret']) !== null && _c !== void 0 ? _c : headers['x-webhook-secret'];
                            expected = this.config.get('EVOLUTION_WEBHOOK_SECRET', { infer: true });
                            if (!secret || secret !== expected) {
                                throw new common_1.UnauthorizedException('Webhook secret inválido');
                            }
                            instanceName = pickInstanceName(body);
                            eventType = pickEventType(headers, body);
                            if (!instanceName) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.whatsAppInstance.findFirst({
                                    where: { instanceName: instanceName },
                                })];
                        case 1:
                            _a = _14.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = null;
                            _14.label = 3;
                        case 3:
                            instance = _a;
                            return [4 /*yield*/, this.prisma.webhookEvent.create({
                                    data: {
                                        instanceId: (_d = instance === null || instance === void 0 ? void 0 : instance.id) !== null && _d !== void 0 ? _d : null,
                                        eventType: eventType,
                                        raw: body !== null && body !== void 0 ? body : {},
                                    },
                                })];
                        case 4:
                            webhook = _14.sent();
                            if (!instance) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.prisma.whatsAppInstance.update({
                                    where: { id: instance.id },
                                    data: { lastActivityAt: new Date() },
                                })];
                        case 5:
                            _14.sent();
                            _14.label = 6;
                        case 6:
                            _14.trys.push([6, 17, , 18]);
                            if (!(instance && (eventType === 'QRCODE_UPDATED' || ((_e = body === null || body === void 0 ? void 0 : body.data) === null || _e === void 0 ? void 0 : _e.qrcode) || (body === null || body === void 0 ? void 0 : body.qrcode)))) return [3 /*break*/, 8];
                            code = (_k = (_h = (_g = (_f = body === null || body === void 0 ? void 0 : body.data) === null || _f === void 0 ? void 0 : _f.qrcode) !== null && _g !== void 0 ? _g : body === null || body === void 0 ? void 0 : body.qrcode) !== null && _h !== void 0 ? _h : (_j = body === null || body === void 0 ? void 0 : body.data) === null || _j === void 0 ? void 0 : _j.code) !== null && _k !== void 0 ? _k : body === null || body === void 0 ? void 0 : body.code;
                            if (!(typeof code === 'string' && code.length > 10)) return [3 /*break*/, 8];
                            return [4 /*yield*/, this.prisma.whatsAppInstance.update({
                                    where: { id: instance.id },
                                    data: { qrCode: code, status: client_1.InstanceStatus.WAITING_QR },
                                })];
                        case 7:
                            _14.sent();
                            _14.label = 8;
                        case 8:
                            if (!(instance && (eventType === 'CONNECTION_UPDATE' || eventType === 'CONNECTION_STATE'))) return [3 /*break*/, 10];
                            state = (_o = (_m = (_l = body === null || body === void 0 ? void 0 : body.data) === null || _l === void 0 ? void 0 : _l.state) !== null && _m !== void 0 ? _m : body === null || body === void 0 ? void 0 : body.state) !== null && _o !== void 0 ? _o : (_q = (_p = body === null || body === void 0 ? void 0 : body.data) === null || _p === void 0 ? void 0 : _p.instance) === null || _q === void 0 ? void 0 : _q.state;
                            status_1 = state === 'open'
                                ? client_1.InstanceStatus.CONNECTED
                                : state === 'close'
                                    ? client_1.InstanceStatus.DISCONNECTED
                                    : client_1.InstanceStatus.ERROR;
                            return [4 /*yield*/, this.prisma.whatsAppInstance.update({
                                    where: { id: instance.id },
                                    data: {
                                        status: status_1,
                                        connectedAt: status_1 === client_1.InstanceStatus.CONNECTED ? new Date() : undefined,
                                        disconnectedAt: status_1 === client_1.InstanceStatus.DISCONNECTED ? new Date() : undefined,
                                    },
                                })];
                        case 9:
                            _14.sent();
                            _14.label = 10;
                        case 10:
                            if (!(instance && (eventType === 'MESSAGES_UPSERT' || eventType === 'SEND_MESSAGE' || eventType === 'MESSAGES_UPDATE'))) return [3 /*break*/, 16];
                            msg = (_t = (_s = (_r = body === null || body === void 0 ? void 0 : body.data) === null || _r === void 0 ? void 0 : _r.message) !== null && _s !== void 0 ? _s : body === null || body === void 0 ? void 0 : body.message) !== null && _t !== void 0 ? _t : body === null || body === void 0 ? void 0 : body.data;
                            key = (_w = (_u = msg === null || msg === void 0 ? void 0 : msg.key) !== null && _u !== void 0 ? _u : (_v = body === null || body === void 0 ? void 0 : body.data) === null || _v === void 0 ? void 0 : _v.key) !== null && _w !== void 0 ? _w : body === null || body === void 0 ? void 0 : body.key;
                            remoteJid = key === null || key === void 0 ? void 0 : key.remoteJid;
                            fromMe = key === null || key === void 0 ? void 0 : key.fromMe;
                            providerMessageId = (_x = key === null || key === void 0 ? void 0 : key.id) !== null && _x !== void 0 ? _x : (_z = (_y = body === null || body === void 0 ? void 0 : body.data) === null || _y === void 0 ? void 0 : _y.key) === null || _z === void 0 ? void 0 : _z.id;
                            phone = remoteJid ? (0, phone_1.normalizeBrazilPhone)(remoteJid.split('@')[0]) : '';
                            occurredAt = new Date();
                            contactId = null;
                            if (!(phone && instance.userId)) return [3 /*break*/, 12];
                            return [4 /*yield*/, this.prisma.contact.upsert({
                                    where: { userId_phone: { userId: instance.userId, phone: phone } },
                                    create: {
                                        userId: instance.userId,
                                        name: phone,
                                        phone: phone,
                                        optIn: false,
                                        status: 'ACTIVE',
                                        source: 'WEBHOOK',
                                    },
                                    update: { updatedAt: new Date() },
                                })];
                        case 11:
                            contact = _14.sent();
                            contactId = contact.id;
                            _14.label = 12;
                        case 12:
                            if (!contactId) return [3 /*break*/, 16];
                            return [4 /*yield*/, this.prisma.conversation.upsert({
                                    where: { instanceId_contactId: { instanceId: instance.id, contactId: contactId } },
                                    create: { instanceId: instance.id, contactId: contactId, lastMessageAt: occurredAt },
                                    update: { lastMessageAt: occurredAt },
                                })];
                        case 13:
                            conv = _14.sent();
                            direction = fromMe ? client_1.MessageDirection.OUTBOUND : client_1.MessageDirection.INBOUND;
                            text = (_13 = (_10 = (_7 = (_4 = (_1 = (_0 = msg === null || msg === void 0 ? void 0 : msg.message) === null || _0 === void 0 ? void 0 : _0.conversation) !== null && _1 !== void 0 ? _1 : (_3 = (_2 = msg === null || msg === void 0 ? void 0 : msg.message) === null || _2 === void 0 ? void 0 : _2.extendedTextMessage) === null || _3 === void 0 ? void 0 : _3.text) !== null && _4 !== void 0 ? _4 : (_6 = (_5 = msg === null || msg === void 0 ? void 0 : msg.message) === null || _5 === void 0 ? void 0 : _5.imageMessage) === null || _6 === void 0 ? void 0 : _6.caption) !== null && _7 !== void 0 ? _7 : (_9 = (_8 = msg === null || msg === void 0 ? void 0 : msg.message) === null || _8 === void 0 ? void 0 : _8.videoMessage) === null || _9 === void 0 ? void 0 : _9.caption) !== null && _10 !== void 0 ? _10 : (_12 = (_11 = msg === null || msg === void 0 ? void 0 : msg.message) === null || _11 === void 0 ? void 0 : _11.documentMessage) === null || _12 === void 0 ? void 0 : _12.caption) !== null && _13 !== void 0 ? _13 : null;
                            return [4 /*yield*/, this.prisma.message.create({
                                    data: {
                                        conversationId: conv.id,
                                        contactId: contactId,
                                        instanceId: instance.id,
                                        direction: direction,
                                        type: client_1.MessageType.TEXT,
                                        text: text,
                                        raw: body !== null && body !== void 0 ? body : {},
                                        providerMessageId: providerMessageId,
                                        occurredAt: occurredAt,
                                    },
                                })];
                        case 14:
                            _14.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.update({
                                    where: { id: instance.id },
                                    data: {
                                        messagesReceivedToday: direction === client_1.MessageDirection.INBOUND ? { increment: 1 } : undefined,
                                        messagesSentToday: direction === client_1.MessageDirection.OUTBOUND ? { increment: 1 } : undefined,
                                        totalMessagesReceived: direction === client_1.MessageDirection.INBOUND ? { increment: 1 } : undefined,
                                        totalMessagesSent: direction === client_1.MessageDirection.OUTBOUND ? { increment: 1 } : undefined,
                                        lastActivityAt: occurredAt,
                                    },
                                })];
                        case 15:
                            _14.sent();
                            _14.label = 16;
                        case 16: return [3 /*break*/, 18];
                        case 17:
                            _b = _14.sent();
                            return [3 /*break*/, 18];
                        case 18: return [2 /*return*/, { ok: true, webhookEventId: webhook.id }];
                    }
                });
            });
        };
        return WebhooksController_1;
    }());
    __setFunctionName(_classThis, "WebhooksController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _evolution_decorators = [(0, common_1.Post)('evolution')];
        __esDecorate(_classThis, null, _evolution_decorators, { kind: "method", name: "evolution", static: false, private: false, access: { has: function (obj) { return "evolution" in obj; }, get: function (obj) { return obj.evolution; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhooksController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhooksController = _classThis;
}();
exports.WebhooksController = WebhooksController;
