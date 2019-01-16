"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EndpointTypes_1 = require("../../core/EndpointTypes");
class WebApiMessage {
    constructor() {
        this.response = '';
        this.endpoint = { config: { commandPrefix: "", type: EndpointTypes_1.EndpointTypes.Internal, name: "http" } };
    }
    reply(message) {
        this.response += message + "<br />\r\n";
    }
    action(message) {
    }
    notice(message) {
    }
    part() {
    }
}
exports.WebApiMessage = WebApiMessage;
//# sourceMappingURL=WebApiMessage.js.map