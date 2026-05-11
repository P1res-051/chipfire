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
exports.ConversationsService = void 0;
var common_1 = require("@nestjs/common");
var ConversationsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ConversationsService = _classThis = /** @class */ (function () {
        function ConversationsService_1(prisma) {
            this.prisma = prisma;
        }
        /**
         * Listar conversas com controle de permissão
         */
        ConversationsService_1.prototype.listConversations = function (currentUserId, isAdmin, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var where, _a, conversations, total;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            where = {};
                            // Se não é admin, filtrar apenas instâncias do usuário
                            if (!isAdmin) {
                                where.instance = {
                                    userId: currentUserId,
                                };
                            }
                            // Filtros opcionais (admin pode filtrar por usuário)
                            if (isAdmin && filters.userId) {
                                where.instance = {
                                    userId: filters.userId,
                                };
                            }
                            if (filters.instanceId) {
                                where.instanceId = filters.instanceId;
                            }
                            if (filters.phone) {
                                where.contact = {
                                    phone: { contains: filters.phone, mode: 'insensitive' },
                                };
                            }
                            if (filters.status) {
                                where.contact = __assign(__assign({}, where.contact), { status: filters.status });
                            }
                            if (filters.tag) {
                                where.contact = __assign(__assign({}, where.contact), { tag: filters.tag });
                            }
                            // Busca por nome ou telefone
                            if (filters.search) {
                                where.OR = [
                                    {
                                        contact: {
                                            name: { contains: filters.search, mode: 'insensitive' },
                                        },
                                    },
                                    {
                                        contact: {
                                            phone: { contains: filters.search, mode: 'insensitive' },
                                        },
                                    },
                                ];
                            }
                            // Filtro de data
                            if (filters.dateStart || filters.dateEnd) {
                                where.lastMessageAt = {};
                                if (filters.dateStart) {
                                    where.lastMessageAt.gte = new Date(filters.dateStart);
                                }
                                if (filters.dateEnd) {
                                    where.lastMessageAt.lte = new Date(filters.dateEnd);
                                }
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.conversation.findMany({
                                        where: where,
                                        include: {
                                            contact: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                    phone: true,
                                                    tag: true,
                                                    status: true,
                                                    optIn: true,
                                                    optOutAt: true,
                                                    userId: true,
                                                },
                                            },
                                            instance: {
                                                select: {
                                                    id: true,
                                                    instanceName: true,
                                                    phoneNumber: true,
                                                    status: true,
                                                    userId: true,
                                                    user: {
                                                        select: { id: true, name: true, email: true },
                                                    },
                                                },
                                            },
                                            messages: {
                                                take: 1,
                                                orderBy: { createdAt: 'desc' },
                                                select: {
                                                    text: true,
                                                    type: true,
                                                    direction: true,
                                                    createdAt: true,
                                                },
                                            },
                                        },
                                        orderBy: (_b = {},
                                            _b[filters.sortBy] = filters.order,
                                            _b),
                                        take: filters.limit,
                                        skip: filters.offset,
                                    }),
                                    this.prisma.conversation.count({ where: where }),
                                ])];
                        case 1:
                            _a = _c.sent(), conversations = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    items: conversations.map(function (conv) { return ({
                                        id: conv.id,
                                        contactId: conv.contact.id,
                                        instanceId: conv.instance.id,
                                        contact: conv.contact,
                                        instance: conv.instance,
                                        lastMessageAt: conv.lastMessageAt,
                                        lastMessage: conv.messages[0] || null,
                                        createdAt: conv.createdAt,
                                        updatedAt: conv.updatedAt,
                                    }); }),
                                    total: total,
                                    limit: filters.limit,
                                    offset: filters.offset,
                                }];
                    }
                });
            });
        };
        /**
         * Obter detalhe de conversa
         */
        ConversationsService_1.prototype.getConversation = function (conversationId, currentUserId, isAdmin) {
            return __awaiter(this, void 0, void 0, function () {
                var conversation;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.conversation.findUnique({
                                where: { id: conversationId },
                                include: {
                                    contact: true,
                                    instance: {
                                        include: {
                                            user: {
                                                select: { id: true, name: true, email: true },
                                            },
                                        },
                                    },
                                },
                            })];
                        case 1:
                            conversation = _a.sent();
                            if (!conversation) {
                                throw new common_1.NotFoundException('Conversa não encontrada');
                            }
                            // Validar permissão
                            if (!isAdmin && conversation.instance.userId !== currentUserId) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            return [2 /*return*/, conversation];
                    }
                });
            });
        };
        /**
         * Obter mensagens da conversa
         */
        ConversationsService_1.prototype.getConversationMessages = function (conversationId_1, currentUserId_1, isAdmin_1) {
            return __awaiter(this, arguments, void 0, function (conversationId, currentUserId, isAdmin, limit, offset) {
                var conversation, _a, messages, total;
                if (limit === void 0) { limit = 50; }
                if (offset === void 0) { offset = 0; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getConversation(conversationId, currentUserId, isAdmin)];
                        case 1:
                            conversation = _b.sent();
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.message.findMany({
                                        where: { conversationId: conversationId },
                                        include: {
                                            contact: {
                                                select: { id: true, name: true, phone: true },
                                            },
                                        },
                                        orderBy: { occurredAt: 'asc' },
                                        take: limit,
                                        skip: offset,
                                    }),
                                    this.prisma.message.count({ where: { conversationId: conversationId } }),
                                ])];
                        case 2:
                            _a = _b.sent(), messages = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    items: messages,
                                    total: total,
                                    limit: limit,
                                    offset: offset,
                                    conversationId: conversationId,
                                }];
                    }
                });
            });
        };
        /**
         * Atualizar conversa
         */
        ConversationsService_1.prototype.updateConversation = function (conversationId, currentUserId, isAdmin, dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Validar permissão
                        return [4 /*yield*/, this.getConversation(conversationId, currentUserId, isAdmin)
                            // Por enquanto, não há campos editáveis em Conversation model
                            // Isso é preparado para futuras extensões (tag, notes)
                            // Se adicionar campos ao modelo, descomente:
                            /*
                            const updated = await this.prisma.conversation.update({
                              where: { id: conversationId },
                              data: dto,
                            })
                            return updated
                            */
                        ];
                        case 1:
                            // Validar permissão
                            _a.sent();
                            // Por enquanto, não há campos editáveis em Conversation model
                            // Isso é preparado para futuras extensões (tag, notes)
                            // Se adicionar campos ao modelo, descomente:
                            /*
                            const updated = await this.prisma.conversation.update({
                              where: { id: conversationId },
                              data: dto,
                            })
                            return updated
                            */
                            return [2 /*return*/, { message: 'Campos editáveis ainda não disponíveis' }];
                    }
                });
            });
        };
        /**
         * Marcar contato como opt-out
         */
        ConversationsService_1.prototype.markOptOut = function (conversationId, currentUserId, isAdmin) {
            return __awaiter(this, void 0, void 0, function () {
                var conversation, contact;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getConversation(conversationId, currentUserId, isAdmin)
                            // Atualizar status do contato
                        ];
                        case 1:
                            conversation = _a.sent();
                            return [4 /*yield*/, this.prisma.contact.update({
                                    where: { id: conversation.contactId },
                                    data: {
                                        status: 'OPTOUT',
                                        optOutAt: new Date(),
                                    },
                                })];
                        case 2:
                            contact = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    contact: contact,
                                    message: 'Contato marcado como opt-out',
                                }];
                    }
                });
            });
        };
        /**
         * Obter conversas por usuário (para dashboard/stats)
         */
        ConversationsService_1.prototype.getConversationStats = function (userId, isAdmin) {
            return __awaiter(this, void 0, void 0, function () {
                var where, _a, total, active, optout, unread;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            where = isAdmin ? {} : { instance: { userId: userId } };
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.conversation.count({ where: where }),
                                    this.prisma.conversation.count({
                                        where: __assign(__assign({}, where), { contact: { status: 'ACTIVE' } }),
                                    }),
                                    this.prisma.conversation.count({
                                        where: __assign(__assign({}, where), { contact: { status: 'OPTOUT' } }),
                                    }),
                                    this.prisma.conversation.count({
                                        where: __assign(__assign({}, where), { messages: {
                                                some: {
                                                    direction: 'INBOUND',
                                                },
                                            } }),
                                    }),
                                ])];
                        case 1:
                            _a = _b.sent(), total = _a[0], active = _a[1], optout = _a[2], unread = _a[3];
                            return [2 /*return*/, {
                                    total: total,
                                    active: active,
                                    optout: optout,
                                    unread: unread,
                                }];
                    }
                });
            });
        };
        return ConversationsService_1;
    }());
    __setFunctionName(_classThis, "ConversationsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConversationsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConversationsService = _classThis;
}();
exports.ConversationsService = ConversationsService;
