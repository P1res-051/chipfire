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
exports.AuthService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var bcrypt = require("bcrypt");
var crypto_1 = require("crypto");
var nanoid_1 = require("nanoid");
var AuthService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuthService = _classThis = /** @class */ (function () {
        function AuthService_1(prisma, jwt, config) {
            this.prisma = prisma;
            this.jwt = jwt;
            this.config = config;
        }
        AuthService_1.prototype.hashToken = function (token) {
            return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        };
        AuthService_1.prototype.signAccessToken = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var ttl;
                return __generator(this, function (_a) {
                    ttl = this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true });
                    return [2 /*return*/, this.jwt.signAsync({ sub: user.id, role: user.role }, { expiresIn: ttl })];
                });
            });
        };
        AuthService_1.prototype.createRefreshSession = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var ttl, refreshToken, refreshTokenHash, expiresAt;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ttl = this.config.get('JWT_REFRESH_TTL_SECONDS', { infer: true });
                            refreshToken = (0, nanoid_1.nanoid)(64);
                            refreshTokenHash = this.hashToken(refreshToken);
                            expiresAt = new Date(Date.now() + ttl * 1000);
                            return [4 /*yield*/, this.prisma.authSession.create({
                                    data: { userId: userId, refreshTokenHash: refreshTokenHash, expiresAt: expiresAt },
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { refreshToken: refreshToken, refreshTokenHash: refreshTokenHash, expiresAt: expiresAt }];
                    }
                });
            });
        };
        AuthService_1.prototype.login = function (email, password) {
            return __awaiter(this, void 0, void 0, function () {
                var user, ok, accessToken, refreshToken;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({ where: { email: email } })];
                        case 1:
                            user = _a.sent();
                            if (!user)
                                throw new common_1.UnauthorizedException('Credenciais inválidas');
                            if (user.status !== client_1.UserStatus.ACTIVE)
                                throw new common_1.ForbiddenException('Usuário inativo');
                            return [4 /*yield*/, bcrypt.compare(password, user.passwordHash)];
                        case 2:
                            ok = _a.sent();
                            if (!ok)
                                throw new common_1.UnauthorizedException('Credenciais inválidas');
                            return [4 /*yield*/, this.prisma.user.update({
                                    where: { id: user.id },
                                    data: { lastLoginAt: new Date() },
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.signAccessToken(user)];
                        case 4:
                            accessToken = _a.sent();
                            return [4 /*yield*/, this.createRefreshSession(user.id)];
                        case 5:
                            refreshToken = (_a.sent()).refreshToken;
                            return [2 /*return*/, {
                                    accessToken: accessToken,
                                    refreshToken: refreshToken,
                                    role: user.role,
                                    mustChangePassword: user.mustChangePassword,
                                }];
                    }
                });
            });
        };
        AuthService_1.prototype.refresh = function (refreshToken) {
            return __awaiter(this, void 0, void 0, function () {
                var refreshTokenHash, session, accessToken, newSession;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            refreshTokenHash = this.hashToken(refreshToken);
                            return [4 /*yield*/, this.prisma.authSession.findFirst({
                                    where: { refreshTokenHash: refreshTokenHash, revokedAt: null },
                                    include: { user: true },
                                })];
                        case 1:
                            session = _a.sent();
                            if (!session)
                                throw new common_1.UnauthorizedException('Refresh token inválido');
                            if (session.expiresAt.getTime() < Date.now())
                                throw new common_1.UnauthorizedException('Refresh expirado');
                            if (session.user.status !== client_1.UserStatus.ACTIVE)
                                throw new common_1.ForbiddenException('Usuário inativo');
                            // Rotação: revoga e cria outro
                            return [4 /*yield*/, this.prisma.authSession.update({
                                    where: { id: session.id },
                                    data: { revokedAt: new Date() },
                                })];
                        case 2:
                            // Rotação: revoga e cria outro
                            _a.sent();
                            return [4 /*yield*/, this.signAccessToken(session.user)];
                        case 3:
                            accessToken = _a.sent();
                            return [4 /*yield*/, this.createRefreshSession(session.user.id)];
                        case 4:
                            newSession = _a.sent();
                            return [2 /*return*/, {
                                    accessToken: accessToken,
                                    refreshToken: newSession.refreshToken,
                                    role: session.user.role,
                                    mustChangePassword: session.user.mustChangePassword,
                                }];
                    }
                });
            });
        };
        AuthService_1.prototype.logout = function (refreshToken) {
            return __awaiter(this, void 0, void 0, function () {
                var refreshTokenHash;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            refreshTokenHash = this.hashToken(refreshToken);
                            return [4 /*yield*/, this.prisma.authSession.updateMany({
                                    where: { refreshTokenHash: refreshTokenHash, revokedAt: null },
                                    data: { revokedAt: new Date() },
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        AuthService_1.prototype.changePassword = function (userId, currentPassword, newPassword) {
            return __awaiter(this, void 0, void 0, function () {
                var user, ok, passwordHash;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({ where: { id: userId } })];
                        case 1:
                            user = _a.sent();
                            if (!user)
                                throw new common_1.UnauthorizedException('Usuário não encontrado');
                            return [4 /*yield*/, bcrypt.compare(currentPassword, user.passwordHash)];
                        case 2:
                            ok = _a.sent();
                            if (!ok)
                                throw new common_1.UnauthorizedException('Senha atual inválida');
                            return [4 /*yield*/, bcrypt.hash(newPassword, 12)];
                        case 3:
                            passwordHash = _a.sent();
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.user.update({
                                        where: { id: userId },
                                        data: { passwordHash: passwordHash, mustChangePassword: false },
                                    }),
                                    this.prisma.authSession.updateMany({
                                        where: { userId: userId, revokedAt: null },
                                        data: { revokedAt: new Date() },
                                    }),
                                ])];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, { ok: true }];
                    }
                });
            });
        };
        return AuthService_1;
    }());
    __setFunctionName(_classThis, "AuthService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
}();
exports.AuthService = AuthService;
