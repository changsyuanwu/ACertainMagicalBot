const Discord = require("discord.js");
const bot = new Discord.Client();
const config = require("/Users/Shared/config.json");
const setTable = require(config.DataFilePath + "/FWTSetData.json");
const aliasListSets = require(config.DataFilePath + "/FWTSetAliases.json");
const aliasListHeroes = require(config.DataFilePath + "/FWTHeroAliases.json");
const rainbowRotation = require(config.DataFilePath + "/FWTSetRotation.json");
const heroDataTable = require(config.DataFilePath + "/FWTHeroStats.json");
const itemDataTable = require(config.DataFilePath + "/FWTItemMaxStats.json");
const heroSkillTable = require(config.DataFilePath + "/FWTHeroSkills.json")
const flagNames = ["confusion", "charm", "stun", "taunt", "disarm", "immobilize", "decrease movement", "dot", "mp burn", "skill cost", "defense ignore", "defense ignoring damage", "weakening", "buff removal", "hp% damage", "defense decrease", "attack decrease", "hp drain", "mastery decrease", "instant death", "decrease crit rate", "push/pull/switch", "passive attack", "seal", "sleep", "melee", "ranged"];

    // Declaring constants/loading databases

//--------------------------------------------------------------------------------------------


for (let i = 0, len = setTable.length; i < len; i++) {
    for (let j = 0, weeks = rainbowRotation.length; j < weeks; j++) {
        let grade = setTable[i]["Tier"].length.toString() + setTable[i]["Grade"];
        if (rainbowRotation[j][grade] == setTable[i]["Name"]) {
            setTable[i]["Last Time in the Rotation"] = rainbowRotation[j]["Week"];
        }
    }
}   // Adds the last time in rotation data to the set data

//--------------------------------------------------------------------------------------------


function coocooPull(isLast) {
    var number = Math.random();
    if (isLast) {
        var junkrate = 0;
        var platrate = 0;
        var arate = 0.7;
        var srate = 0.27;
    } else {
        var junkrate = 0.55;
        var platrate = 0.28;
        var arate = 0.1;
        var srate = 0.045;
    }
    if (number < junkrate) return "junk";
    else if (junkrate <= number && number < junkrate + platrate) return "platinum";
    else if (junkrate + platrate <= number && number < junkrate + platrate + arate) return "A_set";
    else if (junkrate + platrate + arate <= number && number < junkrate + platrate + arate + srate) return "S_set";
    else return "SS_set";
}
function coocooPull10() {
    var pull10 = new Array(10);
    pull10.fill(null);
    return pull10.map((element, index, array) => coocooPull(index === array.length - 1));
}   // End of CooCoo Pulling functions

//--------------------------------------------------------------------------------------------


function createOutput(list) {
    var dataString = "";
    for (var property in list) {
        if ((list.hasOwnProperty(property)) && (!flagNames.includes(property))) {
            dataString = dataString + capitalize(property) + ": " + list[property] + "\n";
        } 
    }
    return dataString;
}
function findNameByAlias(alias, isSet) {
    alias = alias.toLowerCase();
    if (isSet) var aliasList = aliasListSets;
    else var aliasList = aliasListHeroes;
    for (var i = 0, setnum = aliasList.length; i < setnum; i++) {
        for (var j = 0, len = aliasList[i]["aliases"].length; j < len; j++) {
            if (aliasList[i]["aliases"][j] == alias) return aliasList[i]["name"];
        }
    }
    return "nosuchalias";
}
function findData(alias, isSet) {
    if (isSet) {
        var name = findNameByAlias(alias, true);
        var dataTable = setTable;
    } else {
        var name = findNameByAlias(alias, false);
        var dataTable = heroDataTable;
    }
    if (name == "nosuchalias") return "nosuchdata";
    const data = dataTable.find(dataItem => dataItem.Name === name);

    return createOutput(data);
}
function SetsOfTheWeek(WeekRequested) {
    var rainbowData = rainbowRotation[rainbowRotation.length - 1 - WeekRequested];
    return createOutput(rainbowData);
} 
function findProperty(propertyRequested, effectRequested) {
    var dataString = "";
    for (var i = 0, heronum = heroDataTable.length; i < heronum; i++) {
        if (heroDataTable[i][propertyRequested].includes(effectRequested)) dataString = dataString + "\n" + heroDataTable[i]["Name"];
    }
    return dataString;
} 
function findItem(item, level) {
    var dataString = "";
    for (var i = 0, itemnum = itemDataTable.length; i < itemnum; i++) {
        if (itemDataTable[i]["Name"] == item) dataString = itemDataTable[i][level];
    }
    return dataString;
}
function findStat(hero, stat) {
    var dataString = "";
    for (var i = 0, heronum = heroDataTable.length; i < heronum; i++) {
        if (heroDataTable[i]["Name"] == hero) dataString = heroDataTable[i][stat];
    }
    return dataString;
}
function findSkill(alias, skill) {
    var dataString = "";
    var name = findNameByAlias(alias, false)
    if (name == "nosuchalias") return "nosuchdata";
    for (var i = 0, heronum = heroSkillTable.length; i < heronum; i++) {
        if (heroSkillTable[i]["Name"] == name) dataString = heroSkillTable[i][skill];
    }
    return dataString;
} // End of database functions

