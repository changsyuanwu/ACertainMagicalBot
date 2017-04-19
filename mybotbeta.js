const Discord = require("discord.js");
const path = require("path");
const sql = require('sqlite');
const bot = new Discord.Client();
const launchLocation = __dirname;
const config = require(path.join(launchLocation, "config.json"));
const help = require(path.join(launchLocation, "help.json"));
const Logger = require(path.join(launchLocation, "src", "Utilities", "Logger.js"));
const moe = require(path.join(launchLocation, "src", "Moe.json"));
const setDataTable = require(path.join(launchLocation, "src", "Data", "FWTSetData.json"));
const aliasListSets = require(path.join(launchLocation, "src", "Data", "FWTSetAliases.json"));
const aliasListHeroes = require(path.join(launchLocation, "src", "Data", "FWTHeroAliases.json"));
const rainbowRotation = require(path.join(launchLocation, "src", "Data", "FWTSetRotation.json"));
const heroDataTable = require(path.join(launchLocation, "src", "Data", "FWTHeroStats.json"));
const itemDataTable = require(path.join(launchLocation, "src", "Data", "FWTItemMaxStats.json"));
const heroSkillTable = require(path.join(launchLocation, "src", "Data", "FWTHeroSkills.json"));
const triviaTable = require(path.join(launchLocation, "src", "Data", "FWTTrivia.json"));
const soulGearTable = require(path.join(launchLocation, "src", "Data", "FWTSoulGear.json"));
const flagNames = ["confusion", "charm", "stun", "taunt", "disarm", "immobilize", "decrease movement", "dot", "mp burn", "skill cost", "defense ignore", "defense ignoring damage", "weakening", "buff removal", "hp% damage", "defense decrease", "attack decrease", "hp drain", "mastery decrease", "instant death", "decrease crit rate", "push/pull/switch", "passive attack", "seal", "sleep", "melee", "ranged"];

sql.open(path.join(launchLocation, "src", "scores.sqlite"));
var triviaChannels = new Set([]);
var triviaLastQuestion = 0;
const logger = new Logger(config.noLogs);

// Declaring constants/loading databases

//--------------------------------------------------------------------------------------------


