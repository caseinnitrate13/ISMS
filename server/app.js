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

app.post("/api/save-partner", upload.fields([
    { name: "companyProfile", maxCount: 1 },
    { name: "signedMoa", maxCount: 1 }
]), async (req, res) => {
    try {
        const { establishmentName, address, moaStatus, moaSince, positions } = req.body;
        const profileFile = req.files["companyProfile"]?.[0];
        const moaFile = req.files["signedMoa"]?.[0];

        if (!establishmentName || !address || !positions || !profileFile || !moaFile) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // 1️⃣ Create the partner in Firestore first
        const docRef = await addDoc(collection(db, "PARTNERS"), {
            establishmentName,
            address,
            moaStatus,
            moaSince,
            positions,
            createdAt: new Date().toISOString()
        });
        const establishmentID = docRef.id;

        // 2️⃣ Create file directory
        const basePath = path.join(__dirname, "uploads", "partners", establishmentID, "documents");
        fs.mkdirSync(basePath, { recursive: true });

        // 3️⃣ Save files
        const profileFileName = `Profile-${profileFile.originalname}`;
        const moaFileName = `MOA-${moaFile.originalname}`;

        fs.writeFileSync(path.join(basePath, profileFileName), profileFile.buffer);
        fs.writeFileSync(path.join(basePath, moaFileName), moaFile.buffer);

        const firestoreProfilePath = `uploads/partners/${establishmentID}/documents/${profileFileName}`;
        const firestoreMoaPath = `uploads/partners/${establishmentID}/documents/${moaFileName}`;

        // 4️⃣ Update Firestore with file paths
        await setDoc(docRef, {
            documents: {
                profileFilePath: firestoreProfilePath,
                moaFilePath: firestoreMoaPath
            }
        }, { merge: true });

        res.json({ success: true, establishmentID });
    } catch (error) {
        console.error("🔥 Error saving partner:", error);
        res.status(500).json({ success: false, message: "Error saving partner", error });
    }
});

app.post("/api/update-partner",
    upload.fields([
        { name: "profileFile", maxCount: 1 },
        { name: "moaFile", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { partnerId, establishmentName, address, moaStatus, moaSince, positions } = req.body;

            // 1️⃣ Fetch existing partner document
            const partnerRef = doc(db, "PARTNERS", partnerId);
            const partnerSnap = await getDoc(partnerRef);

            if (!partnerSnap.exists()) {
                return res.status(404).json({ success: false, message: "Partner not found" });
            }

            const partnerData = partnerSnap.data();
            const documents = partnerData.documents || {};

            // 2️⃣ Prepare directory path for this partner
            const basePath = path.join(__dirname, "uploads", "partners", partnerId, "documents");
            fs.mkdirSync(basePath, { recursive: true });

            // 3️⃣ Handle new uploads or keep old ones
            let profileFilePath = documents.profileFilePath || null;
            let moaFilePath = documents.moaFilePath || null;

            const newProfileFile = req.files["profileFile"]?.[0];
            const newMoaFile = req.files["moaFile"]?.[0];

            if (newProfileFile) {
                const profileFileName = `Profile-${newProfileFile.originalname}`;
                const profileSavePath = path.join(basePath, profileFileName);

                fs.writeFileSync(profileSavePath, newProfileFile.buffer);
                profileFilePath = `uploads/partners/${partnerId}/documents/${profileFileName}`;
            }

            if (newMoaFile) {
                const moaFileName = `MOA-${newMoaFile.originalname}`;
                const moaSavePath = path.join(basePath, moaFileName);

                fs.writeFileSync(moaSavePath, newMoaFile.buffer);
                moaFilePath = `uploads/partners/${partnerId}/documents/${moaFileName}`;
            }

            // 4️⃣ Build update payload (safe and complete)
            const safeData = {
                establishmentName: establishmentName || "",
                address: address || "",
                moaStatus: moaStatus || "",
                moaSince: moaSince || "",
                positions: positions || "",
                documents: {
                    profileFilePath,
                    moaFilePath,
                },
                lastUpdated: new Date().toISOString(),
            };

            // 5️⃣ Update Firestore
            await updateDoc(partnerRef, safeData);

            console.log(`✅ Partner "${establishmentName}" updated successfully!`);
            res.json({ success: true });
        } catch (error) {
            console.error("🔥 Error updating partner:", error);
            res.status(500).json({ success: false, message: "Error updating partner", error });
        }
    }
);

app.get("/api/get-partners", async (req, res) => {
    try {
        const partnersRef = collection(db, "PARTNERS");
        const snapshot = await getDocs(partnersRef);

        // Convert Firestore docs into an array
        const partners = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort by createdAt ascending → oldest first, latest last
        partners.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        res.json({ success: true, partners });
    } catch (error) {
        console.error("🔥 Error fetching partners:", error);
        res.status(500).json({ success: false, message: "Error fetching partners", error });
    }
});

app.post("/api/delete-partners", async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No IDs provided." });
        }

        for (const id of ids) {
            const partnerDir = path.join(__dirname, "uploads", "partners", id);

            // 1️⃣ Delete Firestore document
            await deleteDoc(doc(db, "PARTNERS", id));

            // 2️⃣ Delete local upload folder
            if (fs.existsSync(partnerDir)) {
                fs.rmSync(partnerDir, { recursive: true, force: true });
                console.log(`Deleted folder: ${partnerDir}`);
            }
        }

        res.json({ success: true, message: `${ids.length} partner(s) deleted successfully.` });
    } catch (error) {
        console.error("🔥 Error deleting partners:", error);
        res.status(500).json({ success: false, message: "Error deleting partners", error });
    }
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
                            remarks: data.remarks
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


