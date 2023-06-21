import { convertCsvDirFilesToJSONDirFiles, getJSONFiles } from './app.js'
import http from 'http';
import path from 'path';
import fs from 'fs';

let jsonDirectory = "C:/Users/Nune/OneDrive/Рабочий стол/EPAM Node/worker's homework/task3/converted files"

const server = http.createServer(async (request, response) => {
    const {method, url} = request;

    request.on('error', (err) => {
        console.error(err);
        response.statusCode = 500;
        response.end('An error occurred during file conversion.');
    });


    if (method === 'POST' && url === '/exports') {
        let bodyPath = '';

        request.on('data', (chunk) => {
            bodyPath = (path.join(...JSON.parse(chunk).path.split('//')));
            console.log(bodyPath)
        });

        request.on('end', ()=>{
            try {
                convertCsvDirFilesToJSONDirFiles(bodyPath).then(()=>{
                    response.statusCode = 200;
                    response.end('CSV files converted and saved.');
                })
                
            } catch (error) {
                console.error(error);
                response.statusCode = 500;
                response.end('An error occurred during file conversion.');
            }
        })
    

        request.on('error',(err)=>{
            console.error(err);
            response.statusCode = 500;
            response.end('An error occurred during file conversion.');
        })
    }

    if (method === 'GET') {
        if (url === '/files') {
                getJSONFiles().then((res) => {
                    response.end(res.toString());
                })
        }

        if (url.startsWith('/files/')) {
            const fileName = url.split('/').pop();
            const filePath = jsonDirectory + '/' + fileName;
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    console.error(err);
                    response.statusCode = 404;
                    response.end(JSON.stringify({error: 'File not found.'}));
                    return;
                }
                response.statusCode = 200;
                response.end(data.toString());
            });
        }
    }

    if (method === 'DELETE' && url.startsWith('/files/')) {
        const fileName = url.split('/').pop();
        const filePath = jsonDirectory + '/' + fileName;

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err);
                response.statusCode = 404;
                response.end(JSON.stringify({error: 'File not found.'}));
            }
            response.statusCode = 200;
            response.end('Successfully deleted!');
        })
    }
})

server.listen(3000, () => {
    console.log('server is up and running')
})
