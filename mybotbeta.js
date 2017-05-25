// Modules
const Discord = require("discord.js");
const path = require("path");
const sql = require("sqlite");
const moment = require("moment");
const FB = require("fb");
const bot = new Discord.Client();

// Utils
const launchLocation = __dirname;
const config = require(path.join(launchLocation, "config.json"));
const help = require(path.join(launchLocation, "help.json"));
const Logger = require(path.join(launchLocation, "src", "Utilities", "Logger.js"));
const moe = require(path.join(launchLocation, "src", "Moe.json"));

// Datatables
const setDataTable = require(path.join(launchLocation, "src", "Data", "FWTSetData.json"));
const aliasListSets = require(path.join(launchLocation, "src", "Data", "FWTSetAliases.json"));
const aliasListHeroes = require(path.join(launchLocation, "src", "Data", "FWTHeroAliases.json"));
const heroDataTable = require(path.join(launchLocation, "src", "Data", "FWTHeroStats.json"));
const itemDataTable = require(path.join(launchLocation, "src", "Data", "FWTItemMaxStats.json"));
const triviaTable = require(path.join(launchLocation, "src", "Data", "FWTTrivia.json"));
const soulGearTable = require(path.join(launchLocation, "src", "Data", "FWTSoulGear.json"));
const featuredSetTable = require(path.join(launchLocation, "src", "Data", "FWTFeaturedSets.json"));
const heroSkillTable = require(path.join(launchLocation, "src", "Data", "FWTHeroSkills.json"))

// Effects
const flagNames = ["confusion", "charm", "stun", "taunt", "disarm", "immobilize", "decrease movement", "dot", "mp burn", "skill cost", "defense ignore", "defense ignoring damage", "weakening", "buff removal", "hp% damage", "defense decrease", "attack decrease", "hp drain", "mastery decrease", "instant death", "decrease crit rate", "push/pull/switch", "passive attack", "seal", "sleep", "melee", "ranged", "overload", "terrain change", "dodge decrease", "decrease healing"];

sql.open(path.join(launchLocation, "src", "botdata.sqlite"));

// Trivia
var triviaChannels = new Set([]);
var triviaLastQuestion = 0;

// Logger
const logger = new Logger(config.noLogs);

//--------------------------------------------------------------------------------------------

for (var i = 0; i < setDataTable.length; i++) {
    for (var j = 0; j < featuredSetTable.length; j++) {
        if ((featuredSetTable[j]["Set1"].toLowerCase() === setDataTable[i]["Name"].toLowerCase()) || (featuredSetTable[j]["Set2"].toLowerCase() === setDataTable[i]["Name"].toLowerCase())) {
            setDataTable[i]["Last Time in Rotation"] = `${featuredSetTable[j]["Start"]} ~ ${featuredSetTable[j]["End"]}`;
        }
    }
} // Adds the last time in rotation data to the set data

//--------------------------------------------------------------------------------------------

