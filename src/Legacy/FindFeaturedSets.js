function findFeaturedSets(dateRequested) {

    for (let i = 0; i < featuredSetTable.length; i++) {
        let start = moment(featuredSetTable[i]["Start"], "MM-DD-YYYY");
        let end = moment(featuredSetTable[i]["End"], "MM-DD-YYYY");

        if (moment(dateRequested, "MM-DD-YYYY").isBetween(start, end, "day", "(]")) {
            var featuredSets = featuredSetTable[i];
        }
    }

    if (featuredSets === undefined) {
        return "Date not found";
    }
    else {
        return createListOutput(featuredSets);
    }

} // Finds the set rotation for the requested week


if (message.content.startsWith(config.prefix + "featuredsets")) {
    if (args.length >= 2) {
        var dateRequested = args[1];
    } else {
        dateRequested = moment().format("MM-DD-YYYY");
    }
    const currentSets = findFeaturedSets(dateRequested);
    message.channel.send(currentSets);
} // Searches for current set rotation