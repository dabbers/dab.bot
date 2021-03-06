import {IMessage} from '../core/Events/IMessage';
import {IEndpoint} from '../core/IEndpoint';

module.exports.create = (modType) => { 
    return new modType( (bot, config) => {
        console.log("M1 INIT");
        bot.on("Message",  (sender:IEndpoint, msg:IMessage) =>
        {
            if(msg.message.indexOf(sender.me.name) != -1) {
                msg.reply(msg.from.name + " Hi");
            }
        });
    },
    () => {
        console.log("M1 UNLOAD");
    });
}
