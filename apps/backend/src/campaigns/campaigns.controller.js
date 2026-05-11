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
exports.CampaignsController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
var roles_guard_1 = require("../auth/roles.guard");
var roles_decorator_1 = require("../auth/roles.decorator");
var CampaignsController = function () {
    var _classDecorators = [(0, common_1.Controller)('campaigns'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)('ADMIN')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _listCampaigns_decorators;
    var _createCampaign_decorators;
    var _getCampaignById_decorators;
    var _updateCampaign_decorators;
    var _deleteCampaign_decorators;
    var _startCampaign_decorators;
    var _pauseCampaign_decorators;
    var _stopCampaign_decorators;
    var _getCampaignMetrics_decorators;
    var CampaignsController = _classThis = /** @class */ (function () {
        function CampaignsController_1(campaignsService) {
            this.campaignsService = (__runInitializers(this, _instanceExtraInitializers), campaignsService);
        }
        CampaignsController_1.prototype.listCampaigns = function (user, status, limit, offset) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.campaignsService.listCampaigns(user.id, true, {
                            status: status,
                            limit: limit ? parseInt(limit) : undefined,
                            offset: offset ? parseInt(offset) : undefined,
                        })];
                });
            });
        };
        CampaignsController_1.prototype.createCampaign = function (user, dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.campaignsService.createCampaign(user.id, dto)];
                });
            });
        };
        CampaignsController_1.prototype.getCampaignById = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.campaignsService.getCampaignById(id, user.id, true)];
                });
            });
        };
        CampaignsController_1.prototype.updateCampaign = function (user, id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.campaignsService.updateCampaign(id, user.id, dto, true)];
                });
            });
        };
        CampaignsController_1.prototype.deleteCampaign = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.campaignsService.deleteCampaign(id, user.id, true)];
                });
            });
        };
        CampaignsController_1.prototype.startCampaign = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.campaignsService.startCampaign(id, user.id, true)];
                });
            });
        };
        CampaignsController_1.prototype.pauseCampaign = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.campaignsService.pauseCampaign(id, user.id, true)];
                });
            });
        };
        CampaignsController_1.prototype.stopCampaign = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.campaignsService.stopCampaign(id, user.id, true)];
                });
            });
        };
        CampaignsController_1.prototype.getCampaignMetrics = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.campaignsService.getCampaignMetrics(id, user.id, true)];
                });
            });
        };
        return CampaignsController_1;
    }());
    __setFunctionName(_classThis, "CampaignsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _listCampaigns_decorators = [(0, common_1.Get)()];
        _createCampaign_decorators = [(0, common_1.Post)()];
        _getCampaignById_decorators = [(0, common_1.Get)(':id')];
        _updateCampaign_decorators = [(0, common_1.Patch)(':id')];
        _deleteCampaign_decorators = [(0, common_1.Delete)(':id')];
        _startCampaign_decorators = [(0, common_1.Post)(':id/start')];
        _pauseCampaign_decorators = [(0, common_1.Post)(':id/pause')];
        _stopCampaign_decorators = [(0, common_1.Post)(':id/stop')];
        _getCampaignMetrics_decorators = [(0, common_1.Get)(':id/metrics')];
        __esDecorate(_classThis, null, _listCampaigns_decorators, { kind: "method", name: "listCampaigns", static: false, private: false, access: { has: function (obj) { return "listCampaigns" in obj; }, get: function (obj) { return obj.listCampaigns; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createCampaign_decorators, { kind: "method", name: "createCampaign", static: false, private: false, access: { has: function (obj) { return "createCampaign" in obj; }, get: function (obj) { return obj.createCampaign; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCampaignById_decorators, { kind: "method", name: "getCampaignById", static: false, private: false, access: { has: function (obj) { return "getCampaignById" in obj; }, get: function (obj) { return obj.getCampaignById; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateCampaign_decorators, { kind: "method", name: "updateCampaign", static: false, private: false, access: { has: function (obj) { return "updateCampaign" in obj; }, get: function (obj) { return obj.updateCampaign; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteCampaign_decorators, { kind: "method", name: "deleteCampaign", static: false, private: false, access: { has: function (obj) { return "deleteCampaign" in obj; }, get: function (obj) { return obj.deleteCampaign; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _startCampaign_decorators, { kind: "method", name: "startCampaign", static: false, private: false, access: { has: function (obj) { return "startCampaign" in obj; }, get: function (obj) { return obj.startCampaign; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _pauseCampaign_decorators, { kind: "method", name: "pauseCampaign", static: false, private: false, access: { has: function (obj) { return "pauseCampaign" in obj; }, get: function (obj) { return obj.pauseCampaign; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _stopCampaign_decorators, { kind: "method", name: "stopCampaign", static: false, private: false, access: { has: function (obj) { return "stopCampaign" in obj; }, get: function (obj) { return obj.stopCampaign; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCampaignMetrics_decorators, { kind: "method", name: "getCampaignMetrics", static: false, private: false, access: { has: function (obj) { return "getCampaignMetrics" in obj; }, get: function (obj) { return obj.getCampaignMetrics; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CampaignsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CampaignsController = _classThis;
}();
exports.CampaignsController = CampaignsController;
