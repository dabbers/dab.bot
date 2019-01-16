import { Bot } from './Bot';
import { Config } from './config/Config';
import { ITickable } from './ITickable';
export declare class CoreContext implements ITickable {
    config: Config;
    bot: Bot;
    constructor(config: Config);
    tick(): void;
    init(): void;
    toString(): string;
}