for (let i = 0, len = setDataTable.length; i < len; i++) {
    for (let j = 0, weeks = rainbowRotation.length; j < weeks; j++) {
        let grade = setDataTable[i]["Tier"].length.toString() + setDataTable[i]["Grade"];
        if (rainbowRotation[j][grade] === setDataTable[i]["Name"]) {
            setDataTable[i]["Last Time in the Rotation"] = rainbowRotation[j]["Week"];
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
} // Processes a single coocoo pull

function coocooPull10() {
    var pull10 = new Array(10);
    pull10.fill(null);
    return pull10.map((element, index, array) => coocooPull(index === array.length - 1));
} // Pulls 10 times and returns results in an array

// End of CooCoo Pulling functions

//--------------------------------------------------------------------------------------------


function createListOutput(list) {
    var dataString = "";
    for (var property in list) {
        if ((list.hasOwnProperty(property)) && (!flagNames.includes(property))) {
            dataString = dataString + capitalize(property) + ": " + list[property] + "\n";
        }
    }
    return dataString;
} // Creates a output in a list

function findNameByAlias(alias, type) {
    alias = alias.toLowerCase();
    if (type === "set") {
        var aliasList = aliasListSets;
    } else if (type === "hero") {
        var aliasList = aliasListHeroes;
    } else {
        return alias;
    }
    for (var i = 0; i < aliasList.length; i++) {
        for (var j = 0; j < aliasList[i]["aliases"].length; j++) {
            if (aliasList[i]["aliases"][j] === alias) return aliasList[i]["name"];
        }
    }
    return "nosuchalias";
} // Finds the correct name from the alias

function findListedPropertyData(alias, type) {
    if (type === "set") {
        var name = findNameByAlias(alias, "set");
        var dataTable = setDataTable;
    } else if (type === "hero") {
        var name = findNameByAlias(alias, "hero");
        var dataTable = heroDataTable;
    } else if (type === "soulgear") {
        var name = findNameByAlias(alias, "hero");
        var dataTable = soulGearTable;
    }
    if (name === "nosuchalias") {
        return "nosuchdata";
    }
    var data = dataTable.find(dataItem => dataItem.Name === name);
    return createListOutput(data);
} // Finds a list of data with properties

function SetsOfTheWeek(WeekRequested) {
    var rainbowData = rainbowRotation[rainbowRotation.length - 1 - WeekRequested];
    return createListOutput(rainbowData);
} // Finds the set rotation for the requested week

function findSingleData(alias, data, type) {
    if (type === "item") {
        var dataTable = itemDataTable;
        var name = findNameByAlias(alias, "item");
    } else if (type === "stat") {
        var dataTable = heroDataTable;
        var name = findNameByAlias(alias, "hero");
    } else if (type === "skill") {
        var dataTable = heroSkillTable;
        var name = findNameByAlias(alias, "hero");
    }
    var dataString = "";
    for (var i = 0; i < dataTable.length; i++) {
        if (dataTable[i]["Name"] === name) {
            dataString = dataTable[i][data];
        }
    }
    return dataString;
} // Finds a single piece of data

function findSets(tier, grade) {
    var dataString = "";
    for (var i = 0; i < setDataTable.length; i++) {
        if ((setDataTable[i]["Tier"] === tier) && (setDataTable[i]["Grade"] == grade)) {
            dataString = dataString + "\n" + setDataTable[i]["Name"];
        }
    }
    return dataString;
} // Finds all sets at the requested grade and tier

function findProperty(propertyRequested, effectRequested) {
    var dataString = "";
    for (var i = 0, heronum = heroDataTable.length; i < heronum; i++) {
        if ((heroDataTable[i][propertyRequested] != undefined) && (heroDataTable[i][propertyRequested].includes(effectRequested))) {
            dataString = dataString + "\n" + heroDataTable[i]["Name"];
        }
    }
    return dataString;
} // Finds all heroes who have the requested property

// End of database functions

//--------------------------------------------------------------------------------------------

function getPoints(ID) {
    return sql.get(`SELECT * FROM scores WHERE userID ='${ID}'`)
        .then(row => {
            if (!row)
                return 0;
            else
                return row.points;
        });
} // Finds the user's score

function trivia(message) {
    triviaChannels.add(message.channel.id);
    do {
        var question = getRandomInt(1, triviaTable.length - 1);
    } while (question === triviaLastQuestion);
    triviaLastQuestion = question;
    var askedQuestion = triviaTable[question]["Question"];
    var correctAnswer = triviaTable[question]["Answer"];

    wait(1500)
        .then(() => message.channel.sendMessage(askedQuestion))
        .then(() => {
            message.channel.awaitMessages(response => response.content.toLowerCase() === correctAnswer.toLowerCase(), {
                max: 1,
                time: 15000,
                errors: ['time'],
            })
                .then((correctMessage) => {
                    var correctUserID = correctMessage.first().author.id;
                    sql.get(`SELECT * FROM scores WHERE userID ='${correctUserID}'`).then(row => {
                        if (!row) {
                            sql.run('INSERT INTO scores (userID, points) VALUES (?, ?)', [correctUserID, 10]);
                        } else {
                            sql.run(`UPDATE scores SET points = ${row.points + 10} WHERE userID = ${correctUserID}`);
                        }
                    }).catch(() => {
                        console.error;
                        sql.run('CREATE TABLE IF NOT EXISTS scores (userID TEXT, points INTEGER)').then(() => {
                            sql.run('INSERT INTO scores (userID, points) VALUES (?, ?)', [correctUserID, 10]);
                        });
                    });
                    getPoints(correctUserID).then(points => {
                        message.channel.sendMessage(`Correct answer "${correctAnswer}" by ${correctMessage.first().member.displayName}! +10 points (Total score: ${points + 10})`);
                    });
                    triviaChannels.delete(message.channel.id);
                })
                .catch(() => {
                    message.channel.sendMessage(`Time's up! The correct answer was "${correctAnswer}".`);
                    triviaChannels.delete(message.channel.id);
                });
        });
} // Main trivia function

// End of trivia functions

//--------------------------------------------------------------------------------------------

function generateTier(tier) {
    var setTier = "";
    for (var i = 0; i < tier; i++) {
        setTier = setTier + "★";
    }
    return setTier;
} // Makes the tiers for set equipment

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
} // Generates a random integer between the specified values

function PullOrNot() {
    var number = Math.random();
    var YesNo;
    if (number <= 0.5) return path.join(launchLocation, "src", "Images", "Pull.png");
    else return path.join(launchLocation, "src", "Images", "Don't Pull.png");
} // Does the 50/50 pull or not

function findEmojiFromGuildByName(guild, emoji_name) {
    const emoji = guild.emojis.find((emoji) => emoji.name === emoji_name);
    return emoji ? emoji.toString() : emoji_name;
} // Finds the emoji id in a guild using the emoji name

function capitalize(inputString) {
    var outputString = inputString.substr(0, 1).toUpperCase() + inputString.substr(1, inputString.length - 1).toLowerCase();
    return outputString;
} // Capitalizes the first letter in a string

function wait(time) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, time);
    });
} // Waits for a set amount of time

