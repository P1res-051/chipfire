"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.DashboardService = void 0;
var common_1 = require("@nestjs/common");
function startOfDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}
function subDays(date, days) {
    var d = new Date(date);
    d.setUTCDate(d.getUTCDate() - days);
    return d;
}
var DashboardService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DashboardService = _classThis = /** @class */ (function () {
        function DashboardService_1(prisma) {
            this.prisma = prisma;
        }
        DashboardService_1.prototype.adminDashboard = function () {
            return __awaiter(this, void 0, void 0, function () {
                var todayStart, from7, _a, totalUsers, activeUsers, totalInstances, connectedInstances, disconnectedInstances, _b, totalContacts, optOutContacts, messagesSentToday, messagesReceivedToday, errorsToday, campaignsActive, healthAverageAgg, healthAverage, chartInstancesByStatus, chartErrorsByType, chartMessagesByDay;
                var _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            todayStart = startOfDay(new Date());
                            from7 = subDays(todayStart, 6);
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.user.count(),
                                    this.prisma.user.count({ where: { status: 'ACTIVE' } }),
                                    this.prisma.whatsAppInstance.count(),
                                    this.prisma.whatsAppInstance.count({ where: { status: 'CONNECTED' } }),
                                    this.prisma.whatsAppInstance.count({ where: { status: 'DISCONNECTED' } }),
                                ])];
                        case 1:
                            _a = _f.sent(), totalUsers = _a[0], activeUsers = _a[1], totalInstances = _a[2], connectedInstances = _a[3], disconnectedInstances = _a[4];
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.contact.count(),
                                    this.prisma.contact.count({ where: { status: 'OPTOUT' } }),
                                ])];
                        case 2:
                            _b = _f.sent(), totalContacts = _b[0], optOutContacts = _b[1];
                            return [4 /*yield*/, this.prisma.whatsAppInstance.aggregate({
                                    _sum: { messagesSentToday: true },
                                })];
                        case 3:
                            messagesSentToday = _f.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.aggregate({
                                    _sum: { messagesReceivedToday: true },
                                })];
                        case 4:
                            messagesReceivedToday = _f.sent();
                            return [4 /*yield*/, this.prisma.messageLog.count({
                                    where: {
                                        createdAt: { gte: todayStart },
                                        status: { not: 'SUCCESS' },
                                    },
                                })];
                        case 5:
                            errorsToday = _f.sent();
                            return [4 /*yield*/, this.prisma.campaign.count({
                                    where: { status: 'ACTIVE' },
                                })];
                        case 6:
                            campaignsActive = _f.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.aggregate({
                                    _avg: { healthScore: true },
                                })];
                        case 7:
                            healthAverageAgg = _f.sent();
                            healthAverage = Math.round((_c = healthAverageAgg._avg.healthScore) !== null && _c !== void 0 ? _c : 0);
                            return [4 /*yield*/, this.prisma.whatsAppInstance.groupBy({
                                    by: ['status'],
                                    _count: { _all: true },
                                })];
                        case 8:
                            chartInstancesByStatus = _f.sent();
                            return [4 /*yield*/, this.prisma.messageLog.groupBy({
                                    by: ['errorType'],
                                    where: { createdAt: { gte: from7 } },
                                    _count: { _all: true },
                                })];
                        case 9:
                            chartErrorsByType = _f.sent();
                            return [4 /*yield*/, this.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT\n        to_char(date_trunc('day', m.\"occurredAt\"), 'YYYY-MM-DD') as day,\n        SUM(CASE WHEN m.\"direction\" = 'INBOUND' THEN 1 ELSE 0 END)::int as inbound,\n        SUM(CASE WHEN m.\"direction\" = 'OUTBOUND' THEN 1 ELSE 0 END)::int as outbound\n      FROM \"Message\" m\n      WHERE m.\"occurredAt\" >= ", "\n      GROUP BY 1\n      ORDER BY 1 ASC\n    "], ["\n      SELECT\n        to_char(date_trunc('day', m.\"occurredAt\"), 'YYYY-MM-DD') as day,\n        SUM(CASE WHEN m.\"direction\" = 'INBOUND' THEN 1 ELSE 0 END)::int as inbound,\n        SUM(CASE WHEN m.\"direction\" = 'OUTBOUND' THEN 1 ELSE 0 END)::int as outbound\n      FROM \"Message\" m\n      WHERE m.\"occurredAt\" >= ", "\n      GROUP BY 1\n      ORDER BY 1 ASC\n    "])), from7)];
                        case 10:
                            chartMessagesByDay = _f.sent();
                            return [2 /*return*/, {
                                    totalUsers: totalUsers,
                                    activeUsers: activeUsers,
                                    totalInstances: totalInstances,
                                    connectedInstances: connectedInstances,
                                    disconnectedInstances: disconnectedInstances,
                                    totalContacts: totalContacts,
                                    optOutContacts: optOutContacts,
                                    messagesSentToday: (_d = messagesSentToday._sum.messagesSentToday) !== null && _d !== void 0 ? _d : 0,
                                    messagesReceivedToday: (_e = messagesReceivedToday._sum.messagesReceivedToday) !== null && _e !== void 0 ? _e : 0,
                                    errorsToday: errorsToday,
                                    campaignsActive: campaignsActive,
                                    healthAverage: healthAverage,
                                    chartMessagesByDay: chartMessagesByDay,
                                    chartInstancesByStatus: chartInstancesByStatus,
                                    chartErrorsByType: chartErrorsByType,
                                }];
                    }
                });
            });
        };
        DashboardService_1.prototype.userDashboard = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var todayStart, from7, myInstances, connectedInstances, sums, errorsToday, optOutsToday, chartMyInstancesStatus, chartMessagesByDay;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            todayStart = startOfDay(new Date());
                            from7 = subDays(todayStart, 6);
                            return [4 /*yield*/, this.prisma.whatsAppInstance.count({ where: { userId: userId } })];
                        case 1:
                            myInstances = _d.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.count({
                                    where: { userId: userId, status: 'CONNECTED' },
                                })];
                        case 2:
                            connectedInstances = _d.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.aggregate({
                                    where: { userId: userId },
                                    _sum: { messagesSentToday: true, messagesReceivedToday: true, errorCount: true, optOutCount: true },
                                    _avg: { healthScore: true },
                                })];
                        case 3:
                            sums = _d.sent();
                            return [4 /*yield*/, this.prisma.messageLog.count({
                                    where: {
                                        userId: userId,
                                        createdAt: { gte: todayStart },
                                        status: { not: 'SUCCESS' },
                                    },
                                })];
                        case 4:
                            errorsToday = _d.sent();
                            return [4 /*yield*/, this.prisma.contact.count({
                                    where: { userId: userId, status: 'OPTOUT', optOutAt: { gte: todayStart } },
                                })];
                        case 5:
                            optOutsToday = _d.sent();
                            return [4 /*yield*/, this.prisma.whatsAppInstance.groupBy({
                                    by: ['status'],
                                    where: { userId: userId },
                                    _count: { _all: true },
                                })];
                        case 6:
                            chartMyInstancesStatus = _d.sent();
                            return [4 /*yield*/, this.prisma.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      SELECT\n        to_char(date_trunc('day', m.\"occurredAt\"), 'YYYY-MM-DD') as day,\n        SUM(CASE WHEN m.\"direction\" = 'INBOUND' THEN 1 ELSE 0 END)::int as inbound,\n        SUM(CASE WHEN m.\"direction\" = 'OUTBOUND' THEN 1 ELSE 0 END)::int as outbound\n      FROM \"Message\" m\n      WHERE m.\"occurredAt\" >= ", " AND m.\"instanceId\" IN (\n        SELECT i.\"id\" FROM \"WhatsAppInstance\" i WHERE i.\"userId\" = ", "\n      )\n      GROUP BY 1\n      ORDER BY 1 ASC\n    "], ["\n      SELECT\n        to_char(date_trunc('day', m.\"occurredAt\"), 'YYYY-MM-DD') as day,\n        SUM(CASE WHEN m.\"direction\" = 'INBOUND' THEN 1 ELSE 0 END)::int as inbound,\n        SUM(CASE WHEN m.\"direction\" = 'OUTBOUND' THEN 1 ELSE 0 END)::int as outbound\n      FROM \"Message\" m\n      WHERE m.\"occurredAt\" >= ", " AND m.\"instanceId\" IN (\n        SELECT i.\"id\" FROM \"WhatsAppInstance\" i WHERE i.\"userId\" = ", "\n      )\n      GROUP BY 1\n      ORDER BY 1 ASC\n    "])), from7, userId)];
                        case 7:
                            chartMessagesByDay = _d.sent();
                            return [2 /*return*/, {
                                    myInstances: myInstances,
                                    connectedInstances: connectedInstances,
                                    messagesSentToday: (_a = sums._sum.messagesSentToday) !== null && _a !== void 0 ? _a : 0,
                                    messagesReceivedToday: (_b = sums._sum.messagesReceivedToday) !== null && _b !== void 0 ? _b : 0,
                                    errorsToday: errorsToday,
                                    optOutsToday: optOutsToday,
                                    healthAverage: Math.round((_c = sums._avg.healthScore) !== null && _c !== void 0 ? _c : 0),
                                    chartMessagesByDay: chartMessagesByDay,
                                    chartMyInstancesStatus: chartMyInstancesStatus,
                                }];
                    }
                });
            });
        };
        return DashboardService_1;
    }());
    __setFunctionName(_classThis, "DashboardService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DashboardService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DashboardService = _classThis;
}();
exports.DashboardService = DashboardService;
var templateObject_1, templateObject_2;
