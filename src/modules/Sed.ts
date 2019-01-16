import {IMessage} from '../core/Events/IMessage';
import {IEndpoint} from '../core/IEndpoint';


class EndpointHistory {
    channels:{ [ key:string ] : ChannelHistory } = {};
}
class ChannelHistory {
    messages:ChannelLine[] = [];
}
class ChannelLine {
    constructor(msg, frm) {
        this.message = msg;
        this.from = frm;
    }
    message:string;
    from:string;
}

var _history :{ [ key:string ] : EndpointHistory } = {};
var _regx = new RegExp(/^s([^A-z0-9])(.*?)\1(.*?)\1([a-z]{0,3})(.*)*/);

function performSedThing(msg:IMessage) {

	if (!_history[msg.endpoint.name]) _history[msg.endpoint.name] = new EndpointHistory();

	try {
		var res = msg.message.match(_regx);

		if (res) {
			var rg = new RegExp(res[2], res[4]);
			for(let line of _history[msg.endpoint.name].channels[msg.target.name].messages) {

				if (rg.test(line.message)) {
					
                    //_bot.say(server.alias, chan, "<" + _history[chan][i].From.Parts[0] + "> " + _history[chan][i].MessageLine.replace(rg, res[3]));
                    msg.endpoint.say(
                        msg.target.name, 
                        "<" + line.from + "> " + line.message.replace(rg, res[3])
                    );
					break;
				}
			}

			return;
        }
        else {
            if (!_history[msg.endpoint.name]) {
                _history[msg.endpoint.name] = new EndpointHistory();
            }

            if (!_history[msg.endpoint.name].channels[msg.target.name]) {
                _history[msg.endpoint.name].channels[msg.target.name] = new ChannelHistory();
            }

            if (_history[msg.endpoint.name].channels[msg.target.name].messages.length >= 50) {
                _history[msg.endpoint.name].channels[msg.target.name].messages.shift();
            }

            _history[msg.endpoint.name].channels[msg.target.name].messages.push(
                new ChannelLine(msg.message, msg.from.name)
            );
        }
	}
	catch(ex) {
		if (msg.endpoint.authBot.isUserAuthed(msg) > 1) {
            msg.reply("Sed Error: " + ex.toString());
        }
		return;
	}

}

module.exports.create = (modType) => { 
    return new modType( (bot, config) => {
        console.log("SED INIT");
        bot.on("Message",  (sender:IEndpoint, msg:IMessage) =>
        {
            performSedThing(msg);
        });
    },
    () => {
        console.log("SED UNLOAD");
    });
}
