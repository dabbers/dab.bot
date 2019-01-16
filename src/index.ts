import 'source-map-support/register';
import * as request from 'request';
import {Config} from './core/config/Config';
import * as Core from './core/Core';

(<any>global).download = function(url, cb) {
	request({
		uri: url,
		method: "GET",
		timeout: 5000,
		followRedirect: true,
		maxRedirects: 5
	}, function(error, response, body) {

		if (error) {
			cb({"error":error});
		}
		else {
			if (response.headers['content-type'] && response.headers['content-type'].toLowerCase().indexOf("json") != -1) {
				cb(JSON.parse(body));
			}
			else {
				cb(body);
			}
		}
		
	});
}

let contextCfg = Config.init("config.json");

let core = new Core.CoreContext(contextCfg);
core.init();

setInterval(() => core.tick(), 600);
