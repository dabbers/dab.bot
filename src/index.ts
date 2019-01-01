import 'source-map-support/register';

import {Config} from './core/config/Config';
import * as Core from './core/Core';
let contextCfg = Config.init("config.json");

let core = new Core.CoreContext(contextCfg);
core.init();

setInterval(() => core.tick(), 600);
