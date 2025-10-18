// USER DETAILS
document.addEventListener('DOMContentLoaded', () => {
    const studentData = JSON.parse(localStorage.getItem('studentData'));
    console.log(studentData);

    if (!studentData) {
        console.warn("No student data found in localStorage.");
        return;
    }

    // Identify which page you're on
    const path = location.pathname;

    const isProgressTracker = path === '/progress-tracker';
    const isSubmission = path === '/submission';
    const isAccountPage = path === '/account';
    const isdwFormPage = path === '/downloadable-forms';
    const isPartnerAgenciesPage = path === '/partner-agency';
    const isReviewAgenciesPage = path === '/review-agency';
    const isNotificationPage = path === '/notifications';

    // Common header elements
    const headerProfile = document.getElementById('headerProfile');
    const headerName = document.querySelector('.nav-profile span');

    // 🧩 Display student info in header (for most pages)
    if (isProgressTracker || isSubmission || isAccountPage || isdwFormPage || isPartnerAgenciesPage
        || isReviewAgenciesPage || isNotificationPage
    ) {
        if (headerName) headerName.textContent = `${studentData.firstname} ${studentData.lastname}`;
        if (headerProfile) headerProfile.src = studentData.profilePic || '/assets/img/account-green.png';
    }

});

document.addEventListener('DOMContentLoaded', function () {
    // SIDEBAR
    const progressTracker = document.getElementById('progress-tracker');
    const submission = document.getElementById('submission');
    const downloadableForms = document.getElementById('downloadable-forms');
    const partnerAgencies = document.getElementById('partner-agencies');
    const notifications = document.getElementById('notifications');
    const account = document.getElementById('account');
    const logout = document.getElementById('logout');
    const path = window.location.pathname;

    if (path.includes('/progress-tracker')) {
        progressTracker.classList.remove('collapsed');
        submission.classList.add('collapsed');
        downloadableForms.classList.add('collapsed');
        partnerAgencies.classList.add('collapsed');
        notifications.classList.add('collapsed');
        account.classList.add('collapsed');
        logout.classList.add('collapsed');
    } else if (path.includes('/submission')) {
        progressTracker.classList.add('collapsed');
        submission.classList.remove('collapsed');
        downloadableForms.classList.add('collapsed');
        partnerAgencies.classList.add('collapsed');
        notifications.classList.add('collapsed');
        account.classList.add('collapsed');
        logout.classList.add('collapsed');
    } else if (path.includes('/downloadable-forms')) {
        progressTracker.classList.add('collapsed');
        submission.classList.add('collapsed');
        downloadableForms.classList.remove('collapsed');
        partnerAgencies.classList.add('collapsed');
        notifications.classList.add('collapsed');
        account.classList.add('collapsed');
        logout.classList.add('collapsed');
    } else if (path.includes('/partner-agency') || path.includes('/review-agency')) {
        progressTracker.classList.add('collapsed');
        submission.classList.add('collapsed');
        downloadableForms.classList.add('collapsed');
        partnerAgencies.classList.remove('collapsed');
        notifications.classList.add('collapsed');
        account.classList.add('collapsed');
        logout.classList.add('collapsed');
        // Highlight the correct nav-link
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-content a');

        navLinks.forEach(link => {
            if (link.getAttribute('href') === path) {
                link.classList.add('active');

                // Show the sub-nav
                const navContent = link.closest('.nav-content');
                if (navContent) {
                    navContent.classList.add('show'); // makes dropdown stay open

                    // Show parent nav-link as expanded (remove collapsed)
                    const parentLink = navContent.previousElementSibling;
                    if (parentLink) {
                        parentLink.classList.remove('collapsed');
                    }
                }
            }
        });
    } else if (path.includes('/notifications')) {
        progressTracker.classList.add('collapsed');
        submission.classList.add('collapsed');
        downloadableForms.classList.add('collapsed');
        partnerAgencies.classList.add('collapsed');
        notifications.classList.remove('collapsed');
        account.classList.add('collapsed');
        logout.classList.add('collapsed');
    } else if (path.includes('/account')) {
        progressTracker.classList.add('collapsed');
        submission.classList.add('collapsed');
        downloadableForms.classList.add('collapsed');
        partnerAgencies.classList.add('collapsed');
        notifications.classList.add('collapsed');
        account.classList.remove('collapsed');
        logout.classList.add('collapsed');
    } else if (path.includes('/logout')) {
        progressTracker.classList.add('collapsed');
        submission.classList.add('collapsed');
        downloadableForms.classList.add('collapsed');
        partnerAgencies.classList.add('collapsed');
        notifications.classList.add('collapsed');
        account.classList.add('collapsed');
        logout.classList.remove('collapsed');
    }

    // DOCUMENT SUBMISSION
    const modalTitle = document.querySelector("#submissionModal .modal-title");
    const modalDescription = document.getElementById("modaldescription");
    const overdue = document.getElementById("overdue");
    const modalFooter = document.getElementById("modalFooter");
    const submissionModal = new bootstrap.Modal(document.getElementById("submissionModal"));
    const fileUploadContainer = document.getElementById("fileUploadContainer");
    const fileUpload = document.getElementById("fileUpload");
    const invalidFiletypeMessage = document.getElementById("invalidFiletype");
    const submitFile = document.getElementById('submitFile');
    const cancelBtn = document.getElementById('cancelBtn');

    const initDocsToPass = document.getElementById("initDocsToPass");
    const preDepDocsToPass = document.getElementById("preDepDocsToPass");
    const inProgDocsToPass = document.getElementById("inProgDocsToPass");
    const finalDocsToPass = document.getElementById("finalDocsToPass");

    let requirementsByType = {
        "Initial Requirements": [],
        "Pre-Deployment Requirements": [],
        "In-Progress Requirements": [],
        "Final Requirements": []
    };

    const viewState = {
        "Initial Requirements": { showAll: false, status: "All" },
        "Pre-Deployment Requirements": { showAll: false, status: "All" },
        "In-Progress Requirements": { showAll: false, status: "All" },
        "Final Requirements": { showAll: false, status: "All" }
    };

    const statusOrder = {
        'To Submit': 'text-secondary',
        'Pending': 'text-primary',
        'Overdue': 'text-danger',
        'To Revise': 'text-warning',
        'Completed': 'text-success'
    };

    // ✅ Fetch requirements from backend
    async function fetchRequirements() {
        try {
            const studentData = JSON.parse(localStorage.getItem('studentData'));
            const studentID = studentData?.id;

            if (!studentID) {
                console.error("No student logged in");
                return;
            }

            // ✅ Call the backend endpoint
            const res = await fetch(`/api/requirements/${studentID}`);
            const result = await res.json();

            if (result.success) {
                requirementsByType = result.data;
                displayAllRequirements(); // update UI
            } else {
                console.error("Error:", result.message);
            }

        } catch (err) {
            console.error("Failed to fetch requirements:", err);
        }
    }


    // ✅ Display all categories
    function displayAllRequirements() {
        loadRequirements("initialReq", "Initial Requirements");
        loadRequirements("preDepReq", "Pre-Deployment Requirements");
        loadRequirements("inProgressReq", "In-Progress Requirements");
        loadRequirements("finalReq", "Final Requirements");

        initDocsToPass.textContent = `${countCompleted("Initial Requirements")}`;
        preDepDocsToPass.textContent = `${countCompleted("Pre-Deployment Requirements")}`;
        inProgDocsToPass.textContent = `${countCompleted("In-Progress Requirements")}`;
        finalDocsToPass.textContent = `${countCompleted("Final Requirements")}`;
    }

    function countCompleted(type) {
        const list = requirementsByType[type];
        const completed = list.filter(r => r.status === "Completed").length;
        return `${completed}/${list.length}`;
    }

    // ✅ Load requirements per category
    function loadRequirements(containerId, type) {
        const container = document.getElementById(containerId);
        const { showAll, status } = viewState[type];
        const requirements = requirementsByType[type] || [];

        container.innerHTML = '';

        // Filter by status
        const filtered = (status === "All") ? requirements : requirements.filter(r => r.status === status);

        if (filtered.length === 0) {
            container.innerHTML = "<div class='p-3 text-center'>No data to show</div>";
            return;
        }

        // Show 2 items or all
        const displayList = showAll ? filtered : filtered.slice(0, 2);

        displayList.forEach(requirement => {
            const now = new Date();
            const dueDate = new Date(requirement.dueDate);

            if (now > dueDate && !["Pending", "Completed", "To Revise"].includes(requirement.status)) {
                requirement.status = "Overdue";
                requirement.pastDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)) + " days past due";
            }

            const [datePart, timePart] = requirement.dueDate.split(',');

            const el = document.createElement("div");
            el.classList.add('p-3', 'd-flex', 'align-items-center', 'border-bottom', 'pointer');
            el.innerHTML = `
                <i class='bi bi-circle-fill me-3 ${statusOrder[requirement.status]}'></i>
                <div class='flex-grow-1'>
                    <div class='fw-bold'>${requirement.title}</div>
                    <div class='text-muted small'>${requirement.description}</div>
                </div>
                <div class='flex-grow-2 text-end'>
                    <div class='small'>Due: ${datePart} <i class="text-secondary">${timePart}</i></div>
                    <div class='badge ${statusOrder[requirement.status]} p-2'>${requirement.status}</div>
                </div>
            `;

            el.addEventListener('click', () => openModal(requirement));
            container.appendChild(el);
        });
    }

    // ✅ Dropdown filter handling
    document.querySelectorAll('.dropdown-menu .view-option').forEach(option => {
        option.addEventListener('click', function (e) {
            e.preventDefault();
            const status = this.dataset.status;
            const parentDropdown = this.closest('.dropdown');

            const map = {
                "initialDropdown": "Initial Requirements",
                "preDepDropdown": "Pre-Deployment Requirements",
                "inProgressDropdown": "In-Progress Requirements",
                "finalDropdown": "Final Requirements"
            };

            const type = map[parentDropdown.id];
            viewState[type].status = status;

            // Update dropdown label
            document.getElementById(parentDropdown.id.replace("Dropdown", "Status")).textContent = status;
            displayAllRequirements();
        });
    });

    // ✅ Show all / Show less toggles
    const showButtons = {
        "showAllInitial": "Initial Requirements",
        "showAllPreDep": "Pre-Deployment Requirements",
        "showAllInProgress": "In-Progress Requirements",
        "showAllFinal": "Final Requirements"
    };

    Object.entries(showButtons).forEach(([btnId, type]) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener("click", function () {
                viewState[type].showAll = !viewState[type].showAll;
                displayAllRequirements();
                this.textContent = viewState[type].showAll ? "Show Less" : "Show All";
            });
        }
    });

    // ✅ Modal open logic
    async function openModal(requirement) {
        selectedRequirement = requirement;
        modalTitle.textContent = requirement.title;
        modalDescription.textContent = requirement.description;

        overdue.classList.add('d-none');
        modalFooter.classList.remove('d-flex', 'justify-content-between');
        cancelBtn.classList.remove("d-none");
        submitFile.classList.remove("d-none");

        // Allow re-upload only for these statuses
        const allowedStatuses = ['To Submit', 'Pending', 'To Revise', 'Overdue'];
        const canUpload = allowedStatuses.includes(requirement.status);

        // Reset upload area
        resetUpload();

        // Check if there's already an uploaded document
        const studentData = JSON.parse(localStorage.getItem('studentData'));
        const studentID = studentData?.id;
        const requirementID = requirement.id || requirement.requirementID;

        try {
            const res = await fetch(`/api/document/${requirementID}/${studentID}`);
            const result = await res.json();

            if (result.success && result.data) {
                const data = result.data;
                showUploadedFile(data.path, canUpload);
            }
        } catch (error) {
            console.error("Error loading existing document:", error);
        }

        // Overdue visual
        if (requirement.status === 'Overdue') {
            overdue.classList.remove('d-none');
            overdue.textContent = `Overdue: ${requirement.pastDue}`;
            modalFooter.classList.add('d-flex', 'justify-content-between');
        }

        submissionModal.show();
    }

    function showUploadedFile(filePath, canUpload) {
        const ext = filePath.split('.').pop().toLowerCase();
        let previewHTML = '';

        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
            previewHTML = `<img src="${filePath}" class="img-fluid mb-2" style="max-height:300px;">`;
        } else if (ext === 'pdf') {
            previewHTML = `<iframe src="${filePath}" class="w-100" style="height:300px;"></iframe>`;
        } else {
            previewHTML = `<i class="bi bi-file-earmark-word" style="font-size:30px;color:#2B579A;"></i>`;
        }

        fileUploadContainer.innerHTML = `
        <div class="file-preview-wrapper">
            ${previewHTML}
            <span class="file-preview-name pointer" onclick="window.open('${filePath}')">${filePath.split('/').pop()}</span>
            ${canUpload ? `<button class="close-preview fs-4" title="Remove">&times;</button>` : ''}
        </div>
    `;

        if (canUpload) {
            fileUploadContainer.querySelector(".close-preview").addEventListener("click", resetUpload);
        } else {
            // disable upload entirely if status is Completed
            fileUploadContainer.innerHTML += `<p class="text-muted small mt-2">Completed requirement</p>`;
            cancelBtn.classList.add("d-none");
            submitFile.classList.add("d-none");
        }
    }


    // ✅ File upload handling
    document.getElementById("fileUploadBtn").addEventListener("click", () => fileUpload.click());

    fileUpload.addEventListener("change", e => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg', 'image/png', 'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            invalidFiletypeMessage.classList.remove("d-none");
            return;
        }

        invalidFiletypeMessage.classList.add("d-none");

        const fileURL = URL.createObjectURL(file);
        let previewHTML = "";

        if (file.type.startsWith("image/")) {
            previewHTML = `<img src="${fileURL}" class="img-fluid mb-2" style="max-height:300px;">`;
        } else if (file.type === "application/pdf") {
            previewHTML = `<iframe src="${fileURL}" type="application/pdf"></iframe>`;
        } else {
            previewHTML = `<i class="bi bi-file-earmark-word" style="font-size:30px;color:#2B579A;"></i>`;
        }

        fileUploadContainer.innerHTML = `
            <div class="file-preview-wrapper">
                ${previewHTML}
                <span class="file-preview-name pointer" onclick="window.open('${fileURL}')">${file.name}</span>
                <button class="close-preview fs-4" title="Remove">&times;</button>
            </div>
        `;

        fileUploadContainer.querySelector(".close-preview").addEventListener("click", resetUpload);
    }

    function resetUpload() {
        fileUpload.value = "";
        fileUploadContainer.innerHTML = `<button id="fileUploadBtn" class="btn btn-outline-dark btn-rounded"><i class="bi bi-upload me-2"></i>Upload File</button>`;
        document.getElementById("fileUploadBtn").addEventListener("click", () => fileUpload.click());
    }

    submitFile.addEventListener('click', async () => {
        if (!fileUpload.files.length) return alert("Please select a file.");

        const file = fileUpload.files[0];
        const studentData = JSON.parse(localStorage.getItem('studentData'));
        const studentID = studentData?.id;
        const requirementID = selectedRequirement.id || selectedRequirement.requirementID;
        const type = selectedRequirement.type;
        const title = selectedRequirement.title;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('studentID', studentID);
        formData.append('requirementID', requirementID);
        formData.append('type', type);
        formData.append('title', title);

        try {
            const res = await fetch('/api/upload-document', {
                method: 'POST',
                body: formData
            });

            const result = await res.json();

            if (result.success) {
                selectedRequirement.status = "Pending";
                submissionModal.hide();
                displayAllRequirements();
                localStorage.setItem('lastUploadPath', result.path);
            } else {
                alert("Failed to upload document.");
            }
        } catch (err) {
            console.error("Error uploading file:", err);
            alert("Error uploading file");
        }
    });

    // ✅ Reset modal when closed
    document.getElementById('submissionModal').addEventListener("hidden.bs.modal", () => {
        resetUpload();
        invalidFiletypeMessage.classList.add("d-none");
    });

    fetchRequirements();
});