function coocooPull(isLast) {
    var number = Math.random();
    if (isLast) {
        var junkrate = 0;
        var brate = 0;
        var arate = 0.7;
        var srate = 0.2;
    } else {
        var junkrate = 0.524;
        var brate = 0.2281;
        var arate = 0.1587;
        var srate = 0.0527;
    }
    if (number < junkrate) return "junk";
    else if (junkrate <= number && number < junkrate + brate) return "B_set";
    else if (junkrate + brate <= number && number < junkrate + brate + arate) return "A_set";
    else if (junkrate + brate + arate <= number && number < junkrate + brate + arate + srate) return "S_set";
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
            dataString += capitalize(property) + ": " + list[property] + "\n";
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

function findFeaturedSets(dateRequested) {
    for (var i = 0; i < featuredSetTable.length; i++) {
        var start = moment(featuredSetTable[i]["Start"], "MM-DD-YYYY");
        var end = moment(featuredSetTable[i]["End"], "MM-DD-YYYY");
        if (moment(dateRequested, "MM-DD-YYYY").isBetween(start, end, "day", "(]")) {
            var featuredSets = featuredSetTable[i];
        }
    }
    if (featuredSets === undefined) {
        return "Date not found";
    } else {
        return createListOutput(featuredSets);
    }
} // Finds the set rotation for the requested week

function findSingleData(alias, data, type) {
    if (type === "stat") {
        var dataTable = heroDataTable;
        var name = alias;
    }
    var dataString = "";
    for (var i = 0; i < dataTable.length; i++) {
        if (dataTable[i]["Name"] === name) {
            dataString = dataTable[i][data];
        }
    }
    return dataString;
} // Finds a single piece of data

function findSets(slot, rareness) {
    var dataString = "";
    for (var i = 0; i < setDataTable.length; i++) {
        if ((setDataTable[i]["Slot"] === slot) && (setDataTable[i]["Rareness"] === rareness)) {
            dataString += "\n" + setDataTable[i]["Name"];
        }
    }
    return dataString;
} // Finds all sets at the requested grade and tier

function findProperty(propertyRequested, effectRequested) {
    var dataString = "";
    for (var i = 0, heronum = heroDataTable.length; i < heronum; i++) {
        if ((heroDataTable[i][propertyRequested] != undefined) && (heroDataTable[i][propertyRequested].includes(effectRequested))) {
            dataString += "\n" + heroDataTable[i]["Name"];
        }
    }
    return dataString;
} // Finds all heroes who have the requested property

function findSkillData(heroAlias, skill) {
    var heroName = findNameByAlias(heroAlias, "hero");
    var datastring = "";
    for (var i = 0; i < heroSkillTable.length; i++) {
        if (heroName === heroSkillTable[i]["Name"]) {
            if ((skill == "4") || (skill == "5")) {
                datastring += heroSkillTable[i][skill] + "\n" + "**Total Gene Cost**: " + heroSkillTable[i][`${skill}GeneCost`];
            } else {
                datastring += heroSkillTable[i][skill] + "\n" + "**MP Cost**: " + heroSkillTable[i][`${skill}MPcost`] + "\n" + "**Total Gene Cost**: " + heroSkillTable[i][`${skill}GeneCost`];
            }
        }
    }
    return datastring
} // Finds the description, MP cost, and Gene cost for a hero's skill

function findSkillImage(heroAlias, skill) {
    var heroName = findNameByAlias(heroAlias, "hero");
    return path.join(launchLocation, "src", "Images", "Hero Skills", `${heroName} ${skill}.jpg`);
} // Finds a hero skill's image

function findItem(item, slot, rareness) {
    switch (Number(rareness)) {
        case 1:
            var transcendence = 1;
            break;
        case 2:
            var transcendence = 1.24;
            break;
        case 3:
            var transcendence = 1.60;
            break;
        case 4:
            var transcendence = 1.60;
            break;
        case 5:
            var transcendence = 1.75;
            break;
        case 6:
            var transcendence = 2.00;
            break;
    } // Gets the max transcendence multiplier

    switch (item) {
        case "bow":
            var type = "Weapon";
            var stat1 = "Attack";
            var stat2 = "Crit";
            break;
        case "mace":
            var type = "Weapon";
            var stat1 = "Attack";
            var stat2 = "Counter Damage";
            break;
        case "sword":
            var type = "Weapon";
            var stat1 = "Attack";
            var stat2 = "Hit";
            break;
        case "armor":
            var type = "Armor";
            var stat1 = "HP";
            var stat2 = "Defense";
            break;
        case "shield":
            var type = "Armor";
            var stat1 = "HP";
            var stat2 = "Counter Rate";
            break;
        case "boots":
            var type = "Armor";
            var stat1 = "HP";
            var stat2 = "Dodge";
            break;
        case "ring":
            var type = "Accessory";
            var stat1 = "Hit";
            var stat2 = "Crit";
            break;
        case "brooch":
            var type = "Accessory";
            var stat1 = "HP";
            var stat2 = "Defense";
            break;
        case "necklace":
            var type = "Accessory";
            var stat1 = "Mastery";
            var stat2 = "Attack";
            break;
    } // Gets type of item and stat types

    for (var i = 0; i < itemDataTable.length; i++) {
        if (itemDataTable[i]["Type"] === type) {
            var valueOfStat1 = itemDataTable[i][capitalize(item)][slot][stat1] * transcendence;
            var valueOfStat2 = itemDataTable[i][capitalize(item)][slot][stat2] * transcendence;
            var dataString = `${stat1}: ${valueOfStat1.toString()}, ${stat2}: ${valueOfStat2.toString()}`;
            return dataString;
        }
    }
} // Finds item max stats

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

function trivia(message, isCritQuestion) {
    triviaChannels.add(message.channel.id);
    do {
        var question = getRandomInt(1, triviaTable.length - 1);
    } while (question === triviaLastQuestion);
    triviaLastQuestion = question;
    var askedQuestion = triviaTable[question]["Question"];
    var correctAnswer = triviaTable[question]["Answer"];

    if (isCritQuestion) {
        var rewardPoints = 60;
    } else {
        rewardPoints = 15;
    }

    wait(1500)
        .then(() => message.channel.send(askedQuestion))
        .then(() => {
            message.channel.awaitMessages(response => response.content.toLowerCase() === correctAnswer.toLowerCase(), {
                max: 1,
                time: 15000,
                errors: ["time"],
            })
                .then((correctMessage) => {
                    var correctUserID = correctMessage.first().author.id;
                    sql.get(`SELECT * FROM scores WHERE userID ="${correctUserID}"`)
                        .then(row => {
                            if (!row) {
                                sql.run("INSERT INTO scores (userID, points) VALUES (?, ?)", [correctUserID, rewardPoints]);
                            } else {
                                sql.run(`UPDATE scores SET points = ${row.points + rewardPoints} WHERE userID = ${correctUserID}`);
                            }
                        })
                        .catch(() => {
                            sql.run("CREATE TABLE IF NOT EXISTS scores (userID TEXT, points INTEGER)").then(() => {
                                sql.run("INSERT INTO scores (userID, points) VALUES (?, ?)", [correctUserID, rewardPoints]);
                            });
                        });
                    getPoints(correctUserID)
                        .then(points => {
                            message.channel.send(`Correct answer "${correctAnswer}" by ${correctMessage.first().member.displayName}! +${rewardPoints} points (Total score: ${points + rewardPoints}) || Highscores: !highscores`);
                        });
                    triviaChannels.delete(message.channel.id);
                })
                .catch(() => {
                    message.channel.send(`Time's up! The correct answer was "${correctAnswer}".`);
                    triviaChannels.delete(message.channel.id);
                });
        });
} // Main trivia function

// End of trivia functions

//--------------------------------------------------------------------------------------------

function generateRareness(rareness) {
    var setTier = "";
    for (var i = 0; i < rareness; i++) {
        setTier = setTier + "★";
    }
    return setTier;
} // Makes the tiers for set equipment

function PullOrNot() {
    var number = Math.random();
    if (number <= 0.5) return path.join(launchLocation, "src", "Images", "Pull.png");
    else return path.join(launchLocation, "src", "Images", "Don't Pull.png");
} // Does the 50/50 pull or not

function news(newsLimit) {
    const facebookEntityName = "Fwar";
    return new Promise((resolve, reject) => {
        FB.napi(facebookEntityName + "/posts", {
            fields: ["from", "permalink_url", "message", "attachments{type,title,description,media,subattachments}"], newsLimit
        }, (error, response) => {
            if (error) {
                if (error.response.error.code === "ETIMEDOUT") {
                    console.log("request timeout");
                } else {
                    console.log("error", error.message);
                }
                reject(error);
            } else {
                resolve(response.data.map(postData => {
                    const attachments = postData.attachments.data[0];
                    const embed = new Discord.RichEmbed()
                        .setDescription(getNewsDescription(postData))
                        .setTitle(getNewsTitle(postData))
                        .setAuthor(postData.from.name, null, "https://www.facebook.com/" + facebookEntityName)
                        .setURL(postData.permalink_url);
                    if (attachments.type !== "album") {
                        embed.setImage(attachments.media.image.src);
                    }
                    return {
                        embed
                    }
                }).filter(data => data !== null));
            }
        });
    });
} // Gets the lastest posts from FWT Facebook

// End of other FWT functions

//--------------------------------------------------------------------------------------------

function findEmojiFromGuildByName(guild, emoji_name) {
    const emoji = guild.emojis.find((emoji) => emoji.name === emoji_name);
    return emoji ? emoji.toString() : emoji_name;
} // Finds the emoji id in a guild using the emoji name

function capitalize(inputString) {
    var outputString = inputString.substr(0, 1).toUpperCase() + inputString.substr(1, inputString.length - 1).toLowerCase();
    return outputString;
} // Capitalizes the first letter in a string

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
} // Generates a random integer between the specified values

