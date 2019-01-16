"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const request = require("request");
const Config_1 = require("./core/config/Config");
const Core = require("./core/Core");
global.download = function (url, cb) {
    request({
        uri: url,
        method: "GET",
        timeout: 5000,
        followRedirect: true,
        maxRedirects: 5
    }, function (error, response, body) {
        if (error) {
            cb({ "error": error });
        }
        else {
            if (response.headers['content-type'] && response.headers['content-type'].toLowerCase().indexOf("json") != -1) {
                cb(JSON.parse(body));
            }
            else {
                cb(body);
            }
        }
    });
};
let contextCfg = Config_1.Config.init("config.json");
let core = new Core.CoreContext(contextCfg);
core.init();
setInterval(() => core.tick(), 600);
//# sourceMappingURL=index.js.map