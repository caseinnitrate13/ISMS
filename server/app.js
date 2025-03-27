const express = require('express');
const fs = require('fs');
const path = require('path');
const port = 8080;


const app = express();

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, '..', 'public')));

const template = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'template.html'), 'utf-8');


app.get('/progress-tracker', (req, res) => {
    const dashboard = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'progress-tracker.html'), 'utf-8');
    res.send(template.replace('{{content}}', dashboard));
});


app.get('/submission', (req, res) => {
    const dashboard = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'document-submission.html'), 'utf-8');
    res.send(template.replace('{{content}}', dashboard));
});







app.use((req, res) => {
    res.status(404).send(template.replace('{{content}}', '<h3>404 - Page Not Found</h3>'));
});

app.listen(port, () =>{
    console.log(`Server successful, listening on port http://127.0.0.1:${port}`)
})