// DOWNLOADABLE FORMS
document.addEventListener('DOMContentLoaded', function () {
    const allDocuments = {
        initDocuments: [
            { name: "Project PDF1", file: "assets/img/sample-file.pdf" },
            { name: "Lecture Notes", file: "assets/img/a.png" },
            { name: "Annual Report", file: "assets/img/sample-file.docx" },
            { name: "Meeting Minutes", file: "assets/img/sample-file.docx" },
            { name: "Research Paper", file: "assets/img/sample-file.docx" },
            { name: "Summary Report", file: "assets/img/sample-file.docx" },
            { name: "User Guide", file: "assets/img/sample-file.docx" },
            { name: "Invoice", file: "assets/img/sample-file.docx" },
            { name: "Presentation", file: "assets/img/sample-file.docx" },
            { name: "Proposal", file: "assets/img/sample-file.docx" }
        ],
        preDepDocuments: [
            { name: "Project PDF2", file: "assets/img/sample-file.pdf" },
            { name: "Lecture Notes", file: "assets/img/a.png" },
            { name: "Annual Report", file: "assets/img/sample-file.docx" },
            { name: "Meeting Minutes", file: "assets/img/sample-file.docx" },
            { name: "Research Paper", file: "assets/img/sample-file.docx" },
            { name: "Summary Report", file: "assets/img/sample-file.docx" },
            { name: "User Guide", file: "assets/img/sample-file.docx" },
            { name: "Invoice", file: "assets/img/sample-file.docx" },
            { name: "Presentation", file: "assets/img/sample-file.docx" },
            { name: "Proposal", file: "assets/img/sample-file.docx" }
        ],
        inProgDocuments: [
            { name: "Project PDF3", file: "assets/img/sample-file.pdf" },
            { name: "Lecture Notes", file: "assets/img/a.png" },
            { name: "Annual Report", file: "assets/img/sample-file.docx" },
            { name: "Meeting Minutes", file: "assets/img/sample-file.docx" },
            { name: "Research Paper", file: "assets/img/sample-file.docx" },
            { name: "Summary Report", file: "assets/img/sample-file.docx" },
            { name: "User Guide", file: "assets/img/sample-file.docx" },
            { name: "Invoice", file: "assets/img/sample-file.docx" },
            { name: "Presentation", file: "assets/img/sample-file.docx" },
            { name: "Proposal", file: "assets/img/sample-file.docx" }
        ],
        finalDocuments: [
            { name: "Project PDF4", file: "assets/img/sample-file.pdf" },
            { name: "Lecture Notes", file: "assets/img/a.png" },
            { name: "Annual Report", file: "assets/img/sample-file.docx" },
            { name: "Meeting Minutes", file: "assets/img/sample-file.docx" },
            { name: "Research Paper", file: "assets/img/sample-file.docx" },
            { name: "Summary Report", file: "assets/img/sample-file.docx" },
            { name: "User Guide", file: "assets/img/sample-file.docx" },
            { name: "Invoice", file: "assets/img/sample-file.docx" },
            { name: "Presentation", file: "assets/img/sample-file.docx" },
            { name: "Proposal", file: "assets/img/sample-file.docx" }
        ]
    };

    function createDocumentCards(containerId, documents) {
        const cardContainer = document.getElementById(containerId);
        if (!cardContainer) return;

        documents.forEach(doc => {
            const fileExtension = doc.file.split('.').pop().toLowerCase();
            let previewHTML = "";

            if (fileExtension === "pdf") {
                previewHTML = `
                    <div class="preview-container" onclick="window.open('${doc.file}', '${doc.name}')">
                        <iframe src="${doc.file}#toolbar=0&navpanes=0&scrollbar=0"></iframe>
                    </div>
                `;
            } else if (["png", "jpg", "jpeg"].includes(fileExtension)) {
                previewHTML = `
                    <div class="preview-container" onclick="window.open('${doc.file}', '${doc.name}')">
                        <img src="${doc.file}" alt="${doc.name}" style="width: 100%; height: 130px; object-fit: cover;" />
                    </div>
                `;
            } else if (fileExtension === "docx") {
                previewHTML = `
                    <div class="placeholder-docx" onclick="window.open('${doc.file}', '${doc.name}')">
                        <i class="bi bi-file-earmark-word" style="font-size: 50px; color: #2B579A;"></i>
                    </div>
                `;
            } else {
                previewHTML = `
                    <div class="placeholder-docx" onclick="window.open('${doc.file}', '${doc.name}')">
                        No Preview Available
                    </div>
                `;
            }

            const card = document.createElement("div");
            card.className = "col-md-3";
            card.innerHTML = `
                <div class="card shadow-sm h-100 mt-0">
                    ${previewHTML}
                    <div class="card-body text-center">
                        <h5 class="card-title">${doc.name}</h5>
                        <a href="${doc.file}" download class="btn btn-primary">Download</a>
                    </div>
                </div>
            `;

            cardContainer.appendChild(card);
        });
    }

    // Loop through all document sets
    for (const [containerId, documents] of Object.entries(allDocuments)) {
        createDocumentCards(containerId, documents);
    }
});



