import {Module} from '../../core/Module';
import {IMessage} from '../../core/Events/IMessage';
import {IEndpoint} from '../../core/IEndpoint';
import { EndpointTypes } from '../../core/EndpointTypes';
import { Bot } from '../../core/Bot';
// import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';

let server : https.Server = null;
module.exports.create = (modType) => { 
    return new modType( (bot:Bot, config:any) => {

        if (!config || !config.port || !config.key || !config.cert) {
            throw new Error("You must provide a config with port and priv/pub key paths");
        }

        let option = { key: fs.readFileSync(config.key), cert: fs.readFileSync(config.cert) };

        server = https.createServer(option, function (req, res) {
            
            let paths = req.url.substr(1).split('/');
            var header=req.headers['authorization']||'',        // get the header
            token=header.split(/\s+/).pop()||'',            // and the encoded auth token
            auth=Buffer.from(token, 'base64').toString(),    // convert from base64
            parts=auth.split(/:/),                          // split on colon
            username=parts[0],
            password=parts[1];
            
            if (!username || !password) {
                res.writeHead(401, {"WWW-Authenticate":"Basic"});

                return res.end("Please authenticate");
            }
            
            if (paths.length == 0 || !paths[0]) {
                res.writeHead(200);
                
                res.write("<html><head><title>dab.bot admin page</title></head><body>\r\n");
                res.write("<ul>\r\n");
                for(let module in bot.modules) {
                    res.write("\t<li><a href=\"/" + new Buffer(module).toString('base64') + "\">" + module+"</a></li>\r\n");
                }
                res.write("</ul>\r\n");

                res.end("</body></html>");
            }

            if (paths[0] == "bfw" || (paths[0] == "api" && ( paths[1] == "messages" || paths[1] == "notify") ) ) {
                console.log(paths);
                if (bot.endpoints["BotFramework"]) {
                    (<any>res).send = res.write;
                    (<any>res).status = (st) => res.statusCode = st;

                    bot.endpoints["BotFramework"].emit("BotFwAPI", req, res);
                }
            }
            else {
                let module = new Buffer(paths[0], 'base64').toString('ascii');
                let m = bot.modules[module];
    
                if (m && m.onWebRequest) {
                    m.onWebRequest(req, res);
                }
                else {
                    res.writeHead(404);
                    res.end("module not found");
                }
            }
        }).listen(config.port);
    },
    () => {
        if (server) {
            server.close();
        }
    });
}