app.get("/api/student-progress", async (req, res) => {
    try {
        const studentBlocks = ["A", "B"];
        const results = {};

        // ✅ Get all requirements with due dates
        const requirementsSnap = await getDocs(collection(db, "REQUIREMENTS"));
        const allRequirements = requirementsSnap.docs.map((doc) => ({
            id: doc.id,
            title: doc.data().title || "Untitled",
            dueDate: doc.data().dueDate || null,
            dueTime: doc.data().dueTime
        }));

        console.log(`📋 Found ${allRequirements.length} requirements with due dates`);

        // ✅ Map title → key for easier access
        const reverseRequirementMap = {
            "Student Information Sheet (SIS)": "SIS",
            "Medical Certificate (PE & Nuero)": "MedCertPhysical",
            "Medical Certificate (PE & Nuero)": "MedCertNeuro",
            "Insurance": "Insurance",
            "Certificate of Registration": "COR",
            "Certificate of Academic Records": "CAR",
            "Good Moral": "GoodMoral",

            // 🟩 Pre-Deployment Requirements
            "Letter of Application": "LOA",
            "Resume": "Resume",
            "OJT Orientation Certificate": "PreOrientation",
            "Parent Waiver": "WaiverSigned",
            "Letter of Endorsement": "LOE",
            "Notice of Acceptance": "NOA",
            "Internship Contract": "InternshipContract",
            "Work Plan": "Workplan",

            // 🟨 In-Progress Requirements
            "DTR": "DTR_JAN",
            "DTR": "DTR_FEB",
            "DTR": "DTR_MAR",
            "DTR": "DTR_APR",
            "DTR": "DTR_MAY",
            "Monthly Progress Report": "MPR_JAN",
            "Monthly Progress Report": "MPR_FEB",
            "Monthly Progress Report": "MPR_MAR",
            "Monthly Progress Report": "MPR_APR",
            "Monthly Progress Report": "MPR_MAY",
            "Midterm/Final Assessment": "MidtermAssessment",
            "Midterm/Final Assessment": "FinalAssessment",

            // 🟥 Final Requirements
            "Certificate of Completion": "CertCompletion",
            "Written Report": "WrittenReport",
            "E-copy": "ECopy",
            "Final Presentation": "FinalPresentation"
        };

        // ✅ Build a quick lookup for due dates
        const dueDateMap = {};
        allRequirements.forEach((r) => {
            const key = reverseRequirementMap[r.title];
            if (key && r.dueDate) {
                dueDateMap[key] = {
                    dueDate: r.dueDate,             // e.g., "2025-10-21"
                    dueTime: r.dueTime || "23:59"   // fallback to end-of-day if missing
                };
            }
        });
        // ✅ Fetch each block in parallel
        await Promise.all(
            studentBlocks.map(async (block) => {
                const studentsRef = collection(db, "ACCOUNTS", "STUDENTS", block);
                const studentsSnap = await getDocs(studentsRef);
                const blockData = [];

                await Promise.all(
                    studentsSnap.docs.map(async (studentDoc) => {
                        const studentID = studentDoc.id;
                        const sData = studentDoc.data();
                        const studentName = `${sData.surname || ""}, ${sData.firstname || ""}`.trim();
                        const requirementStatuses = {};

                        // ✅ Fetch each requirement submission for this student
                        await Promise.all(
                            allRequirements.map(async (reqDoc) => {
                                const reqID = reqDoc.id;
                                const studentSubRef = collection(db, "DOCUMENTS", reqID, studentID);
                                const studentSubSnap = await getDocs(studentSubRef);

                                if (!studentSubSnap.empty) {
                                    studentSubSnap.forEach((subDoc) => {
                                        const docData = subDoc.data();
                                        const title = docData.title || "Untitled";
                                        const status = docData.docustatus || "Pending";
                                        const shortKey = reverseRequirementMap[title];
                                        if (shortKey) requirementStatuses[shortKey] = status;
                                    });
                                }
                            })
                        );

                        blockData.push({
                            studentID,
                            studentName,
                            block,
                            requirements: requirementStatuses,
                        });
                    })
                );

                results[block] = blockData;
            })
        );

        // ✅ Include due dates in the response
        res.status(200).json({ success: true, results, dueDates: dueDateMap });
    } catch (error) {
        console.error("🔥 Error fetching student progress:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});



app.get('/admin/publish-requirements', (req, res) => {
    const publishRequirements = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin-side', 'duedate.html'), 'utf-8');
    res.send(adminTemplate.replace('{{content}}', publishRequirements));
});

app.post("/save-requirement", async (req, res) => {
    try {
        const { type, title, dueDate, dueTime, datePosted, notes } = req.body;

        if (!type || !title || !dueDate) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const requirementsRef = collection(db, "REQUIREMENTS");
        await addDoc(requirementsRef, {
            type,
            title,
            dueDate,
            dueTime,
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
        const { type, title, dueDate, dueTime, notes } = req.body;

        const docRef = doc(db, "REQUIREMENTS", id);
        await updateDoc(docRef, {
            type,
            title,
            dueDate,
            dueTime,
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

app.get("/api/faculty/:facultyID/notifications", async (req, res) => {
    try {
        const { facultyID } = req.params;
        if (!facultyID) {
            return res.status(400).json({ success: false, message: "Faculty ID is required" });
        }

        const notifRef = collection(db, "NOTIFICATIONS", facultyID, "usernotif");
        const notifSnap = await getDocs(notifRef);

        const notifications = notifSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                message: data.message,
                timestamp: data.timestamp,
                notified: data.notified || false,
            };
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ success: true, notifications });
    } catch (error) {
        console.error("🔥 Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Error fetching notifications", error });
    }
});

// ✅ Mark faculty notification as read (set notified = true)
app.patch('/api/faculty/:facultyID/notifications/:notifID', async (req, res) => {
    try {
        const { facultyID, notifID } = req.params;
        const { notified } = req.body;

        if (!facultyID || !notifID) {
            return res.status(400).json({ success: false, message: 'Faculty ID and notification ID are required' });
        }

        // Firestore reference:
        // ACCOUNTS -> FACULTY -> ACCOUNTS -> facultyID -> notifications -> notifID
        const notifRef = doc(db, 'NOTIFICATIONS', facultyID, 'usernotif', notifID);

        await updateDoc(notifRef, { notified });

        res.json({ success: true, message: 'Notification status updated successfully.' });
    } catch (error) {
        console.error('🔥 Error updating notification status:', error);
        res.status(500).json({ success: false, message: 'Error updating notification status', error: error.message });
    }
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

        const allRequirements = [];

        requirementsSnap.forEach(docSnap => {
            const data = docSnap.data();
            const type = data.type || "Others";
            if (!grouped[type]) grouped[type] = [];

            const reqObj = {
                id: docSnap.id,
                title: data.title,
                description: data.notes || "",
                dueDate: data.dueDate || "",
                dueTime: data.dueTime || "",
                datePosted: data.datePosted || "",
                createdAt: data.createdAt || "",
                type: type,
                status: "To Submit"
            };

            grouped[type].push(reqObj);
            allRequirements.push(reqObj);
        });

        // Step 2: Fetch student's submitted documents in parallel
        const submittedDocs = {};
        const submissionPromises = allRequirements.map(req => {
            const docRef = collection(db, "DOCUMENTS", req.id, studentID);
            return getDocs(docRef).then(docSnap => {
                docSnap.forEach(subDoc => {
                    submittedDocs[req.id] = subDoc.data();
                });
            });
        });

        // Wait for all submissions to resolve
        await Promise.all(submissionPromises);

        console.log("📦 Requirements found:", allRequirements.length);
        console.log("📄 Submitted docs found:", Object.keys(submittedDocs).length);

        // Step 3: Merge submissions into requirements
        for (const [type, list] of Object.entries(grouped)) {
            grouped[type] = list.map(req => {
                const submitted = submittedDocs[req.id];
                return submitted
                    ? {
                        ...req,
                        status: submitted.docustatus || "Pending",
                        submittedPath: submitted.path || null,
                        createdAt: submitted.createdAt || ""
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
        const { studentID, requirementID, type, title, studentName } = req.body;

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

        // --- Fetch the single faculty ---
        const facultySnap = await getDocs(collection(db, 'ACCOUNTS', 'FACULTY', 'ACCOUNTS'));
        if (!facultySnap.empty) {
            const facultyDoc = facultySnap.docs[0]; // take the first (and only) faculty
            const facultyID = facultyDoc.id;

            const notifID = crypto.randomUUID().split('-')[0];
            const notifRef = doc(db, "NOTIFICATIONS", facultyID, "usernotif", notifID);

            const notifData = {
                title: "Document Submitted",
                message: `${studentName} uploaded a document for "${title}" in ${type}.`,
                timestamp: new Date().toISOString(),
                notified: false
            };

            await setDoc(notifRef, notifData);
            console.log(`📩 Notification saved for faculty ${facultyID}`);
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

app.get("/api/get-downloadables", async (req, res) => {
    try {
        console.log("🚀 Fetching downloadables from Firestore...");
        const snapshot = await getDocs(collection(db, "DOWNLOADABLES"));
        console.log("📄 Snapshot size:", snapshot.size);

        const downloadables = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({
            success: true,
            downloadables, // 👈 this matches what your client expects
        });
    } catch (error) {
        console.error("🔥 Error fetching downloadables:", error);
        res.status(500).json({ success: false, message: "Error fetching downloadables" });
    }
});




app.get('/partner-agency', (req, res) => {
    const partnerAgencies = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'partner-agencies.html'), 'utf-8');
    res.send(template.replace('{{content}}', partnerAgencies));
});



app.get('/review-agency', (req, res) => {
    const reviewAgency = fs.readFileSync(path.join(__dirname, '..', 'public', 'client-side', 'review-agency.html'), 'utf-8');
    res.send(template.replace('{{content}}', reviewAgency));
});

app.get("/api/get-partnersreview", async (req, res) => {
    try {
        const partnersRef = collection(db, "PARTNERS");
        const snapshot = await getDocs(partnersRef);

        const partners = [];

        for (const docSnap of snapshot.docs) {
            const partnerData = docSnap.data();
            const establishmentID = docSnap.id;

            // Fetch all student reviews for this partner
            const reviewsRef = collection(db, "REVIEWS", establishmentID, "STUDENTS");
            const reviewsSnap = await getDocs(reviewsRef);

            let totalStars = 0;
            const reviews = [];

            reviewsSnap.forEach(reviewDoc => {
                const data = reviewDoc.data();
                reviews.push({
                    firstname: data.firstname,
                    lastname: data.lastname,
                    review: data.review,
                    star: data.star,
                    createdAt: data.createdAt
                });
                totalStars += data.star || 0;
            });

            const avgRating = reviews.length > 0 ? totalStars / reviews.length : 0;

            partners.push({
                id: establishmentID,
                ...partnerData,
                reviews,
                rating: avgRating.toFixed(1)
            });
        }

        // Sort by creation date if available
        partners.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        res.json({ success: true, partners });
    } catch (error) {
        console.error("🔥 Error fetching partners:", error);
        res.status(500).json({ success: false, message: "Error fetching partners", error });
    }
});

// POST: Save Review
app.post("/api/save-review", async (req, res) => {
    try {
        const { establishmentID, studentID, firstname, lastname, review, star } = req.body;

        if (!establishmentID || !studentID) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const reviewRef = doc(db, "REVIEWS", establishmentID, "STUDENTS", studentID);
        const createdAt = new Date().toISOString();

        await setDoc(reviewRef, {
            firstname,
            lastname,
            review,
            star,
            createdAt
        });

        res.json({ success: true, message: "Review saved successfully." });
    } catch (error) {
        console.error("🔥 Error saving review:", error);
        res.status(500).json({ success: false, message: "Error saving review", error });
    }
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