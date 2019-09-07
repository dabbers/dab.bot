import 'source-map-support/register';
import {Config} from './core/config/Config';
import * as Core from './core/Core';
import {promisify} from 'util';
import * as dns from 'dns';
import * as http from 'http';
import * as https from 'https';
import { Cipher } from 'crypto';


const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

(global as any).download = function(url) {
	// return new pending promise
	return new Promise((resolve, reject) => {
		// select http or https module, depending on reqested url
		const lib = url.startsWith('https') ? https : http;
		const request = lib.get(url, (response) => {
			// handle http errors
			if (response.statusCode < 200 || response.statusCode > 299) {
				return reject(new Error('Failed to load page, status code: ' + response.statusCode));
			}
			// temporary data holder
			const body = [];
			// on every content chunk, push it to the data array
			response.on('data', (chunk) => body.push(chunk));
			// we are done, resolve promise with those joined chunks
			response.on('end', () => {
				let b = body.join('');
				if (response.headers['content-type'] && response.headers['content-type'].toLowerCase().indexOf("json") != -1) {
					return resolve(JSON.parse(b));
				}
				else {
					return resolve(b);
				}
			});
		});

		// handle connection errors of the request
		request.on('error', (err) => reject(err));
	})
};

(global as any).lookupAsync = promisify( dns.lookup );
(global as any).lookupServiceAsync = promisify( dns.lookupService );


let contextCfg = Config.init("config.json");

let core = new Core.CoreContext(contextCfg);
core.init();


(global as any).nothrow = async ( fnc: ()=>any, ...args:any[]) => {
	try {
		return await fnc.apply(core.bot, args);
	}
	catch {
		return null;
	}
}

setInterval(() => core.tick(), 600);
