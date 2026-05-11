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
exports.MediaService = void 0;
var common_1 = require("@nestjs/common");
var nanoid_1 = require("nanoid");
var MediaService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MediaService = _classThis = /** @class */ (function () {
        function MediaService_1(prisma, storage, config) {
            this.prisma = prisma;
            this.storage = storage;
            this.config = config;
            this.maxMediaSizeMb = this.config.get('MAX_MEDIA_SIZE_MB', 25);
        }
        /**
         * Determinar tipo de mídia baseado na extensão/mimetype
         */
        MediaService_1.prototype.determineMediaType = function (mimetype) {
            if (mimetype.startsWith('image/'))
                return 'IMAGE';
            if (mimetype.startsWith('video/'))
                return 'VIDEO';
            if (mimetype.startsWith('audio/'))
                return 'AUDIO';
            if (mimetype === 'application/pdf')
                return 'PDF';
            if (mimetype === 'application/msword' ||
                mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                mimetype === 'application/vnd.ms-excel' ||
                mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                return 'DOCUMENT';
            }
            return 'DOCUMENT'; // fallback
        };
        /**
         * Gerar slug único
         */
        MediaService_1.prototype.generateUniqueSlug = function (baseName) {
            return __awaiter(this, void 0, void 0, function () {
                var baseSlug, slug, counter;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            baseSlug = baseName
                                .toLowerCase()
                                .trim()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/^-+|-+$/g, '')
                                .substring(0, 50);
                            slug = baseSlug || (0, nanoid_1.nanoid)(8);
                            counter = 1;
                            _a.label = 1;
                        case 1: return [4 /*yield*/, this.prisma.mediaLibrary.findUnique({
                                where: { slug: slug },
                            })];
                        case 2:
                            if (!_a.sent()) return [3 /*break*/, 3];
                            slug = "".concat(baseSlug || 'media', "-").concat(counter);
                            counter++;
                            return [3 /*break*/, 1];
                        case 3: return [2 /*return*/, slug];
                    }
                });
            });
        };
        /**
         * Listar mídias do usuário com filtros
         */
        MediaService_1.prototype.listMedia = function (userId, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var limit, offset, where, _a, items, total;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            limit = Math.min(filters.limit || 50, 100);
                            offset = filters.offset || 0;
                            where = { userId: userId };
                            if (filters.type) {
                                where.type = filters.type;
                            }
                            if (filters.search) {
                                where.OR = [
                                    { name: { contains: filters.search, mode: 'insensitive' } },
                                    { slug: { contains: filters.search, mode: 'insensitive' } },
                                    { tags: { hasSome: [filters.search] } },
                                ];
                            }
                            if (filters.tag) {
                                where.tags = { hasSome: [filters.tag] };
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.mediaLibrary.findMany({
                                        where: where,
                                        take: limit,
                                        skip: offset,
                                        orderBy: { createdAt: 'desc' },
                                    }),
                                    this.prisma.mediaLibrary.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), items = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    items: items.map(function (m) { return (__assign(__assign({}, m), { variable: _this.getVariableForMedia(m.type, m.slug) })); }),
                                    total: total,
                                    limit: limit,
                                    offset: offset,
                                }];
                    }
                });
            });
        };
        /**
         * Upload de arquivo
         */
        MediaService_1.prototype.uploadMedia = function (userId, file, tags) {
            return __awaiter(this, void 0, void 0, function () {
                var fileSizeMb, type, slug, _a, publicUrl, filePath, tagsList, media;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!file) {
                                throw new common_1.BadRequestException('Arquivo não fornecido');
                            }
                            fileSizeMb = file.size / (1024 * 1024);
                            if (fileSizeMb > this.maxMediaSizeMb) {
                                throw new common_1.BadRequestException("Arquivo excede tamanho m\u00E1ximo de ".concat(this.maxMediaSizeMb, "MB"));
                            }
                            type = this.determineMediaType(file.mimetype);
                            return [4 /*yield*/, this.generateUniqueSlug(file.originalname.replace(/\.[^/.]+$/, ''))
                                // Fazer upload
                            ];
                        case 1:
                            slug = _b.sent();
                            return [4 /*yield*/, this.storage.uploadFile(file, slug)
                                // Parsear tags
                            ];
                        case 2:
                            _a = _b.sent(), publicUrl = _a.publicUrl, filePath = _a.filePath;
                            tagsList = tags
                                ? tags.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
                                : [];
                            return [4 /*yield*/, this.prisma.mediaLibrary.create({
                                    data: {
                                        userId: userId,
                                        name: file.originalname.replace(/\.[^/.]+$/, ''),
                                        slug: slug,
                                        type: type,
                                        filePath: filePath,
                                        publicUrl: publicUrl,
                                        mimeType: file.mimetype,
                                        size: file.size,
                                        tags: tagsList,
                                    },
                                })];
                        case 3:
                            media = _b.sent();
                            return [2 /*return*/, __assign(__assign({}, media), { variable: this.getVariableForMedia(media.type, media.slug) })];
                    }
                });
            });
        };
        /**
         * Criar texto pronto
         */
        MediaService_1.prototype.createTextMedia = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var slug, tagsList, media;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.generateUniqueSlug(dto.name)];
                        case 1:
                            slug = _a.sent();
                            tagsList = dto.tags
                                ? dto.tags.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
                                : [];
                            return [4 /*yield*/, this.prisma.mediaLibrary.create({
                                    data: {
                                        userId: userId,
                                        name: dto.name,
                                        slug: slug,
                                        type: 'TEXT',
                                        publicUrl: null, // Texto não tem URL
                                        filePath: null,
                                        mimeType: 'text/plain',
                                        size: Buffer.byteLength(dto.content, 'utf8'),
                                        tags: tagsList,
                                    },
                                })];
                        case 2:
                            media = _a.sent();
                            return [2 /*return*/, __assign(__assign({}, media), { content: dto.content, variable: this.getVariableForMedia(media.type, media.slug) })];
                    }
                });
            });
        };
        /**
         * Obter detalhe de mídia
         */
        MediaService_1.prototype.getMediaById = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var media;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mediaLibrary.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            media = _a.sent();
                            if (!media) {
                                throw new common_1.NotFoundException('Mídia não encontrada');
                            }
                            if (media.userId !== userId) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            return [2 /*return*/, __assign(__assign({}, media), { variable: this.getVariableForMedia(media.type, media.slug) })];
                    }
                });
            });
        };
        /**
         * Editar mídia
         */
        MediaService_1.prototype.updateMedia = function (id, userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var media, tagsList, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mediaLibrary.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            media = _a.sent();
                            if (!media) {
                                throw new common_1.NotFoundException('Mídia não encontrada');
                            }
                            if (media.userId !== userId) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            tagsList = dto.tags
                                ? dto.tags.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
                                : media.tags;
                            return [4 /*yield*/, this.prisma.mediaLibrary.update({
                                    where: { id: id },
                                    data: {
                                        name: dto.name || media.name,
                                        tags: tagsList,
                                    },
                                })];
                        case 2:
                            updated = _a.sent();
                            return [2 /*return*/, __assign(__assign({}, updated), { variable: this.getVariableForMedia(updated.type, updated.slug) })];
                    }
                });
            });
        };
        /**
         * Deletar mídia
         */
        MediaService_1.prototype.deleteMedia = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var media;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.mediaLibrary.findUnique({
                                where: { id: id },
                            })];
                        case 1:
                            media = _a.sent();
                            if (!media) {
                                throw new common_1.NotFoundException('Mídia não encontrada');
                            }
                            if (media.userId !== userId) {
                                throw new common_1.ForbiddenException('Acesso negado');
                            }
                            if (!media.filePath) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.storage.deleteFile(media.filePath)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: 
                        // Deletar do banco
                        return [4 /*yield*/, this.prisma.mediaLibrary.delete({
                                where: { id: id },
                            })];
                        case 4:
                            // Deletar do banco
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        /**
         * Obter stream para preview
         */
        MediaService_1.prototype.getMediaPreview = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var media, stream;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getMediaById(id, userId)];
                        case 1:
                            media = _a.sent();
                            if (!media.filePath) {
                                throw new common_1.BadRequestException('Mídia não tem arquivo para preview');
                            }
                            return [4 /*yield*/, this.storage.getFileStream(media.filePath)];
                        case 2:
                            stream = _a.sent();
                            if (!stream) {
                                throw new common_1.NotFoundException('Arquivo não encontrado no storage');
                            }
                            return [2 /*return*/, { stream: stream, mimeType: media.mimeType }];
                    }
                });
            });
        };
        /**
         * Gerar string de variável para cada tipo
         */
        MediaService_1.prototype.getVariableForMedia = function (type, slug) {
            var typeMap = {
                IMAGE: "{{imagem:".concat(slug, "}}"),
                VIDEO: "{{video:".concat(slug, "}}"),
                AUDIO: "{{audio:".concat(slug, "}}"),
                PDF: "{{documento:".concat(slug, "}}"),
                DOCUMENT: "{{documento:".concat(slug, "}}"),
                TEXT: "{{texto:".concat(slug, "}}"),
            };
            return typeMap[type] || "{{midia:".concat(slug, "}}");
        };
        return MediaService_1;
    }());
    __setFunctionName(_classThis, "MediaService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MediaService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MediaService = _classThis;
}();
exports.MediaService = MediaService;
