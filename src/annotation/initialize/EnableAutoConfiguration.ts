/**
 *
 * 功能描述: 开启自动配置  加载
 *
 * @className EnableAutoConfiguration
 * @projectName chook
 * @author yanshaowen
 * @date 2018/12/24 10:36
 */
import * as  KoaBodyParser from "koa-bodyparser";
import * as  KoaRouter from "koa-router";
import "reflect-metadata";
import {KoaApplication} from "../../app/KoaApplication";
import {CommonConstant} from "../../constants/CommonConstant";
import {HttpStatusConstant} from "../../constants/HttpStatusConstant";
import {MetaConstant} from "../../constants/MetaConstant";
import {Beans} from "../../core/Beans";
import {Controller, Controllers} from "../../core/Controllers";
import {DefaultGlobalConfigBean} from "../../core/GlobalConfigBean";
import {ControllerArgumentSourceEnum} from "../../enums/ControllerArgumentSourceEnum";
import {ValidError} from "../../error/ValidError";
import {ControllerArgument} from "../../model/ControllerArgument";
import {JSHelperUtil} from "../../util/JSHelperUtil";
import {StringUtil} from "../../util/StringUtil";
import {RequestHeaderError} from "../../error/RequestHeaderError";
import {RequestMethod} from "../../enums/RequestMethod";
import {ContentTypeEnum} from "../../enums/ContentTypeEnum";
import {JsonProtocol} from "../../protocol/JsonProtocol";
import {ApplicationLog} from "../../log/ApplicationLog";
import "../../core/Hook";
import {HttpContent} from "../../context/HttpContent";
import {HookLog} from "../../core/Hook";
import {GenerateUtil} from "../../util/GenerateUtil";

