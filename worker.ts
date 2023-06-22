import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
const {csvFilePaths} = workerData;

function readCSV(csvFilePath: string): Promise<string[]>{
    return new Promise((resolve) => {
        const result: string[] = [];
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

async function processCSVFile(csvFilePath: string): Promise<string | null> {
    try {
      const jsonData: string[] = await readCSV(csvFilePath);
      const jsonFilePath: string = path.join(
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

csvFilePaths.forEach((csvFilePath: string) => {
    processCSVFile(csvFilePath).then((jsonFilePath) => {
        parentPort!.postMessage(jsonFilePath);
    });
});

const promises = csvFilePaths.map((csvFilePath: string) => {
    processCSVFile(csvFilePath)
});

Promise.all(promises).then((jsonFilePaths) => {
  parentPort!.postMessage(jsonFilePaths);
});