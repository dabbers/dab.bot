import {Module} from '../core/Module';
import {IMessage} from '../core/Events/IMessage';
import {IEndpoint} from '../core/IEndpoint';
import { Command, CommandThrottleOptions, CommandAuthOptions, CommandAuthTypes, CommandBindOptions } from '../core/Command';
import { Bot } from '../core/Bot';
import { IEvent } from '../core/Events/IEvent';
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

var fncTemplate:string = "let m = message; let msg = message;\r\n{code};";

module.exports = new Module( (bot, global) => {
    bot.addCommand(
        new Command(
            "login", 
            (b:Bot, m:IEvent) => {
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
            (b:Bot, m:IMessage) => {
                try {
                    let parts = m.message.split(" ");
                    let cmd = (parts[1] || "").toLowerCase();
                    let code = fncTemplate.replace("{code}", parts.splice(2).join(" "));
                    
                    if (!cmd) {
                        return m.reply("[Error] Please specify a command, or help");
                    }

                    if ("help" == cmd) {
                        return m.reply("[Error] Help is a reserved word");
                    }

                    try {        
                        new Function(code);
                    }
                    catch(ex) {
                        return m.reply("[Error] Syntax error in command: " + ex);
                    }

                    b.addCommand(
                        new Command(
                            cmd, 
                            // Todo: Find a better way to assign this maybe?
                            <any>(new Function("bot", "message", code)),
                            new CommandThrottleOptions(-1, -1, -1),
                            [],
                            [],
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
            (b:Bot, m:IMessage) => {
                try {
                    let parts = m.message.split(" ");
                    let cmd = (parts[1] || "").toLowerCase();
                    
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
            (b:Bot, m:IMessage) => {
                try {
                    let parts = m.message.split(" ");
                    let cmdName = (parts[1] || "").toLowerCase();
                    let propName = (parts[2] || "").toLowerCase();
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
                            let code = fncTemplate.replace("{code}", parts.splice(3).join(" "));
                            try {        
                                new Function(code);
                            }
                            catch(ex) {
                                return m.reply("[Error] Syntax error in command: " + ex);
                            }
        
                            // Todo: Find a better Typescript way to assign this maybe?
                            cmd.fnc = <any>(new Function("bot", "message", code));
                        }
                        break;
                        case "throttle": {
                            let operation = (parts[3] || "").toLowerCase();
                            if (!operation || (operation != "user" && operation != "channel" && operation != "endpoint")) {
                                return m.reply("[Error] Missing throttle option.. " + cmdPrefix + 
                                    "setcmd <CommandName> throttle <user/channel/endpoint> <number (-1 means no limit)>");
                            }

                            let value = parseInt((parts[4] || ""));
                            if (isNaN(value)) {
                                return m.reply("[Error] Missing throttle value (-1 means no limit): " + cmdPrefix + 
                                    "setcmd <CommandName> throttle <user/channel/endpoint> <seconds between calls>");
                            }

                            cmd.throttle[operation] = value;
                        }
                        break;
                        case "binding": {
                            let operation = (parts[3] || "").toLowerCase();
                            if (!operation || (operation != "add" && operation != "remove")) {
                                return m.reply("[Error] Missing throttle option.. " + cmdPrefix + 
                                    "setcmd <CommandName> binding <add/remove> <listing index or bind regex of format '#channel@endpoint'>");
                            }

                            if (operation == "add") {
                                let code = parts.splice(4).join(" ");
                                try {
                                cmd.binding.push(new CommandBindOptions(code));
                                }
                                catch(er) {
                                    return m.reply("[Error] " + er);
                                }
                            }
                            else if (operation == "remove") {
                                let index = parseInt(parts[4]);
                                if (isNaN(index) || index < 0 || index >= cmd.binding.length) {
                                    return m.reply("[Error] Invalid bind index. " + cmdPrefix + 
                                        "setcmd <CommandName> binding remove <0-" + (cmd.binding.length - 1).toString() + ">");
                                }

                                cmd.binding.splice(index, 1);
                            }
                        }
                        break;
                        case "auth": {
                            let operation = (parts[3] || "").toLowerCase();
                            if (!operation || (operation != "add" && operation != "remove")) {
                                return m.reply("[Error] Missing throttle option.. " + cmdPrefix + 
                                    "setcmd <CommandName> auth <add/remove> [args]");
                            }

                            if (operation == "add") {
                                let authType = (parts[4] || "").toLowerCase();
                                if (!authType || 
                                    (authType != "account" && 
                                    authType != "level" && 
                                    authType != "role" && 
                                    authType != "name")) {
                                    
                                    return m.reply("[Error] Missing/invalid auth type. Values: account, level, role, name");
                                }

                                let code = parts.splice(5).join(" ");
                                try {
                                    cmd.auth.push(new CommandAuthOptions(<CommandAuthTypes>authType, code));
                                }
                                catch(er) {
                                    return m.reply("[Error] " + er);
                                }
                            }
                            else if (operation == "remove") {
                                let index = parseInt(parts[4]);
                                if (isNaN(index) || index < 0 || index >= cmd.binding.length) {
                                    return m.reply("[Error] Invalid bind index. " + cmdPrefix + 
                                        "setcmd <CommandName> binding remove <0-" + (cmd.binding.length - 1).toString() + ">");
                                }
                                
                                cmd.binding.splice(index, 1);
                            }
                        }
                        break;
                        case "serialize":
                        break;
                        case "requireCommandPrefix":
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
            (b:Bot, m:IMessage) => {
                try {
                    let parts = m.message.split(" ");
                    let cmdName = (parts[1] || "").toLowerCase();
                    let propName = (parts[2] || "").toLowerCase();
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
            (b:Bot, m:IMessage) => {
                try {
                    var re = eval(m.message.substr(3));
                    
                    if (re) {
                        m.reply(re.toString());
                    }
                }
                catch(er) {
                    (<IMessage>m).reply("[Error] " + er);
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
});
