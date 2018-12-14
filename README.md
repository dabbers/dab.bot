# dab.bot
A bot written in Typescript that connects to various chat services such as Discord, Telegram, and IRC. The goal of the bot was to have a framework that can connect to multiple endpoints and work the same way regardless of the endpoint. A lot of information gets abstracted out, but considering a large portion of that information isn't needed for a typical bot, it's worth the abstraction. Various properts can be added on a per endpoint basis and used in a module, but the bot itself operates in a very abstract manner.

An endpoint is just a connection that has a "me" object (who the bot is on this endpoint), and that's basically it. It understands how to join and leave channels (some endpoints don't support it). 

Every endpoint needs to emit 3 different events: Join, Leave, and Message. Join is whenever a user joins a location the bot can see (usually a channel). Leave is when the user is no longer available in that channel. For IRC, a QUIT will be mapped to every channel that user was part of as a Leave. Message is pretty obvious. Each endpoint will provide its own extra details in the event, but the basis of each event will tell you who triggered the event, and what endpoint the event came from.

Currently a work in progress. See the sample config for how to configure, then run tsc and then node bin/index.js to start the bot. You can see an example module in src/modules/. 

I'm currently planning on having most modules be an NPM package. So you can inclued modules just by including them in the package.json. You can still include local modules though.

# "Features"

* Connect to IRC *done*
* Connect to Discord *done*
* Connect to Telegram *done*
* Connect to Microsoft BotFramework
* Emits Messages *done*
* Emits Join Messages
* Emits Leave Messages (IRC will send quit and parts as same message)
* Supports commands *Currently in progress*
* Supports Modules *Mostly done*
* Supports an auto saved config *Currently in progress, needs to add newly joined channels to list*
* Some tests would be nice, but currently the code isn't very testable
* A storage class that makes persisting bot state very easy.


