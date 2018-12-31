"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class Config {
    constructor() {
        this.isDirty = false;
    }
    static init(configPath) {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath).toString());
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
            }
        });
    }
    toString() {
        return "Config";
    }
}
exports.Config = Config;
;
//# sourceMappingURL=Config.js.map