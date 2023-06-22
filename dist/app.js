"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJSONFiles = exports.convertCsvDirFilesToJSONDirFiles = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const worker_threads_1 = require("worker_threads");
const consts_1 = require("./assets/consts");
function getCSVFiles(directoryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let csvFiles;
        if (!fs.existsSync(directoryPath)) {
            console.log('No directory with matching name');
            return;
        }
        return new Promise((resolve, reject) => {
            fs.readdir(directoryPath, (error, files) => {
                if (error) {
                    reject(error);
                    return;
                }
                csvFiles = files.filter((file) => path.extname(file) === '.csv').map((file) => {
                    return path.join(directoryPath, file);
                });
                resolve(csvFiles);
            });
        }).then();
    });
}
function getWorkersCount(csvFilesCount) {
    let cpus = os.cpus().length;
    return Math.min(cpus, csvFilesCount) > 10 ? 10 : Math.min(cpus, csvFilesCount);
}
function convertCsvDirFilesToJSONDirFiles(directoryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const workers = [];
        let csvFiles = yield getCSVFiles(directoryPath);
        let workersCount = getWorkersCount(csvFiles.length);
        const filePathsPerWorker = Math.floor(csvFiles.length / workersCount);
        for (let i = 0; i < csvFiles.length; i += filePathsPerWorker) {
            const worker = new worker_threads_1.Worker('./worker.js', {
                workerData: { csvFilePaths: csvFiles.slice(i, i + filePathsPerWorker) },
            });
            worker.on('error', (error) => {
                console.log(`Worker ${worker.threadId} error:`, error);
            });
            workers.push(worker);
        }
        yield Promise.all(workers.map((worker) => new Promise((resolve) => worker.on('exit', resolve)))).then(() => { });
    });
}
exports.convertCsvDirFilesToJSONDirFiles = convertCsvDirFilesToJSONDirFiles;
function getJSONFiles() {
    return new Promise((resolve, reject) => {
        fs.readdir(consts_1.jsonDirectory, (error, files) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(files);
        });
    });
}
exports.getJSONFiles = getJSONFiles;
