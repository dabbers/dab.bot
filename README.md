# dab.bot
A bot written in Typescript that connects to various chat services such as Discord, Telegram, and IRC

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


