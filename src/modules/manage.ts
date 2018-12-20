import {Module} from '../core/Module';
import {IMessage} from '../core/Events/IMessage';
import {IEndpoint} from '../core/IEndpoint';
import { Command, CommandThrottleOptions, CommandAuthOptions, CommandAuthTypes } from '../core/Command';
import { Bot } from '../core/Bot';
import { IEvent } from '../core/Events/IEvent';
var keys :string[] = [
        "name", 
        "fnc",
        "throttle",
        "binding",
        "auth",
        "serialize",
        "requireCommandPrefix"
];

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
                    let code = parts.splice(2).join(" ");
                    
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
                            <any>(new Function("bot", "message","{" +  code + ";}")),
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
                    
                    b.delCommand(cmd);
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
                    let keyName = (parts[2] || "").toLowerCase();
                    let cmd = b.textCommands[cmdName];

                    if (!cmd) {
                        return m.reply("[Error] Please specify a command, or help");
                    }


                    let properties = Object.keys(cmd);
                    for(let property of properties) {
                        if (property.toLowerCase() == keyName) {

                        }
                    }
                    b.setCommand(null);
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
                    let keyName = (parts[2] || "").toLowerCase();
                    let cmd = b.textCommands[cmdName];

                    if (!cmd) {
                        return m.reply("[Error] Please specify a command, or help");
                    }

                    let properties = Object.keys(cmd);
                    for(let property of properties) {
                        if (property.toLowerCase() == keyName) {

                        }
                    }
                    b.setCommand(null);
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
    );
},
() => {
    console.log("M1 UNLOAD");
});