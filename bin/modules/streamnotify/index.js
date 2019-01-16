"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const qs = require("querystring");
var gBot = null;
var gConfig = null;
module.exports.create = (modType) => {
    return new modType((bot, config) => {
        console.log("streamnotify INIT");
        if (!config || !config.endpoint || !config.channel)
            throw new Error("Missign required config options!");
        if (!bot.modules["webapi"])
            throw new Error("webapi needs to be loaded for this module to work");
        gBot = bot;
        gConfig = config;
        let cfg = {
            "hub.callback": "http://dab:test@home.dab.biz:8001/c3RyZWFtbm90aWZ5/twitch",
            "hub.mode": "subscribe",
            "hub.topic": "https://api.twitch.tv/helix/streams?user_id=406878434",
            "hub.lease_seconds": "3600",
        };
        let requestWebhook = () => {
            request.post({
                headers: { 'Client-ID': config.clientId },
                url: 'https://api.twitch.tv/helix/webhooks/hub',
                json: cfg
            }, function (error, response, body) {
            });
        };
        setInterval(requestWebhook, 3300000);
        requestWebhook();
    }, () => {
        console.log("streamnotify UNLOAD");
    }, (req, res) => {
        let paths = req.url.substr(1).split('/');
        let [path1, query] = paths[1].split('?');
        switch (path1) {
            case "twitch":
                if (!query) {
                    let data = '';
                    req.on("data", (d) => {
                        data += d;
                        if (d.length > 2048) {
                            req.connection.destroy(451);
                        }
                    });
                    req.on("end", () => {
                        try {
                            let d = JSON.parse(data);
                            if (d.data && d.data.length > 0) {
                                gBot.endpoints[gConfig.endpoint].say(gConfig.channel, "GamerGalaxy is now streaming: https://twitch.tv/gamergalaxy_tv");
                            }
                            else {
                                gBot.endpoints[gConfig.endpoint].say(gConfig.channel, "GamerGalaxy has stopped streaming.");
                            }
                        }
                        catch (_a) {
                            // bleh/
                        }
                        res.writeHead(200);
                        res.end("Thanks");
                    });
                }
                else {
                    let form = qs.parse(query);
                    res.writeHead(200);
                    res.end(form["hub.challenge"]);
                }
                break;
            case "mixer":
                break;
            default: {
                res.writeHead(200);
                res.end("Hi");
            }
        }
    });
};
//# sourceMappingURL=index.js.map