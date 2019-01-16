import { EndpointConfig } from "./EndpointConfig";
import { ModuleConfig } from "./ModuleConfig";
export declare class BotConfig {
    endpoints: EndpointConfig[];
    storagePath: string;
    modules: (string | ModuleConfig)[];
    rawEvalPrefix: string;
}
