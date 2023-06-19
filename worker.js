import {parentPort, workerData} from "worker_threads";
import fs from "fs";
import path from "path";
import csv from 'csv-parser';

const {csvFilePaths} = workerData;

async function processCSVFile(csvFilePath) {
    await readCSV(csvFilePath)
        .then((data) => {
            const jsonData = JSON.stringify(data);
            fs.writeFileSync(path.join(path.dirname(csvFilePath.replace('csv files', 'converted files')), path.basename(csvFilePath).replace('csv', 'json')), jsonData);
        })
        .catch((error) => {
            console.log(`Error processing file ${csvFilePath}:`, error);
        }).then()
}

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
csvFilePaths.forEach((csvFilePath) => {
    processCSVFile(csvFilePath).then((jsonFilePath) => {
        parentPort.postMessage(jsonFilePath);
    });
});
