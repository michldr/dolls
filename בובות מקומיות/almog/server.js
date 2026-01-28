const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const srcDir = path.join(__dirname, 'src');

const server = http.createServer((req, res) => {
    let filePath = path.join(srcDir, req.url === '/' ? 'index.html' : req.url);
    let extname = path.extname(filePath).toLowerCase();
    let contentType = 'text/html';

    if (extname === '.js') contentType = 'application/javascript';
    else if (extname === '.css') contentType = 'text/css';
    else if (extname === '.json') contentType = 'application/json';
    else if (extname === '.png') contentType = 'image/png';
    else if (extname === '.jpg' || extname === '.jpeg') contentType = 'image/jpeg';
    else if (extname === '.svg') contentType = 'image/svg+xml';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
