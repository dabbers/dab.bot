import {Bot} from './Bot';
import {IEndpoint} from './IEndpoint';
import {EndpointTypes} from './EndpointTypes';
import {Config} from './config/Config';
import * as WatchWithProxy from 'watchwithproxy';
import {ITickable} from './ITickable';

export class CoreContext implements ITickable {

    config : Config;
    bot : Bot;

    constructor(config : Config) {
        let watchOptions = new WatchWithProxy.WatchOptions();
        
        let listener = (sender:any, property: string, oldval:any, newval:any) => {
            console.log("Updated callback! sender: ", sender.toString(), "property:", property, "old:", oldval, "new:", newval);
            
            // Editing a watched property inside a callback causes an infinite loop!!
            if (sender.toString() != "Config") {
                this.config.isDirty = true;
            }
        }
        
        let watchedConfig = WatchWithProxy.Watcher.Watch(config, watchOptions, listener);
        this.config = watchedConfig;
    }

    tick() : void {
        // The bot.tick() might cause some config changes.
        // Perform the config.tick() after just in case.
        this.bot.tick();
        this.config.tick();
    }

    init() : void {
        this.bot = new Bot(this.config.bot);

        this.bot.init();
    }

    toString() {
        return "[core CoreContext]";
    }
}
