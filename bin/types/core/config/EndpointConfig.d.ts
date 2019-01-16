import { EndpointTypes } from "../EndpointTypes";
import { ChannelConfig } from "./ChannelConfig";
import { ManagerConfig } from "./ManagerConfig";
import { ModuleConfig } from "./ModuleConfig";
export declare class EndpointConfig {
    type: EndpointTypes;
    name: string;
    connectionString: string[];
    nickname: string;
    ident: string;
    real: string;
    password: string;
    bindIp: string;
    modules: (string | ModuleConfig)[];
    channels: ChannelConfig[];
    managers: ManagerConfig[];
    commandPrefix: string;
}
