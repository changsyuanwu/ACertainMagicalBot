# ACertainMagicalBot

A Discord Bot with various commands for server moderation, games, utility, etc.

Also has specific commands for the mobile game Fantasy War Tactics R such as getting hero stats and set information.

# Requirements

* `git` command line installed
* `node` Version 8.0.0 or higher

A Discord bot token is needed. This is obtained by creating an application in the Developer section of discordapp.com

# Downloading
c
In a command prompt in your projects folder (wherever that may be) run the following:

`git clone https://github.com/changsyuanwu/ACertainMagicalBot.git`

Once finished:

* In the folder from where you ran the git command, run `cd ACertainMagicalBot` and then run `npm install`

* Navigate to the folder, go to `/src/Data`, and rename `config.js.example` to `config.js`

* Edit `config.js` and fill in all the relevant details as indicated in the file's comments.

# Starting the bot

To start the bot, in the command prompt, run the following command: `node mybotbeta.js`

# Adding the bot to a server

To add the bot to your guild, you have to get an oauth link for it.

You can use this site to help you generate a full OAuth Link, which includes a calculator for the permissions: https://finitereality.github.io/permissions-calculator/?v=0