function wait(time) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, time);
    });
} // Waits for a set amount of time

function prune(message, value) {
    value = Math.min(value, 100);
    message.channel.fetchMessages({ limit: 100 })
        .then(messages => {
            const filteredMessages = messages.filter(message => message.author.id === bot.user.id);
            var filteredArray = filteredMessages.array();

            message.channel.bulkDelete(filteredArray.slice(0, value));
        }).catch(err => console.error(err));
} // Prunes messages from bot

function status() {
    var statusCycle = ["https://github.com/TheMasterDodo/ACertainMagicalBot", "Use !help for info", "Spamming !whale", `Serving ${bot.guilds.size} servers`, `Serving ${bot.channels.size} channels`];
    var random = getRandomInt(0, statusCycle.length);
    bot.user.setGame(statusCycle[random]);
    logger.log(2, `Set status to ${statusCycle[random]}`);
    setTimeout(status, 600000); // Cycles every 10 minutes
} // Sets the status message of the bot

function incrementUses() {
    sql.get(`SELECT * FROM utilities WHERE type = "Uses"`)
        .then(row => {
            if (!row) {
                sql.run("INSERT INTO utilities (type, value) VALUES (?, ?)", ["Uses", 0]);
            } else {
                sql.run(`UPDATE utilities SET value = ${row.value + 1} WHERE type = "Uses"`);
            }
        })
        .catch(() => {
            sql.run("CREATE TABLE IF NOT EXISTS utilities (type TEXT, value INTEGER)").then(() => {
                sql.run("INSERT INTO utilities (type, values) VALUES (?, ?)", ["Uses", 0]);
            });
        });
} // Increments the number of uses of the bot by 1

