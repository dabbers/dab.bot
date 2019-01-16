import { BotConfig } from "./BotConfig";
import { ITickable } from '../ITickable';
export declare class Config implements ITickable {
    path: string;
    isDirty: boolean;
    bot: BotConfig;
    constructor(cfg?: Config);
    static init(configPath: string): Config;
    tick(): void;
    save(): void;
    toString(): string;
}
