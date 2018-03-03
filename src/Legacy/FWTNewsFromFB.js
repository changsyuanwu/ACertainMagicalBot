const FB = require("fb");

function news(newsLimit, message) {
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
                    if (message.channel.type === "dm") {
                        var color = "#4F545C";
                    } else {
                        var color = message.guild.me.displayColor;
                    }
                    const embed = new Discord.RichEmbed()
                        .setDescription(getNewsDescription(postData))
                        .setTitle(getNewsTitle(postData))
                        .setAuthor(postData.from.name, null, "https://www.facebook.com/" + facebookEntityName)
                        .setColor(color)
                        .setURL(postData.permalink_url);
                    if (postData.attachments !== undefined) {
                        var attachments = postData.attachments.data[0];
                        if (attachments.type !== "album") {
                            embed.setImage(attachments.media.image.src);
                        }
                    }
                    return {
                        embed
                    };
                }).filter(data => data !== null));
            }
        });
    });
} // Gets the lastest posts from FWT Facebook


function setupFacebookAccessToken() {
    return new Promise((resolve, reject) => {
        FB.napi("oauth/access_token", {
            client_id: config.fbClientID,
            client_secret: config.fbClientSecret,
            grant_type: "client_credentials"
        }, (error, res) => {
            if (error) {
                reject(error);
            }
            else {
                FB.setAccessToken(res.access_token);
                resolve();
            }
        });
    });
} // Gets a Facebook access token 


function getNewsTitle(data) {
    let title = data.message.substring(0, data.message.indexOf("\n"));
    if (data.attachments !== undefined) {
        var attachments = data.attachments.data[0];
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
    }
    return title;
} // Gets the title of a Facebook post


function getNewsDescription(data) {
    let description = data.message.substring(data.message.indexOf("\n"));
    if (data.attachments !== undefined) {
        var attachments = data.attachments.data[0];
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
    }
    if (description.length > 2048) {
        description = description.substring(0, 2048);
    }
    return description;
} // Gets text content from Facebook post


if (message.content.startsWith(config.prefix + "news")) {
    if (args.length === 2) {
        limit = Math.min(Number.parseInt(args[1], 10), 10);
    } else {
        limit = 1;
    }
    news(limit, message)
        .then((news) => {
            for (let i = 0; i < limit; i++) {
                message.channel.send({ embed: news[i]["embed"] });
            }
        });
} // Gets the latest FWT news from Facebook


Promise.all([
    setupFacebookAccessToken()
])
    .then(() => {
        bot.login(config.token)
            .then(() => {
                status();
            });
    });