"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const Config_1 = require("./core/config/Config");
const Core = require("./core/Core");
let contextCfg = Config_1.Config.init("config.json");
let core = new Core.CoreContext(contextCfg);
core.init();
//# sourceMappingURL=index.js.map