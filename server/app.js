const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const port = 3080;
const bodyParser = require('body-parser');

//Firebase Connection
const { db } = require('./config');
const { doc, setDoc, getDoc, getDocs, collection, deleteDoc, updateDoc, addDoc, serverTimestamp } = require('firebase/firestore');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Storage 
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/registration', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { studentID, password } = req.body;

        if (!studentID || !password) {
            return res.status(400).send({ success: false, message: 'Missing ID or password' });
        }

        // --- Check students ---
        const blocks = ['A', 'B'];

        for (const block of blocks) {
            const studentRef = doc(db, 'ACCOUNTS', 'STUDENTS', block, studentID);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
                const data = studentSnap.data();

                if (data.password === password) {
                    return res.send({
                        success: true,
                        userRole: 'student',
                        redirect: '/progress-tracker',
                        student: {
                            id: studentID,
                            firstname: data.firstname || '',
                            lastname: data.surname || '',
                            block,
                            email: data.email || ''
                        }
                    });
                } else {
                    return res.status(401).send({ success: false, message: 'Incorrect password' });
                }
            }
        }

        // --- Check faculty (adjusted path) ---
        const facultyRef = doc(db, 'ACCOUNTS', 'FACULTY', 'ACCOUNTS', studentID);
        const facultySnap = await getDoc(facultyRef);

        if (facultySnap.exists()) {
            const data = facultySnap.data();

            if (data.password === password) {
                return res.send({
                    success: true,
                    userRole: 'faculty',
                    redirect: '/admin/student-progress',
                    faculty: {
                        id: studentID,
                        firstname: data.firstname || '',
                        lastname: data.lastname || '',
                        email: data.email || '',
                        department: data.department || '',
                        position: data.position || ''
                    }
                });
            } else {
                return res.status(401).send({ success: false, message: 'Incorrect password' });
            }
        }

        // --- No match ---
        return res.status(404).send({ success: false, message: 'Account not found' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send({ success: false, message: 'Server error', error });
    }
});


// ADMIN SIDE PAGES
const adminTemplate = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'template-admin.html'), 'utf-8');

app.get('/admin/downloadable', (req, res) => {
    const downloadable = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'downloadable.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', downloadable));
});


app.post("/api/upload-downloadable", upload.single("file"), async (req, res) => {
    try {
        const { title, type, action } = req.body; // action: "save" (Draft) or "upload" (Published)

        if (!title) {
            return res.status(400).json({ success: false, message: "Missing title" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // 🔎 Check if a downloadable with the same title already exists
        const downloadableRef = collection(db, "DOWNLOADABLES");
        const existingSnap = await getDocs(downloadableRef);
        const existingDoc = existingSnap.docs.find(doc => doc.data().requirementname === title);

        let downloadableID;

        if (existingDoc) {
            // ✅ Update existing document
            downloadableID = existingDoc.id;
            console.log(`♻️ Updating existing downloadable: ${title}`);
        } else {
            // 🆕 Create new document
            downloadableID = crypto.randomUUID().split('-')[0];
            console.log(`🆕 Creating new downloadable: ${title}`);
        }

        // ✅ Define folder structure
        const basePath = path.join(__dirname, "uploads", "downloadable", downloadableID);
        fs.mkdirSync(basePath, { recursive: true });

        // ✅ Clean up old files first before saving the new one
        const oldFiles = fs.existsSync(basePath) ? fs.readdirSync(basePath) : [];
        for (const oldFile of oldFiles) {
            fs.unlinkSync(path.join(basePath, oldFile));
            console.log(`🧹 Deleted old file: ${oldFile}`);
        }

        // ✅ Prepare file details
        const filename = req.file.originalname;
        const filePath = path.join(basePath, filename);
        const firestorePath = `uploads/downloadable/${downloadableID}/${filename}`;

        // ✅ Save new file to disk
        fs.writeFileSync(filePath, req.file.buffer);

        // ✅ Determine status
        const status = action === "save" ? "Draft" : "Uploaded";

        // ✅ Update Firestore document
        const docRef = doc(db, "DOWNLOADABLES", downloadableID);
        await setDoc(docRef, {
            requirementname: title,
            requirementtype: type || "Uncategorized",
            path: firestorePath,
            createdat: new Date().toISOString(),
            status
        }, { merge: true });


        console.log(`✅ Firestore updated for downloadable: ${title}`);
        console.log(`📁 Saved latest file: ${filename}`);

        res.json({ success: true, downloadableID, path: firestorePath, status });

    } catch (error) {
        console.error("🔥 Error uploading downloadable:", error);
        res.status(500).json({ success: false, message: "Error uploading downloadable", error });
    }
});

app.get("/api/get-downloadables", async (req, res) => {
    try {
        const downloadableRef = collection(db, "DOWNLOADABLES");
        const snapshot = await getDocs(downloadableRef);

        if (snapshot.empty) {
            return res.json({ success: true, data: [] });
        }

        const data = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
                id: doc.id,
                title: d.requirementname,
                type: d.requirementtype,
                fileurl: `/${d.path}`,
                createdat: d.createdat,
                status: d.status
            };
        });

        // 🕒 Sort oldest first (so the latest appears last)
        data.sort((a, b) => new Date(a.createdat) - new Date(b.createdat));

        res.json({ success: true, data });
    } catch (err) {
        console.error("🔥 Error fetching downloadables:", err);
        res.status(500).json({
            success: false,
            message: "Error loading downloadables.",
        });
    }
});

