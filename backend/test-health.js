const http = require('http');
http.get('http://localhost:3000/api/health', (res) => {
    console.log('STATUS: ' + res.statusCode);
    res.setEncoding('utf8');
    res.on('data', (chunk) => console.log('BODY: ' + chunk));
}).on('error', (e) => {
    console.log('ERROR: ' + e.message);
});
