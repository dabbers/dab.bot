"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Module_1 = require("../core/Module");
const Command_1 = require("../core/Command");
const fs = require("fs");
const WebApiMessage_1 = require("./WebApiMessage");
const qs = require("querystring");
var keys = [
    //"name", 
    "fnc",
    "code",
    "throttle",
    "binding",
    "auth",
    "serialize",
    "requirecommandprefix"
];
var panel = fs.readFileSync('.../../storage/manage_page.html').toString();
var fncTemplate = "let m = message; let msg = message;\r\n{code};";
var rawEval = "";
var gBot = null;
module.exports = new Module_1.Module((bot, config) => {
    gBot = bot;
    rawEval = bot.config.rawEvalPrefix;
    bot.addCommand(new Command_1.Command("login", (b, m) => {
        try {
            if (!b.loginUser(m)) {
                m.reply("Invalid login/password");
            }
            else {
                m.reply("Success! Logged in.");
            }
        }
        catch (er) {
            m.reply("[Error] " + er);
        }
    }, new Command_1.CommandThrottleOptions(10, -1, -1), [], [], false, false)).addCommand(new Command_1.Command("logout", (b, m) => {
        try {
            b.logoutUser(m);
            m.reply("Logged out.");
        }
        catch (er) {
            m.reply("[Error] " + er);
        }
    }, new Command_1.CommandThrottleOptions(10, -1, -1), [], [], false, false)).addCommand(new Command_1.Command("addcmd", (b, m) => {
        try {
            let parts = m.args;
            let cmd = (parts[0] || "").toLowerCase();
            let code = fncTemplate.replace("{code}", parts.splice(1).join(" "));
            if (!cmd) {
                return m.reply("[Error] Please specify a command, or help");
            }
            if ("help" == cmd) {
                return m.reply("[Error] Help is a reserved word");
            }
            try {
                new Function(code);
            }
            catch (ex) {
                return m.reply("[Error] Syntax error in command: " + ex);
            }
            b.addCommand(new Command_1.Command(cmd, 
            // Todo: Find a better way to assign this maybe?
            (new Function("bot", "message", code)), new Command_1.CommandThrottleOptions(-1, -1, -1), [], []));
            m.reply("[Success] " + cmd + " has been added");
        }
        catch (er) {
            m.reply("[Error] " + er);
        }
    }, new Command_1.CommandThrottleOptions(-1, -1, -1), [], [new Command_1.CommandAuthOptions(Command_1.CommandAuthTypes.Level, "3")], false)).addCommand(new Command_1.Command("delcmd", (b, m) => {
        try {
            let parts = m.args;
            let cmd = (parts[0] || "").toLowerCase();
            if (!cmd) {
                return m.reply("[Error] Please specify a command");
            }
            switch (cmd) {
                case "delcmd":
                case "addcmd":
                case "setcmd":
                case "getcmd":
                case "login":
                case "logout":
                    return m.reply("[Error] Cannot delete system commands");
            }
            b.delCommand(cmd);
            m.reply("[Success] " + cmd + " deleted");
        }
        catch (er) {
            m.reply("[Error] " + er);
        }
    }, new Command_1.CommandThrottleOptions(-1, -1, -1), [], [new Command_1.CommandAuthOptions(Command_1.CommandAuthTypes.Level, "3")], false)).addCommand(new Command_1.Command("setcmd", (b, m) => {
        try {
            let parts = m.args;
            let cmdName = (parts[0] || "").toLowerCase();
            let propName = (parts[1] || "").toLowerCase();
            let cmd = b.textCommands[cmdName];
            let cmdPrefix = m.endpoint.config.commandPrefix;
            if (!cmd) {
                if (cmdName != "help") {
                    return m.reply("[Error] Please specify a command, or use " +
                        cmdPrefix + "setcmd help for more info");
                }
                else {
                    return m.reply("Usage: " + cmdPrefix + "setcmd <CommandName" +
                        " (without prefix)> <property> [arguments]" + "\r\n" +
                        "Valid property names: " + JSON.stringify(keys) + "\r\n" +
                        "For more info on properties, do " + cmdPrefix + "setcmd help <property>");
                }
            }
            switch (cmd.name) {
                case "delcmd":
                case "addcmd":
                case "setcmd":
                case "getcmd":
                case "login":
                case "logout":
                    return m.reply("[Error] Cannot edit system commands");
            }
            let properties = Object.keys(cmd);
            if (properties.indexOf(propName) == -1) {
                return m.reply("[Error] Invalid property name. Use " +
                    m.endpoint.config.commandPrefix + "setcmd help for more info");
            }
            switch (propName) {
                case "fnc":
                case "code":
                    {
                        let code = fncTemplate.replace("{code}", parts.splice(2).join(" "));
                        try {
                            new Function(code);
                        }
                        catch (ex) {
                            return m.reply("[Error] Syntax error in command: " + ex);
                        }
                        // Todo: Find a better Typescript way to assign this maybe?
                        cmd.fnc = (new Function("bot", "message", code));
                    }
                    break;
                case "throttle":
                    {
                        let operation = (parts[2] || "").toLowerCase();
                        if (!operation || (operation != "user" && operation != "channel" && operation != "endpoint")) {
                            return m.reply("[Error] Missing throttle option.. " + cmdPrefix +
                                "setcmd <CommandName> throttle <user/channel/endpoint> <number (-1 means no limit)>");
                        }
                        let value = parseInt((parts[3] || ""));
                        if (isNaN(value)) {
                            return m.reply("[Error] Missing throttle value (-1 means no limit): " + cmdPrefix +
                                "setcmd <CommandName> throttle <user/channel/endpoint> <seconds between calls>");
                        }
                        cmd.throttle[operation] = value;
                    }
                    break;
                case "binding":
                    {
                        let operation = (parts[2] || "").toLowerCase();
                        if (!operation || (operation != "add" && operation != "remove")) {
                            return m.reply("[Error] Missing throttle option.. " + cmdPrefix +
                                "setcmd <CommandName> binding <add/remove> <listing index or bind regex of format '#channel@endpoint'>");
                        }
                        if (operation == "add") {
                            let code = parts.splice(3).join(" ");
                            try {
                                cmd.binding.push(new Command_1.CommandBindOptions(code));
                            }
                            catch (er) {
                                return m.reply("[Error] " + er);
                            }
                        }
                        else if (operation == "remove") {
                            let index = parseInt(parts[3]);
                            if (isNaN(index) || index < 0 || index >= cmd.binding.length) {
                                return m.reply("[Error] Invalid bind index. " + cmdPrefix +
                                    "setcmd <CommandName> binding remove <0-" + (Math.max(cmd.binding.length - 1)).toString() + ">");
                            }
                            cmd.binding.splice(index, 1);
                        }
                    }
                    break;
                case "auth":
                    {
                        let operation = (parts[2] || "").toLowerCase();
                        if (!operation || (operation != "add" && operation != "remove")) {
                            return m.reply("[Error] Missing throttle option.. " + cmdPrefix +
                                "setcmd <CommandName> auth <add/remove> [args]");
                        }
                        if (operation == "add") {
                            let authType = (parts[3] || "").toLowerCase();
                            if (!authType ||
                                (authType != "account" &&
                                    authType != "level" &&
                                    authType != "role" &&
                                    authType != "name")) {
                                return m.reply("[Error] Missing/invalid auth type. Values: account, level, role, name");
                            }
                            let code = parts.splice(4).join(" ");
                            try {
                                cmd.auth.push(new Command_1.CommandAuthOptions(authType, code));
                            }
                            catch (er) {
                                return m.reply("[Error] " + er);
                            }
                        }
                        else if (operation == "remove") {
                            let index = parseInt(parts[3]);
                            if (isNaN(index) || index < 0 || index >= cmd.auth.length) {
                                return m.reply("[Error] Invalid bind index. " + cmdPrefix +
                                    "setcmd <CommandName> binding remove <0-" + (Math.max(0, cmd.auth.length - 1)).toString() + ">");
                            }
                            cmd.auth.splice(index, 1);
                        }
                    }
                    break;
                case "serialize":
                case "requireCommandPrefix":
                    if (!parts[2]) {
                        return m.reply("[Error] Must indicate true or false for the value");
                    }
                    let val = parts[2].toLowerCase();
                    if (val != "true" && val != "false") {
                        return m.reply("[Error] Value must be true or false specifically");
                    }
                    cmd[propName] = (val == "true" ? true : false);
                    break;
            }
            b.setCommand(cmd);
        }
        catch (er) {
            m.reply("[Error] " + er);
        }
    }, new Command_1.CommandThrottleOptions(-1, -1, -1), [], [new Command_1.CommandAuthOptions(Command_1.CommandAuthTypes.Level, "3")], false)).addCommand(new Command_1.Command("getcmd", (b, m) => {
        try {
            let parts = m.args;
            let cmdName = (parts[0] || "").toLowerCase();
            let propName = (parts[1] || "").toLowerCase();
            let cmd = b.textCommands[cmdName];
            let cmdPrefix = m.endpoint.config.commandPrefix;
            if (!cmd) {
                if (cmdName != "help") {
                    return m.reply("[Error] Please specify a command, or use " +
                        cmdPrefix + "setcmd help for more info");
                }
                else {
                    return m.reply("Usage: " + cmdPrefix + "getcmd <CommandName" +
                        " (without prefix)> <property> [arguments]" + "\r\n" +
                        "Valid property names: " + JSON.stringify(keys) + "\r\n" +
                        "For more info on properties, do " + cmdPrefix + "setcmd help <property>");
                }
            }
            switch (cmd.name) {
                case "delcmd":
                case "addcmd":
                case "setcmd":
                case "getcmd":
                case "login":
                case "logout":
                    return m.reply("[Error] Cannot edit system commands");
            }
            let properties = Object.keys(cmd);
            if (properties.indexOf(propName) == -1) {
                return m.reply("[Error] Invalid property name. Use " +
                    m.endpoint.config.commandPrefix + "setcmd help for more info");
            }
            let value = "";
            switch (propName) {
                case "code":
                case "fnc":
                    value = cmd.fnc.toString();
                    break;
                case "requirecommandprefix":
                    value = cmd.requireCommandPrefix.toString();
                    break;
                default:
                    value = JSON.stringify(cmd[propName]);
            }
            m.reply("[Value] " + value);
        }
        catch (er) {
            m.reply("[Error] " + er);
        }
    }, new Command_1.CommandThrottleOptions(-1, -1, -1), [], [new Command_1.CommandAuthOptions(Command_1.CommandAuthTypes.Level, "3")], false)).addCommand(new Command_1.Command(bot.config.rawEvalPrefix, (b, m) => {
        try {
            let toExecute = m.args.join(" ");
            console.log("To Execute: '" + toExecute + "'");
            var re = eval(toExecute);
            if (re) {
                m.reply(re.toString());
            }
        }
        catch (er) {
            m.reply("[Error] " + er);
        }
    }, new Command_1.CommandThrottleOptions(-1, -1, -1), [], [new Command_1.CommandAuthOptions(Command_1.CommandAuthTypes.Level, "3")], false, false));
}, () => {
    console.log("manage module unloaded");
});
module.exports.onWebRequest = (req, res) => {
    let paths = req.url.substr(1).split('/');
    switch (paths[1]) {
        case "addcmd":
        case "delcmd":
        case "setcmd":
        case "getcmd":
            {
                let cmd = gBot.textCommands[paths[1]];
                let msg = new WebApiMessage_1.WebApiMessage();
                msg.args = [];
                msg.command = paths[1];
                let data = '';
                req.on("data", (d) => {
                    data += d;
                    if (d.length > 2048) {
                        req.connection.destroy(451);
                    }
                });
                req.on("end", () => {
                    var form = qs.parse(data);
                    msg.args.push(form.command);
                    let splitArgs = form.args.split(' ');
                    for (let word of splitArgs) {
                        msg.args.push(word);
                    }
                    cmd.fnc(gBot, msg);
                    res.writeHead(200);
                    res.end(panel.replace(/\$output\$/g, msg.response).replace(/\$path\$/g, paths[0]));
                });
            }
            break;
        case "raw":
            {
                let cmd = gBot.textCommands[rawEval];
                let msg = new WebApiMessage_1.WebApiMessage();
                msg.args = [];
                msg.command = paths[1];
                let data = '';
                req.on("data", (d) => {
                    data += d;
                    if (d.length > 2048) {
                        req.connection.destroy(451);
                    }
                });
                req.on("end", () => {
                    var form = qs.parse(data);
                    msg.args.push(form.command);
                    let splitArgs = form.args.split(' ');
                    for (let word of splitArgs) {
                        msg.args.push(word);
                    }
                    cmd.fnc(gBot, msg);
                    res.writeHead(200);
                    res.end(panel.replace(/\$output\$/g, msg.response).replace(/\$path\$/g, paths[0]));
                });
            }
            break;
        default:
            res.writeHead(200);
            res.end(panel.replace(/\$output\$/g, "").replace(/\$path\$/g, paths[0]));
    }
};
//# sourceMappingURL=manage.js.map