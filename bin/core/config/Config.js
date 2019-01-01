"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class Config {
    constructor(cfg) {
        this.isDirty = false;
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
    static init(configPath) {
        if (fs.existsSync(configPath)) {
            return new Config(JSON.parse(fs.readFileSync(configPath).toString()));
        }
        let cfg = new Config();
        cfg.path = configPath;
        return cfg;
    }
    tick() {
        if (this.isDirty) {
            this.save();
        }
    }
    save() {
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
}
exports.Config = Config;
;
//# sourceMappingURL=Config.js.map