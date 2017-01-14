var Discord = require("discord.js");
var bot = new Discord.Client();

function coocooPull(isLast, isDodo) {
    var number = Math.random();
    var pull = "";
    if (isLast) {
        var junkrate = 0;
        var platrate = 0;
        var arate = 0.7;
        var srate = 0.27;
    } else if (isDodo) {
        var junkrate = 0;
        var platrate = 0;
        var arate = 0.0;
        var srate = 0.0;
    } else {
        var junkrate = 0.55;
        var platrate = 0.28;
        var arate = 0.1;
        var srate = 0.045;
    }
    if (number < junkrate) pull = "<:junk:269584481944338432>";
    else if (junkrate <= number && number < junkrate + platrate) pull = "<:platinum:269584501200519170>";
    else if (junkrate + platrate <= number && number < junkrate + platrate + arate) pull = "<:A_set:269588637597958144>";
    else if (junkrate + platrate + arate <= number && number < junkrate + platrate + arate + srate) pull = "<:S_set:269588682275553282>";
    else pull = "<:SS_set:269588698113245184>";
    return pull;
};

function coocooPull10(isDodo) {
    if (isDodo) {
        var pull10 = "";
        for (var i = 0; i < 9; i++) {
            pull = coocooPull(false, true);
            pull10 = pull10 + pull + " ";
        };
        pull = coocooPull(false, true);
        pull10 = pull10 + " " + pull; 
    } else {
        var pull10 = "";
        for (var i = 0; i < 9; i++) {
            pull = coocooPull(false, false);
            pull10 = pull10 + pull + " ";
        };
        pull = coocooPull(true, false);
        pull10 = pull10 + pull;
    }
    return pull10;
};


bot.on("message", msg => {
    if (msg.content.startsWith("!ping")) {
        msg.channel.sendMessage("pong!");
    } else if (msg.content.startsWith("!pull")) {
        pull = coocooPull(false);
        msg.channel.sendMessage(pull);
    } else if (msg.content.startsWith("!whale")) {
        if (msg.author.username.startsWith("The Master Dodo")) {
            pull10 = coocooPull10(false); // Changing this to true give me SS pulls
            msg.channel.sendMessage(pull10);
        } else {
            pull10 = coocooPull10(false);
            msg.channel.sendMessage(pull10);
        }
    } else if (msg.content.startsWith("!emote")) {
        msg.channel.sendMessage(":smirk:");
    }
});
bot.on('ready', () => {
    console.log('I am ready!');
});
bot.login("MjY5MDAwNzY3OTA4NjEwMDU5.C1i-Eg.any7fYM1VCa0qrxy2JJXnOYxhTg");