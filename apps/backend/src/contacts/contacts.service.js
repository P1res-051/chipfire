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
exports.ContactsService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var XLSX = require("xlsx");
var phone_1 = require("../common/phone");
function parseExcel(buffer) {
    var wb = XLSX.read(buffer, { type: 'buffer' });
    var sheetName = wb.SheetNames[0];
    if (!sheetName)
        return [];
    var sheet = wb.Sheets[sheetName];
    var rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return rows.map(function (r) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return ({
            name: String((_d = (_c = (_b = (_a = r['NOME']) !== null && _a !== void 0 ? _a : r['Nome']) !== null && _b !== void 0 ? _b : r['name']) !== null && _c !== void 0 ? _c : r['NAME']) !== null && _d !== void 0 ? _d : '').trim(),
            phone: String((_h = (_g = (_f = (_e = r['TELEFONE']) !== null && _e !== void 0 ? _e : r['Telefone']) !== null && _f !== void 0 ? _f : r['phone']) !== null && _g !== void 0 ? _g : r['PHONE']) !== null && _h !== void 0 ? _h : '').trim(),
            tag: String((_m = (_l = (_k = (_j = r['ETIQUETA']) !== null && _j !== void 0 ? _j : r['Etiqueta']) !== null && _k !== void 0 ? _k : r['tag']) !== null && _l !== void 0 ? _l : r['TAG']) !== null && _m !== void 0 ? _m : '').trim() || undefined,
        });
    });
}
var ContactsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ContactsService = _classThis = /** @class */ (function () {
        function ContactsService_1(prisma) {
            this.prisma = prisma;
        }
        ContactsService_1.prototype.assertAccess = function (user, ownerUserId) {
            if (user.role !== client_1.UserRole.ADMIN && user.sub !== ownerUserId) {
                throw new common_1.ForbiddenException('Acesso negado');
            }
        };
        ContactsService_1.prototype.list = function (user, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var where;
                return __generator(this, function (_a) {
                    where = {
                        userId: user.role === client_1.UserRole.ADMIN ? filters.userId : user.sub,
                        status: filters.status,
                        tag: filters.tag,
                        OR: filters.q
                            ? [
                                { name: { contains: filters.q, mode: 'insensitive' } },
                                { phone: { contains: filters.q } },
                            ]
                            : undefined,
                    };
                    return [2 /*return*/, this.prisma.contact.findMany({
                            where: where,
                            orderBy: { createdAt: 'desc' },
                            take: 2000,
                        })];
                });
            });
        };
        ContactsService_1.prototype.get = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                var c;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.contact.findUnique({ where: { id: id } })];
                        case 1:
                            c = _a.sent();
                            if (!c)
                                throw new common_1.NotFoundException('Contato não encontrado');
                            this.assertAccess(user, c.userId);
                            return [2 /*return*/, c];
                    }
                });
            });
        };
        ContactsService_1.prototype.create = function (user, data) {
            return __awaiter(this, void 0, void 0, function () {
                var normalized;
                return __generator(this, function (_a) {
                    this.assertAccess(user, data.userId);
                    normalized = (0, phone_1.normalizeBrazilPhone)(data.phone);
                    if (!(0, phone_1.isValidBrazilPhoneWithDDI55)(normalized)) {
                        throw new common_1.BadRequestException('Telefone inválido (exija DDI 55 + DDD + número)');
                    }
                    return [2 /*return*/, this.prisma.contact.upsert({
                            where: { userId_phone: { userId: data.userId, phone: normalized } },
                            create: {
                                userId: data.userId,
                                name: data.name,
                                phone: normalized,
                                tag: data.tag,
                                optIn: data.optIn,
                                status: data.status,
                                source: 'MANUAL',
                            },
                            update: {
                                name: data.name,
                                tag: data.tag,
                                optIn: data.optIn,
                                status: data.status,
                            },
                        })];
                });
            });
        };
        ContactsService_1.prototype.update = function (user, id, data) {
            return __awaiter(this, void 0, void 0, function () {
                var c;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get(user, id)];
                        case 1:
                            c = _a.sent();
                            return [2 /*return*/, this.prisma.contact.update({
                                    where: { id: id },
                                    data: __assign(__assign({}, data), { tag: data.tag === null ? null : data.tag }),
                                })];
                    }
                });
            });
        };
        ContactsService_1.prototype.markOptOut = function (user, id) {
            return __awaiter(this, void 0, void 0, function () {
                var c;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get(user, id)];
                        case 1:
                            c = _a.sent();
                            return [2 /*return*/, this.prisma.contact.update({
                                    where: { id: c.id },
                                    data: { status: client_1.ContactStatus.OPTOUT, optIn: false, optOutAt: new Date() },
                                })];
                    }
                });
            });
        };
        ContactsService_1.prototype.exportCsv = function (user, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var contacts, header, lines, _i, contacts_1, c;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.list(user, { userId: userId, status: undefined, tag: undefined, q: undefined })];
                        case 1:
                            contacts = _d.sent();
                            header = ['NOME', 'TELEFONE', 'ETIQUETA', 'OPT_IN', 'STATUS'];
                            lines = [header.join(',')];
                            for (_i = 0, contacts_1 = contacts; _i < contacts_1.length; _i++) {
                                c = contacts_1[_i];
                                lines.push([
                                    JSON.stringify((_a = c.name) !== null && _a !== void 0 ? _a : ''),
                                    JSON.stringify((_b = c.phone) !== null && _b !== void 0 ? _b : ''),
                                    JSON.stringify((_c = c.tag) !== null && _c !== void 0 ? _c : ''),
                                    JSON.stringify(c.optIn ? 'true' : 'false'),
                                    JSON.stringify(c.status),
                                ].join(','));
                            }
                            return [2 /*return*/, lines.join('\n')];
                    }
                });
            });
        };
        ContactsService_1.prototype.importExcel = function (user, params) {
            return __awaiter(this, void 0, void 0, function () {
                var rows, created, updated, invalid, skipped, _i, rows_1, row, name_1, phoneNormalized, existing;
                var _a, _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            this.assertAccess(user, params.userId);
                            if (!params.confirmOptIn) {
                                throw new common_1.BadRequestException('Confirmação de opt-in é obrigatória para importação');
                            }
                            rows = parseExcel(params.fileBuffer);
                            if (!rows.length)
                                throw new common_1.BadRequestException('Planilha vazia ou inválida (colunas: NOME, TELEFONE, ETIQUETA)');
                            created = 0;
                            updated = 0;
                            invalid = 0;
                            skipped = 0;
                            _i = 0, rows_1 = rows;
                            _f.label = 1;
                        case 1:
                            if (!(_i < rows_1.length)) return [3 /*break*/, 7];
                            row = rows_1[_i];
                            name_1 = ((_a = row.name) !== null && _a !== void 0 ? _a : '').trim();
                            phoneNormalized = (0, phone_1.normalizeBrazilPhone)(row.phone);
                            if (!name_1 || !(0, phone_1.isValidBrazilPhoneWithDDI55)(phoneNormalized)) {
                                invalid++;
                                return [3 /*break*/, 6];
                            }
                            return [4 /*yield*/, this.prisma.contact.findUnique({
                                    where: { userId_phone: { userId: params.userId, phone: phoneNormalized } },
                                })];
                        case 2:
                            existing = _f.sent();
                            if (!!existing) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.contact.create({
                                    data: {
                                        userId: params.userId,
                                        name: name_1,
                                        phone: phoneNormalized,
                                        tag: row.tag,
                                        optIn: true,
                                        status: client_1.ContactStatus.ACTIVE,
                                        source: (_b = params.source) !== null && _b !== void 0 ? _b : 'EXCEL',
                                    },
                                })];
                        case 3:
                            _f.sent();
                            created++;
                            return [3 /*break*/, 6];
                        case 4:
                            // Atualiza tag/nome e mantém opt-out se já ocorreu
                            if (existing.status === client_1.ContactStatus.OPTOUT) {
                                skipped++;
                                return [3 /*break*/, 6];
                            }
                            return [4 /*yield*/, this.prisma.contact.update({
                                    where: { id: existing.id },
                                    data: {
                                        name: name_1,
                                        tag: (_c = row.tag) !== null && _c !== void 0 ? _c : existing.tag,
                                        optIn: true,
                                        status: existing.status === client_1.ContactStatus.INACTIVE ? client_1.ContactStatus.ACTIVE : existing.status,
                                        source: (_e = (_d = existing.source) !== null && _d !== void 0 ? _d : params.source) !== null && _e !== void 0 ? _e : 'EXCEL',
                                    },
                                })];
                        case 5:
                            _f.sent();
                            updated++;
                            _f.label = 6;
                        case 6:
                            _i++;
                            return [3 /*break*/, 1];
                        case 7: return [2 /*return*/, { total: rows.length, created: created, updated: updated, invalid: invalid, skipped: skipped }];
                    }
                });
            });
        };
        return ContactsService_1;
    }());
    __setFunctionName(_classThis, "ContactsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ContactsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ContactsService = _classThis;
}();
exports.ContactsService = ContactsService;
