import fs from 'fs';
import path from 'path';
import os from 'os';
import { Worker } from "worker_threads";


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

    #getWorkersCount(csvFilesCount) {
        return Math.min(cpus, csvFilesCount) > 10 ? 10 : Math.min(cpus, csvFilesCount);
    }

    async convertCsvDirFilesToJSONDirFiles() {
            const workers = [];
            for (let i = 0; i < this.csvFiles.length; i += this.filePathsPerWorker) {
                const worker = new Worker('./worker.js', {
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
        process.exit()
    }
}

const parser = new CSVConverter("C:/Users/Nune/OneDrive/Рабочий стол/EPAM Node/worker's homework/task3/csv files");
setTimeout(() => parser.convertCsvDirFilesToJSONDirFiles().then(), 1000)