// @EnableAutoConfiguration 无参数类装饰器
export function EnableAutoConfiguration(target: (new () => object)): void;
// @EnableAutoConfiguration('name') 参数为name的类装饰器
export function EnableAutoConfiguration(target: string): CallableFunction;
// @EnableAutoConfiguration({name:'name'}) 参数为options的类装饰器
export function EnableAutoConfiguration(target: Options): CallableFunction;
export function EnableAutoConfiguration(target: (new () => object) | Options| string): void | CallableFunction {
     let options = new Options();
     options.name = "default";
     if (target instanceof Function) {
          // 无参数装饰器
          exec(target, options);
     } else {
          // 有参数装饰器
          return (target1: (new () => object)): void =>  {
               if (target instanceof Options) {
                    options = target;
               } else if (typeof target === "string") {
                    options.name = target;
               }
               exec(target1, options);
          };
     }
}
class Options {
     // default: 默认
     public name: string;
}
function exec(target: (new () => object), options: Options) {
     if (options.name === "default") {
          const defaultGlobalConfigBean = new DefaultGlobalConfigBean();
          defaultGlobalConfigBean.application = new KoaApplication();
          defaultGlobalConfigBean.middleware = [];
          // 请求参数转换中间件
          defaultGlobalConfigBean.middleware.push(KoaBodyParser());
          // 路由中间件
          const koaRouter = new KoaRouter();
          Controllers.getAll().forEach((controller: Controller) => {
               let routerMethod = "all";
               if (StringUtil.isNotBank(controller.method)) {
                    routerMethod = controller.method.toLowerCase();
               }
               const defaultMap = new Map<string, new () => object>();
               koaRouter[routerMethod](controller.path, async (ctx) => {
                    try {
                         // 检验请求头content-type
                         if (!JSHelperUtil.isNullOrUndefined(controller.requestContentType) && ctx.method !== RequestMethod.GET && !ctx.is(controller.requestContentType)) {
                              throw new RequestHeaderError(`content-type=${ctx.header["content-type"]},allow content-type is ${controller.requestContentType}`);
                         }
                         const o = Reflect.construct(controller.clazz, []);
                         const controllerArguments = Reflect.getOwnMetadata(MetaConstant.CONTROLLER_ARGUMENTS, controller.clazz.prototype.constructor, controller.functionName) || new Array<ControllerArgument>();
                         const args = [];
                         for (const controllerArgument of controllerArguments) {
                              let v = null;
                              if (JSHelperUtil.isBaseType(controllerArgument.type)) {
                                   if (controllerArgument.source === ControllerArgumentSourceEnum.PARAMS) {
                                        if (controllerArgument.outName in ctx.query) {
                                             v = ctx.query[controllerArgument.outName];
                                        }
                                   } else if (controllerArgument.source === ControllerArgumentSourceEnum.BODY) {
                                        if (controllerArgument.outName in ctx.request.body) {
                                             v = ctx.request.body[controllerArgument.outName];
                                        }
                                   } else if (controllerArgument.source === ControllerArgumentSourceEnum.HEADER) {
                                        if (controllerArgument.outName in ctx.header) {
                                             v = ctx.header[controllerArgument.outName];
                                        }
                                   }
                              } else if (JSHelperUtil.isClassType(controllerArgument.type)) {
                                   if (controllerArgument.source === ControllerArgumentSourceEnum.PARAMS) {
                                        v = JsonProtocol.jsonToBean(ctx.query, controllerArgument.type, defaultMap);
                                   } else if (controllerArgument.source === ControllerArgumentSourceEnum.BODY) {
                                        v = JsonProtocol.jsonToBean(ctx.body, controllerArgument.type, defaultMap);
                                   } else if (controllerArgument.source === ControllerArgumentSourceEnum.HEADER) {
                                        v = JsonProtocol.jsonToBean(ctx.header, controllerArgument.type, defaultMap);
                                   }
                              }
                              // 类型转换 null 或者undefined 不转换 如果失败则直接抛出错误
                              if (!JSHelperUtil.isNullOrUndefined(v)) {
                                   if (JSHelperUtil.isBaseType(controllerArgument.type)) {
                                        v = controllerArgument.type(v);
                                        // number类型则判断NaN
                                        if (controllerArgument.type === Number && isNaN(controllerArgument.type(v))) {
                                             const validTypeError = new ValidError<string>("type transform error");
                                             validTypeError.argsName = controllerArgument.inName;
                                             validTypeError.argsValue = v;
                                             validTypeError.validRule = "typeCheck";
                                             throw validTypeError;
                                        }
                                   }
                              }
                              args[controllerArgument.index] = v;

                         }
                         const httpContent = new HttpContent();
                         httpContent.headers = new Map<string, string>();
                         Object.keys(ctx.headers).forEach((key) => {
                              httpContent.headers.set(key, ctx.headers[key]);
                         });
                         if (!httpContent.headers.has("request-id")) {
                              // 框架生成
                              httpContent.headers.set("request-id", GenerateUtil.getRequestId());
                         }
                         HookLog.setHttpContext(httpContent);
                         const result = await Reflect.apply(controller.clazz.prototype[controller.functionName], o, args);
                         // 检查响应头的content-type
                         if (controller.responseContentType === ContentTypeEnum.APPLICATION_JSON) {
                              // bean转json
                              const returnGenerics = Reflect.getOwnMetadata(MetaConstant.BEAN_RETURN_GENERICS, controller.clazz.prototype, controller.functionName) ||
                                  new Map<string, new () => object>();
                              ctx.body = JsonProtocol.toJson(result, returnGenerics);
                              ctx.status  = HttpStatusConstant.OK;
                         } else {
                              throw new RequestHeaderError(`response content-type=${controller.responseContentType} error`);
                         }
                    } catch (e) {
                         if (e instanceof ValidError) {
                              ctx.body = {message: e.getValidMessage()};
                              ctx.status  = ValidError.STATUS;
                         } else if (e instanceof RequestHeaderError) {
                              ctx.body = {message: e.message};
                              ctx.status  = RequestHeaderError.STATUS;
                         } else {
                              console.log(e)
                              ctx.body = {message: "unknown error, message=" + e.message };
                              ctx.status  = HttpStatusConstant.SERVER_ERROR;
                         }
                    }
               });
          });
          defaultGlobalConfigBean.middleware.push(koaRouter.routes());
          defaultGlobalConfigBean.middleware.push(koaRouter.allowedMethods());
          // 设置bean
          Beans.setBean(CommonConstant.GLOBAL_CONFIG, defaultGlobalConfigBean);
     }
     // 加载bean
     const beans = Beans.getBeans();
     beans.forEach((obj, key) => {
          if (JSHelperUtil.isClassObject(obj)) {
               if (key === "logStatic") {
                    // 加载静态日志
                    Object.keys(obj).map((objKey) => {
                         ApplicationLog.setExtStaticField(objKey, String(obj[objKey]));
                    });
               }
          }
     });
}