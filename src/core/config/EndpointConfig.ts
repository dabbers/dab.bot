import { EndpointTypes } from "../EndpointTypes";
import { ChannelConfig } from "./ChannelConfig";
import { Manager } from "./Manager";

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

    managers:Manager[];

    commandPrefix:string;
}
