/**
 *
 * 功能描述: 从body中取出的对象
 *
 * @className RequestBody
 * @projectName papio
 * @author yanshaowen
 * @date 2018/12/26 14:23
 */
import "reflect-metadata";
import {MetaConstant} from "../../constants/MetaConstant";
import {ControllerArgumentSourceEnum} from "../../enums/ControllerArgumentSourceEnum";
import {ApplicationLog} from "../../log/ApplicationLog";
import {ControllerArgument} from "../../model/ControllerArgument";
import {JSHelperUtil} from "../../util/JSHelperUtil";
import {ValidOptions} from "../validation/ValidOptions";
// @RequestBody 无参数
export function RequestBody(target: object, propertyKey: string, paramIndex: number): void;
// @RequestBody("id")  只带字段的名称
export function RequestBody(target: string): CallableFunction;
// @RequestBody({value: "id"}) 带选项参数
export function RequestBody(target: ValidOptions<string>): CallableFunction;

export function RequestBody(target: object | string | ValidOptions<string>, propertyKey?: string, paramIndex?: number): void | CallableFunction {
    let options = new ValidOptions<string>();
    if (!propertyKey) {
        if (target instanceof ValidOptions) { options = target; }
        if (typeof target === "string" ) { options.value = target; }
        // 带参数
        return (target1: object, propertyKey1: string, paramIndex1: number) => {
            exec(target1, propertyKey1, paramIndex1, options);
        };
    } else {
        // 不带参
        exec(target as object, propertyKey, paramIndex, options);
    }
}
function exec(target: object, propertyKey: string, paramIndex: number, options: ValidOptions<string>) {
    // 获取对应的index的参数名和类型
    const paramsTypes = Reflect.getMetadata("design:paramtypes", target.constructor.prototype, propertyKey);
    const argsNameList = JSHelperUtil.getArgsNameList(target.constructor.prototype[propertyKey]);
    const currentType = paramsTypes[paramIndex];
    const currentArgsName = argsNameList[paramIndex];
    if (JSHelperUtil.isBaseType(currentType) || JSHelperUtil.isClassObject(currentType)) {
        const controllerArguments = Reflect.getOwnMetadata(MetaConstant.CONTROLLER_ARGUMENTS, target.constructor, propertyKey) || new Array<ControllerArgument>();
        const controllerArgument = new ControllerArgument();
        controllerArgument.index = paramIndex;
        controllerArgument.inName = currentArgsName;
        controllerArgument.outName = options.value || currentArgsName;
        controllerArgument.type = currentType;
        controllerArgument.source = ControllerArgumentSourceEnum.BODY;
        controllerArguments.push(controllerArgument);
        Reflect.defineMetadata(MetaConstant.CONTROLLER_ARGUMENTS, controllerArguments, target.constructor, propertyKey);

    } else {
        ApplicationLog.debug(`functionName=${propertyKey}, argsName=${currentArgsName} type is error, Should be number| string| bool| objectBean`);
    }
}
