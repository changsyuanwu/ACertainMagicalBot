const path = require("path");
const launchLocation = __dirname;
const moe = require(path.join(launchLocation.slice(0, 37), "src", "Moe.json"));


var sorted_arr = moe.slice().sort(); 
var results = [];
for (var i = 0; i < moe.length - 1; i++) {
    if (sorted_arr[i + 1] == sorted_arr[i]) {
        results.push(sorted_arr[i]);
    }
}

console.log(results);