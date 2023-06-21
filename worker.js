import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
const {csvFilePaths} = workerData;

function readCSV(csvFilePath) {
    return new Promise((resolve) => {
        const result = [];
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data) => {
                result.push(data)
            })
            .on('end', () => {
                resolve(result);
            })
    })
}

async function processCSVFile(csvFilePath) {
    try {
      const jsonData = await readCSV(csvFilePath);
      const jsonFilePath = path.join(
        path.dirname(csvFilePath.replace('csv files', 'converted files')),
        path.basename(csvFilePath).replace('csv', 'json')
      );
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData));
      return jsonFilePath;
    } catch (error) {
      console.log(`Error processing file ${csvFilePath}:`, error);
      return null;
    }
  }

csvFilePaths.forEach((csvFilePath) => {
    processCSVFile(csvFilePath).then((jsonFilePath) => {
        parentPort.postMessage(jsonFilePath);
    });
});

const promises = csvFilePaths.map((csvFilePath) => {
    processCSVFile(csvFilePath)
});

Promise.all(promises).then((jsonFilePaths) => {
  parentPort.postMessage(jsonFilePaths);
});