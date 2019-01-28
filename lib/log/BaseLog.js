"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const StackAnalysisUtil_1 = require("../util/StackAnalysisUtil");
const HttpContent_1 = require("../context/HttpContent");
const DailyRotateFile = require("winston-daily-rotate-file");
const { combine, timestamp, printf, splat } = winston_1.format;
/**
 *
 * 功能描述: 日志基础类
 *
 * @className BaseLog
 * @projectName papio
 * @author yanshaowen
 * @date 2019/1/27 14:33
 */
const consoleLogger = winston_1.createLogger({
    level: "silly",
    format: combine(timestamp({
        format: "YYYY-MM-DD HH:mm:dd.SSS",
    }), splat(), printf((nfo) => {
        let codeInfo = "";
        let classInfo = "";
        let errorStack = "";
        const base = `[${nfo.timestamp}] [${nfo.level}] `;
        if (nfo.meta !== null && nfo.meta.kind === "IConsoleLogMeta") {
            const meta = nfo.meta;
            const stackType = StackAnalysisUtil_1.StackAnalysisUtil.parseStackAll(meta.stack)[2];
            classInfo = `[${stackType.className} ${stackType.methodName}]`;
            codeInfo = `[${stackType.line} ${stackType.row} ${stackType.file}]`;
            if (meta.error) {
                errorStack = meta.error.stack;
            }
        }
        else if (nfo.meta !== null && nfo.meta.kind === "ISqlLogMeta") {
            const meta = nfo.meta;
            nfo.message = `query=${meta.query}, params=${JSON.stringify(meta.parameters)}`;
            if (meta.time) {
                nfo.message += "time=" + meta.time + "," + nfo.message;
            }
            if (meta.error) {
                nfo.message += "errorMessage=" + meta.error + "," + nfo.message;
            }
        }
        const logMessage = [];
        logMessage.push(base);
        if (classInfo.length > 0) {
            logMessage.push(classInfo);
        }
        if (codeInfo.length > 0) {
            logMessage.push(codeInfo);
        }
        logMessage.push(`- ${nfo.message}`);
        logMessage.push(errorStack);
        // ext static
        const extStaticFields = BaseLog.getExtStaticFields();
        if (extStaticFields.size > 0) {
            logMessage.push(`-`);
            extStaticFields.forEach((value, key) => {
                logMessage.push(`${key}=${value}&`);
            });
        }
        return logMessage.join(" ");
    })),
    transports: [
        new winston_1.transports.Console(),
    ],
});
const dataBaseLogger = winston_1.createLogger({
    level: "silly",
    format: combine(timestamp({
        format: "YYYY-MM-DD HH:mm:dd.SSS",
    }), splat(), printf((nfo) => {
        const logJson = {};
        logJson.timestamp = nfo.timestamp;
        logJson.level = nfo.level;
        if (nfo.meta !== null && nfo.meta.kind === "ISqlLogMeta") {
            const meta = nfo.meta;
            logJson.time = meta.time;
            logJson.query = meta.query;
            logJson.parameters = meta.parameters;
            logJson.errorMessage = meta.error;
        }
        // ext static
        const extStaticFields = BaseLog.getExtStaticFields();
        if (extStaticFields.size > 0) {
            extStaticFields.forEach((value, key) => {
                logJson[key] = value;
            });
        }
        logJson["request-id"] = HttpContent_1.HttpContent.getHeader("request-id");
        return JSON.stringify(logJson, null);
    })),
    transports: [
        new DailyRotateFile({
            filename: "logs/database/database-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
        }),
    ],
});
const applicationLogger = winston_1.createLogger({
    level: "silly",
    format: combine(timestamp({
        format: "YYYY-MM-DD HH:mm:dd.SSS",
    }), splat(), printf((nfo) => {
        const applicationLogJson = {};
        applicationLogJson.timestamp = nfo.timestamp;
        applicationLogJson.level = nfo.level;
        applicationLogJson.message = nfo.message;
        if (nfo.meta !== null && nfo.meta.kind === "IConsoleLogMeta") {
            const meta = nfo.meta;
            const stackType = StackAnalysisUtil_1.StackAnalysisUtil.parseStackAll(nfo.meta.stack)[2];
            applicationLogJson.className = stackType.className;
            applicationLogJson.methodName = stackType.methodName;
            applicationLogJson.line = stackType.line;
            applicationLogJson.row = stackType.row;
            applicationLogJson.file = stackType.file;
            if (meta.error) {
                applicationLogJson.errorStack = meta.error.stack;
            }
        }
        // ext static
        const extStaticFields = BaseLog.getExtStaticFields();
        if (extStaticFields.size > 0) {
            extStaticFields.forEach((value, key) => {
                applicationLogJson[key] = value;
            });
        }
        applicationLogJson["request-id"] = HttpContent_1.HttpContent.getHeader("request-id");
        return JSON.stringify(applicationLogJson, null);
    })),
    transports: [
        new DailyRotateFile({
            filename: "logs/application/application-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
        }),
    ],
});
class BaseLog {
    constructor() {
        this.applicationLogger = applicationLogger;
        this.consoleLogger = consoleLogger;
        this.dataBaseLogger = dataBaseLogger;
    }
    // 设置静态字段
    static setExtStaticField(key, value) {
        BaseLog.extStaticFields.set(key, value);
    }
    static getExtStaticFields() {
        return BaseLog.extStaticFields;
    }
}
BaseLog.extStaticFields = new Map();
exports.BaseLog = BaseLog;
//# sourceMappingURL=BaseLog.js.map