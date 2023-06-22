"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const path_1 = __importDefault(require("path"));
const { csvFilePaths } = worker_threads_1.workerData;
function readCSV(csvFilePath) {
    return new Promise((resolve) => {
        const result = [];
        fs_1.default.createReadStream(csvFilePath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (data) => {
            result.push(data);
        })
            .on('end', () => {
            resolve(result);
        });
    });
}
function processCSVFile(csvFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const jsonData = yield readCSV(csvFilePath);
            const jsonFilePath = path_1.default.join(path_1.default.dirname(csvFilePath.replace('csv files', 'converted files')), path_1.default.basename(csvFilePath).replace('csv', 'json'));
            fs_1.default.writeFileSync(jsonFilePath, JSON.stringify(jsonData));
            return jsonFilePath;
        }
        catch (error) {
            console.log(`Error processing file ${csvFilePath}:`, error);
            return null;
        }
    });
}
csvFilePaths.forEach((csvFilePath) => {
    processCSVFile(csvFilePath).then((jsonFilePath) => {
        worker_threads_1.parentPort.postMessage(jsonFilePath);
    });
});
const promises = csvFilePaths.map((csvFilePath) => {
    processCSVFile(csvFilePath);
});
Promise.all(promises).then((jsonFilePaths) => {
    worker_threads_1.parentPort.postMessage(jsonFilePaths);
});
