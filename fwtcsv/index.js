const fs = require('fs');
const csv = require('csv');
const JSONStream = require('JSONStream');

const inputFile = 'High Schools (USA MA) - Schools.csv';
const outputFile = 'High Schools (USA MA) - Schools.json';

const input = fs.createReadStream(inputFile);
const output = fs.createWriteStream(outputFile);

input.pipe(csv.parse({
  delimiter: ',',
  columns: true
})).pipe(JSONStream.stringify()).pipe(output);