function prune(message, value) {
    value = Math.min(value, 100);
    message.channel.fetchMessages({ limit: 100 }).then(messages => {
        const filteredMessages = messages.filter(message => message.author.id === bot.user.id);
        var filteredArray = filteredMessages.array();

        message.channel.bulkDelete(filteredArray.slice(0, value));
    }).catch(err => console.error(err));
} // Prunes messages from bot

function status() {
    var statusCycle = ["https://github.com/TheMasterDodo/ACertainMagicalBot", "Use !help for info", "Spamming !whale", `Serving ${bot.guilds.size} servers`, `Serving ${bot.channels.size} channels`, `Serving ${bot.users.size} users`];
    var random = getRandomInt(0, statusCycle.length - 1);
    bot.user.setGame(statusCycle[random]);
    logger.log(2, `Set status to ${statusCycle[random]}`);
    setTimeout(status, 300000); // Cycles every 5 minutes
} // Sets the status message of the bot

// End of other functions

//--------------------------------------------------------------------------------------------

bot.on("message", message => {
    if (message.mentions.users.has(bot.user.id)) {
        console.log(`Message Received!\n\tSender: ${message.author.username} \n\tContent: ${message.content.slice(message.content.indexOf(" "))}`);
    } // Logs messages that mention the bot

    if (!message.content.startsWith(config.prefix)) return;
    // Ignore messages that don't start with the prefix
    
    if (message.author.bot) return;
    // Checks if sender is a bot

    const args = message.content.slice(1).split(" ");
    const msgContent = message.content.slice(message.content.indexOf(" ") + 1);

    logger.logFrom(message.channel, 1, `[command: ${args[0]}]`);

    if (message.content.startsWith(config.prefix + "ping")) {
        message.channel.sendMessage("pong! [Response time: " + bot.ping + "ms]");
    } // Bot testing


    else if (message.content.startsWith(config.prefix + "help")) {
        message.channel.sendMessage(help.join("\n\n"), { split: true });
    } // Help command


    else if (message.content.startsWith(config.prefix + "hug")) {
        message.channel.sendMessage("*hug*");
    } // Gives a nice warm hug


    else if (message.content.startsWith(config.prefix + "nameset") && (message.author.id === config.ownerID)) {
        if (args.length === 1) {
            message.guild.member(bot.user).setNickname("A Certain Magical Bot");
        } else {
            message.guild.member(bot.user).setNickname(message.content.slice(message.content.indexOf(" ")));
        }
        message.channel.sendMessage("My name has been set!");
    } // Sets the bot's name (Only owner can do it)


    else if ((message.content.startsWith(config.prefix + "invite")) && (message.author.id === config.ownerID)) {
        message.mentions.users.first().sendMessage("https://discordapp.com/oauth2/authorize?permissions=2012740672&scope=bot&client_id=269000767908610059");
    } // Sends the invite link (Only owner can do it)


    else if (message.content.startsWith(config.prefix + "calc")) {
        var input = message.content.replace(/[^-()\d/*+.]/g, '');
        if (input != "") {
            var result = eval(input);
            message.channel.sendMessage(result);
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Calculator function


    else if ((message.content.startsWith(config.prefix + "prune")) && (message.author.id === config.ownerID)) {
        if (args.length >= 2) {
            prune(message, args[2] - 1);
        } else if (args.length === 1) {
            prune(message, 1 - 1);
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Prunes messages from bot (Prunes 1 more than the command)


    else if (message.content.startsWith(config.prefix + "id")) {
        if (args.length === 1) {
            message.reply(`${message.author.id}`);
        } else {
            message.channel.sendMessage(message.mentions.users.first().id);
        }
    } // Looks up an user's Discord ID


    else if (message.content.startsWith(config.prefix + "choose")) {
        if (args.length >= 2) {
            var msg = message.content.slice(message.content.indexOf(" ") + 1);
            var choices = msg.split("|");
            message.channel.sendMessage(choices[getRandomInt(0, choices.length)]);
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Bot makes a choice


    else if (message.content.startsWith(config.prefix + "github")) {
        message.channel.sendMessage("https://github.com/TheMasterDodo/ACertainMagicalBot");
    } // Sends the GitHub repository link


    else if (message.content.startsWith(config.prefix + "tadaima") && (message.content.includes("maid"))) {
        message.channel.sendMessage("おかえりなさいませ！ご主人様♥, \nDo you want dinner or a shower or \*blushes\* me?");
    } else if (message.content.startsWith(config.prefix + "tadaima")) {
        message.channel.sendMessage("Okaeri dear, \nDo you want dinner or a shower or \*blushes\* me?");
    } // Tadaima ("I'm home")



    else if (message.content.startsWith(config.prefix + "tuturu")) {
        message.channel.sendFile(path.join(launchLocation, "src", "Images", "Tuturu.png"));
    } else if (message.content.startsWith(config.prefix + "moa")) {
        message.channel.sendFile(path.join(launchLocation, "src", "Images", "Moa.png"));
    } else if (message.content.startsWith(config.prefix + "tyrant")) {
        message.channel.sendFile(path.join(launchLocation, "src", "Images", "Tyrant.png"));
    } else if (message.content.startsWith(config.prefix + "moe")) {
        message.channel.sendFile(moe[getRandomInt(0, moe.length)]);
    } else if (message.content.startsWith(config.prefix + "doodoo")) {
        for (var i = 0; i < moe.length; i++) {
            message.channel.sendFile(moe[i]);
        }
    } // Custom/Anime commands



    else if (message.content.startsWith(config.prefix + "pull")) {
        message.channel.sendFile(PullOrNot());
    } // Bot does a 50/50 pull or no

    else if (message.content.startsWith(config.prefix + "whale")) {
        var pulls = "";
        var totalPull = "";
        if ((args[1] > 100) || ((args[1] > 10) && (message.guild.id === "164867600457662464"))) {
            message.channel.sendMessage("```OVERFLOW_ERROR```");
            return;
        }
        if (args.length > 1) {
            for (var i = 0; i < args[1]; i++) {
                pulls = coocooPull10().map((emoji_name) => findEmojiFromGuildByName(message.guild, emoji_name));
                totalPull = pulls.join(" ") + "\n" + totalPull;
            }
            message.channel.sendMessage(totalPull, { split: true });
        } else {
            pulls = coocooPull10().map((emoji_name) => findEmojiFromGuildByName(message.guild, emoji_name));
            message.channel.sendMessage(pulls.join(" "));
        }
    } // 10x pull

    else if (message.content.startsWith(config.prefix + "sets")) {
        if (args.length >= 3) {
            var setInfo = findSets(generateTier(args[1]), args[2].toUpperCase());
            message.channel.sendMessage(setInfo);
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Searches for sets at the requested grade and tier

    else if (message.content.startsWith(config.prefix + "set")) {
        if (args.length >= 2) {
            var setInfo = findListedPropertyData(msgContent, "set");
            if (setInfo != "nosuchdata") {
                message.channel.sendMessage(setInfo);
            } else {
                message.channel.sendMessage("Unknown Set!");
            }
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Searches for set info

    else if (message.content.startsWith(config.prefix + "stats")) {
        if (args.length >= 2) {
            var heroStats = findListedPropertyData(args[1], "hero");
            if (heroStats != "nosuchdata") {
                message.channel.sendMessage(heroStats);
            } else {
                message.channel.sendMessage("Unknown Hero!");
            }
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Searches for hero stats

    else if (message.content.startsWith(config.prefix + "stat")) {
        if (args.length >= 3) {
            var heroRequested = findNameByAlias(args[1], "hero");
            var statRequested = args[2].toLowerCase();
            var statData = findSingleData(args[1], statRequested, "stat");
            if (statData != "nosuchdata") {
                message.channel.sendMessage(heroRequested + "'s " + capitalize(statRequested) + ": " + statData);
            } else {
                message.channel.sendMessage("Unknown Hero!");
            }
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Searches for the requested stat of the requested hero

    else if (message.content.startsWith(config.prefix + "effect")) {
        if (args.length >= 2) {
            var effect = msgContent;
            if (effect === "list") {
                var flags = "";
                for (var i = 0; i < flagNames.length; i++) {
                    flags = flags + "\n" + capitalize(flagNames[i]);
                }
                message.channel.sendMessage(flags);
            } else if (flagNames.includes(effect)) {
                var effectHeroes = findProperty(effect, "TRUE");
                message.channel.sendMessage(effectHeroes);
            } else {
                message.channel.sendMessage("Unknown effect");
            }
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Searches for which heroes can cause the requested effect

    else if (message.content.startsWith(config.prefix + "property")) {
        if (args.length >= 3) {
            var propertyHeroes = findProperty(args[1].toLowerCase(), capitalize(args[2]));
            message.channel.sendMessage(propertyHeroes);
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Searches for which heroes have the requested property

    else if (message.content.startsWith(config.prefix + "item")) {
        if (args.length >= 2) {
            var itemName = args[1].toLowerCase();
            var itemLevel = args[2];
            var itemStats = findSingleData(itemName, itemLevel, "item");
            message.channel.sendMessage(itemStats);
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Searches for the requested item's max stats

    else if (message.content.startsWith(config.prefix + "skill")) {
        if (args.length >= 3) {
            var skillData = findSingleData(args[1], args[2], "skill");
            message.channel.sendMessage(skillData);
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Searches for the requested hero skill

    else if (message.content.startsWith(config.prefix + "rainbow")) {
        if (args.length >= 2) {
            var WeekRequested = args[1];
        } else {
            WeekRequested = 0;
        }
        const currentSets = SetsOfTheWeek(WeekRequested);
        message.channel.sendMessage(currentSets);
    } // Searches for current set rotation

    else if (message.content.startsWith(config.prefix + "triviaquestions")) {
        message.channel.sendMessage(`There are currently ${triviaTable.length - 1} trivia questions available`);
    } // Finds number of trivia questions

    else if ((message.content.startsWith(config.prefix + "trivia")) && (!triviaChannels.has(message.channel.id))) {
        if (message.channel.type === "dm") {
            message.channel.sendMessage("Please use this command in a server!");
            return;
        }
        message.channel.sendMessage(`+++ ${message.member.displayName} started a new round of FWT Trivia. Get ready! +++`);
        trivia(message);
    } // Starts a round of FWT trivia

    else if (message.content.startsWith(config.prefix + "score")) {
        if (args.length === 1) {
            getPoints(message.author.id).then(points => {
                if (points != 0) {
                    message.channel.sendMessage(`Score for ${message.member.displayName}: ${points} points`);
                } else {
                    message.channel.sendMessage("You have 0 points! Play trivia using !trivia to earn points");
                }
            });
        } else {
            getPoints(message.mentions.users.first().id).then(points => {
                if (points != 0) {
                    message.channel.sendMessage(`Score for ${message.mentions.users.first().username}: ${points} points`);
                } else {
                    message.channel.sendMessage(`${message.mentions.users.first().username} has 0 points! Play trivia using !trivia to earn points`);
                }
            });
        }
    } // Looks up how many points an user has

    else if (message.content.startsWith(config.prefix + "soulgear")) {
        if (args.length >= 2) {
            var sgData = findListedPropertyData(args[1], "soulgear");
            if (sgData != "nosuchdata") {
                message.channel.sendMessage(sgData);
            } else {
                message.channel.sendMessage("Unknown Soul Gear!");
            }
        } else {
            message.channel.sendMessage("Invalid request!");
        }
    } // Looks up a hero's soul gear

});

// End of all commands
//--------------------------------------------------------------------------------------------

bot.on('error', (e) => console.error(e));
bot.on('warn', (e) => console.warn(e));
process.on("unhandledRejection", err => {
    logger.log(3, "An error occured!");
    console.error(err);
});
// Captures errors

bot.on("ready", () => {
    logger.log(1, `Ready to server in ${bot.channels.size} channels on ${bot.guilds.size} servers, for a total of ${bot.users.size} users.`);
});

bot.login(config.token).then(() => status());