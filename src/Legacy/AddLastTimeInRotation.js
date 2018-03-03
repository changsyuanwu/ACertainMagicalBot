//--------------------------------------------------------------------------------------------
const featuredSetTable = require("./src/Data/FWTData/FWTFeaturedSets.json");

for (let i = 0; i < setDataTable.length; i++) {
    for (let j = 0; j < featuredSetTable.length; j++) {
        if ((featuredSetTable[j]["Set1"].toLowerCase() === setDataTable[i]["Name"].toLowerCase()) || (featuredSetTable[j]["Set2"].toLowerCase() === setDataTable[i]["Name"].toLowerCase())) {
            setDataTable[i]["Last Time in Rotation"] = `${featuredSetTable[j]["Start"]} ~ ${featuredSetTable[j]["End"]}`;
        }
    }
} // Adds the last time in rotation data to the set data


//--------------------------------------------------------------------------------------------