// PARTNER AGENCIES
document.addEventListener('DOMContentLoaded', function () {
    const agencies = [
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 Support1 IT Support1 slots lef slots lef slots lef slots lef slots lef slots lef slots lef slots lef slots lef IT Support1 IT Support", description: "Description", rating: "5/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5" },
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 IT Support, 3 Data Analyst, 1 Full Stack Web Developer", description: "Description", description: "Description", rating: "4/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5" },
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 IT Support, 3 Data Analyst, 1 Full Stack Web Developer", description: "DescripDescriptionDescripti  Description Description DescriptiononDescriptionDescription Description DescriptiontionDescripDescriptionDescripti  Description Description DescriptiononDescriptionDescription Description DescriptiontionDescripDescriptionDescripti  Description Description DescriptiononDescriptionDescription Description DescriptiontionDescripDescriptionDescripti  Description Description DescriptiononDescriptionDescription Description Descriptiontion ", rating: "5/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5" },
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 IT Support, 3 Data Analyst, 1 Full Stack Web Developer", description: "Description", rating: "3/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5" },
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 IT Support, 3 Data Analyst, 1 Full Stack Web Developer", description: "Description", rating: "3/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: AccomodatingAccomodatingAccomodatingAccomodating AccomodatingAccomodatingAccomodatingAccomodatingAccomodatingAccomodating AccomodatingAccomodatingAccomodatingAccomodating AccomodatingAccomodating | Rating: 3/5" },
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 IT Support, 3 Data Analyst, 1 Full Stack Web Developer", description: "Description", rating: "1/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5" },
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 IT Support, 3 Data Analyst, 1 Full Stack Web Developer", description: "Description", rating: "2/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5" },
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 IT Support, 3 Data Analyst, 1 Full Stack Web Developer", description: "Description", rating: "4/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5" },
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 IT Support, 3 Data Analyst, 1 Full Stack Web Developer", description: "Description", rating: "1/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5" },
        { name: "Our Lady of Lourdes College Foundation", address: "Daet, Camarines Norte", position: "1 IT Support, 3 Data Analyst, 1 Full Stack Web Developer", description: "Description", rating: "2/5", reviews: "Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5, Name: Annika | Review: Accomodating | Rating: 3/5" }
    ];

    // PARTNER AGENCY
    const agencyContainer = document.getElementById('agenciesCards');
    agencies.forEach(agency => {
        const agencyCard = document.createElement("div");
        agencyCard.className = "col-md-3";
        agencyCard.innerHTML = `
            <div class="agencyCard mt-0 card shadow-sm">
                <div class="card-body text-center">
                    <i class="bi bi-building fs-3 dark-purple"></i>
                    <div id="agencyNameCard">${agency.name}</div>
                    <div id="agencyAddressCard" class="text-muted">${agency.address}</div>
                </div>
            </div>
        `;

        if (agencyContainer) {
            agencyContainer.appendChild(agencyCard);
            console.log('Agency displayed');
        }


        agencyCard.addEventListener('click', function () {
            const agencyModal = new bootstrap.Modal(document.getElementById('agencyModal'));
            const modalTitle = document.querySelector('#agencyModal .modal-title');
            const agencyName = document.getElementById('agencyName');
            const agencyAddress = document.getElementById('agencyAddress');
            const positionNeeded = document.getElementById('positionNeeded');
            const agencyDescription = document.getElementById('agencyDescription');

            modalTitle.textContent = agency.name;
            agencyName.textContent = agency.name;
            agencyAddress.textContent = agency.address;

            const position = agency.position.split(',').map(pos => `<li>${pos.trim()}</li>`).join('');
            positionNeeded.innerHTML = `<ul">${position}</ul>`;
            agencyDescription.textContent = agency.description;
            agencyModal.show();

        });
    });


    // REVIEW AGENCY
    const reviewContainer = document.getElementById('reviewAgenciesCards');
    agencies.forEach(agency => {
        const reviewCard = document.createElement("div");
        reviewCard.className = "col-md-3";

        // Build stars dynamically
        let starsHTML = '';
        const rating = parseFloat(agency.rating);
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHTML += `<i class="bi bi-star-fill text-warning"></i>`;
            } else {
                starsHTML += `<i class="bi bi-star" style="color: #e4e5e9;"></i>`;
            }
        }

        reviewCard.innerHTML = `
            <div class="agencyCard mt-0 g-0 card shadow-sm">
                <div class="card-body text-center">
                <i class="bi bi-building fs-3 dark-purple"></i>
                    <div id="reviewNameCard">${agency.name}</div>
                    <div id="reviewAddressCard" class="text-muted">${agency.address}</div>
                </div>
                <div class="text-center mt-0" id="rating">
                    <div class="stars">${starsHTML}</div>
                    <div>${agency.rating}</div>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-outline-primary btn-sm">Review</button>
                </div>
            </div>
        `;

        if (reviewContainer) {
            reviewContainer.appendChild(reviewCard);
        }

        const button = reviewCard.querySelector("button");
        button.addEventListener("click", () => {
            document.getElementById("reviewAgenciesCards").style.display = "none";
            document.getElementById("reviewSelectedCard").style.display = "flex";

            // reft side
            document.getElementById("reviewAgencyName").innerText = agency.name;

            const rating = parseFloat(agency.rating);
            const fullStars = Math.floor(rating);
            const hasHalf = rating % 1 >= 0.5;

            let starsHTML = "";
            for (let i = 1; i <= 5; i++) {
                if (i <= fullStars) {
                    starsHTML += `<i class="bi bi-star-fill text-warning"></i>`;
                } else {
                    starsHTML += `<i class="bi bi-star" style="color: #e4e5e9;"></i>`;
                }
            }

            document.getElementById("reviewStars").innerHTML = starsHTML;
            document.getElementById("reviewRatingValue").innerText = `${agency.rating}`;

            // right side
            const reviewsContainer = document.getElementById("reviewsContainer");
            reviewsContainer.innerHTML = "";

            const reviewList = agency.reviews.split(",").map(r => r.trim());
            reviewList.forEach(review => {
                const [namePart, descPart, ratingPart] = review.split("|").map(item => item.trim());
                const reviewer = namePart.replace("Name: ", "");
                const desc = descPart.replace("Review: ", "");
                const reviewRating = parseFloat(ratingPart.replace("Rating: ", "").split("/")[0]);

                let reviewStars = "";
                const reviewFullStars = Math.floor(reviewRating);
                const reviewHalf = reviewRating % 1 >= 0.5;
                for (let i = 1; i <= 5; i++) {
                    if (i <= reviewFullStars) {
                        reviewStars += `<i class="bi bi-star-fill text-warning"></i>`;
                    } else {
                        reviewStars += `<i class="bi bi-star" style="color: #e4e5e9;"></i>`;
                    }
                }

                const reviewCard = document.createElement("div");
                reviewCard.className = "card mb-2 p-2";
                reviewCard.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mt-0">
                    <strong>${reviewer}</strong>
                    <div>${reviewStars}</div>
                    </div>
                    <p class="mb-0 small text-muted clamped-text">${desc}</p>
                `;
                reviewsContainer.appendChild(reviewCard);
            });
        });

        reviewAgenciesCards.appendChild(reviewCard);
    });

    const agencyBack = document.getElementById('agencyBack');
    agencyBack.addEventListener('click', function () {
        document.getElementById("reviewSelectedCard").style.display = "none";
        document.getElementById("reviewAgenciesCards").style.display = "flex";
    })


    // wrire review
    const stars = document.querySelectorAll(".star");
    const rating = document.getElementById("totalRating");
    let activeStars = 0;

    stars.forEach((star, index) => {
        star.addEventListener("click", () => {
            const icon = star.querySelector("i");
            const isSelected = icon.classList.contains("bi-star-fill");

            if (isSelected) {
                for (let i = index; i < stars.length; i++) {
                    const iTag = stars[i].querySelector("i");
                    iTag.classList.remove("bi-star-fill", "text-warning");
                    iTag.classList.add("bi-star");

                }
            } else {
                for (let i = 0; i <= index; i++) {
                    const iTag = stars[i].querySelector("i");
                    iTag.classList.remove("bi-star");
                    iTag.classList.add("bi-star-fill", "text-warning");
                }
            }

            // Count active stars
            activeStars = 0;
            stars.forEach(star => {
                const iTag = star.querySelector("i");
                if (iTag.classList.contains("bi-star-fill")) {
                    activeStars++;
                }
            });

            rating.textContent = activeStars;
        });
    });

    const submit = document.getElementById('submitReview');
    submit.addEventListener('click', function () {
        const review = document.getElementById('review');
        const reviewValue = review.value;
        const reviewsContainer = document.getElementById("reviewsContainer");

        if (reviewValue === '' && activeStars === 0) {
            alert("Please leave a review or select stars!");
            return;
        }

        // Create review card
        const reviewCard = document.createElement("div");
        reviewCard.className = "card mb-2 p-2";


        // Create stars HTML dynamically
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= activeStars) {
                starsHTML += `<i class="bi bi-star-fill text-warning"></i>`;
            } else {
                starsHTML += `<i class="bi bi-star" style="color: #e4e5e9;"></i>`;
            }
        }

        reviewCard.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <strong>AccountName</strong>
                <div class="text-muted">${starsHTML}</div>
            </div>
            <p class="mb-0 small text-muted text-wrap clamped-text">${reviewValue}</p>
        `;

        reviewsContainer.appendChild(reviewCard);

        // Reset form
        review.value = "";
        stars.forEach(star => {
            const iTag = star.querySelector("i");
            iTag.classList.remove("bi-star-fill", "text-warning");
            iTag.classList.add("bi-star");
        });
        rating.textContent = "0";
        activeStars = 0;

        // Toggle expand/collapse on review text
        document.addEventListener("click", function (e) {
            if (e.target.classList.contains("clamped-text")) {
                e.target.classList.toggle("expanded");
            }
        });


        // Add see more/less toggle
        reviewsContainer.querySelectorAll(".clamped-text").forEach(p => {
            // Check if content overflows
            if (p.scrollHeight > p.clientHeight) {
                const toggle = document.createElement("span");
                toggle.className = "see-toggle";
                toggle.textContent = " See more";

                toggle.addEventListener("click", () => {
                    if (p.classList.contains("expanded")) {
                        p.classList.remove("expanded");
                        toggle.textContent = " See more";
                    } else {
                        p.classList.add("expanded");
                        toggle.textContent = " See less";
                    }
                });

                p.after(toggle);
            }
        });


    });

    // Toggle expand/collapse on review text
    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("clamped-text")) {
            if (e.target.style.webkitLineClamp === "unset") {
                e.target.style.display = "-webkit-box";
                e.target.style.webkitLineClamp = "7";
            } else {
                e.target.style.display = "block";
                e.target.style.webkitLineClamp = "unset";
            }
        }
    });


});

