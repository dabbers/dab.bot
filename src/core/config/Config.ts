import { BotConfig } from "./BotConfig";
import * as fs from 'fs';
import * as process from 'process';
import {ITickable} from '../ITickable';

export class Config implements ITickable {

    path : string;
    isDirty : boolean = false;
    bot: BotConfig;
    modules:string[]; // Global modules

    constructor(cfg?: Config) {
        if (cfg) {
            this.path = cfg.path;
            this.isDirty = false;
            this.bot = cfg.bot;
            this.modules = cfg.modules;
        }
        else {
            this.isDirty = true;
        }
    }

    static init(configPath:string) : Config {
        if (fs.existsSync(configPath)) {
            return new Config(JSON.parse(fs.readFileSync(configPath).toString()));
        }

        let cfg = new Config();
        cfg.path = configPath;
        return cfg;
    }
    
    tick() : void {
        if (this.isDirty) {
            this.save();
        }
    }

    save() : void {
        this.isDirty = false;

        fs.writeFile(this.path, JSON.stringify(this, null, 4), function (err) {
            if (err) {
                console.log("[Config.ts] There was an issue saving the config: ", err);
                setTimeout(() => this.isDirty = true, 2000);
            }
        });
    }

    toString() {
        return "[config Config]";
    }
};
