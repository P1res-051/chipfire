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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var throttler_1 = require("@nestjs/throttler");
var throttler_2 = require("@nestjs/throttler");
var core_1 = require("@nestjs/core");
var nestjs_pino_1 = require("nestjs-pino");
var nestjs_zod_1 = require("nestjs-zod");
var env_1 = require("./config/env");
var auth_module_1 = require("./auth/auth.module");
var prisma_module_1 = require("./prisma/prisma.module");
var users_module_1 = require("./users/users.module");
var health_module_1 = require("./health/health.module");
var seed_module_1 = require("./seed/seed.module");
var queues_module_1 = require("./queues/queues.module");
var evolution_module_1 = require("./evolution/evolution.module");
var instances_module_1 = require("./instances/instances.module");
var audit_module_1 = require("./audit/audit.module");
var settings_module_1 = require("./settings/settings.module");
var templates_module_1 = require("./templates/templates.module");
var webhooks_module_1 = require("./webhooks/webhooks.module");
var logs_module_1 = require("./logs/logs.module");
var contacts_module_1 = require("./contacts/contacts.module");
var dashboard_module_1 = require("./dashboard/dashboard.module");
var media_module_1 = require("./media/media.module");
var conversations_module_1 = require("./conversations/conversations.module");
var campaigns_module_1 = require("./campaigns/campaigns.module");
var AppModule = function () {
    var _a;
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    validate: function (env) { return env_1.envSchema.parse(env); },
                }),
                nestjs_pino_1.LoggerModule.forRoot({
                    pinoHttp: {
                        level: (_a = process.env.LOG_LEVEL) !== null && _a !== void 0 ? _a : 'info',
                        transport: process.env.LOG_PRETTY === 'true'
                            ? { target: 'pino-pretty', options: { colorize: true } }
                            : undefined,
                        redact: {
                            paths: ['req.headers.authorization', 'req.headers.cookie'],
                            remove: true,
                        },
                    },
                }),
                throttler_1.ThrottlerModule.forRoot([
                    {
                        ttl: 60000,
                        limit: 120,
                    },
                ]),
                prisma_module_1.PrismaModule,
                audit_module_1.AuditModule,
                seed_module_1.SeedModule,
                auth_module_1.AuthModule,
                users_module_1.UsersModule,
                health_module_1.HealthModule,
                queues_module_1.QueuesModule,
                evolution_module_1.EvolutionModule,
                instances_module_1.InstancesModule,
                settings_module_1.SettingsModule,
                templates_module_1.TemplatesModule,
                webhooks_module_1.WebhooksModule,
                logs_module_1.LogsModule,
                contacts_module_1.ContactsModule,
                dashboard_module_1.DashboardModule,
                media_module_1.MediaModule,
                conversations_module_1.ConversationsModule,
                campaigns_module_1.CampaignsModule,
            ],
            providers: [
                { provide: core_1.APP_PIPE, useClass: nestjs_zod_1.ZodValidationPipe },
                { provide: core_1.APP_GUARD, useClass: throttler_2.ThrottlerGuard },
            ],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AppModule = _classThis = /** @class */ (function () {
        function AppModule_1() {
        }
        return AppModule_1;
    }());
    __setFunctionName(_classThis, "AppModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppModule = _classThis;
}();
exports.AppModule = AppModule;