// NOTIFICATIONS

document.addEventListener('DOMContentLoaded', function () {
    const notifications = [
        {
            title: 'A New Requirement has been posted.',
            description: 'Insurance: 3 photocopies ...',
            time: '1 minute ago',
        },
        {
            title: 'A New Requirement has been posted.',
            description: 'Insurance: 3 photocopies ...',
            time: '20 minute ago',
        },
        {
            title: 'A New Requirement has been posted.',
            description: 'Insurance: 3 photocopies ...',
            time: '1 hour ago',
        },
        {
            title: 'A New Requirement has been posted.',
            description: 'Insurance: 3 photocopies ...',
            time: '5 hours ago',
        },
        {
            title: 'A New Requirement has been posted.',
            description: 'Insurance: 3 photocopies ...',
            time: '3 days ago',
        },
        {
            title: 'A New Requirement has been posted.',
            description: 'Insurance: 3 photocopies ...',
            time: '5 days ago',
        },
        {
            title: 'A New Requirement has been posted.',
            description: 'Insurance: 3 photocopies ...',
            time: '2 weeks ago',
        },
    ];

    // Function to load notifications dynamically
    function loadNotifications() {
        const recentContainer = document.getElementById('recentBody');
        const earlierContainer = document.getElementById('earlierBody');

        // Limit the recent notifications to the first 4 items
        const recentNotifications = notifications.slice(0, 4);
        const earlierNotifications = notifications.slice(4);

        // Helper function to create notification HTML
        function createNotificationHTML(notification) {
            return `
              <div class="p-3 d-flex align-items-start justify-content-between border-bottom osahan-post-header">
                  <i class="bi bi-bell-fill me-3 mt-1"></i>
                  <div class="flex-grow-1">
                      <div class="fw-bold">${notification.title}</div>
                      <div class="small notification">${notification.description}</div>
                      <div class="text-muted small pt-1">${notification.time}</div>
                  </div>
                  <div class="dropdown">
                      <button type="button" class="btn btn-sm rounded" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                          <i class="bi bi-three-dots"></i>
                      </button>
                      <div class="dropdown-menu dropdown-menu-end">
                          <button class="dropdown-item" type="button"><i class="mdi mdi-delete"></i> Delete</button>
                          <button class="dropdown-item" type="button"><i class="mdi mdi-close"></i> Turn Off</button>
                      </div>
                  </div>
              </div>
            `;
        }


        // Load recent notifications (up to 4)
        recentNotifications.forEach(notification => {
            recentContainer.classList.add('bg-light')
            recentContainer.insertAdjacentHTML('beforeend', createNotificationHTML(notification));
        });

        // Load earlier notifications (any after the 4th)
        earlierNotifications.forEach(notification => {
            earlierContainer.insertAdjacentHTML('beforeend', createNotificationHTML(notification));
        });
    }

    loadNotifications();
});


