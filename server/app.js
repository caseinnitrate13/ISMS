const express = require('express');
const fs = require('fs');
const path = require('path');
const port = 3080;
const bodyParser = require('body-parser');

//Firebase Connection
const { db } = require('./config');
const {  doc, setDoc, getDocs, collection } = require('firebase/firestore');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/registration', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

// ADMIN SIDE PAGES
const adminTemplate = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'template-admin.html'), 'utf-8');

app.get('/admin/downloadable', (req, res) => {
    const downloadable = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'downloadable.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', downloadable));
});

app.get('/admin/registered-accounts', (req, res) => {
    const registeredAccounts = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'reg-accounts.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', registeredAccounts));
});

app.post('/save-account', async (req, res) => {
    try {
        const accountData = req.body;
        const { student_id, targetBlock } = accountData;

        if (!student_id || !targetBlock) {
            return res.status(400).send({ success: false, message: 'Missing student_id or targetBlock' });
        }
        const accountRef = doc(db, 'ACCOUNTS', 'STUDENTS', targetBlock, student_id);

        await setDoc(accountRef, accountData);
        res.send({ success: true, message: 'Account saved successfully' });

    } catch (error) {
        console.error('Error saving account:', error);
        res.status(500).send({ success: false, message: 'Error saving account', error });
    }
});

app.get('/get-students', async (req, res) => {
    try {
        const blocks = ['A', 'B'];
        const allStudents = [];

        for (const block of blocks) {
            const studentsRef = collection(db, 'ACCOUNTS', 'STUDENTS', block);
            const snapshot = await getDocs(studentsRef);

            snapshot.forEach(doc => {
                allStudents.push({ ...doc.data(), targetBlock: block });
            });
        }

        // Sort by reg_date (oldest → newest)
        allStudents.sort((a, b) => new Date(a.reg_date) - new Date(b.reg_date));

        res.send({ success: true, students: allStudents });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).send({ success: false, message: 'Error fetching students', error });
    }
});

app.get('/admin/partner-establishments', (req, res) => {
    const partnerEstablishments = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'partner-establishments.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', partnerEstablishments));
});

app.get('/admin/submitted-documents', (req, res) => {
    const submittedDocuments = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'submission.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', submittedDocuments));
});

app.get('/admin/student-progress', (req, res) => {
    const studentProgress = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'student-checklist.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', studentProgress));
});

app.get('/admin/publish-requirements', (req, res) => {
    const publishRequirements = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'duedate.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', publishRequirements));
});

app.get('/admin/notifications', (req, res) => {
    const notifications = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'notifications.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', notifications));
});

app.get('/admin/user-profile', (req, res) => {
    const userProfile = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'users-profile.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', userProfile));
});


// CLIENT SIDE PAGES
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


app.use((req, res) => {
    if (req.originalUrl.startsWith('/admin')) {
        res.status(404).send(adminTemplate.replace('{{content}}', '<h3>404 - Page Not Found</h3>'));
    } else {
        res.status(404).send(template.replace('{{content}}', '<h3>404 - Page Not Found</h3>'));
    }
});

app.listen(port, () => {
    console.log(`Server successful, listening on port http://127.0.0.1:${port}`)
})