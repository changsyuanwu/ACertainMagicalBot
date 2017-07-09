const path = require("path");
const launchLocation = __dirname;
const moe = require(path.join(launchLocation.slice(0, 37), "src", "Moe.json"));

for (let i = 0; i < moe.length; i++) {
    for (let j = 0; j < moe.length; j++) {
        if ((j !== i) && (moe[i] == moe[j])) {
            console.log(moe[j]);
        }
    }
}