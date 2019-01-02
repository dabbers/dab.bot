import { EndpointConfig } from "./EndpointConfig";
import { ModuleConfig } from "./ModuleConfig";

export class BotConfig {

    endpoints: EndpointConfig[];
    storagePath:string;
    modules:(string|ModuleConfig)[]; // Global modules
    rawEvalPrefix: string;
};
