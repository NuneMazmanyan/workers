import fs from 'fs';
import path from 'path';
import os from 'os';
import { Worker } from 'worker_threads';

async function getCSVFiles(directoryPath) {
    let csvFiles = [];
    if (!fs.existsSync(directoryPath)) {
        console.log('No directory with matching name')
        return;
    }
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (error, files) => {
            if (error) {
                reject(error);
                return;
            }
            csvFiles = files.filter((file) => path.extname(file) === '.csv');
            csvFiles = files.map((file)=>{
                return path.join(directoryPath, file);
            });
            console.log(csvFiles)
            resolve(csvFiles);
        })
    }).then()
}

function getWorkersCount(csvFilesCount) {
    let cpus = os.cpus().length;
    return Math.min(cpus, csvFilesCount) > 10 ? 10 : Math.min(cpus, csvFilesCount);
}

async function convertCsvDirFilesToJSONDirFiles(directoryPath) {
    const workers = [];
    let csvFiles = await getCSVFiles(directoryPath);

    let workersCount = getWorkersCount(csvFiles.length);
    const filePathsPerWorker = Math.floor(csvFiles.length / workersCount);

    for (let i = 0; i < csvFiles.length; i += filePathsPerWorker) {
        const worker = new Worker('./worker.js', {
            workerData: {csvFilePaths: csvFiles.slice(i, i + filePathsPerWorker)},
        });
        worker.on('error', (error) => {
            console.log(`Worker ${worker.threadId} error:`, error);
        });
        workers.push(worker);
    }

    await Promise.all(workers.map((worker) => new Promise((resolve) => worker.on('exit', resolve)))).then(() => {
        process.exit();
    });
}

convertCsvDirFilesToJSONDirFiles("C:/Users/Nune/OneDrive/Рабочий стол/EPAM Node/worker's homework/task3/csv files")


