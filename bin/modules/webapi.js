"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Module_1 = require("../core/Module");
const http = require("http");
let server = null;
module.exports = new Module_1.Module((bot, config) => {
    if (!config || !config.port) {
        throw new Error("You must provide a config with port and priv/pub key paths");
    }
    server = http.createServer(function (req, res) {
        let paths = req.url.substr(1).split('/');
        var header = req.headers['authorization'] || '', // get the header
        token = header.split(/\s+/).pop() || '', // and the encoded auth token
        auth = Buffer.from(token, 'base64').toString(), // convert from base64
        parts = auth.split(/:/), // split on colon
        username = parts[0], password = parts[1];
        if (!username || !password) {
            res.writeHead(401, { "WWW-Authenticate": "Basic" });
            return res.end("Please authenticate");
        }
        if (paths.length == 0 || !paths[0]) {
            res.writeHead(200);
            res.write("<html><head><title>dab.bot admin page</title></head><body>\r\n");
            res.write("<ul>\r\n");
            for (let module in bot.modules) {
                res.write("\t<li><a href=\"/" + new Buffer(module).toString('base64') + "\">" + module + "</a></li>\r\n");
            }
            res.write("</ul>\r\n");
            res.end("</body></html>");
        }
        let module = new Buffer(paths[0], 'base64').toString('ascii');
        let m = bot.modules[module];
        if (m && m.onWebRequest) {
            m.onWebRequest(req, res);
        }
        else {
            res.writeHead(404);
            res.end("module not found");
        }
    }).listen(config.port);
}, () => {
    if (server) {
        server.close();
    }
});
//# sourceMappingURL=webapi.js.map