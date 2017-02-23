const fs = require('fs');
const csv = require('csv');
const JSONStream = require('JSONStream');

const inputFile = '.csv input file';
const outputFile = '.json output file';

const input = fs.createReadStream(inputFile);
const output = fs.createWriteStream(outputFile);

input.pipe(csv.parse({
  delimiter: ',',
  columns: true
})).pipe(JSONStream.stringify()).pipe(output);
