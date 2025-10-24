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

// ✅ NOTIFICATIONS — FULL MERGED SCRIPT
document.addEventListener('DOMContentLoaded', () => {
    const studentData = JSON.parse(localStorage.getItem('studentData'));
    if (!studentData || !studentData.id) return;
    const userId = studentData.id;
    const path = location.pathname;


    const isProgressTracker = path === '/progress-tracker';
    const isSubmission = path === '/submission';
    const isAccountPage = path === '/account';
    const isdwFormPage = path === '/downloadable-forms';
    const isPartnerAgenciesPage = path === '/partner-agency';
    const isReviewAgenciesPage = path === '/review-agency';
    const isNotificationPage = path === '/notifications';


    // Load only on valid pages
    if (!(
        isProgressTracker || isSubmission || isAccountPage || isdwFormPage || isPartnerAgenciesPage
        || isReviewAgenciesPage || isNotificationPage
    )) return;

    /* ------------------------------
       🟣 HEADER NOTIFICATION DROPDOWN
    ------------------------------- */
    async function loadNotifications(userId) {
        const notificationsList = document.querySelector('.notifications');
        const notificationsBadge = document.querySelector('.badge-number');
        const dropdownHeader = document.querySelector('.dropdown-header');

        try {
            const response = await fetch(`/api/faculty/${userId}/notifications`);
            const data = await response.json();

            if (!data.success) return;

            // ✅ Only include notifications that are NOT yet notified
            const unreadNotifications = data.notifications.filter(n => !n.notified);
            const unreadCount = unreadNotifications.length;

            // Clear existing notification items and dividers
            notificationsList.querySelectorAll('.notification-item, .dropdown-divider').forEach(item => item.remove());

            // Show only top 2 unread notifications
            const limitedNotifications = unreadNotifications.slice(0, 2);

            for (const notification of limitedNotifications) {
                const { id, title, message, timestamp } = notification;
                const date = new Date(timestamp);
                const formattedTime = date.toLocaleString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                const notificationItem = document.createElement('li');
                notificationItem.classList.add('notification-item');
                notificationItem.style.cursor = 'pointer';
                notificationItem.innerHTML = `
          <i class="bi bi-bell text-primary"></i>
          <div>
            <h4>${title}</h4>
            <p>${message}</p>
            <p>${formattedTime}</p>
          </div>
        `;

                // 👇 When clicked, mark as read & redirect
                notificationItem.addEventListener('click', async () => {
                    try {
                        await fetch(`/api/faculty/${userId}/notifications/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notified: true })
                        });

                        // Redirect based on title
                        if (title.toLowerCase().includes('document status update'))
                            window.location.href = '/submission';
                        else window.location.href = '/notifications';
                    } catch (err) {
                        console.error('⚠️ Failed to mark notification as read:', err);
                    }
                });

                const divider = document.createElement('li');
                divider.innerHTML = `<hr class="dropdown-divider">`;

                notificationsList.appendChild(notificationItem);
                notificationsList.appendChild(divider);
            }

            // 🧭 Update header & badge
            notificationsBadge.textContent = unreadCount;
            dropdownHeader.innerHTML =
                unreadCount > 0
                    ? `You have <span class="badge rounded-pill bg-primary p-2 ms-2">${unreadCount}</span> new notifications
             <a href="/notifications"><span class="badge rounded-pill bg-primary p-2 ms-2">View all</span></a>`
                    : `You have no new notifications
             <a href="/notifications"><span class="badge rounded-pill bg-secondary p-2 ms-2">View all</span></a>`;
        } catch (error) {
            console.error('🔥 Error loading notifications:', error);
        }
    }

    // Initial load
    loadNotifications(studentData.id);

    // Poll every 5 seconds for updates
    /* ------------------------------
       🟣 PAGE NOTIFICATIONS (Full List)
    ------------------------------- */
    if (!isNotificationPage) return;

    const recentBody = document.getElementById('recentBody');
    const earlierBody = document.getElementById('earlierBody');
    const viewAllBadge = document.querySelector('.box-title .badge');
    const notificationList = document.getElementById('notificationList');
    const notifDeleteBtn = document.getElementById('notifDeleteNotifBtn');
    const notifConfirmDeleteBtn = document.getElementById('notifConfirmDeleteBtn');

    let selectedCards = [];

    // Load all notifications
    async function loadAllNotifications() {
        try {
            const response = await fetch(`/api/student/${userId}/notifications`);
            const data = await response.json();
            if (!data.success) return;

            const notifications = data.notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            recentBody.innerHTML = '';
            earlierBody.innerHTML = '';

            const recent = notifications.slice(0, 3);
            const earlier = notifications.slice(3);

            recent.forEach(n => recentBody.appendChild(createNotificationCard(n)));
            earlier.slice(0, 2).forEach(n => earlierBody.appendChild(createNotificationCard(n)));

            // View all toggle
            let isViewingAll = false;
            viewAllBadge.addEventListener('click', () => {
                earlierBody.innerHTML = '';
                if (!isViewingAll) {
                    earlier.forEach(n => earlierBody.appendChild(createNotificationCard(n)));
                    viewAllBadge.textContent = 'View less';
                    viewAllBadge.classList.replace('bg-primary', 'bg-secondary');
                    isViewingAll = true;
                } else {
                    earlier.slice(0, 2).forEach(n => earlierBody.appendChild(createNotificationCard(n)));
                    viewAllBadge.textContent = 'View all';
                    viewAllBadge.classList.replace('bg-secondary', 'bg-primary');
                    isViewingAll = false;
                }
            });
        } catch (err) {
            console.error('🔥 Error loading notifications:', err);
        }
    }

    // Create notification card
    function createNotificationCard({ id, title, message, timestamp, notified }) {
        const date = new Date(timestamp);
        const formattedTime = date.toLocaleString('en-US', {
            month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        const wrapper = document.createElement('div');
        wrapper.className = `notification-card d-flex justify-content-between align-items-start ${!notified ? 'highlight' : ''}`;
        wrapper.innerHTML = `
      <div class="d-flex align-items-center w-100">
        <input type="checkbox" class="notif-checkbox me-3" data-id="${id}">
        <div class="notification-icon ${!notified ? 'text-success' : 'text-muted'} me-3">
          <i class="bi ${!notified ? 'bi-bell-fill' : 'bi-bell'} fs-5"></i>
        </div>
        <div>
          <div class="notification-header fw-bold">${title}</div>
          <div>${message}</div>
          <div class="notification-time text-muted mt-1" style="font-size: 12px;">${formattedTime}</div>
        </div>
      </div>
    `;

        // Click to mark as read
        wrapper.addEventListener('click', async (e) => {
            if (e.target.classList.contains('notif-checkbox')) return;
            try {
                await fetch(`/api/faculty/${userId}/notifications/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notified: true })
                });
                if (title.toLowerCase().includes('document status update'))
                    window.location.href = '/submission';
                else window.location.href = '/notifications';
            } catch (err) {
                console.error('⚠️ Failed to mark as read:', err);
            }
        });

        return wrapper;
    }

    // Sorting
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', function () {
            const sortType = this.dataset.sort;
            const cards = Array.from(notificationList.querySelectorAll('.notification-card'));
            cards.sort((a, b) => {
                const dateA = new Date(a.querySelector('.notification-time').textContent.trim());
                const dateB = new Date(b.querySelector('.notification-time').textContent.trim());
                return sortType === 'newest' ? dateB - dateA : dateA - dateB;
            });
            cards.forEach(card => notificationList.appendChild(card));
        });
    });

    // Mark as Read/Unread
    document.querySelectorAll('.mark-option').forEach(option => {
        option.addEventListener('click', async function () {
            const action = this.dataset.action;
            const selected = document.querySelectorAll('.notif-checkbox:checked');
            for (const checkbox of selected) {
                const id = checkbox.dataset.id;
                await fetch(`/api/faculty/${userId}/notifications/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notified: action === 'read' })
                });
            }
            loadAllNotifications();
        });
    });

    // Delete notifications
    notifDeleteBtn.addEventListener('click', () => {
        selectedCards = document.querySelectorAll('.notif-checkbox:checked');
        if (selectedCards.length === 0) {
            alert('Please select at least one notification to delete.');
            return;
        }
        const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
        modal.show();
    });

    notifConfirmDeleteBtn.addEventListener('click', async () => {
        for (const checkbox of selectedCards) {
            const id = checkbox.dataset.id;
            await fetch(`/api/faculty/${userId}/notifications/${id}`, { method: 'DELETE' });
            checkbox.closest('.notification-card').remove();
        }
        const modalEl = document.getElementById('confirmDeleteModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    });

    // Load notifications initially + refresh
    loadAllNotifications();
    setInterval(loadAllNotifications, 10000);
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
            const formattedTime = new Date(`1970-01-01T${requirement.dueTime}`).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            const el = document.createElement("div");
            el.classList.add('p-3', 'd-flex', 'align-items-center', 'border-bottom', 'pointer');
            el.innerHTML = `
                <i class='bi bi-circle-fill me-3 ${statusOrder[requirement.status]}'></i>
                <div class='flex-grow-1'>
                    <div class='fw-bold'>${requirement.title}</div>
                    <div class='text-muted small'>${requirement.description}</div>
                </div>
                <div class='flex-grow-2 text-end'>
                    <div class='small'>Due: ${datePart} <i class="text-secondary">${formattedTime}</i></div>
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
        const allowedStatuses = ['To Submit', 'Pending', 'To Revise'];
        let canUpload = allowedStatuses.includes(requirement.status);

        // Disable upload if overdue
        if (requirement.status === 'Overdue') {
            canUpload = false; // prevent upload
            overdue.classList.remove('d-none');
            overdue.textContent = `Overdue: ${requirement.pastDue || 'Past due'}`;
            modalFooter.classList.add('d-flex', 'justify-content-between');
        }

        // Reset upload area
        resetUpload();

        // Disable upload and submit buttons if not allowed
        if (!canUpload) {
            submitFile.setAttribute('disabled', true);
            // If you have a drag-drop area or input field for file, disable it too:
            const fileInput = document.getElementById('fileInput'); // replace with your actual input ID
            if (fileInput) fileInput.setAttribute('disabled', true);
        } else {
            submitFile.removeAttribute('disabled');
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.removeAttribute('disabled');
        }

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
        const studentName = `${studentData?.firstname || ""} ${studentData?.lastname || ""}`.trim();
        const requirementID = selectedRequirement.id || selectedRequirement.requirementID;
        const type = selectedRequirement.type;
        const title = selectedRequirement.title;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('studentID', studentID);

        formData.append('requirementID', requirementID);
        formData.append('type', type);
        formData.append('title', title);
        formData.append('studentName', studentName);

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
// DOWNLOADABLE FORMS
document.addEventListener("DOMContentLoaded", async () => {
    const sectionMap = {
        "Initial Requirements": "initDocuments",
        "Pre-Deployment Requirements": "preDepDocuments",
        "In-Progress Requirements": "inProgDocuments",
        "Final Requirements": "finalDocuments"
    };

    // ✅ FIXED: Adjusted to use "data" instead of "downloadables"
    async function fetchDownloadables() {
        try {
            const response = await fetch("/api/get-downloadables");
            const result = await response.json();
            console.log("🛰️ Raw API response:", result);

            // Your backend returns { success: true, data: [...] }
            if (result.success && Array.isArray(result.data)) {
                return result.data;
            }

            console.error("⚠️ No valid 'data' array found in API response.");
            return [];
        } catch (err) {
            console.error("⚠️ Error fetching downloadables:", err);
            return [];
        }
    }

    function createDocumentCards(containerId, documents) {
        const cardContainer = document.getElementById(containerId);
        if (!cardContainer) return;

        cardContainer.innerHTML = ""; // Clear old content

        if (documents.length === 0) {
            cardContainer.innerHTML = `<p class="text-center text-muted">No downloadable forms available.</p>`;
            return;
        }

        documents.forEach(doc => {
            // ✅ Update field names to match your Firestore data
            const fileExtension = doc.fileurl.split('.').pop().toLowerCase();
            let previewHTML = "";

            if (fileExtension === "pdf") {
                previewHTML = `
                    <div class="preview-container" onclick="window.open('${doc.fileurl}', '${doc.title}')">
                        <iframe src="${doc.fileurl}#toolbar=0&navpanes=0&scrollbar=0"></iframe>
                    </div>
                `;
            } else if (["png", "jpg", "jpeg"].includes(fileExtension)) {
                previewHTML = `
                    <div class="preview-container" onclick="window.open('${doc.fileurl}', '${doc.title}')">
                        <img src="${doc.fileurl}" alt="${doc.title}" style="width: 100%; height: 130px; object-fit: cover;" />
                    </div>
                `;
            } else if (fileExtension === "docx") {
                previewHTML = `
                    <div class="placeholder-docx" onclick="window.open('${doc.fileurl}', '${doc.title}')">
                        <i class="bi bi-file-earmark-word" style="font-size: 50px; color: #2B579A;"></i>
                    </div>
                `;
            } else {
                previewHTML = `
                    <div class="placeholder-docx" onclick="window.open('${doc.fileurl}', '${doc.title}')">
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
                        <h5 class="card-title">${doc.title}</h5>
                        <a href="${doc.fileurl}" download class="btn btn-primary">Download</a>
                    </div>
                </div>
            `;

            cardContainer.appendChild(card);
        });
    }

    // Fetch data and populate per section
    let allDownloadables = await fetchDownloadables();
    if (!Array.isArray(allDownloadables)) {
        console.warn("⚠️ allDownloadables is not an array. Using empty array instead:", allDownloadables);
        allDownloadables = [];
    }

    console.log("📦 allDownloadables fetched:", allDownloadables);

    Object.entries(sectionMap).forEach(([type, containerId]) => {
        // ✅ Update filter to use 'type'
        const filteredDocs = allDownloadables.filter(
            doc => (doc.type || "").toLowerCase() === type.toLowerCase()
        );
        createDocumentCards(containerId, filteredDocs);
    });
});


// PARTNER AGENCIES

// PARTNER AGENCY
document.addEventListener("DOMContentLoaded", async () => {
    // Fetch partners from the backend
    async function fetchPartners() {
        try {
            const res = await fetch("/api/get-partners");
            const data = await res.json();

            console.log("📦 Partner data fetched:", data);

            if (data.success && Array.isArray(data.partners)) {
                return data.partners;
            } else {
                console.warn("⚠️ No partners found in API response.");
                return [];
            }
        } catch (err) {
            console.error("🔥 Error fetching partners:", err);
            return [];
        }
    }

    const partners = await fetchPartners();
    const container = document.getElementById("agenciesCards");

    if (!container) return;

    container.innerHTML = "";

    if (partners.length === 0) {
        container.innerHTML = `<p class="text-center text-muted">No partner agencies available.</p>`;
        return;
    }

    // Create partner cards
    partners.forEach(partner => {
        const card = document.createElement("div");
        card.className = "col-md-3";
        card.innerHTML = `
      <div class="card shadow-sm h-100 agencyCard mt-0">
        <div class="card-body text-center">
          <i class="bi bi-building fs-3 dark-purple"></i>
          <div id="agencyNameCard">${partner.establishmentName}</div>
          <div id="agencyAddressCard" class="text-muted">${partner.address}</div>
        </div>
      </div>
    `;

        // Show modal when clicked
        card.addEventListener("click", () => {
            const modal = new bootstrap.Modal(document.getElementById("agencyModal"));
            const modalTitle = document.querySelector("#agencyModal .modal-title");
            const agencyName = document.getElementById("agencyName");
            const agencyAddress = document.getElementById("agencyAddress");
            const positionNeeded = document.getElementById("positionNeeded");

            modalTitle.textContent = partner.establishmentName;
            agencyName.textContent = partner.establishmentName;
            agencyAddress.textContent = partner.address;

            const positions = (partner.positions || "")
                .split(",")
                .map(pos => `<li>${pos.trim()}</li>`)
                .join("");
            positionNeeded.innerHTML = `<ul>${positions}</ul>`;

            modal.show();
        });

        container.appendChild(card);
    });
});

// REVIEW AGENCY
document.addEventListener("DOMContentLoaded", async function () {

    // ✅ Fetch partner agencies from backend
    async function fetchAgencies() {
        try {
            const res = await fetch("/api/get-partnersreview");
            const data = await res.json();
            if (data.success && Array.isArray(data.partners)) {
                console.log("✅ Agencies fetched for review:", data.partners);
                return data.partners;
            } else {
                console.warn("⚠️ No agencies found in API response.");
                return [];
            }
        } catch (error) {
            console.error("🔥 Error fetching agencies:", error);
            return [];
        }
    }

    const agencies = await fetchAgencies();
    const reviewContainer = document.getElementById("reviewAgenciesCards");
    if (!reviewContainer) return;

    reviewContainer.innerHTML = "";

    if (agencies.length === 0) {
        reviewContainer.innerHTML = `<p class="text-center text-muted">No partner agencies available for review.</p>`;
        return;
    }

    // ✅ Build each agency card
    agencies.forEach(agency => {
        const reviewCard = document.createElement("div");
        reviewCard.className = "col-md-3";

        const ratingValue = parseFloat(agency.rating || 0);
        let starsHTML = "";
        for (let i = 1; i <= 5; i++) {
            starsHTML += i <= ratingValue
                ? `<i class="bi bi-star-fill text-warning"></i>`
                : `<i class="bi bi-star" style="color: #e4e5e9;"></i>`;
        }

        reviewCard.innerHTML = `
            <div class="agencyCard mt-0 g-0 card shadow-sm">
                <div class="card-body text-center">
                    <i class="bi bi-building fs-3 dark-purple"></i>
                    <div id="reviewNameCard">${agency.establishmentName || "Unnamed Agency"}</div>
                    <div id="reviewAddressCard" class="text-muted">${agency.address || "No address"}</div>
                </div>
                <div class="text-center mt-0" id="rating">
                    <div class="stars">${starsHTML}</div>
                    <div>${ratingValue.toFixed(1)}/5</div>
                </div>
                <div class="d-flex justify-content-end p-2">
                    <button type="button" class="btn btn-outline-primary btn-sm">Review</button>
                </div>
            </div>
        `;

        reviewContainer.appendChild(reviewCard);

        // ✅ Handle "Review" button click
        const button = reviewCard.querySelector("button");
        button.addEventListener("click", async () => {
            document.getElementById("reviewAgenciesCards").style.display = "none";
            document.getElementById("reviewSelectedCard").style.display = "flex";

            // ✅ Immediately refresh agency data before displaying
            await refreshAgencyReviews(agency.id);

            // Left side (Agency details)
            document.getElementById("reviewAgencyName").innerText = agency.establishmentName || "Unnamed Agency";
            document.getElementById("reviewAgencyAddress").innerText = agency.address || "No address provided";


            // Right side (Reviews) — This will already be filled by refreshAgencyReviews
            const reviewsContainer = document.getElementById("reviewsContainer");

            // ⭐ Interactive Write Review Section (safe rebind)
            const stars = document.querySelectorAll(".star");
            const ratingDisplay = document.getElementById("totalRating");
            let activeStars = 0;

            // Remove previous listeners
            stars.forEach(star => {
                const newStar = star.cloneNode(true);
                star.parentNode.replaceChild(newStar, star);
            });
            const freshStars = document.querySelectorAll(".star");

            // Add fresh listeners
            freshStars.forEach((star, index) => {
                star.addEventListener("click", () => {
                    for (let i = 0; i < freshStars.length; i++) {
                        const iTag = freshStars[i].querySelector("i");
                        if (i <= index) {
                            iTag.classList.add("bi-star-fill", "text-warning");
                            iTag.classList.remove("bi-star");
                        } else {
                            iTag.classList.remove("bi-star-fill", "text-warning");
                            iTag.classList.add("bi-star");
                        }
                    }
                    activeStars = index + 1;
                    ratingDisplay.textContent = activeStars;
                });
            });

            // Replace old submit listener
            const submit = document.getElementById("submitReview");
            const newSubmit = submit.cloneNode(true);
            submit.parentNode.replaceChild(newSubmit, submit);

            newSubmit.addEventListener("click", async function () {
                const review = document.getElementById("review");
                const reviewValue = review.value.trim();

                if (reviewValue === "" && activeStars === 0) {
                    alert("Please leave a review or select stars!");
                    return;
                }

                // ✅ Get student data from localStorage
                const studentData = JSON.parse(localStorage.getItem("studentData")) || {};
                const studentID = studentData.id;
                const firstname = studentData.firstname || "John";
                const lastname = studentData.lastname || "Doe";

                // ✅ Prepare review payload
                const reviewData = {
                    establishmentID: agency.id,
                    studentID,
                    firstname,
                    lastname,
                    review: reviewValue,
                    star: activeStars
                };

                try {
                    const res = await fetch("/api/save-review", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(reviewData)
                    });

                    const result = await res.json();

                    if (result.success) {
                        console.log("✅ Review saved:", result.message);
                        await refreshAgencyReviews(agency.id); // 🔁 Refresh reviews immediately

                        // Reset form
                        review.value = "";
                        ratingDisplay.textContent = "0";
                        freshStars.forEach(s => {
                            const iTag = s.querySelector("i");
                            iTag.classList.remove("bi-star-fill", "text-warning");
                            iTag.classList.add("bi-star");
                        });
                        activeStars = 0;
                    }
                } catch (err) {
                    console.error("🔥 Error submitting review:", err);
                    alert("Error submitting review. Check console for details.");
                }
            });
        });

    });

    // 🔙 Back button logic
    const agencyBack = document.getElementById("agencyBack");
    if (agencyBack) {
        agencyBack.addEventListener("click", function () {
            document.getElementById("reviewSelectedCard").style.display = "none";
            document.getElementById("reviewAgenciesCards").style.display = "flex";
        });
    }

    // ♻️ Helper function to refresh agency reviews dynamically
    async function refreshAgencyReviews(agencyId) {
        const updatedRes = await fetch(`/api/get-partnersreview`);
        const updatedData = await updatedRes.json();

        if (updatedData.success) {
            const updatedAgency = updatedData.partners.find(p => p.id === agencyId);
            if (updatedAgency) {
                document.getElementById("reviewRatingValue").innerText = updatedAgency.rating;

                let updatedStarsHTML = "";
                for (let i = 1; i <= 5; i++) {
                    updatedStarsHTML += i <= Math.round(updatedAgency.rating)
                        ? `<i class="bi bi-star-fill text-warning"></i>`
                        : `<i class="bi bi-star" style="color: #e4e5e9;"></i>`;
                }
                document.getElementById("reviewStars").innerHTML = updatedStarsHTML;

                const reviewsContainer = document.getElementById("reviewsContainer");
                reviewsContainer.innerHTML = "";

                if (updatedAgency.reviews.length > 0) {
                    updatedAgency.reviews.forEach(r => {
                        let starIcons = "";
                        for (let i = 1; i <= 5; i++) {
                            starIcons += i <= r.star
                                ? `<i class="bi bi-star-fill text-warning"></i>`
                                : `<i class="bi bi-star" style="color: #e4e5e9;"></i>`;
                        }

                        const reviewCard = document.createElement("div");
                        reviewCard.className = "card mb-2 p-2";
                        reviewCard.innerHTML = `
                            <div class="d-flex justify-content-between align-items-center">
                                <strong>${r.firstname} ${r.lastname}</strong>
                                <div>${starIcons}</div>
                            </div>
                            <p class="mb-0 small text-muted">${r.review}</p>
                        `;
                        reviewsContainer.appendChild(reviewCard);
                    });
                } else {
                    reviewsContainer.innerHTML = `<p class="text-muted small">No reviews yet.</p>`;
                }
            }
        }
    }
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
document.addEventListener('DOMContentLoaded', async function () {

    const statusOrder = {
        'To Submit': 'bg-secondary',
        'Pending': 'bg-primary',
        'Overdue': 'bg-danger',
        'To Revise': 'bg-warning text-dark',
        'Completed': 'bg-success'
    };

    // Filters
    let filters = {
        "Initial Requirements": "All",
        "Pre-Deployment Requirements": "All",
        "In-Progress Requirements": "All",
        "Final Requirements": "All"
    };

    // 🧠 Fetch requirements from backend
    async function fetchProgressRequirements(studentID) {
        try {
            const res = await fetch(`/api/requirements/${studentID}`);
            const data = await res.json();
            if (!data.success) throw new Error("API returned error");
            return data.data;
        } catch (err) {
            console.error("❌ Error fetching requirements:", err);
            return null;
        }
    }

    // 📊 Build table rows
    function showTableData(tableID, requirements, statusFilter) {
        const tbody = document.getElementById(tableID);
        tbody.innerHTML = "";

        if (!requirements || requirements.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4' class='p-3 text-center'>No data to show</td></tr>";
            return;
        }

        const filtered = statusFilter === "All" ? requirements : requirements.filter(req => req.status === statusFilter);

        if (filtered.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4' class='p-3 text-center'>No data to show</td></tr>";
            return;
        }

        filtered.forEach(req => {
            const row = document.createElement("tr");
            let badgeClass = statusOrder[req.status] || 'bg-secondary';

            // ✅ Check for overdue
            if (req.status !== "Completed" && req.status !== "To Revise" && req.dueDate) {
                // Combine dueDate and dueTime into a JS Date
                let dueDateTime = new Date(req.dueDate); // parse dueDate
                if (req.dueTime) {
                    const [hours, minutes] = req.dueTime.split(":").map(Number);
                    dueDateTime.setHours(hours, minutes);
                }

                if (new Date() > dueDateTime) {
                    req.status = "Overdue";
                    badgeClass = statusOrder["Overdue"];
                }
            }

            const statusCell = `<td><span class="badge ${badgeClass}">${req.status}</span></td>`;
            const nameCell = `<td>${req.title}</td>`;

            const formattedTime = new Date(`1970-01-01T${req.dueTime}`).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            let dueDateCell = `<td></td>`;
            if (req.dueDate) {
                dueDateCell = `<td>${req.dueDate} <span class="text-muted fst-italic">${formattedTime || ""}</span></td>`;
            }

            let submittedCell = `<td></td>`;
            if (req.createdAt) {
                const createdAtDate = new Date(req.createdAt);
                if (!isNaN(createdAtDate)) {
                    const formattedSubDate = createdAtDate.toLocaleDateString('en-CA');
                    const formattedSubTime = createdAtDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });

                    submittedCell = `<td>${formattedSubDate} <span class="text-muted fst-italic">${formattedSubTime || ""}</span></td>`;
                } else {
                    submittedCell = `<td>Invalid Date</td>`;
                }
            }

            row.innerHTML = statusCell + nameCell + dueDateCell + submittedCell;
            tbody.appendChild(row);
        });
    }

    // 🔘 Calculate progress
    function calculateProgress(requirements) {
        const total = requirements.length;
        const completed = requirements.filter(r => r.status === "Completed").length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        return { completed, total, percent, progressText: `${completed}/${total}` };
    }

    function buildProgressCards(groupedData) {
        const progressStages = [
            { key: "Initial Requirements", index: 0 },
            { key: "Pre-Deployment Requirements", index: 1 },
            { key: "In-Progress Requirements", index: 2 },
            { key: "Final Requirements", index: 3 }
        ];

        progressStages.forEach(stage => {
            const reqs = groupedData[stage.key] || [];
            const stats = calculateProgress(reqs);

            // Update text
            document.getElementById(`progress-value-${stage.index}`).textContent = `${stats.percent}%`;
            document.getElementById(`progress-text-${stage.index}`).textContent = stats.progressText;

            // Animate circle
            const card = document.getElementById(`progress-${stage.index}`).closest('.col-md-3');
            const rightBar = card.querySelector('.progress-right .progress-bar');
            const leftBar = card.querySelector('.progress-left .progress-bar');

            if (stats.percent <= 50) {
                rightBar.style.transform = `rotate(${(stats.percent / 100) * 360}deg)`;
                leftBar.style.transform = 'rotate(0deg)';
            } else {
                rightBar.style.transform = 'rotate(180deg)';
                leftBar.style.transform = `rotate(${((stats.percent - 50) / 100) * 360}deg)`;
            }
        });
    }

    // 🎚️ Handle dropdown filter changes
    document.querySelectorAll('.dropdown-menu .view-option').forEach(option => {
        option.addEventListener('click', function (e) {
            e.preventDefault();
            const status = this.dataset.status;
            const parentDropdown = this.closest('.dropdown');

            const dropdownMap = {
                "initialDropdown": "Initial Requirements",
                "preDepDropdown": "Pre-Deployment Requirements",
                "inProgressDropdown": "In-Progress Requirements",
                "finalDropdown": "Final Requirements"
            };

            const key = dropdownMap[parentDropdown.id];
            filters[key] = status;

            document.getElementById(`${parentDropdown.id.replace('Dropdown', 'Status')}`).textContent = status;

            showTableData(`${parentDropdown.id.replace('Dropdown', 'Body')}`, groupedData[key], status);
        });
    });


    const studentData = JSON.parse(localStorage.getItem("studentData")) || {};
    const studentID = studentData.id; // Replace with actual logged-in student's ID
    const groupedData = await fetchProgressRequirements(studentID);

    // Show table data
    showTableData('initBody', groupedData["Initial Requirements"], filters["Initial Requirements"]);
    showTableData('preDepBody', groupedData["Pre-Deployment Requirements"], filters["Pre-Deployment Requirements"]);
    showTableData('inProgressBody', groupedData["In-Progress Requirements"], filters["In-Progress Requirements"]);
    showTableData('finalBody', groupedData["Final Requirements"], filters["Final Requirements"]);

    // Show progress circles
    buildProgressCards(groupedData);
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