// PROGRESS TRACKER

document.addEventListener('DOMContentLoaded', function () {

    //   progress table

    const initRequirements = [
        { title: 'Requirement 1', dueDate: '10/20/2025, 11:59 PM', status: 'Completed', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 2', dueDate: '10/20/2025, 11:59 PM', status: 'To Submit', dateSubmitted: '' },
        { title: 'Requirement 3', dueDate: '10/20/2025, 11:59 PM', status: 'Pending', dateSubmitted: '' },
        { title: 'Requirement 4', dueDate: '10/20/2025, 11:59 PM', status: 'Completed', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 5', dueDate: '10/20/2025, 11:59 PM', status: 'Overdue', dateSubmitted: '' },
        { title: 'Requirement 6', dueDate: '10/20/2025, 11:59 PM', status: 'To Revise', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 5', dueDate: '10/20/2025, 11:59 PM', status: 'Overdue', dateSubmitted: '' },
        { title: 'Requirement 6', dueDate: '10/20/2025, 11:59 PM', status: 'To Revise', dateSubmitted: '10/20/2025, 11:58 PM' }
    ];

    const preDepRequirements = [
        { title: 'Requirement 1', dueDate: '10/20/2025, 11:59 PM', status: 'Completed', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 2', dueDate: '10/20/2025, 11:59 PM', status: 'To Submit', dateSubmitted: '' },
        { title: 'Requirement 3', dueDate: '10/20/2025, 11:59 PM', status: 'Pending', dateSubmitted: '' },
        { title: 'Requirement 4', dueDate: '10/20/2025, 11:59 PM', status: 'Completed', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 5', dueDate: '10/20/2025, 11:59 PM', status: 'Overdue', dateSubmitted: '' },
        { title: 'Requirement 6', dueDate: '10/20/2025, 11:59 PM', status: 'To Revise', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 5', dueDate: '10/20/2025, 11:59 PM', status: 'Overdue', dateSubmitted: '' },
        { title: 'Requirement 6', dueDate: '10/20/2025, 11:59 PM', status: 'To Revise', dateSubmitted: '10/20/2025, 11:58 PM' }
    ];


    const inProgressRequirements = [
        { title: 'Requirement 1', dueDate: '10/20/2025, 11:59 PM', status: 'Completed', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 2', dueDate: '10/20/2025, 11:59 PM', status: 'To Submit', dateSubmitted: '' },
        { title: 'Requirement 3', dueDate: '10/20/2025, 11:59 PM', status: 'Pending', dateSubmitted: '' },
        { title: 'Requirement 4', dueDate: '10/20/2025, 11:59 PM', status: 'Completed', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 5', dueDate: '10/20/2025, 11:59 PM', status: 'Overdue', dateSubmitted: '' },
        { title: 'Requirement 6', dueDate: '10/20/2025, 11:59 PM', status: 'To Revise', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 5', dueDate: '10/20/2025, 11:59 PM', status: 'Overdue', dateSubmitted: '' },
        { title: 'Requirement 6', dueDate: '10/20/2025, 11:59 PM', status: 'To Revise', dateSubmitted: '10/20/2025, 11:58 PM' }
    ];


    const finalRequirements = [
        { title: 'Requirement 1', dueDate: '10/20/2025, 11:59 PM', status: 'Completed', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 2', dueDate: '10/20/2025, 11:59 PM', status: 'Pending', dateSubmitted: '' },
        { title: 'Requirement 3', dueDate: '10/20/2025, 11:59 PM', status: 'To Submit', dateSubmitted: '' },
        { title: 'Requirement 4', dueDate: '10/20/2025, 11:59 PM', status: 'Completed', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 5', dueDate: '10/20/2025, 11:59 PM', status: 'Overdue', dateSubmitted: '' },
        { title: 'Requirement 6', dueDate: '10/20/2025, 11:59 PM', status: 'To Revise', dateSubmitted: '10/20/2025, 11:58 PM' },
        { title: 'Requirement 5', dueDate: '10/20/2025, 11:59 PM', status: 'Overdue', dateSubmitted: '' },
        { title: 'Requirement 6', dueDate: '10/20/2025, 11:59 PM', status: 'To Revise', dateSubmitted: '10/20/2025, 11:58 PM' }
    ];

    const statusOrder = {
        'To Submit': 'bg-secondary',
        'Pending': 'bg-primary',
        'Overdue': 'bg-danger',
        'To Revise': 'bg-warning text-dark',
        'Completed': 'bg-success'
    };

    let initialStatus = "All";
    let preDepStatus = "All";
    let inProgressStatus = "All";
    let finalStatus = "All";

    function showTableData(tableID, requirements, statusFilter) {
        const tbody = document.getElementById(tableID);
        tbody.innerHTML = "";

        const filtered = statusFilter === "All" ? requirements : requirements.filter(req => req.status === statusFilter);

        if (filtered.length === 0) {
            container.innerHTML = "<td class='p-3 text-center col-md-12'>No data to show</td>";
            return;
        }

        filtered.forEach(req => {
            const row = document.createElement("tr");

            const badgeClass = statusOrder[req.status] || 'bg-secondary';
            const statusCell = `<td><span class="badge ${badgeClass}">${req.status}</span></td>`;
            const nameCell = `<td>${req.title}</td>`;
            let dueDateCell = `<td></td>`;

            if (req.dueDate) {
                const [date, time] = req.dueDate.split(', ');
                dueDateCell = `<td>${date} <span class="text-muted fst-italic">${time}</span></td>`;
            }

            let submittedCell = '<td></td>';
            if (req.dateSubmitted) {
                const [date, time] = req.dateSubmitted.split(', ');
                submittedCell = `<td>${date} <span class="text-muted fst-italic">${time}</span></td>`;
            }

            row.innerHTML = statusCell + nameCell + dueDateCell + submittedCell;
            tbody.appendChild(row);
        });
    }

    // status dropdown
    document.querySelectorAll('.dropdown-menu .view-option').forEach(option => {
        option.addEventListener('click', function (e) {
            e.preventDefault();
            const status = this.dataset.status;
            const parentDropdown = this.closest('.dropdown');

            if (parentDropdown.id === "initialDropdown") {
                initialStatus = status;
                document.getElementById("initialStatus").textContent = status;
                showTableData('initBody', initRequirements, initialStatus);

            } else if (parentDropdown.id === "preDepDropdown") {
                preDepStatus = status;
                document.getElementById("preDepStatus").textContent = status;
                showTableData('preDepBody', preDepRequirements, preDepStatus);

            } else if (parentDropdown.id === "inProgressDropdown") {
                inProgressStatus = status;
                document.getElementById("inProgressStatus").textContent = status;
                showTableData('inProgressBody', inProgressRequirements, inProgressStatus);
            } else if (parentDropdown.id === "finalDropdown") {
                finalStatus = status;
                document.getElementById("finalStatus").textContent = status;
                showTableData('finalBody', finalRequirements, finalStatus);
            }

        });
    });

    showTableData('initBody', initRequirements, initialStatus);
    showTableData('preDepBody', preDepRequirements, preDepStatus);
    showTableData('inProgressBody', inProgressRequirements, inProgressStatus);
    showTableData('finalBody', finalRequirements, finalStatus);


    // progess circle

    function calculateProgress(requirements) {
        const total = requirements.length;
        const completed = requirements.filter(r => r.status === "Completed").length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        return {
            completed,
            total,
            percent,
            progressText: `${completed}/${total}`
        };
    }

    const progressData = [
        { label: "Initial", color: "blue", ...calculateProgress(initRequirements) },
        { label: "Pre-Deployment", color: "yellow", ...calculateProgress(preDepRequirements) },
        { label: "In-Progress", color: "red", ...calculateProgress(inProgressRequirements) },
        { label: "Final", color: "purple", ...calculateProgress(finalRequirements) }
    ];

    const progressCardsContainer = document.getElementById('progressCards');

    progressData.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'col-md-3 mb-4';
        card.innerHTML = `
            <div class="card text-center progress-card">
            <div class="card-body">
                <div class="progress ${item.color}" id="progress-${index}">
                <span class="progress-left">
                    <span class="progress-bar"></span>
                </span>
                <span class="progress-right">
                    <span class="progress-bar"></span>
                </span>
                <div class="progress-value">${item.percent}%</div>
                </div>
                <p class="mt-3 mb-0 fw-bold">${item.label} <br> Requirements</p>
                <p class="text-muted fs-6 mb-0"><small>${item.progressText}<small></p>
            </div>
            </div>
        `;
        progressCardsContainer.appendChild(card);

        // Animate circle
        const rightBar = card.querySelector('.progress-right .progress-bar');
        const leftBar = card.querySelector('.progress-left .progress-bar');

        if (item.percent <= 50) {
            const rightDeg = (item.percent / 100) * 360;
            rightBar.style.transform = `rotate(${rightDeg}deg)`;
            leftBar.style.transform = 'rotate(0deg)';
        } else {
            rightBar.style.transform = 'rotate(180deg)';
            const leftDeg = ((item.percent - 50) / 100) * 360;
            leftBar.style.transform = `rotate(${leftDeg}deg)`;
        }
    });
});

// PROFILE
document.addEventListener('DOMContentLoaded', function () {
    // EDIT PROFILE
    const profileUpload = document.getElementById('uploadProfile');
    const deleteProfile = document.getElementById('deleteProfile');
    const profileInput = document.getElementById('profileInput');
    const profileImage = document.querySelector('.profile-img');

    // save changes
    const saveEdit = document.getElementById('editDetails');

    const usernameEdit = document.getElementById('usernameEdit');
    const companyNameEdit = document.getElementById('companyNameEdit');
    const companyAddressEdit = document.getElementById('companyAddressEdit');
    const emailEdit = document.getElementById('emailEdit');
    const phoneNumEdit = document.getElementById('phoneNumEdit');

    const username = document.getElementById('username');
    const companyName = document.getElementById('companyName');
    const companyAddress = document.getElementById('companyAddress');
    const email = document.getElementById('email');
    const phoneNumber = document.getElementById('phoneNumber');

    const formValidation = document.getElementById('editProfileForm');

    const profilecompanyName = document.getElementById('profilecompanyName');
    const headerCompanyName = document.getElementById('headerCompanyName');
    const headerProfileImg = document.getElementById('headerProfileImg');
    const ProfileImgDisplay = document.getElementById('profileDisplay');
    const defaultImage = "/assets/img/account.png";

    let isEditing = false;
    let uploadedImageURL = defaultImage;

    profileUpload.disabled = true;
    profileUpload.style.pointerEvents = 'none';
    deleteProfile.disabled = true;
    deleteProfile.style.pointerEvents = 'none';

    saveEdit.addEventListener('click', function () {
        if (!isEditing) {
            profileUpload.disabled = false;
            profileUpload.style.pointerEvents = 'auto';
            deleteProfile.style.pointerEvents = 'auto';
            deleteProfile.disabled = false;

            profileUpload.addEventListener("click", function (event) {
                event.preventDefault();
                profileInput.click();
            });

            profileInput.addEventListener("change", function (event) {
                if (event.target.files.length > 0) {
                    const file = event.target.files[0];
                    uploadedImageURL = URL.createObjectURL(file);
                    profileImage.src = uploadedImageURL;
                }
            });

            deleteProfile.addEventListener('click', function () {
                const storedUser = JSON.parse(localStorage.getItem("user"));
                const userID = storedUser?.userID;

                if (!userID) return;
                profileImage.src = defaultImage;
                profileInput.value = "";
                uploadedImageURL = defaultImage;

                fetch('/delete-profile-pic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userID })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            console.log('Profile picture deleted successfully.');
                        } else {
                            console.error('Error deleting profile picture:', data.message);
                        }
                    })
                    .catch(err => console.error('Error:', err));
            });


            usernameEdit.readOnly = false;
            companyNameEdit.readOnly = false;
            companyAddressEdit.readOnly = false;
            emailEdit.readOnly = false;
            phoneNumEdit.readOnly = false;

            usernameEdit.focus();
            saveEdit.textContent = "Save Changes";

        } else {
            if (!formValidation.checkValidity()) {
                formValidation.classList.add("was-validated");
                return;
            }

            const storedUser = JSON.parse(localStorage.getItem("user"));
            const userID = storedUser?.userID;

            const formData = new FormData();
            formData.append("userID", userID);
            formData.append("username", usernameEdit.value.trim());
            formData.append("companyName", companyNameEdit.value.trim());
            formData.append("companyAddress", companyAddressEdit.value.trim());
            formData.append("email", emailEdit.value.trim());
            formData.append("phoneNumber", phoneNumEdit.value.trim());

            if (profileInput.files.length > 0) {
                formData.append("profilePic", profileInput.files[0]);
            }

            fetch('/update-profile', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Profile updated successfully.');

                        username.textContent = usernameEdit.value.trim();
                        companyName.textContent = companyNameEdit.value.trim();
                        companyAddress.textContent = companyAddressEdit.value.trim();
                        email.textContent = emailEdit.value.trim();
                        phoneNumber.textContent = phoneNumEdit.value.trim();

                        profilecompanyName.textContent = companyNameEdit.value.trim();
                        headerCompanyName.textContent = companyNameEdit.value.trim();

                        const imagePath = data.profilepicPath || uploadedImageURL;
                        profileImage.src = imagePath;
                        ProfileImgDisplay.src = imagePath;
                        headerProfileImg.src = imagePath;

                        location.reload()
                    } else {
                        console.error('Error updating profile:', data.message);
                    }
                })
                .catch(error => console.error('Error:', error));

            // Disable editing
            usernameEdit.readOnly = true;
            companyNameEdit.readOnly = true;
            companyAddressEdit.readOnly = true;
            emailEdit.readOnly = true;
            phoneNumEdit.readOnly = true;

            profileUpload.disabled = true;
            profileUpload.style.pointerEvents = 'none';
            deleteProfile.disabled = true;
            deleteProfile.style.pointerEvents = 'none';

            saveEdit.textContent = "Edit Details";
        }

        isEditing = !isEditing;
    });


    //CHANGE PASSWORD
    document.querySelector('#profile-change-password form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const storedUser = JSON.parse(localStorage.getItem("user"));
        const userID = storedUser?.userID;
        const currentPasswordInput = document.getElementById("currentPassword");
        const newPasswordInput = document.getElementById("newPassword");
        const renewPasswordInput = document.getElementById("renewPassword");

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const renewPassword = renewPasswordInput.value;

        const currentFeedback = document.getElementById("currentPasswordFeedback");
        const newFeedback = document.getElementById("newPasswordFeedback");
        const renewFeedback = document.getElementById("renewPasswordFeedback");

        [currentPasswordInput, newPasswordInput, renewPasswordInput].forEach(input => input.classList.remove("is-invalid"));
        [currentFeedback, newFeedback, renewFeedback].forEach(fb => fb.style.display = "none");

        if (!userID) return alert("User not logged in.");

        let hasError = false;

        if (!newPassword) {
            newPasswordInput.classList.add("is-invalid");
            newFeedback.style.display = "block";
            newFeedback.textContent = "New password is required.";
            hasError = true;
        }

        if (newPassword !== renewPassword) {
            renewPasswordInput.classList.add("is-invalid");
            renewFeedback.style.display = "block";
            renewFeedback.textContent = "Passwords do not match.";
            hasError = true;
        }

        if (hasError) return;

        try {
            const res = await fetch('/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID, currentPassword, newPassword })
            });

            const data = await res.json();
            if (data.success) {
                currentPasswordInput.value = "";
                newPasswordInput.value = "";
                renewPasswordInput.value = "";
                document.getElementById("alertModalLabel").textContent = "Success";
                document.getElementById("alertModalBody").textContent = data.message || "Password changed successfully.";
                const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
                alertModal.show();
            } else {
                currentPasswordInput.classList.add("is-invalid");
                currentFeedback.style.display = "block";
                currentFeedback.textContent = data.message || "Current password is incorrect.";
            }
        } catch (err) {
            console.error("Error changing password:", err);
            alert("Server error.");
        }
    });


});

// EDIT PROFILE 
document.addEventListener("DOMContentLoaded", function () {

    const fileInput = document.getElementById("profileUpload");
    const previewImg = document.getElementById("previewImg");
    const placeholder = document.getElementById("placeholder");
    const previewBox = document.getElementById("profilePreview");
    const uploadBtn = document.getElementById("profileUploadBtn");
    const saveBtn = document.getElementById("saveProfileBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    // edit/save toggle
    const editBtn = document.getElementById("editBtn");
    const editFormInputs = document.querySelectorAll(
        "#profile-edit input, #profile-edit a.btn"
    );

    // initially disable all inputs
    function setFormDisabled(disabled) {
        editFormInputs.forEach((el) => {
            el.disabled = disabled;
            if (disabled) {
                el.classList.add("disabled");
                el.setAttribute("tabindex", "-1"); // prevent tabbing to disabled links
            } else {
                el.classList.remove("disabled");
                el.removeAttribute("tabindex");
            }
        });
    }

    setFormDisabled(true);

    editBtn?.addEventListener("click", function (e) {
        e.preventDefault();

        if (editBtn.textContent === "Edit Profile") {
            // editing mode
            setFormDisabled(false);
            editBtn.textContent = "Save Changes";
        } else {
            // Save & disable again (trigger existing submit logic)
            editForm.dispatchEvent(new Event("submit"));
            setFormDisabled(true);
            editBtn.textContent = "Edit Profile";
        }
    });

    let tempImage = null;
    const defaultImg = "/assets/img/account.png";

    const savedImage = localStorage.getItem("profileImage");
    const savedData = JSON.parse(localStorage.getItem("profileData")) || {};

    if (savedImage) updateAllProfiles(savedImage);
    if (Object.keys(savedData).length > 0) applyProfileData(savedData);

    // --- File Upload Trigger ---
    uploadBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        fileInput.click();
    });
    previewBox?.addEventListener("click", () => fileInput.click());

    // --- Preview new image ---
    fileInput?.addEventListener("change", function () {
        const file = this.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (e) {
                tempImage = e.target.result;

                // Show preview inside modal
                previewImg.src = tempImage;
                previewImg.classList.remove("d-none");
                placeholder.classList.add("d-none");

                // Only update changeProfile for now
                const changeProfile = document.getElementById("changeProfile");
                if (changeProfile) changeProfile.src = tempImage;
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Save button (in modal) ---
    saveBtn?.addEventListener("click", function () {
        if (tempImage) {
            console.log("Temporary image stored, waiting for submit...");
        }
        const modalEl = document.getElementById("uploadProfile");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    });

    // --- Delete Profile Image ---
    deleteBtn?.addEventListener("click", function () {
        tempImage = defaultImg;
        const changeProfile = document.getElementById("changeProfile");
        if (changeProfile) changeProfile.src = defaultImg;

        // Close delete modal
        const modalEl = document.getElementById("deleteModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        console.log("🗑️ Profile image reset to default. Will apply on submit.");
    });

    // --- Submit Main Edit Form ---
    const editForm = document.querySelector("#profile-edit form");
    editForm?.addEventListener("submit", function (e) {
        e.preventDefault();

        if (tempImage) {
            updateAllProfiles(tempImage);
            localStorage.setItem("profileImage", tempImage);
            tempImage = null;
        }

        const newData = {
            fullname: document.getElementById("editFullname").value,
            company: document.getElementById("editCompany").value,
            position: document.getElementById("editPosition").value,
            address: document.getElementById("editAddress").value,
            phone: document.getElementById("editPhone").value,
            email: document.getElementById("editEmail").value,
        };

        applyProfileData(newData);

        localStorage.setItem("profileData", JSON.stringify(newData));

        console.log("Profile updated & saved");
    });

    // --- Helpers ---
    function updateAllProfiles(image) {
        ["accountProfile", "changeProfile", "headerProfile"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.src = image;
        });
    }

    function applyProfileData(data) {
        if (data.fullname) {
            document.getElementById("accountName").textContent = data.fullname;
            document.getElementById("fullname").textContent = data.fullname;
        }
        if (data.company) document.getElementById("company").textContent = data.company;
        if (data.position) document.getElementById("position").textContent = data.position;
        if (data.address) document.getElementById("address").textContent = data.address;
        if (data.phone) document.getElementById("phone").textContent = data.phone;
        if (data.email) document.getElementById("email").textContent = data.email;
    }
});
