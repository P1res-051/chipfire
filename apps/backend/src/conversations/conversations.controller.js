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
exports.ConversationsController = void 0;
var common_1 = require("@nestjs/common");
var jwt_guard_1 = require("../auth/jwt.guard");
var list_conversations_query_1 = require("./dto/list-conversations.query");
var ConversationsController = function () {
    var _classDecorators = [(0, common_1.Controller)('conversations'), (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _listConversations_decorators;
    var _getConversation_decorators;
    var _getConversationMessages_decorators;
    var _updateConversation_decorators;
    var _markOptOut_decorators;
    var _getStats_decorators;
    var ConversationsController = _classThis = /** @class */ (function () {
        function ConversationsController_1(conversationsService) {
            this.conversationsService = (__runInitializers(this, _instanceExtraInitializers), conversationsService);
        }
        /**
         * GET /api/conversations
         * Listar conversas (com controle de permissão)
         */
        ConversationsController_1.prototype.listConversations = function (user, query) {
            return __awaiter(this, void 0, void 0, function () {
                var validatedQuery;
                return __generator(this, function (_a) {
                    validatedQuery = list_conversations_query_1.listConversationsQuerySchema.parse(query);
                    return [2 /*return*/, this.conversationsService.listConversations(user.id, user.role === 'ADMIN', validatedQuery)];
                });
            });
        };
        /**
         * GET /api/conversations/:id
         * Detalhe da conversa
         */
        ConversationsController_1.prototype.getConversation = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.conversationsService.getConversation(id, user.id, user.role === 'ADMIN')];
                });
            });
        };
        /**
         * GET /api/conversations/:id/messages
         * Histórico de mensagens
         */
        ConversationsController_1.prototype.getConversationMessages = function (user, id, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                var parsedLimit, parsedOffset;
                return __generator(this, function (_a) {
                    parsedLimit = Math.min(parseInt(limit || '50'), 100);
                    parsedOffset = parseInt(offset || '0');
                    return [2 /*return*/, this.conversationsService.getConversationMessages(id, user.id, user.role === 'ADMIN', parsedLimit, parsedOffset)];
                });
            });
        };
        /**
         * PATCH /api/conversations/:id
         * Atualizar conversa
         */
        ConversationsController_1.prototype.updateConversation = function (user, id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.conversationsService.updateConversation(id, user.id, user.role === 'ADMIN', dto)];
                });
            });
        };
        /**
         * POST /api/conversations/:id/optout
         * Marcar contato como opt-out
         */
        ConversationsController_1.prototype.markOptOut = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.conversationsService.markOptOut(id, user.id, user.role === 'ADMIN')];
                });
            });
        };
        /**
         * GET /api/conversations/stats
         * Estatísticas de conversas
         */
        ConversationsController_1.prototype.getStats = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.conversationsService.getConversationStats(user.id, user.role === 'ADMIN')];
                });
            });
        };
        return ConversationsController_1;
    }());
    __setFunctionName(_classThis, "ConversationsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _listConversations_decorators = [(0, common_1.Get)()];
        _getConversation_decorators = [(0, common_1.Get)(':id')];
        _getConversationMessages_decorators = [(0, common_1.Get)(':id/messages')];
        _updateConversation_decorators = [(0, common_1.Patch)(':id')];
        _markOptOut_decorators = [(0, common_1.Post)(':id/optout')];
        _getStats_decorators = [(0, common_1.Get)('stats/overview')];
        __esDecorate(_classThis, null, _listConversations_decorators, { kind: "method", name: "listConversations", static: false, private: false, access: { has: function (obj) { return "listConversations" in obj; }, get: function (obj) { return obj.listConversations; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConversation_decorators, { kind: "method", name: "getConversation", static: false, private: false, access: { has: function (obj) { return "getConversation" in obj; }, get: function (obj) { return obj.getConversation; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConversationMessages_decorators, { kind: "method", name: "getConversationMessages", static: false, private: false, access: { has: function (obj) { return "getConversationMessages" in obj; }, get: function (obj) { return obj.getConversationMessages; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateConversation_decorators, { kind: "method", name: "updateConversation", static: false, private: false, access: { has: function (obj) { return "updateConversation" in obj; }, get: function (obj) { return obj.updateConversation; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _markOptOut_decorators, { kind: "method", name: "markOptOut", static: false, private: false, access: { has: function (obj) { return "markOptOut" in obj; }, get: function (obj) { return obj.markOptOut; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: function (obj) { return "getStats" in obj; }, get: function (obj) { return obj.getStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConversationsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConversationsController = _classThis;
}();
exports.ConversationsController = ConversationsController;
