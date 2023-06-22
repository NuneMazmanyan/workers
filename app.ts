import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Worker } from 'worker_threads';
import { jsonDirectory } from './assets/consts'

async function getCSVFiles(directoryPath: string): Promise<void | string[]> {
    let csvFiles: string[];
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
            csvFiles = files.filter((file) => path.extname(file) === '.csv').map((file)=>{
                return path.join(directoryPath, file);
            });
            resolve(csvFiles);
        })
    }).then()
}

function getWorkersCount(csvFilesCount: number): number {
    let cpus: number = os.cpus().length;
    return Math.min(cpus, csvFilesCount) > 10 ? 10 : Math.min(cpus, csvFilesCount);
}

export async function convertCsvDirFilesToJSONDirFiles(directoryPath: string): Promise<void> {
    const workers: Worker[] = [];
    let csvFiles: string[] = await getCSVFiles(directoryPath) as string[];

    let workersCount = getWorkersCount(csvFiles!.length);
    const filePathsPerWorker = Math.floor(csvFiles!.length / workersCount);

    for (let i = 0; i < csvFiles!.length; i += filePathsPerWorker) {
        const worker = new Worker('./worker.js', {
            workerData: {csvFilePaths:(csvFiles as string[]).slice(i, i + filePathsPerWorker)},
        });
        worker.on('error', (error) => {
            console.log(`Worker ${worker.threadId} error:`, error);
        });
        workers.push(worker);
    }

    await Promise.all(workers.map((worker) => new Promise((resolve) => worker.on('exit', resolve)))).then(() => {});
}

export function getJSONFiles(): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(jsonDirectory, (error, files) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(files);
        })
    })
}