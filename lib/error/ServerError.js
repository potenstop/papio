"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpStatusConstant_1 = require("../constants/HttpStatusConstant");
/**
 *
 * 功能描述:
 *
 * @className ServerError
 * @projectName papio
 * @author yanshaowen
 * @date 2019/1/23 17:59
 */
class ServerError extends Error {
}
ServerError.STATUS = HttpStatusConstant_1.HttpStatusConstant.SERVER_ERROR;
exports.ServerError = ServerError;
//# sourceMappingURL=ServerError.js.map