//--------------------------------------------------------------------------------------------


function PullOrNot() {
    var number = Math.random();
    var YesNo;
    if (number <= 0.5) YesNo =  config.FilePath + "/Images/Pull.png";
    else YesNo = config.FilePath + "/Images/Don't Pull.png";
    return YesNo;
}
function findEmojiFromGuildByName(guild, emoji_name) {
    const emoji = guild.emojis.find((emoji) => emoji.name === emoji_name);
    return emoji ? emoji.toString() : emoji_name;
}
function capitalize(inputString) {
    var outputString = inputString.substr(0, 1).toUpperCase() + inputString.substr(1, inputString.length - 1).toLowerCase();
    return outputString;
}  // End of other functions

//--------------------------------------------------------------------------------------------


bot.on("message", msg => {
    if (!msg.content.startsWith(config.prefix)) return; // Checks for prefix
    if (msg.author.bot) return; // Checks if sender is a bot

    if (msg.channel.id == config.ReservedGeneral) {
        const AllowedCommands = ["!set", "!rainbow", "!pull", "!hero", "!stats", "!ping", !"property"];
        var command = 0;
        for (var i = 0, cmdnum = AllowedCommands.length; i < cmdnum; i++) {
            if (!msg.content.startsWith(AllowedCommands[i])) {
                command = command++;
                if (command == 6) {
                    msg.channel.sendMessage(msg.content + " command is not allowed here. Please use it in " + config.ReservedCode + " or " + config.ReservedCasino);
                    return;
                }
            }
        }
    }   // Server specific commands


    if (msg.content.startsWith(config.prefix + "ping")) msg.channel.sendMessage("pong!");
    // Bot testing

    else if (msg.content.startsWith(config.prefix+ "help"))  msg.channel.sendMessage(config.Help);
    // Help command
    
    else if (msg.content.startsWith(config.prefix + "tadaima") && (msg.content.includes("maid"))) msg.channel.sendMessage("おかえりなさいませ！ご主人様♥, \nDo you want dinner or a shower or \*blushes\* me?");
    else if (msg.content.startsWith(config.prefix + "tadaima") && (msg.content.includes("spades"))) msg.channel.sendMessage("おかえりなさいませ！ご主人様 :anger:, \nWell, I don't have much of a choice. I guess I'll end this here since I got ~~Shido~~ Spades-san to pat my head today.----right, all of me?");
    else if (msg.content.startsWith(config.prefix + "tadaima")) msg.channel.sendMessage("Okaeri dear, \nDo you want dinner or a shower or \*blushes\* me?");
    else if (msg.content.startsWith(config.prefix + "tuturu")) msg.channel.sendFile(config.FilePath + "/Images/Tuturu.png");
    else if (msg.content.startsWith(config.prefix + "moe")) msg.channel.sendFile(config.FilePath + "/Images/Shushu/moe.PNG");
    // End of custom commands
    
    
    else if (msg.content.startsWith(config.prefix + "pull")) msg.channel.sendFile(PullOrNot()); // 50/50 pull or no
    
    else if (msg.content.startsWith(config.prefix + "whale")) { // 10x pull
        var splitContent = msg.content.split(" ");
        var pulls = "";
        var totalPull = "";
        if (splitContent.length > 1) {
            for (var i = 0; i < splitContent[1]; i++) {
                pulls = coocooPull10().map((emoji_name) => findEmojiFromGuildByName(msg.guild, emoji_name));
                totalPull = pulls.join(" ") + "\n" + totalPull;
            }
            msg.channel.sendMessage(totalPull);
        } else {
            pulls = coocooPull10().map((emoji_name) => findEmojiFromGuildByName(msg.guild, emoji_name));
            msg.channel.sendMessage(pulls.join(" "));
        }

    } else if (msg.content.startsWith(config.prefix + "set")) { // Searches database for set info
        var setName = msg.content.slice(msg.content.indexOf(" ", 0) + 1, msg.content.length);
        var setInfo = findData(setName, true);
        if (setInfo != "nosuchdata") msg.channel.sendMessage(setInfo);
        else msg.channel.sendMessage("Unknown Set!");

    } else if (msg.content.startsWith(config.prefix + "stats")) { // Searches database for hero stats
        var heroRequested = msg.content.slice(msg.content.indexOf(" ", 0) + 1, msg.content.length);
        var heroStats = findData(heroRequested, false);
        if (heroStats != "nosuchdata") msg.channel.sendMessage(heroStats);
        else msg.channel.sendMessage("Unknown Hero!");
        
    } else if (msg.content.startsWith(config.prefix + "stat")) { // Searches for the requested stat of the requested hero
        var splitContent = msg.content.split(" ");
        if (splitContent.length <= 2) {
            msg.channel.sendMessage("Invalid request!");
            return;
        }
        var heroRequested = findNameByAlias(splitContent[1]);
        var statRequested = splitContent[2].toLowerCase();
        var statData = findStat(heroRequested, statRequested)
        if (statData != "nosuchdata") msg.channel.sendMessage(heroRequested + "'s " + capitalize(statRequested) + ": " + statData);
        else msg.channel.sendMessage("Unknown Hero!");
    
    } else if (msg.content.startsWith(config.prefix + "effect")) { // Searches database for the requested effect and returns which heroes can cause the effect
        var effect = msg.content.slice(msg.content.indexOf(" ", 0) + 1, msg.content.length).toLowerCase();
        if (effect == "list") {
            var flags = "";
            for (var i = 0; i < flagNames.length; i++) {
                flags = flags + "\n" + capitalize(flagNames[i]);
            }
            msg.channel.sendMessage(flags);
        } else if (flagNames.includes(effect)) {
            var effectHeroes = findProperty(effect, "TRUE");
            msg.channel.sendMessage(effectHeroes);
        } else 
            msg.channel.sendMessage("Unknown effect");
        
    } else if (msg.content.startsWith(config.prefix + "property")) { // Searches database for the requested property and returns which heroes have the property
        var splitContent = msg.content.split(" ");
        if (splitContent.length <= 2) {
            msg.channel.sendMessage("Invalid property!");
            return;
        }
        var property = splitContent[1].toLowerCase();
        var effect = capitalize(splitContent[2]);
        var propertyHeroes = findProperty(property, effect);
        msg.channel.sendMessage(propertyHeroes);
        
    } else if (msg.content.startsWith(config.prefix + "item")) { // Searches database for the requested item and returns the stats
        var splitContent = msg.content.split(" ");
        var itemName = splitContent[1].toLowerCase();
        var itemLevel = splitContent[2];
        var itemStats = findItem(itemName, itemLevel);
        msg.channel.sendMessage(itemStats);
        
    } else if (msg.content.startsWith(config.prefix + "skill")) { // Searches database for the requested skill
        var splitContent = msg.content.split(" ");
        var heroName = findNameByAlias(splitContent[1]);;
        var skill = splitContent[2];
        var skillData = findSkill(heroName, skill)
        if (skillData != "nosuchdata") msg.channel.sendMessage(skillData);
        else msg.channel.sendMessage("Unknown Hero!");
        
    } else if (msg.content.startsWith(config.prefix + "nameset") && (msg.author.id == config.ownerID)) {
        msg.guild.member(bot.user).setNickname("A Certain Magical Bot");
        msg.channel.sendMessage("My name has been set!");

    } else if (msg.content.startsWith(config.prefix + "rainbow")) { // Searches database for current set rotation
        if (msg.content.indexOf(" ",0) != -1) {
            var WeekRequested = msg.content.slice(msg.content.indexOf(" ",0) + 1, msg.content.length);
        } else WeekRequested = 0;
        const currentSets = SetsOfTheWeek(WeekRequested);
        msg.channel.sendMessage(currentSets);
    }
});
bot.on("ready", () => {
    console.log("I am ready!");
    bot.user.setGame("spamming Twins nerf requests");
});
bot.on("error", e => { console.error(e); });
bot.login(config.token);