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
exports.StorageService = void 0;
var common_1 = require("@nestjs/common");
var fs = require("fs");
var path = require("path");
var minio_1 = require("minio");
var StorageService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var StorageService = _classThis = /** @class */ (function () {
        function StorageService_1(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(StorageService.name);
            this.minioClient = null;
            this.minioEnabled = this.configService.get('MINIO_ENABLED') === 'true';
            this.minioBucket = this.configService.get('MINIO_BUCKET', 'evo-crm');
            this.storageDir = path.join(process.cwd(), '..', '..', 'storage', 'uploads');
            // Garantir que a pasta de storage local existe
            if (!fs.existsSync(this.storageDir)) {
                fs.mkdirSync(this.storageDir, { recursive: true });
                this.logger.log("Diret\u00F3rio de storage criado: ".concat(this.storageDir));
            }
            // Inicializar MinIO se habilitado
            if (this.minioEnabled) {
                try {
                    this.initMinioClient();
                }
                catch (error) {
                    this.logger.warn("Falha ao conectar MinIO: ".concat(error.message, ". Usando storage local como fallback."));
                    this.minioEnabled = false;
                }
            }
        }
        StorageService_1.prototype.initMinioClient = function () {
            var endpoint = this.configService.get('MINIO_ENDPOINT');
            var rootUser = this.configService.get('MINIO_ROOT_USER');
            var rootPassword = this.configService.get('MINIO_ROOT_PASSWORD');
            if (!endpoint || !rootUser || !rootPassword) {
                throw new Error('MinIO config incompleto');
            }
            this.minioClient = new minio_1.Client({
                endPoint: endpoint.replace('http://', '').replace('https://', ''),
                useSSL: endpoint.startsWith('https'),
                accessKey: rootUser,
                secretKey: rootPassword,
            });
            this.logger.log("MinIO client inicializado: ".concat(endpoint));
        };
        StorageService_1.prototype.uploadFile = function (file, slug) {
            return __awaiter(this, void 0, void 0, function () {
                var fileName, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!file)
                                throw new Error('Arquivo não fornecido');
                            fileName = "".concat(slug, "-").concat(Date.now()).concat(path.extname(file.originalname));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            if (!(this.minioEnabled && this.minioClient)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.uploadToMinio(file, fileName)];
                        case 2: return [2 /*return*/, _a.sent()];
                        case 3: return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            this.logger.warn("Erro ao salvar no MinIO: ".concat(error_1.message, ". Usando storage local."));
                            return [3 /*break*/, 5];
                        case 5: 
                        // Fallback: salvar localmente
                        return [2 /*return*/, this.uploadToLocal(file, fileName)];
                    }
                });
            });
        };
        StorageService_1.prototype.uploadToMinio = function (file, fileName) {
            return __awaiter(this, void 0, void 0, function () {
                var bucketExists, publicUrl;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.minioClient.bucketExists(this.minioBucket)];
                        case 1:
                            bucketExists = _a.sent();
                            if (!!bucketExists) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.minioClient.makeBucket(this.minioBucket, 'us-east-1')];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: 
                        // Fazer upload
                        return [4 /*yield*/, this.minioClient.putObject(this.minioBucket, fileName, file.buffer, file.size, { 'Content-Type': file.mimetype })];
                        case 4:
                            // Fazer upload
                            _a.sent();
                            publicUrl = this.configService.get('MINIO_PUBLIC_URL');
                            return [2 /*return*/, {
                                    publicUrl: "".concat(publicUrl, "/").concat(this.minioBucket, "/").concat(fileName),
                                    filePath: "minio://".concat(this.minioBucket, "/").concat(fileName),
                                }];
                    }
                });
            });
        };
        StorageService_1.prototype.uploadToLocal = function (file, fileName) {
            var filePath = path.join(this.storageDir, fileName);
            fs.writeFileSync(filePath, file.buffer);
            return {
                publicUrl: "/storage/uploads/".concat(fileName),
                filePath: "local://".concat(fileName),
            };
        };
        StorageService_1.prototype.deleteFile = function (filePath) {
            return __awaiter(this, void 0, void 0, function () {
                var key, localPath, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            if (!filePath.startsWith('minio://')) return [3 /*break*/, 3];
                            if (!(this.minioEnabled && this.minioClient)) return [3 /*break*/, 2];
                            key = filePath.replace("minio://".concat(this.minioBucket, "/"), '');
                            return [4 /*yield*/, this.minioClient.removeObject(this.minioBucket, key)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [3 /*break*/, 4];
                        case 3:
                            if (filePath.startsWith('local://')) {
                                localPath = path.join(this.storageDir, filePath.replace('local://', ''));
                                if (fs.existsSync(localPath)) {
                                    fs.unlinkSync(localPath);
                                }
                            }
                            _a.label = 4;
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            error_2 = _a.sent();
                            this.logger.warn("Erro ao deletar arquivo ".concat(filePath, ": ").concat(error_2.message));
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        StorageService_1.prototype.getFileStream = function (filePath) {
            return __awaiter(this, void 0, void 0, function () {
                var key, localPath, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            if (!filePath.startsWith('minio://')) return [3 /*break*/, 3];
                            if (!(this.minioEnabled && this.minioClient)) return [3 /*break*/, 2];
                            key = filePath.replace("minio://".concat(this.minioBucket, "/"), '');
                            return [4 /*yield*/, this.minioClient.getObject(this.minioBucket, key)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2: return [3 /*break*/, 4];
                        case 3:
                            if (filePath.startsWith('local://')) {
                                localPath = path.join(this.storageDir, filePath.replace('local://', ''));
                                if (fs.existsSync(localPath)) {
                                    return [2 /*return*/, fs.createReadStream(localPath)];
                                }
                            }
                            _a.label = 4;
                        case 4: return [2 /*return*/, null];
                        case 5:
                            error_3 = _a.sent();
                            this.logger.error("Erro ao ler arquivo ".concat(filePath, ": ").concat(error_3.message));
                            return [2 /*return*/, null];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        return StorageService_1;
    }());
    __setFunctionName(_classThis, "StorageService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        StorageService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return StorageService = _classThis;
}();
exports.StorageService = StorageService;
