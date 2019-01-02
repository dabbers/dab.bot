import {Module} from '../core/Module';
import {IMessage} from '../core/Events/IMessage';
import {IEndpoint} from '../core/IEndpoint';
import { EndpointTypes } from '../core/EndpointTypes';

module.exports = new Module( (bot, global) => {
    setInterval( () => {
        let key = Object.keys(bot.endpoints).filter(p => bot.endpoints[p].type == EndpointTypes.IRC);
        if (key && key.length > 0) {
            bot.endpoints[key[0]].say("#dab.beta", "testing");
        }
    },
    3000);
},
() => {
    console.log("M1 UNLOAD");
});