// 🗑️ DELETE downloadable (Firestore + local folder)
app.delete("/api/delete-downloadable/:id", async (req, res) => {
    try {
        const downloadableID = req.params.id;

        if (!downloadableID) {
            return res.status(400).json({ success: false, message: "Missing downloadable ID" });
        }

        const docRef = doc(db, "DOWNLOADABLES", downloadableID);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return res.status(404).json({ success: false, message: "Downloadable not found" });
        }

        // ✅ Delete Firestore document
        await deleteDoc(docRef);
        console.log(`🗑️ Firestore document deleted: ${downloadableID}`);

        // ✅ Delete corresponding local folder
        const folderPath = path.join(__dirname, "uploads", "downloadable", downloadableID);
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`📂 Folder deleted: ${folderPath}`);
        }

        res.json({ success: true, message: "Downloadable deleted successfully." });

    } catch (error) {
        console.error("🔥 Error deleting downloadable:", error);
        res.status(500).json({ success: false, message: "Error deleting downloadable", error });
    }
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

app.delete("/delete-student/:block/:student_id", async (req, res) => {
    const { block, student_id } = req.params;

    try {
        if (!block || !student_id) {
            return res.status(400).json({ success: false, message: "Missing block or student_id" });
        }

        // Firestore path: ACCOUNTS/STUDENTS/{block}/{student_id}
        const docRef = doc(db, "ACCOUNTS", "STUDENTS", block, student_id);
        await deleteDoc(docRef);

        console.log(`🗑️ Deleted student ${student_id} from block ${block}`);
        res.json({ success: true, message: "Student deleted successfully" });

    } catch (error) {
        console.error("🔥 Delete error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.patch('/update-status/:block/:student_id', async (req, res) => {
    const { block, student_id } = req.params;
    const { status } = req.body;

    try {
        if (!block || !student_id || !status) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const accountRef = doc(db, 'ACCOUNTS', 'STUDENTS', block, student_id);
        await updateDoc(accountRef, { status });

        console.log(`✅ Updated status of ${student_id} in block ${block} to ${status}`);
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('🔥 Error updating status:', error);
        res.status(500).json({ success: false, message: error.message });
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

app.get('/api/submitted-requirements', async (req, res) => {
    try {
        const { title } = req.query;

        if (!title) {
            return res.status(400).json({ success: false, message: "Missing requirement title" });
        }

        // 🔍 Find ALL requirements that match the given title
        const requirementsRef = collection(db, "REQUIREMENTS");
        const requirementsSnap = await getDocs(requirementsRef);
        const matchingRequirements = requirementsSnap.docs.filter(
            (doc) => doc.data().title === title
        );

        if (matchingRequirements.length === 0) {
            return res.status(404).json({ success: false, message: "Requirement not found" });
        }

        const results = [];
        const studentBlocks = ['A', 'B'];

        for (const reqDoc of matchingRequirements) {
            const requirementID = reqDoc.id;

            for (const block of studentBlocks) {
                const studentsRef = collection(db, "ACCOUNTS", "STUDENTS", block);
                const studentsSnap = await getDocs(studentsRef);

                // Process all students in parallel
                const promises = studentsSnap.docs.map(async (studentDoc) => {
                    const studentID = studentDoc.id;
                    const sData = studentDoc.data();
                    const studentName = `${sData.firstname || ""} ${sData.surname || ""}`.trim();

                    const submittedDocsRef = collection(db, "DOCUMENTS", requirementID, studentID);
                    const submittedSnap = await getDocs(submittedDocsRef);

                    submittedSnap.forEach((docu) => {
                        const data = docu.data();
                        results.push({
                            requirementID,
                            requirementTitle: title,
                            studentID,
                            studentName,
                            submitteddocuID: docu.id,
                            title: data.title || "",
                            type: data.type || "",
                            createdAt: data.createdAt || "",
                            docustatus: data.docustatus || "Pending",
                            path: `/${data.path}` || "",
                        });
                    });
                });

                await Promise.all(promises);
            }
        }

        console.log(`📄 ${results.length} documents found for "${title}"`);
        res.status(200).json({ success: true, documents: results });

    } catch (error) {
        console.error("🔥 Error fetching submitted requirements:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});


app.post('/api/update-docustatus', async (req, res) => {
    try {
        const { requirementID, studentID, submitteddocuID, newStatus, remarks } = req.body;

        if (!requirementID || !studentID || !submitteddocuID || !newStatus) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const docRef = doc(db, "DOCUMENTS", requirementID, studentID, submitteddocuID);
        const updateData = { docustatus: newStatus };

        if (remarks) updateData.remarks = remarks;

        await updateDoc(docRef, updateData);

        console.log(`✅ Updated docustatus to "${newStatus}" for ${requirementID}/${studentID}/${submitteddocuID}`);
        if (remarks) console.log(`🗒 Remarks: ${remarks}`);

        res.status(200).json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        console.error("🔥 Error updating docustatus:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});


app.get('/admin/student-progress', (req, res) => {
    const studentProgress = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'student-checklist.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', studentProgress));
});

app.get('/admin/publish-requirements', (req, res) => {
    const publishRequirements = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'duedate.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', publishRequirements));
});

app.post("/save-requirement", async (req, res) => {
    try {
        const { type, title, dueDate, datePosted, notes } = req.body;

        if (!type || !title || !dueDate) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const requirementsRef = collection(db, "REQUIREMENTS");
        await addDoc(requirementsRef, {
            type,
            title,
            dueDate,
            datePosted,
            notes,
            createdAt: serverTimestamp(),
        });

        res.json({ success: true, message: "Requirement saved successfully." });
    } catch (error) {
        console.error("🔥 Error saving requirement:", error);
        res.status(500).json({ success: false, message: "Error saving requirement.", error });
    }
});

// Fetch all requirements
app.get("/get-requirements", async (req, res) => {
    try {
        const requirementsRef = collection(db, "REQUIREMENTS");
        const snapshot = await getDocs(requirementsRef);

        const requirements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({ success: true, requirements });
    } catch (error) {
        console.error("🔥 Error fetching requirements:", error);
        res.status(500).json({ success: false, message: "Error fetching requirements.", error });
    }
});

app.put("/update-requirement/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { type, title, dueDate, notes } = req.body;

        const docRef = doc(db, "REQUIREMENTS", id);
        await updateDoc(docRef, {
            type,
            title,
            dueDate,
            notes,
        });

        res.json({ success: true, message: "Requirement updated successfully." });
    } catch (error) {
        console.error("🔥 Error updating requirement:", error);
        res.status(500).json({ success: false, message: "Error updating requirement.", error });
    }
});

app.delete("/delete-requirement/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Missing document ID." });
        }

        await deleteDoc(doc(db, "REQUIREMENTS", id));

        res.json({ success: true, message: "Requirement deleted successfully." });
    } catch (error) {
        console.error("🔥 Error deleting requirement:", error);
        res.status(500).json({ success: false, message: "Error deleting requirement.", error });
    }
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

// ✅ Fetch requirements with student's submissions
app.get('/api/requirements/:studentID', async (req, res) => {
    try {
        const { studentID } = req.params;

        // Step 1: Fetch all requirements
        const requirementsRef = collection(db, 'REQUIREMENTS');
        const requirementsSnap = await getDocs(requirementsRef);

        const grouped = {
            "Initial Requirements": [],
            "Pre-Deployment Requirements": [],
            "In-Progress Requirements": [],
            "Final Requirements": []
        };

        requirementsSnap.forEach(docSnap => {
            const data = docSnap.data();
            const type = data.type || "Others";
            if (!grouped[type]) grouped[type] = [];
            grouped[type].push({
                id: docSnap.id,
                title: data.title,
                description: data.notes || "",
                dueDate: data.dueDate || "",
                datePosted: data.datePosted || "",
                createdAt: data.createdAt || "",
                type: type,
                status: "To Submit"
            });
        });

        // Step 2: Fetch student's submitted documents (using new structure)
        const submittedDocs = {};

        for (const [type, reqList] of Object.entries(grouped)) {
            for (const req of reqList) {
                const docRef = collection(db, "DOCUMENTS", req.id, studentID); // DOCUMENTS/{requirementID}/{studentID}
                const docSnap = await getDocs(docRef);

                docSnap.forEach(subDoc => {
                    const data = subDoc.data();
                    submittedDocs[req.id] = data;
                });
            }
        }

        console.log("📦 Requirements found:", Object.keys(grouped).length);
        console.log("📄 Submitted docs found:", Object.keys(submittedDocs).length);

        // Step 3: Merge submissions into requirements
        for (const [type, list] of Object.entries(grouped)) {
            grouped[type] = list.map(req => {
                const submitted = submittedDocs[req.id];
                return submitted
                    ? {
                        ...req,
                        status: submitted.docustatus || "Pending",
                        submittedPath: submitted.path || null
                    }
                    : { ...req, status: "To Submit" };
            });
        }

        res.json({ success: true, data: grouped });

    } catch (error) {
        console.error("🔥 Error fetching requirements:", error);
        res.status(500).json({ success: false, message: "Failed to fetch requirements." });
    }
});


app.get('/api/document/:requirementID/:studentID', async (req, res) => {
    try {
        const { requirementID, studentID } = req.params;
        const folderRef = collection(db, "DOCUMENTS", requirementID, studentID);
        const folderSnap = await getDocs(folderRef);

        if (folderSnap.empty) {
            return res.json({ success: false, message: "No document found" });
        }

        // Return first file (students usually submit one file per requirement)
        const doc = folderSnap.docs[0].data();
        res.json({ success: true, data: doc });

    } catch (error) {
        console.error("🔥 Error fetching document:", error);
        res.status(500).json({ success: false, message: "Error fetching document" });
    }
});

app.post("/api/upload-document", upload.single("file"), async (req, res) => {
    try {
        const { studentID, requirementID, type, title } = req.body;

        if (!studentID || !requirementID) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // 🔎 Check if a submission already exists for this student + requirement
        const studentDocsRef = collection(db, "DOCUMENTS", requirementID, studentID);
        const existingSnap = await getDocs(studentDocsRef);

        let submitteddocuID;
        if (!existingSnap.empty) {
            submitteddocuID = existingSnap.docs[0].id;
            console.log(`♻️ Updating existing document for ${studentID} under ${requirementID}`);
        } else {
            submitteddocuID = crypto.randomUUID().split('-')[0];
            console.log(`🆕 Creating new document for ${studentID} under ${requirementID}`);
        }

        const basePath = path.join(__dirname, "uploads", "documents", requirementID, studentID, submitteddocuID);
        fs.mkdirSync(basePath, { recursive: true });

        const filename = `${req.file.originalname}`;
        const filePath = path.join(basePath, filename);
        const firestorePath = `uploads/documents/${requirementID}/${studentID}/${submitteddocuID}/${filename}`;

        fs.writeFileSync(filePath, req.file.buffer);

        const docRef = doc(db, "DOCUMENTS", requirementID, studentID, submitteddocuID);
        await setDoc(docRef, {
            requirementID,
            studentID,
            submitteddocuID,
            type,
            title,
            path: firestorePath,
            createdAt: new Date().toISOString(),
            docustatus: "Pending",
            remarks: ""
        }, { merge: true });

        console.log(`✅ Firestore updated for ${studentID}`);

        const oldFiles = fs.readdirSync(basePath);
        for (const oldFile of oldFiles) {
            if (oldFile !== filename) {
                fs.unlinkSync(path.join(basePath, oldFile));
                console.log(`🧹 Deleted old file: ${oldFile}`);
            }
        }

        res.json({ success: true, path: firestorePath });

    } catch (error) {
        console.error("🔥 Error saving document:", error);
        res.status(500).json({ success: false, message: "Error saving document", error });
    }
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