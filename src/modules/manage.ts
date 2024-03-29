import {IMessage} from '../core/Events/IMessage';
import { Command, CommandThrottleOptions, CommandAuthOptions, CommandAuthTypes, CommandBindOptions } from '../core/Command';
import { Bot } from '../core/Bot';
import { IEvent } from '../core/Events/IEvent';
import { ICommandMessage } from '../core/CommandMessage';
import * as http from 'http';
import * as fs from 'fs';
import { WebApiMessage } from './webapi/WebApiMessage';
import * as qs from 'querystring';

var keys :string[] = [
        //"name", 
        "fnc",
        "code",
        "throttle",
        "binding",
        "auth",
        "serialize",
        "requirecommandprefix"
];
var panel = fs.readFileSync('storage/manage_page.html').toString();

var fncTemplate:string = "let m = message; let msg = message;\r\n{code};";
var rawEval = "";
var gBot :Bot = null;
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

module.exports.create = (modType) => { 
    return new modType( (bot, config) => {
        gBot = bot;
        rawEval = bot.config.rawEvalPrefix;

        bot.addCommand(
            new Command(
                "login", 
                (b:Bot, m:IMessage) => {
                    try {
                        if (!b.loginUser(m)) {
                            (<IMessage>m).reply("Invalid login/password");
                        }
                        else {
                            (<IMessage>m).reply("Success! Logged in.");
                        }
                    }
                    catch(er) {
                        (<IMessage>m).reply("[Error] " + er);
                    }
                },
                new CommandThrottleOptions(10, -1, -1),
                [],
                [],
                false,
                false
            )
        ).addCommand(
            new Command(
                "logout", 
                (b:Bot, m:IEvent) => {
                    try {
                        b.logoutUser(m);
                        (<IMessage>m).reply("Logged out.");
                    }
                    catch(er) {
                        (<IMessage>m).reply("[Error] " + er);
                    }
                },
                new CommandThrottleOptions(10, -1, -1),
                [],
                [],
                false,
                false
            )
        ).addCommand(
            new Command(
                "addcmd", 
                (b:Bot, m:ICommandMessage) => {
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
                            new AsyncFunction(code);
                        }
                        catch(ex) {
                            return m.reply("[Error] Syntax error in command: " + ex);
                        }

                        b.addCommand(
                            new Command(
                                cmd, 
                                // Todo: Find a better way to assign this maybe?
                                <any>(new AsyncFunction("bot", "message", "require", code)),
                                new CommandThrottleOptions(-1, -1, -1),
                                [],
                                [],
                                true,
                                true
                            )
                        );

                        (<IMessage>m).reply("[Success] " + cmd + " has been added");
                    }
                    catch(er) {
                        (<IMessage>m).reply("[Error] " + er);
                    }
                },
                new CommandThrottleOptions(-1, -1, -1),
                [],
                [new CommandAuthOptions(CommandAuthTypes.Level, "3")], 
                false
            )
        ).addCommand(
            new Command(
                "delcmd", 
                (b:Bot, m:ICommandMessage) => {
                    try {
                        let parts = m.args;
                        let cmd = (parts[0] || "").toLowerCase();
                        
                        if (!cmd) {
                            return m.reply("[Error] Please specify a command");
                        }

                        switch(cmd) {
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
                    catch(er) {
                        (<IMessage>m).reply("[Error] " + er);
                    }
                },
                new CommandThrottleOptions(-1, -1, -1),
                [],
                [new CommandAuthOptions(CommandAuthTypes.Level, "3")], 
                false
            )
        ).addCommand(
            new Command(
                "setcmd", 
                (b:Bot, m:ICommandMessage) => {
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

                        switch(cmd.name) {
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

                        switch(propName) {
                            case "fnc":
                            case "code": {
                                let code = fncTemplate.replace("{code}", parts.splice(2).join(" "));
                                try {        
                                    new AsyncFunction(code);
                                }
                                catch(ex) {
                                    return m.reply("[Error] Syntax error in command: " + ex);
                                }
            
                                // Todo: Find a better Typescript way to assign this maybe?
                                cmd.fnc = <any>(new AsyncFunction("bot", "message", "require", code));
                            }
                            break;
                            case "throttle": {
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
                            case "binding": {
                                let operation = (parts[2] || "").toLowerCase();
                                if (!operation || (operation != "add" && operation != "remove")) {
                                    return m.reply("[Error] Missing throttle option.. " + cmdPrefix + 
                                        "setcmd <CommandName> binding <add/remove> <listing index or bind regex of format '#channel@endpoint'>");
                                }

                                if (operation == "add") {
                                    let code = parts.splice(3).join(" ");
                                    try {
                                    cmd.binding.push(new CommandBindOptions(code));
                                    }
                                    catch(er) {
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
                            case "auth": {
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
                                        cmd.auth.push(new CommandAuthOptions(<CommandAuthTypes>authType, code));
                                    }
                                    catch(er) {
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
                    catch(er) {
                        (<IMessage>m).reply("[Error] " + er);
                    }
                },
                new CommandThrottleOptions(-1, -1, -1),
                [],
                [new CommandAuthOptions(CommandAuthTypes.Level, "3")], 
                false
            )
        ).addCommand(
            new Command(
                "getcmd", 
                (b:Bot, m:ICommandMessage) => {
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

                        switch(cmd.name) {
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

                        switch(propName) {
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
                    catch(er) {
                        (<IMessage>m).reply("[Error] " + er);
                    }
                },
                new CommandThrottleOptions(-1, -1, -1),
                [],
                [new CommandAuthOptions(CommandAuthTypes.Level, "3")], 
                false
            )
        ).addCommand(
            new Command(
                bot.config.rawEvalPrefix, 
                async (b:Bot, m:ICommandMessage) => {
                        
                    let toExecute = m.args.join(" ");

                    try {
                        let msg = m;
                        let message = m;
                        if (msg && message) msg = message;

                        console.log("To Execute: '" + toExecute + "'");

                        var re = eval(toExecute);
                        
                        if (re) {
                            m.reply(re.toString());
                        }
                    }
                    catch(er) {
                        if (er.message != "await is only valid in async function" && er.message != "Illegal return statement") {
                            (<IMessage>m).reply("[Error] " + er);
                        }
                        else {
                            try {
                                
                                let code = fncTemplate.replace("{code}", toExecute);
                                
                                console.log(code);

                                let f =  new AsyncFunction("bot", "message", "require", code);
                                let re = await f(b, m, require);

                                if (re) {
                                    m.reply(re.toString());
                                }
                            }
                            catch(exc) {
                                (<IMessage>m).reply("[Error 0x02] " + exc);
                            }
                        }
                    }
                },
                new CommandThrottleOptions(-1, -1, -1),
                [],
                [new CommandAuthOptions(CommandAuthTypes.Level, "3")], 
                false,
                false
            )
        );
    },
    () => {
        console.log("manage module unloaded");
    },
    (req : http.IncomingMessage, res: http.ServerResponse) => {
        let paths = req.url.substr(1).split('/');
    
        switch(paths[1]) {
            case "addcmd":
            case "delcmd":
            case "setcmd":
            case "getcmd": {
                let cmd = gBot.textCommands[paths[1]];
                let msg = new WebApiMessage();
                msg.args = [];
                msg.command = paths[1];
    
                let data = '';
    
                req.on("data", (d) => {
                    data += d;
    
                    if (d.length > 2048) {
                        req.connection.destroy(new Error("451"));
                    }
                });
    
                req.on("end", () => {
                    var form = qs.parse(data);
                    msg.args.push(<string>form.command);
                    let splitArgs = (<string>form.args).split(' ');
                    for(let word of splitArgs) {
                        msg.args.push(word);
                    }
                    cmd.fnc(gBot, msg, require);
                    res.writeHead(200);
                    res.end(panel.replace(/\$output\$/g, msg.response).replace(/\$path\$/g, paths[0]));
                });
            }
            break;
            case "raw": {
                let cmd = gBot.textCommands[rawEval];
                let msg = new WebApiMessage();
                msg.args = [];
                msg.command = paths[1];
    
                let data = '';
    
                req.on("data", (d) => {
                    data += d;
    
                    if (d.length > 2048) {
                        req.connection.destroy(new Error("451"));
                    }
                });
    
                req.on("end", () => {
                    var form = qs.parse(data);
                    msg.args.push(<string>form.command);
                    let splitArgs = (<string>form.args).split(' ');
                    for(let word of splitArgs) {
                        msg.args.push(word);
                    }
                    cmd.fnc(gBot, msg, require);
                    res.writeHead(200);
                    res.end(panel.replace(/\$output\$/g, msg.response).replace(/\$path\$/g, paths[0]));
                });
            }
            break;
            default:
                res.writeHead(200);
                res.end(panel.replace(/\$output\$/g, "").replace(/\$path\$/g, paths[0]));
        }
    }
    
    );
}