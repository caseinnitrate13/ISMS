const express = require('express');
const fs = require('fs');
const path = require('path');
const port = 3080;

//Firebase Connection
const { db } = require('./config');
const { doc, setDoc, getDoc } = require('firebase/firestore');
const { storage } = require('./config');
const { ref, uploadBytes } = require('firebase/storage');

const app = express();

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, '..', 'public')));

const template = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'template.html'), 'utf-8');


app.get('/progress-tracker', (req, res) => {
    const progressTracker = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'progress-tracker.html'), 'utf-8');
    res.send(template.replace('{{content}}', progressTracker));
});



app.get('/submission', (req, res) => {
    const submission = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'document-submission.html'), 'utf-8');
    res.send(template.replace('{{content}}', submission));
});

app.get('/downloadable-forms', (req, res) => {
    const downloadableForms = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'downloadable-forms.html'), 'utf-8');
    res.send(template.replace('{{content}}', downloadableForms));
});

app.get('/partner-agency', (req, res) => {
    const partnerAgencies = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'partner-agencies.html'), 'utf-8');
    res.send(template.replace('{{content}}', partnerAgencies));
});

app.get('/review-agency', (req, res) => {
    const reviewAgency = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'review-agency.html'), 'utf-8');
    res.send(template.replace('{{content}}', reviewAgency));
});

app.get('/account', (req, res) => {
    const account = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'account.html'), 'utf-8');
    res.send(template.replace('{{content}}', account));
});

app.get('/notifications', (req, res) => {
    const notifications = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'notifications.html'), 'utf-8');
    res.send(template.replace('{{content}}', notifications));
});


app.get('/test-firestore', async (req, res) => {
    try {
        const testRef = doc(db, 'testCollection', 'testDoc');

        await setDoc(testRef, { message: 'Hello from Firebase!' });

        const docSnap = await getDoc(testRef);

        console.log('Document fetched:', docSnap.data());

        res.send(`📦 Firebase Firestore is working! Message: ${docSnap.data().message}`);
    } catch (error) {
        console.error('🔥 Firebase Firestore test failed:', error);
        res.status(500).send('Error connecting to Firebase.');
    }
});

app.get('/test-storage', async (req, res) => {
    try {
        const storageRef = ref(storage, 'test-folder/test-file.txt');
        const fileBuffer = Buffer.from('Hello from Firebase Storage!', 'utf-8');

        await uploadBytes(storageRef, fileBuffer);

        console.log('✅ File uploaded to Firebase Storage!');
        res.send('📤 Firebase Storage is working and file was uploaded.');
    } catch (error) {
        console.error('🔥 Firebase Storage test failed:', error);
        res.status(500).send('Error connecting to Firebase Storage.');
    }
});


app.use((req, res) => {
    res.status(404).send(template.replace('{{content}}', '<h3>404 - Page Not Found</h3>'));
});


app.listen(port, () => {
    console.log(`Server successful, listening on port http://127.0.0.1:${port}`)
})