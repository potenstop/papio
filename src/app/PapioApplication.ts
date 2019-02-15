/**
 *
 * 功能描述:
 *
 * @className PapioApplication
 * @projectName papio
 * @author yanshaowen
 * @date 2018/12/21 14:32
 */
import {CommonConstant} from "../constants/CommonConstant";
import ProcessEnv = NodeJS.ProcessEnv;
import {Beans} from "../core/Beans";
import { IGlobalConfigBean } from "../core/GlobalConfigBean";

export class PapioApplication {
    public static async run(startClass: (new () => object) , processEnv: ProcessEnv): Promise<void> {
        const papioApplication = new PapioApplication();
        papioApplication.startClass = startClass;
        papioApplication.processEnv = processEnv;
        papioApplication.run();
    }
    private startClass: object;
    private processEnv: ProcessEnv;
    private async run(): Promise<void> {
        const globalConfig = Beans.getBean(CommonConstant.GLOBAL_CONFIG) as IGlobalConfigBean;
        if (globalConfig) {
            // 加载中间件
            globalConfig.middleware.forEach((o: (() => void)) => {
                globalConfig.application.use(o);
            });
            await globalConfig.application.start(globalConfig.port);
        }
    }

}
