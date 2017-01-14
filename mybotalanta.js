var Discord = require("discord.js");
var bot = new Discord.Client();

function coocoopull(isLast) {
    var number = Math.random() * 100;
    var pull = "gz";
    
    if (isLast) {
				var junkrate = 0;
        var platrate = 0;
        var arate = 70.0;
        var srate = 27.0;
    }
    else {
				var junkrate = 55.0;
        var platrate = 28.0;
        var arate = 10.0;
        var srate = 4.5;
    }
    
    if (number < junkrate) pull = "junk";
    else if (junkrate <= number && number < junkrate+platrate) pull = "plat";
    else if (junkrate+platrate <= number && number < junkrate+platrate+arate) pull = "a set";
    else if (junkrate+platrate+arate <= number && number <= junkrate+platrate+arate+srate) pull = "s set";
    else if (junkrate+platrate+arate+srate <= number && number < 100) pull = "ss set";
    return pull;
};

function coocoopull10() {
    var pull10 = "";
    for (var i = 0; i < 9; i++) {
        pull = coocoopull();
        pull10 = pull10 + pull + ", ";
    };
    
    return pull10;
};

bot.on("message", msg => {
    if (msg.content.startsWith("!ping")) {
        msg.channel.sendMessage("pong!");
    }

    else if (msg.content.startsWith("!hellododo")) {
        msg.channel.sendMessage("hello!");
    }

    else if (msg.content.startsWith("!bark")) {
        msg.channel.sendMessage("Woof!");
    }
    else if (msg.content.startsWith("!gamble")) {
        pull = coocoopull(false);
        msg.channel.sendMessage (pull);
    }
    else if (msg.content.startsWith("!whale")) {
        pull10 = coocoopull10();
        msg.channel.sendMessage (pull10);
    }
});

bot.on('ready', () => {
  console.log('I am ready!');
});

bot.login("MjY5MDAwNzY3OTA4NjEwMDU5.C1i-Eg.any7fYM1VCa0qrxy2JJXnOYxhTg");
