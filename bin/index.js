"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const Config_1 = require("./core/config/Config");
const Core = require("./core/Core");
const util_1 = require("util");
const dns = require("dns");
const http = require("http");
const https = require("https");
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
global.download = function (url) {
    // return new pending promise
    return new Promise((resolve, reject) => {
        // select http or https module, depending on reqested url
        const lib = url.startsWith('https') ? https : http;
        const request = lib.get(url, (response) => {
            // handle http errors
            if (response.statusCode < 200 || response.statusCode > 299) {
                return reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            response.on('data', (chunk) => body.push(chunk));
            // we are done, resolve promise with those joined chunks
            response.on('end', () => {
                let b = body.join('');
                if (response.headers['content-type'] && response.headers['content-type'].toLowerCase().indexOf("json") != -1) {
                    return resolve(JSON.parse(b));
                }
                else {
                    return resolve(b);
                }
            });
        });
        // handle connection errors of the request
        request.on('error', (err) => reject(err));
    });
};
global.lookupAsync = util_1.promisify(dns.lookup);
global.lookupServiceAsync = util_1.promisify(dns.lookupService);
let contextCfg = Config_1.Config.init("config.json");
let core = new Core.CoreContext(contextCfg);
core.init();
global.nothrow = async (fnc, ...args) => {
    try {
        return await fnc.apply(core.bot, args);
    }
    catch {
        return null;
    }
};
setInterval(() => core.tick(), 600);
//# sourceMappingURL=index.js.map