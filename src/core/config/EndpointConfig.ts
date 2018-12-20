import { EndpointTypes } from "../EndpointTypes";
import { ChannelConfig } from "./ChannelConfig";
import { ManagerConfig } from "./ManagerConfig";

export class EndpointConfig {
    type:EndpointTypes;
    name:string;
    
    connectionString:string[];

    nickname:string;
    ident:string;
    real:string;
    
    password:string;

    bindIp:string;

    modules:string[];

    channels:ChannelConfig[];

    managers:ManagerConfig[];

    commandPrefix:string;
}