function getUses() {
    return sql.get(`SELECT * FROM utilities WHERE type = "Uses"`)
        .then(row => {
            if (!row)
                return 0;
            else
                return row.value;
        });
} // Gets the number of uses of the bot

function setupFacebookAccessToken() {
    return new Promise((resolve, reject) => {
        FB.napi("oauth/access_token", {
            client_id: config.fbClientID,
            client_secret: config.fbClientSecret,
            grant_type: "client_credentials"
        }, (error, res) => {
            if (error) {
                reject(error);
            } else {
                FB.setAccessToken(res.access_token);
                resolve();
            }
        });
    });
} // Gets a Facebook access token 

function getNewsTitle(data) {
    const attachments = data.attachments.data[0];
    let title;
    switch (attachments.type) {
        case "note":
            title = data.message;
            break;
        case "album":
            title = data.message.substring(0, data.message.indexOf("\n"));
            break;
        case "video_inline":
            title = `${attachments.title}: ${data.message.substring(0, data.message.indexOf("\n"))}`;
            break;
        case "cover_photo":
            title = attachments.title;
            break;
        default:
            title = data.message.substring(0, data.message.indexOf("\n"));
            break;
    }
    return title;
} // Gets the title of a Facebook post

function getNewsDescription(data) {
    const attachments = data.attachments.data[0];
    let description;
    switch (attachments.type) {
        case "note":
            description = attachments.description;
            break;
        case "cover_photo":
            description = " ";
            break;
        case "album":
        case "video_inline":
        default:
            description = data.message.substring(data.message.indexOf("\n"));
    }
    if (description.length > 2048) {
        description = description.substring(0, 2048);
    }
    return description;
} // Gets text content from Facebook post

