import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import cluster from 'cluster';
import os from 'os';
import {parentPort, Worker, workerData} from "worker_threads";
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);

const cpus = os.cpus().length;
class CSVConverter {
    constructor(directoryPath) {
        this.directoryPath = directoryPath;
        this.#initialize().then()
    }

    async #initialize() {
        this.csvFiles = await this.#getCSVFiles(this.directoryPath).then();
        this.workersCount = this.#getWorkersCount(this.csvFiles.length);
        this.filePathsPerWorker = Math.floor(this.csvFiles.length / this.workersCount);
    }

    async #getCSVFiles() {
        if (!fs.existsSync(this.directoryPath)) {
            console.log('No directory with matching name')
            return;
        }
        return new Promise((resolve, reject) => {
            fs.readdir(this.directoryPath, (error, files) => {
                if (error) {
                    reject(error);
                    return;
                }
                this.csvFiles = files.filter((file) => path.extname(file) === '.csv');
                resolve(this.csvFiles);
            })
        }).then()
    }

    #readCSV(csvFilePath) {
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

    #getWorkersCount(csvFilesCount) {
        return Math.min(cpus, csvFilesCount) > 10 ? 10 : Math.min(cpus, csvFilesCount);
    }

    async #processCSVFile(csvFilePath) {
        await this.#readCSV(csvFilePath)
            .then((data) => {
                const jsonData = JSON.stringify(data);
                fs.writeFileSync(path.join(path.dirname(csvFilePath.replace('csv files', 'converted files')), path.basename(csvFilePath).replace('csv', 'json')), jsonData);
            })
            .catch((error) => {
                console.log(`Error processing file ${csvFilePath}:`, error);
            }).then()
    }

    async convertCsvDirFilesToJSONDirFiles() {
        if (cluster.isMaster) {
            const workers = [];
            for (let i = 0; i < this.csvFiles.length; i += this.filePathsPerWorker) {
                const worker = new Worker(__filename, {
                    workerData: {csvFilePaths: this.csvFiles.slice(i, i + this.filePathsPerWorker)},
                });
                worker.on('error', (error) => {
                    console.log(`Worker ${worker.threadId} error:`, error);
                });
                workers.push(worker);
            }
            Promise.all(workers.map((worker) => new Promise((resolve) => worker.on('exit', resolve)))).then(() => {
                process.exit();
            });
        } else {
            const {csvFilePaths} = workerData;
            csvFilePaths.forEach((csvFilePath) => {
                this.#processCSVFile(csvFilePath).then((jsonFilePath) => {
                    parentPort.postMessage(jsonFilePath);
                });
            });
        }
        process.exit()
    }
}

const parser = new CSVConverter("C:/Users/Nune/OneDrive/Рабочий стол/EPAM Node/worker's homework/task3/csv files");
setTimeout(() => parser.convertCsvDirFilesToJSONDirFiles().then(), 1000)
