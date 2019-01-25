/**
 *
 * 功能描述: 数据配置
 *
 * @className DataSourceConfiguration
 * @projectName chook
 * @author yanshaowen
 * @date 2019/1/22 9:39
 */
import {annotation, data} from "../../../src/chook";
import Configuration = annotation.Configuration;
import Bean = annotation.Bean;
import IDataSource = data.IDataSource;
import {TypeDataSource} from "../../../src/data/typeorm/TypeDataSource";
import MapperScan = annotation.MapperScan;

@Configuration
@MapperScan("@dao/common-util")
export class MysqlCommonUtilConfiguration {
    @Bean
    public dataSourceMaster(): IDataSource {
        const typeDataSource = new TypeDataSource();
        typeDataSource.setName("mysql-master");
        typeDataSource.setUrl("mysql://127.0.0.1:3306/common_util");
        typeDataSource.setUsername("common_util_root");
        typeDataSource.setPassword("123456");
        typeDataSource.build();
        return typeDataSource;
    }
    /*@Bean
    public dataSourceSlave1(): IDataSource {
        const typeDataSource = new TypeDataSource();
        typeDataSource.setName("mysql-slave1");
        typeDataSource.setReadOnly(true);
        typeDataSource.setUrl("mysql://127.0.0.1:3306/common_util");
        typeDataSource.setUsername("common_util_root");
        typeDataSource.setPassword("123456");
        typeDataSource.build();
        return typeDataSource;
    }
    @Bean
    public dataSourceSlave2(): IDataSource {
        const typeDataSource = new TypeDataSource();
        typeDataSource.setName("mysql-slave2");
        typeDataSource.setReadOnly(true);
        typeDataSource.setUrl("mysql://127.0.0.1:3306/common_util");
        typeDataSource.setUsername("common_util_root");
        typeDataSource.setPassword("123456");
        typeDataSource.build();
        return typeDataSource;
    }*/
}