function clean(text) {
    if (typeof (text) === 'string')
        return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
    else
        return text;
} // Prevents the use of mentions in text

// End of utility functions

//--------------------------------------------------------------------------------------------

bot.on("message", async (message) => {
    if (message.mentions.users.has(bot.user.id)) {
        console.log(`Message Received!\n\tSender: ${message.author.username} \n\tContent: ${message.content.slice(message.content.indexOf(" "))}`);
    } // Logs messages that mention the bot

    if (message.author.id === bot.user.id) {
        incrementUses();
    } // Increments whenever the bot sends a message (bot is "used")

    if (message.content.includes("gimme")) {
        message.channel.send({ files: [path.join(launchLocation, "src", "Images", "Gimme.gif")] })
    } // Sends Shu-shu gimme gif when message contains "gimme"

    if (!message.content.startsWith(config.prefix)) return;
    // Ignore messages that don't start with the prefix

    if (message.author.bot) return;
    // Checks if sender is a bot

    const args = message.content.slice(1).split(" ");
    const msgContent = message.content.slice(message.content.indexOf(" ") + 1);

    logger.logFrom(message.channel, 1, `[command: ${args[0]}]`);

    if (message.content.startsWith(config.prefix + "ping")) {
        message.channel.send("pong! [Response time: " + bot.ping + "ms]");
    } // Bot testing


    else if (message.content.startsWith(config.prefix + "help")) {
        message.channel.send(help.join("\n\n"), { split: true });
    } // Help command


    else if (message.content.startsWith(config.prefix + "hug")) {
        message.channel.send("*hug*");
    } // Gives a nice warm hug


    else if (message.content.startsWith(config.prefix + "nameset") && (message.author.id === config.ownerID)) {
        if (args.length === 1) {
            message.guild.member(bot.user).setNickname("A Certain Magical Bot");
        } else {
            message.guild.member(bot.user).setNickname(message.content.slice(message.content.indexOf(" ")));
        }
        message.channel.send("My name has been set!");
    } // Sets the bot's name (Only owner can do it)


    else if ((message.content.startsWith(config.prefix + "invite")) && (message.author.id === config.ownerID)) {
        message.mentions.users.first().send(config.invite)
            .then(() => {
                message.channel.send(`Sent an invite to ${message.mentions.users.first()}`)
            });
    } // Sends the invite link (Only owner can do it)


    else if (message.content.startsWith(config.prefix + "calc")) {
        var input = message.content.replace(/[^-()\d/*+.]/g, "");
        if (input != "") {
            var result = eval(input);
            message.channel.send(result);
        } else {
            message.channel.send("Invalid request!");
        }
    } // Calculator function


    else if ((message.content.startsWith(config.prefix + "prune")) && (message.author.id === config.ownerID)) {
        if (args.length >= 2) {
            prune(message, args[2] - 1);
        } else if (args.length === 1) {
            prune(message, 1 - 1);
        } else {
            message.channel.send("Invalid request!");
        }
    } // Prunes messages from bot (Prunes 1 more than the command)


    else if (message.content.startsWith(config.prefix + "id")) {
        if (args.length === 1) {
            message.reply(`${message.author.id}`);
        } else {
            message.channel.send(message.mentions.users.first().id);
        }
    } // Looks up an user's Discord ID


    else if (message.content.startsWith(config.prefix + 'eval')) {
        if (message.author.id !== config.ownerID) return;
        try {
            const code = args.join(' ');
            let evaled = eval(code);

            if (typeof evaled !== 'string')
                evaled = require('util').inspect(evaled);

            message.channel.send(clean(evaled), { code: 'xl' });
        } catch (err) {
            message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
        }
    } // Eval() code


    else if (message.content.startsWith(config.prefix + "uses")) {
        getUses()
            .then(uses => {
                message.channel.send(`There have been ${uses} uses since 2017-04-24`);
            });
    } // Gets the number of uses


    else if (message.content.startsWith(config.prefix + "choose")) {
        if (args.length >= 2) {
            var msg = message.content.slice(message.content.indexOf(" ") + 1);
            var choices = msg.split("|");
            message.channel.send(choices[getRandomInt(0, choices.length)]);
        } else {
            message.channel.send("Invalid request!");
        }
    } // Bot makes a choice


    else if (message.content.startsWith(config.prefix + "github")) {
        message.channel.send("https://github.com/TheMasterDodo/ACertainMagicalBot");
    } // Sends the GitHub repository link


    else if (message.content.startsWith(config.prefix + "mee6")) {
        message.channel.send(`Go check out **${message.guild.name}**'s leaderboard: https://mee6.xyz/levels/${message.guild.id}`);
    } // Finds the link to the server's mee6 data

    
    else if (message.content.startsWith(config.prefix + "google")) {
        message.channel.send(`https://www.google.com/#q=${msgContent.replace(" ", "+")}`);
    }


    else if (message.content.startsWith(config.prefix + "tadaima") && (message.content.includes("maid"))) {
        message.channel.send("おかえりなさいませ！ご主人様♥, \nDo you want dinner or a shower or \*blushes\* me?");
    } else if (message.content.startsWith(config.prefix + "tadaima")) {
        message.channel.send("Okaeri dear, \nDo you want dinner or a shower or \*blushes\* me?");
    } // Tadaima ("I'm home")


    else if (message.content.startsWith(config.prefix + "tuturu")) {
        message.channel.send({ files: [path.join(launchLocation, "src", "Images", "Tuturu.png")] });
    } else if (message.content.startsWith(config.prefix + "moa")) {
        message.channel.send({ files: [path.join(launchLocation, "src", "Images", "Moa.png")] });
    } else if (message.content.startsWith(config.prefix + "tyrant")) {
        message.channel.send({ files: [path.join(launchLocation, "src", "Images", "Tyrant.png")] });
    } else if (message.content.startsWith(config.prefix + "moe")) {
        message.channel.send({ files: [moe[getRandomInt(0, moe.length)]] });
    } else if ((message.content.startsWith(config.prefix + "doodoo")) && (message.author.id === config.ownerID)) {
        for (var i = 0; i < moe.length; i++) {
            message.channel.send({ files: [moe[i]] });
        }
    } // Custom/Anime commands


    else if (message.content.startsWith(config.prefix + "pull")) {
        message.channel.send({ files: [PullOrNot()] });
    } // Bot does a 50/50 pull or no

    else if (message.content.startsWith(config.prefix + "whale")) {
        var pulls = "";
        var totalPull = "";
        if ((args[1] > 100) || ((args[1] > 10) && (message.guild.id === "164867600457662464"))) {
            message.channel.send("```OVERFLOW_ERROR```");
            return;
        }
        if (args.length > 1) {
            for (var i = 0; i < args[1]; i++) {
                pulls = coocooPull10().map((emoji_name) => findEmojiFromGuildByName(message.guild, emoji_name));
                totalPull = pulls.join(" ") + "\n" + totalPull;
            }
            message.channel.send(totalPull, { split: true });
        } else {
            pulls = coocooPull10().map((emoji_name) => findEmojiFromGuildByName(message.guild, emoji_name));
            message.channel.send(pulls.join(" "));
        }
    } // 10x pull

    else if (message.content.startsWith(config.prefix + "sets")) {
        if (args.length >= 3) {
            var setInfo = findSets(args[1].toUpperCase(), generateRareness(args[2]));
            message.channel.send(setInfo);
        } else {
            message.channel.send("Invalid request!");
        }
    } // Searches for sets at the requested slot and rareness

    else if (message.content.startsWith(config.prefix + "set")) {
        if (args.length >= 2) {
            var setInfo = findListedPropertyData(msgContent, "set");
            if (setInfo != "nosuchdata") {
                message.channel.send(setInfo);
            } else {
                message.channel.send("Unknown Set!");
            }
        } else {
            message.channel.send("Invalid request!");
        }
    } // Searches for set info

    else if ((message.content.startsWith(config.prefix + "stats")) || (message.content.startsWith(config.prefix + "hero"))) {
        if (args.length >= 2) {
            var heroStats = findListedPropertyData(args[1], "hero");
            if (heroStats != "nosuchdata") {
                message.channel.send(heroStats);
            } else {
                message.channel.send("Unknown Hero!");
            }
        } else {
            message.channel.send("Invalid request!");
        }
    } // Searches for hero stats

    else if (message.content.startsWith(config.prefix + "stat")) {
        if (args.length >= 3) {
            var heroRequested = findNameByAlias(args[1], "hero");
            var statRequested = args[2].toLowerCase();
            var statData = findSingleData(heroRequested, statRequested, "stat");
            if (statData != "nosuchdata") {
                message.channel.send(heroRequested + "'s " + capitalize(statRequested) + ": " + statData);
            } else {
                message.channel.send("Unknown Hero!");
            }
        } else {
            message.channel.send("Invalid request!");
        }
    } // Searches for the requested stat of the requested hero

    else if (message.content.startsWith(config.prefix + "compare")) {
        if (args.length >= 4) {
            var statRequested = args[1].toLowerCase();
            var dataString = "";
            for (var i = 0; i < args.length - 2; i++) {
                var heroRequested = findNameByAlias(args[2 + i], "hero");
                var statData = findSingleData(heroRequested, statRequested, "stat");
                if (statData != "nosuchdata") {
                    dataString += "\n" + heroRequested + "'s " + capitalize(statRequested) + ": " + statData;
                } else {
                    dataString += "\n" + "Unknown Hero!";
                }
            }

            message.channel.send(dataString);
        } else {
            message.channel.send("Invalid request!");
        }
    } // Searches for the requested stat of the requested heroes

    else if (message.content.startsWith(config.prefix + "effect")) {
        if (args.length >= 2) {
            var effect = msgContent.toLowerCase();
            if (effect === "list") {
                var flags = "";
                for (var i = 0; i < flagNames.length; i++) {
                    flags = flags + "\n" + capitalize(flagNames[i]);
                }
                message.channel.send(flags);
            } else if (flagNames.includes(effect)) {
                var effectHeroes = findProperty(effect, "TRUE");
                message.channel.send(effectHeroes);
            } else {
                message.channel.send("Unknown effect");
            }
        } else {
            message.channel.send("Invalid request!");
        }
    } // Searches for which heroes can cause the requested effect

    else if (message.content.startsWith(config.prefix + "property")) {
        if (args.length >= 3) {
            var propertyHeroes = findProperty(args[1].toLowerCase(), capitalize(args[2]));
            message.channel.send(propertyHeroes);
        } else {
            message.channel.send("Invalid request!");
        }
    } // Searches for which heroes have the requested property

    else if (message.content.startsWith(config.prefix + "item")) {
        if (args.length >= 4) {
            var slot = args[2].toUpperCase();
            if (((slot === "I") || (slot === "II") || (slot === "III") || (slot === "IV") || (slot === "V")) && (args[3] >= 1) && (args[3] <= 6)) {
                var itemStats = findItem(args[1].toLowerCase(), slot, args[3]);
                message.channel.send(itemStats);
                return;
            }
        }
        message.channel.send("Invalid request!");
    } // Searches for the requested item's max stats

    else if (message.content.startsWith(config.prefix + "skills")) {
        if (args.length >= 2) {
            for (var i = 1; i <= 5; i++) {
                await message.channel.send(findSkillData(args[1], i), { files: [findSkillImage(args[1], i)] });
            }
        } else {
            message.channel.send("Invalid request!");
        }
    } // Searches for the skill infos of the requested hero

    else if (message.content.startsWith(config.prefix + "skill")) {
        if (args.length >= 3) {
            message.channel.send(findSkillData(args[1], args[2]), { files: [findSkillImage(args[1], args[2])] });
        } else {
            message.channel.send("Invalid request!");
        }
    } // Searches for the info for the requested hero skill

    else if (message.content.startsWith(config.prefix + "featuredsets")) {
        if (args.length >= 2) {
            var dateRequested = args[1];
        } else {
            dateRequested = moment().format("MM-DD-YYYY");
        }
        const currentSets = findFeaturedSets(dateRequested);
        message.channel.send(currentSets);
    } // Searches for current set rotation

    else if (message.content.startsWith(config.prefix + "triviaquestions")) {
        message.channel.send(`There are currently ${triviaTable.length - 1} trivia questions available`);
    } // Finds number of trivia questions

    else if ((message.content.startsWith(config.prefix + "trivia")) && (!triviaChannels.has(message.channel.id))) {
        if (message.channel.type === "dm") {
            message.channel.send("Please use this command in a server!");
            return;
        }
        if (getRandomInt(0, 100) < 5) {
            message.channel.send(`+++ ${message.member.displayName} started a new round of FWTR Trivia. Get ready! +++ CRITICAL QUESTION: 60 POINTS +++`);
            trivia(message, true);
        } else {
            message.channel.send(`+++ ${message.member.displayName} started a new round of FWTR Trivia. Get ready! +++`);
            trivia(message, false);
        }
    } // Starts a round of FWT trivia

    else if (message.content.startsWith(config.prefix + "score")) {
        if (args.length === 1) {
            getPoints(message.author.id)
                .then(points => {
                    if (points != 0) {
                        message.channel.send(`Score for ${message.member.displayName}: ${points} points`);
                    } else {
                        message.channel.send("You have 0 points! Play trivia using !trivia to earn points");
                    }
                });
        } else {
            getPoints(message.mentions.users.first().id)
                .then(points => {
                    if (points != 0) {
                        message.channel.send(`Score for ${message.mentions.users.first().username}: ${points} points`);
                    } else {
                        message.channel.send(`${message.mentions.users.first().username} has 0 points! Play trivia using !trivia to earn points`);
                    }
                });
        }
    } // Looks up how many points an user has

    else if (message.content.startsWith(config.prefix + "highscores")) {
        var msg = "__**Fantasy War Tactics R Trivia TOP 10**__";
        sql.all(`SELECT userID, points FROM scores ORDER BY points DESC LIMIT 10`)
            .then((rows) => {
                for (var i = 0; i < 10; i++) {
                    msg += `\n#${i + 1} ${bot.users.get(rows[i].userID).username} (${rows[i].points})`;
                }
                message.channel.send(msg);
            });
    } // Finds top 10 highscores for FWT Trivia

    else if (message.content.startsWith(config.prefix + "sg")) {
        if (args.length >= 2) {
            var sgData = findListedPropertyData(args[1], "soulgear");
            if (sgData != "nosuchdata") {
                message.channel.send(sgData);
            } else {
                message.channel.send("Unknown Soul Gear!");
            }
        } else {
            message.channel.send("Invalid request!");
        }
    } // Looks up a hero's soul gear

    else if (message.content.startsWith(config.prefix + "news")) {
        var limit;
        if (args.length === 2) {
            limit = Math.min(Number.parseInt(args[1], 10), 10);
        } else {
            limit = 1;
        }
        news(limit)
            .then((news) => {
                for (var i = 0; i < limit; i++) {
                    message.channel.send({ embed: news[i]["embed"] });
                }
            });
    } // Gets the latest FWT news from Facebook

});

// End of all commands
//--------------------------------------------------------------------------------------------

bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
process.on("unhandledRejection", err => {
    logger.log(3, "An error occured!");
    console.error(err);
});
// Captures errors

bot.on("ready", () => {
    logger.log(1, `Ready to server in ${bot.channels.size} channels on ${bot.guilds.size} servers, for a total of ${bot.users.size} users.`);
});

Promise.all([
    setupFacebookAccessToken()
])
    .then(() => {
        bot.login(config.token)
            .then(() => {
                status();
            });
    });