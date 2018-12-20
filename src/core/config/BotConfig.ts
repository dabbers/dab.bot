import { EndpointConfig } from "./EndpointConfig";

export class BotConfig {

    endpoints: EndpointConfig[];
    storagePath:string;
    modules:string[]; // Global modules
};
