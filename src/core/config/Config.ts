import { BotConfig } from "./BotConfig";
import * as fs from 'fs';
import * as process from 'process';
import {ITickable} from '../ITickable';

export class Config implements ITickable {

    path : string;
    isDirty : boolean = false;

    static init(configPath:string) : Config {
        if (fs.existsSync(configPath)) {
            return <Config>JSON.parse(fs.readFileSync(configPath).toString());
        }

        let cfg = new Config();
        cfg.path = configPath;
        return cfg;
    }

    bot: BotConfig;
    modules:string[]; // Global modules
    
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
            }
        });
    }

    toString() {
        return "Config";
    }
};
