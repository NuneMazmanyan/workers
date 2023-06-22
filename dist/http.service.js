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
const app_1 = require("./app");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const consts_1 = require("./assets/consts");
const server = http.createServer((request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { method, url } = request;
    request.on('error', (err) => {
        console.error(err);
        response.statusCode = 500;
        response.end('An error occurred during file conversion.');
    });
    if (method === 'POST' && url === '/exports') {
        let bodyPath = '';
        request.on('data', (chunk) => {
            bodyPath = (path.join(...JSON.parse(chunk).path.split('//')));
        });
        request.on('end', () => {
            try {
                (0, app_1.convertCsvDirFilesToJSONDirFiles)(bodyPath).then(() => {
                    response.statusCode = 200;
                    response.end('CSV files converted and saved.');
                });
            }
            catch (error) {
                console.error(error);
                response.statusCode = 500;
                response.end('An error occurred during file conversion.');
            }
        });
        request.on('error', (err) => {
            console.error(err);
            response.statusCode = 500;
            response.end('An error occurred during file conversion.');
        });
    }
    if (method === 'GET') {
        if (url === '/files') {
            (0, app_1.getJSONFiles)().then((res) => {
                response.end(res.toString());
            });
        }
        if (url.startsWith('/files/')) {
            const fileName = url.split('/').pop();
            const filePath = consts_1.jsonDirectory + '/' + fileName;
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    console.error(err);
                    response.statusCode = 404;
                    response.end(JSON.stringify({ error: 'File not found.' }));
                    return;
                }
                response.statusCode = 200;
                response.end(data.toString());
            });
        }
    }
    if (method === 'DELETE' && url.startsWith('/files/')) {
        const fileName = url.split('/').pop();
        const filePath = consts_1.jsonDirectory + '/' + fileName;
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err);
                response.statusCode = 404;
                response.end(JSON.stringify({ error: 'File not found.' }));
            }
            response.statusCode = 200;
            response.end('Successfully deleted!');
        });
    }
}));
server.listen(3000, () => {
    console.log('server is up and running');
});
