import {Module} from '../core/Module';
import {IMessage} from '../core/Events/IMessage';
import {IEndpoint} from '../core/IEndpoint';
import { IEvent } from '../core/Events/IEvent';
import { IrcEndpoint } from '../core/endpoints/IrcEndpoint';
import { EndpointTypes } from '../core/EndpointTypes';

class OnConnectCommandConfig {
    command: "join"|"say"|"part"|"raw";
    delay:number;
    args: string[];
}

class OnConnectConfig {
    commands: OnConnectCommandConfig[];
}

module.exports.create = (modType) => { 
    return new modType( (bot, config : OnConnectConfig) => {
        if (!config || !config.commands) {
            throw new Error("Must provide commands to execute");
        }

        bot.on("Connected",  (sender:IEndpoint) => {
            for(let cmd of config.commands) {
                if (!cmd.command || (cmd.command != "join" && cmd.command != "say" && cmd.command != "part" && cmd.command != "raw") || ! cmd.args || !Array.isArray(cmd.args)) {
                    throw new Error("Expected command structure of cmd.command (join, part, say) and cmd.args string:[]")
                }

                if (cmd.delay) {
                    setTimeout(
                        function(comm) { 
                            return function() { sender[comm.command].apply(sender, comm.args) };
                        }(cmd),
                        cmd.delay
                    );
                }
                else {
                    sender[cmd.command].apply(sender, cmd.args);
                }
                
            }
        });
    },
    () => {
        console.log("ONCONNECT UNLOAD");
    });
}