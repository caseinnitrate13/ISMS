// FACULTY DETAILS
document.addEventListener('DOMContentLoaded', async () => {
  const path = location.pathname;

  // Identify faculty admin pages
  const isRegisteredAcc = path === '/admin/registered-accounts';
  const isDownloadable = path === '/admin/downloadable';
  const isEstablishments = path === '/admin/partner-establishments';
  const isSubmittedDocs = path === '/admin/submitted-documents';
  const isStudentProgress = path === '/admin/student-progress';
  const isPublishReq = path === '/admin/publish-requirements';
  const isAgencyReviews = path === '/admin/agency-reviews';
  const isNotifications = path === '/admin/notifications';
  const isFacultyProfile = path === '/admin/user-profile';

  // Get faculty credentials (stored after login)
  const facultyID = JSON.parse(localStorage.getItem('facultyData'))?.id;

  if (!facultyID) {
    console.warn("⚠️ No faculty credentials found. Redirecting to login...");
    window.location.href = '/';
    return;
  }

  try {
    // 🔍 Fetch latest faculty info from backend
    const response = await fetch(`/get-faculty/${facultyID}`);
    const result = await response.json();

    if (!result.success) {
      console.error("Error fetching faculty data:", result.message);
      return;
    }

    const facultyData = result.faculty;
    console.log(facultyData);

    console.log(facultyData.profilePic);

    // Common header elements
    const headerProfile = document.getElementById('headerProfile');
    const headerName = document.querySelector('.nav-profile span');

    // 🧩 Display faculty info in header (for all admin pages)
    if (
      isRegisteredAcc ||
      isDownloadable ||
      isEstablishments ||
      isSubmittedDocs ||
      isStudentProgress ||
      isPublishReq ||
      isAgencyReviews ||
      isNotifications ||
      isFacultyProfile
    ) {
      if (headerName) headerName.textContent = `${facultyData.firstname} ${facultyData.lastname}`;
      if (headerProfile) headerProfile.src = facultyData.profilePic || '/assets/img/account-green.png';
    }

    // ✅ If on Faculty Profile page, show full info
    if (isFacultyProfile) {
      document.getElementById('accountName').textContent =
        `${facultyData.firstname} ${facultyData.middlename ? facultyData.middlename + ' ' : ''}${facultyData.lastname}`;
      document.getElementById('studentID').textContent = facultyData.id || '';

      // 🖼️ Profile
      const accountProfile = document.getElementById('accountProfile');
      if (accountProfile) accountProfile.src = facultyData.profilePic || '/assets/img/account-green.png';

      // 🧾 Static details
      document.getElementById('fullname').textContent =
        `${facultyData.firstname} ${facultyData.middlename ? facultyData.middlename + ' ' : ''}${facultyData.lastname}`;
      document.getElementById('emailaddress').textContent = facultyData.email || '—';
      document.getElementById('birthdate').textContent = facultyData.birthdate || '—';
      document.getElementById('regdate').textContent = facultyData.regdate || '—';

      // 🧩 Editable form fields
      document.querySelector('input[name="editsurname"]').value = facultyData.lastname || '';
      document.querySelector('input[name="editfirstname"]').value = facultyData.firstname || '';
      document.querySelector('input[name="editmiddlename"]').value = facultyData.middlename || '';
      document.querySelector('input[name="editsuffix"]').value = facultyData.suffix || '';
      document.querySelector('input[name="editemail"]').value = facultyData.email || '';
      document.querySelector('input[name="editbirthdate"]').value = facultyData.birthdate || '';
      document.querySelector('select[name="editgender"]').value = facultyData.gender || '';
      document.querySelector('input[name="editcontact"]').value = facultyData.contact || '';

      const profileImg = document.getElementById('changeProfile');
      if (profileImg) profileImg.src = facultyData.profilePic || '/assets/img/account-green.png';
    }
  } catch (error) {
    console.error("🔥 Error fetching faculty data:", error);
  }

  // 🧩 Handle Faculty Profile Save
  const editForm = document.querySelector("#profile-edit form");

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const facultyData = JSON.parse(localStorage.getItem("facultyData"));
      const facultyID = facultyData?.id;

      if (!facultyID) {
        alert("Faculty credentials not found. Please log in again.");
        return;
      }

      // Collect updated form data
      const updatedData = {
        lastname: document.querySelector('input[name="editsurname"]').value.trim(),
        firstname: document.querySelector('input[name="editfirstname"]').value.trim(),
        middlename: document.querySelector('input[name="editmiddlename"]').value.trim(),
        suffix: document.querySelector('input[name="editsuffix"]').value.trim(),
        email: document.querySelector('input[name="editemail"]').value.trim(),
        birthdate: document.querySelector('input[name="editbirthdate"]').value,
        gender: document.querySelector('select[name="editgender"]').value,
        contact: document.querySelector('input[name="editcontact"]').value.trim(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const response = await fetch("/update-faculty-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facultyID, updatedData }),
        });

        const result = await response.json();

        if (result.success) {
          console.log("✅ Faculty profile updated successfully!");

          // ✅ If a new profile pic is selected, upload it now
          if (tempImageFile) {
            await uploadProfilePicture(tempImageFile);
          }

        } else {
          alert("⚠️ Failed to update profile: " + result.message);
        }
      } catch (error) {
        console.error("🔥 Error updating faculty profile:", error);
        alert("An error occurred while saving your profile.");
      }
    });
  }

  // 🧩 Handle Faculty Change Password
  const passwordForm = document.querySelector("#changePasswordForm");

  if (passwordForm) {
    const renewPassword = document.getElementById("renewPassword");
    const newPassword = document.getElementById("newPassword");

    // Real-time password match check
    renewPassword.addEventListener("input", () => {
      if (renewPassword.value !== newPassword.value) {
        renewPassword.setCustomValidity("Passwords do not match");
      } else {
        renewPassword.setCustomValidity("");
      }
    });

    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Use native HTML validation
      if (!passwordForm.checkValidity()) {
        passwordForm.classList.add("was-validated");
        return;
      }

      // Get faculty credentials from localStorage
      const facultyData = JSON.parse(localStorage.getItem("facultyData"));
      const facultyID = facultyData?.id;

      if (!facultyID) {
        alert("Faculty credentials not found. Please log in again.");
        return;
      }

      const currentPassword = document.getElementById("currentPassword").value.trim();
      const newPasswordVal = newPassword.value.trim();

      try {
        // Call backend route
        const response = await fetch("/change-faculty-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facultyID, currentPassword, newPassword: newPasswordVal }),
        });

        const result = await response.json();

        if (result.success) {
          passwordForm.reset();
          passwordForm.classList.remove("was-validated");
          alert("✅ Password changed successfully!");
        } else {
          alert("⚠️ " + result.message);
        }
      } catch (error) {
        console.error("🔥 Error changing password:", error);
        alert("An error occurred while changing your password.");
      }
    });
  }

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
    "#profile-edit input, #profile-edit select, #profile-edit a.btn"
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
  let tempImageFile = null; // ✅ store the File for uploading
  const defaultImg = "/assets/img/account.png";

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
      tempImageFile = file;
      const reader = new FileReader();
      reader.onload = function (e) {
        tempImage = e.target.result;

        // Show preview inside modal
        previewImg.src = tempImage;
        previewImg.classList.remove("d-none");
        placeholder.classList.add("d-none");

        const changeProfile = document.getElementById("changeProfile");
        if (changeProfile) changeProfile.src = tempImage;
      };
      reader.readAsDataURL(file);
    }
  });

  // ✅ PROFILE PICTURE HANDLING
  async function uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append("facultyID", facultyID);
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-faculty-profile-pic", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        console.log("✅ Profile picture uploaded");
        document.getElementById("changeProfile").src = `/${data.path}?t=${Date.now()}`;
        tempImageFile = null;
      } else {
        alert("⚠️ " + data.message);
      }
    } catch (err) {
      console.error("🔥 Error uploading profile picture:", err);
    }
  }

  async function deleteProfilePicture() {
    try {
      const res = await fetch("/api/delete-faculty-profile-pic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyID }),
      });
      const data = await res.json();

      if (data.success) {
        console.log("🗑️ Profile picture deleted");
        document.getElementById("changeProfile").src = defaultImg;
      } else {
        alert("⚠️ " + data.message);
      }
    } catch (err) {
      console.error("🔥 Error deleting profile picture:", err);
    }
  }

  // --- Delete Profile Image ---
  deleteBtn?.addEventListener("click", async function () {
    await deleteProfilePicture();
    const modalEl = document.getElementById("deleteModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  });

  // --- Save Modal Button (for preview only) ---
  saveBtn?.addEventListener("click", function () {
    if (tempImage) {
      console.log("Temporary image ready for upload on save changes");
    }
    const modalEl = document.getElementById("uploadProfile");
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  });
});

// ✅ SIDEBAR FUNCTION FOR ADMIN
document.addEventListener('DOMContentLoaded', () => {
  const registeredAcc = document.getElementById('registered-accounts');
  const downloadable = document.getElementById('downloadable');
  const partnerAgencies = document.getElementById('partner-agencies');
  const submittedDocs = document.getElementById('submitted-documents');
  const studentProgress = document.getElementById('student-progress');
  const publishReq = document.getElementById('publish-requirements');
  const notifications = document.getElementById('notifications');
  const facultyProfile = document.getElementById('user-profile');
  const logout = document.getElementById('logout');

  const path = window.location.pathname;

  // Identify faculty admin pages
  const isRegisteredAcc = path.includes('/admin/registered-accounts');
  const isDownloadable = path.includes('/admin/downloadable');
  const isEstablishments = path.includes('/admin/partner-establishments');
  const isAgencyReviews = path.includes('/admin/agency-reviews');
  const isSubmittedDocs = path.includes('/admin/submitted-documents');
  const isStudentProgress = path.includes('/admin/student-progress');
  const isPublishReq = path.includes('/admin/publish-requirements');
  const isNotifications = path.includes('/admin/notifications');
  const isFacultyProfile = path.includes('/admin/user-profile');
  const isLogout = path.includes('/index.html');

  // Remove all active states first
  const allLinks = [
    registeredAcc, downloadable, partnerAgencies, submittedDocs,
    studentProgress, publishReq, notifications, facultyProfile, logout
  ];
  allLinks.forEach(link => link?.classList.remove('active', 'collapsed', 'show'));

  // Apply active styles based on path
  if (isRegisteredAcc) {
    registeredAcc.classList.add('active');
  } else if (isDownloadable) {
    downloadable.classList.add('active');
  } else if (isEstablishments || isAgencyReviews) {
    partnerAgencies.classList.add('active');

    // Highlight correct nested link
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-content a');
    navLinks.forEach(link => {
      if (link.getAttribute('href') === path) {
        link.classList.add('active');
        const navContent = link.closest('.nav-content');
        if (navContent) {
          navContent.classList.add('show');
          const parentLink = navContent.previousElementSibling;
          if (parentLink) parentLink.classList.add('active');
        }
      }
    });
  } else if (isSubmittedDocs) {
    submittedDocs.classList.add('active');
  } else if (isStudentProgress) {
    studentProgress.classList.add('active');
  } else if (isPublishReq) {
    publishReq.classList.add('active');
  } else if (isNotifications) {
    notifications.classList.add('active');
  } else if (isFacultyProfile) {
    facultyProfile.classList.add('active');
  } else if (isLogout) {
    logout.classList.add('active');
  }

  // Collapse everything else except the active one
  allLinks.forEach(link => {
    if (!link?.classList.contains('active') && !link?.classList.contains('show')) {
      link?.classList.add('collapsed');
    }
  });
});



//NOTIFICATIONS — FULL MERGED SCRIPT
document.addEventListener('DOMContentLoaded', () => {
  const facultyData = JSON.parse(localStorage.getItem('facultyData'));
  if (!facultyData || !facultyData.id) return;
  const userId = facultyData.id;
  const path = location.pathname;

  // Page identifiers
  const isRegisteredAcc = path === '/admin/registered-accounts';
  const isDownloadable = path === '/admin/downloadable';
  const isEstablishments = path === '/admin/partner-establishments';
  const isSubmittedDocs = path === '/admin/submitted-documents';
  const isStudentProgess = path === '/admin/student-progress';
  const isPublishReq = path === '/admin/publish-requirements';
  const isNotifications = path === '/admin/notifications';
  const isFacultyProfile = path === '/admin/user-profile';

  // Load only on valid pages
  if (!(
    isRegisteredAcc || isDownloadable || isEstablishments ||
    isSubmittedDocs || isStudentProgess || isPublishReq ||
    isNotifications || isFacultyProfile
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
            if (title.toLowerCase().includes('document submitted')) {
              window.location.href = '/admin/submitted-documents';
            } else {
              window.location.href = '/admin/notifications';
            }
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
             <a href="/admin/notifications"><span class="badge rounded-pill bg-primary p-2 ms-2">View all</span></a>`
          : `You have no new notifications
             <a href="/admin/notifications"><span class="badge rounded-pill bg-secondary p-2 ms-2">View all</span></a>`;
    } catch (error) {
      console.error('🔥 Error loading notifications:', error);
    }
  }

  // Initial load
  loadNotifications(facultyData.id);

  // Poll every 5 seconds for updates
  setInterval(() => loadNotifications(facultyData.id), 5000);

  /* ------------------------------
     🟣 PAGE NOTIFICATIONS (Full List)
  ------------------------------- */
  if (!isNotifications) return;

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
      const response = await fetch(`/api/faculty/${userId}/notifications`);
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
        if (title.toLowerCase().includes('document submitted'))
          window.location.href = '/admin/submitted-documents';
        else window.location.href = '/admin/notifications';
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


// DOWNLOADABLE REQUIREMENTS
document.addEventListener("DOMContentLoaded", () => {
  let cardBeingEdited = null;
  // Fetch and display all downloadable forms
  async function fetchDownloadables() {
    try {
      const response = await fetch("/api/get-downloadables");
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const container = document.getElementById("downloadablesContainer");
        container.innerHTML = "";

        result.data.forEach((item) => {
          const name = item.title || "Untitled";
          const fileURL = item.fileurl || "";
          const status = item.status || "";
          const type = item.type || "Uncategorized"; // ✅ include the type

          const card = document.createElement("div");
          card.className = "col-md-3 mb-3";
          card.dataset.requirementType = type;
          card.dataset.downloadableId = item.id || ""; // ✅ optional: keep ID reference

          card.innerHTML = `
          <div class="card h-100 position-relative shadow">
            <input type="checkbox" class="form-check-input position-absolute"
                   style="top:5px;left:5px;z-index:3;">
            <div class="card-body d-flex flex-column" style="height: 400px;">
              <h6 class="card-title">${name}</h6>
              <div class="flex-grow-1 mb-2">
                <iframe src="${fileURL}#toolbar=0" width="100%" height="100%" style="border:none;"></iframe>
              </div>
            </div>
          </div>
        `;
          addTimestamp(card);
          container.appendChild(card);
        });

        console.log("✅ Downloadable requirements loaded:", result.data);
      } else {
        console.warn("⚠️ No downloadable forms found.");
      }
    } catch (err) {
      console.error("🔥 Error fetching downloadables:", err);
    }
  }

  // Load downloadables when the page is ready
  fetchDownloadables();

  // Show modal for adding new file
  document.getElementById('addFileBtn').addEventListener('click', function () {
    cardBeingEdited = null;
    document.getElementById('addRequirementLabel').textContent = 'New Downloadable Form';
    document.getElementById('addRequirementForm').reset();
    const addModal = new bootstrap.Modal(document.getElementById('addRequirementModal'));
    addModal.show();
  });

  document.getElementById("editBtn").disabled = true;

  // Edit selected card
  document.getElementById('editBtn').addEventListener('click', function () {
    const container = document.querySelector('.row.text-center');
    const selectedCards = container.querySelectorAll('.form-check-input:checked');

    if (selectedCards.length === 0) {
      alert('Please select a form to edit.');
      return;
    }
    if (selectedCards.length > 1) {
      alert('Please select only one form to edit at a time.');
      return;
    }

    const checkbox = selectedCards[0];
    const cardWrapper = checkbox.closest('.col-md-3');
    cardBeingEdited = cardWrapper;

    const cardTitle = cardWrapper.querySelector('.card-title').textContent;
    const cardType = cardWrapper.dataset.requirementType || "Uncategorized";

    document.getElementById('requirementName').value = cardTitle;
    document.getElementById('requirementFile').value = '';
    document.getElementById('editRequirementType').value = cardType;

    document.getElementById('addRequirementLabel').textContent = 'Edit Downloadable Form';
    const addModal = new bootstrap.Modal(document.getElementById('addRequirementModal'));
    addModal.show();
  });

  // Add / Edit submit handler
  document.getElementById('addRequirementForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nameInput = document.getElementById('requirementName');
    const fileInput = document.getElementById('requirementFile');
    const name = nameInput.value.trim();
    const file = fileInput.files[0];

    if (!name) {
      alert('Please provide a name for the form.');
      return;
    }

    if (!file && !cardBeingEdited) {
      alert('Please provide a PDF file.');
      return;
    }

    // Create FormData to send to backend
    const formData = new FormData();
    const requirementType = document.getElementById('editRequirementType').value;

    formData.append('title', name);
    formData.append('type', requirementType);
    formData.append('action', 'upload');
    if (file) formData.append('file', file);

    try {
      const response = await fetch('/api/upload-downloadable', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Upload success:', result);

        if (cardBeingEdited) {
          cardBeingEdited.querySelector('.card-title').textContent = name;
          if (file) {
            const fileURL = URL.createObjectURL(file);
            cardBeingEdited.querySelector('iframe').src = `${fileURL}#toolbar=0`;
          }
          cardBeingEdited = null;
        } else {
          const fileURL = file ? URL.createObjectURL(file) : '';
          const newCard = document.createElement('div');
          newCard.className = 'col-md-3 mb-3';
          newCard.innerHTML = `
            <div class="card h-100 position-relative shadow">
              <input type="checkbox" class="form-check-input position-absolute"
              style="top:5px;left:5px;z-index:3;">
              <div class="card-body d-flex flex-column" style="height: 400px;">
                <h6 class="card-title">${name}</h6>
                <div class="flex-grow-1 mb-2">
                  <iframe src="${fileURL}#toolbar=0" width="100%" height="100%" style="border:none;"></iframe>
                </div>
              </div>
            </div>
          `;
          addTimestamp(newCard);
          document.querySelector('#downloadablesContainer').appendChild(newCard);
        }

        document.getElementById('addRequirementForm').reset();
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('addRequirementModal'));
        modalInstance.hide();
        document.getElementById('addRequirementLabel').textContent = 'New Downloadable Form';

        const feedbackMessage = document.getElementById('feedbackMessage');
        feedbackMessage.textContent = `✅ "${name}" successfully uploaded!`;
        const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
        feedbackModal.show();

        setTimeout(() => {
          feedbackModal.hide();
        }, 2000);

      } else {
        console.error('❌ Upload failed:', result.message);
        alert('Error: ' + result.message);
      }

    } catch (err) {
      console.error('🔥 Error uploading file:', err);
      alert('Upload failed. Check console for details.');
    }
  });


  // Sorting
  document.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', function () {
      const sortType = this.getAttribute('data-sort');
      const container = document.querySelector('.row.text-center');
      const cards = Array.from(container.children);

      cards.sort((a, b) => {
        const titleA = a.querySelector('.card-title').textContent.trim().toLowerCase();
        const titleB = b.querySelector('.card-title').textContent.trim().toLowerCase();
        return sortType === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      });

      cards.forEach(card => container.appendChild(card));
    });
  });

  // Timestamp
  function addTimestamp(card) {
    const timestamp = Date.now();
    card.setAttribute('data-timestamp', timestamp);
  }

  // Filter Old → New
  document.getElementById('filterBtn').addEventListener('click', function () {
    const container = document.querySelector('.row.text-center');
    const cards = Array.from(container.children);

    cards.sort((a, b) => {
      const timeA = parseInt(a.getAttribute('data-timestamp') || '0');
      const timeB = parseInt(b.getAttribute('data-timestamp') || '0');
      return timeA - timeB;
    });

    cards.forEach(card => container.appendChild(card));
  });

  // Initialize timestamps
  document.querySelectorAll('.row.text-center > .col-md-3').forEach(addTimestamp);

  // Delete
  const container = document.getElementById("downloadablesContainer");
  const deleteBtn = document.getElementById("deleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const deleteModalEl = document.getElementById("deleteConfirmModal");

  let bootstrapDeleteModal = null;
  if (deleteModalEl) {
    bootstrapDeleteModal = new bootstrap.Modal(deleteModalEl);
  }

  // Show modal when delete button clicked
  deleteBtn.addEventListener("click", () => {
    const selectedCards = container.querySelectorAll(".form-check-input:checked");

    if (selectedCards.length === 0) {
      // Instead of alert, you can also disable the button until a checkbox is checked
      alert("Please select at least one form to delete.");
      return;
    }

    if (bootstrapDeleteModal) {
      bootstrapDeleteModal.show();
    }
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    const feedbackMsg = document.getElementById("feedbackMessage");
    const feedbackModalEl = document.getElementById("feedbackModal");
    const feedbackModal = new bootstrap.Modal(feedbackModalEl);

    const selectedCards = document.querySelectorAll(".form-check-input:checked");

    if (selectedCards.length === 0) return;

    const response = await fetch("/api/get-downloadables");
    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      let deletedCount = 0;

      for (const checkbox of selectedCards) {
        const cardWrapper = checkbox.closest(".col-md-3, .card, .downloadable-card");
        if (!cardWrapper) continue;

        const cardTitleEl = cardWrapper.querySelector(".card-title");
        if (!cardTitleEl) continue;

        const cardTitle = cardTitleEl.textContent.trim();
        const downloadable = result.data.find(d => d.title === cardTitle);

        if (downloadable && downloadable.id) {
          try {
            const delRes = await fetch(`/api/delete-downloadable/${downloadable.id}`, {
              method: "DELETE"
            });
            const delResult = await delRes.json();

            if (delResult.success) {
              deletedCount++;
              cardWrapper.remove();
            }
          } catch (err) {
            console.error("🔥 Error deleting:", err);
          }
        }
      }

      // 🟢 Show feedback modal with message
      if (deletedCount > 0) {
        feedbackMsg.textContent = `✅ Successfully deleted ${deletedCount} document${deletedCount > 1 ? "s" : ""}.`;
      } else {
        feedbackMsg.textContent = "⚠️ No documents were deleted.";
      }

      feedbackModal.show();

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        feedbackModal.hide();
      }, 2000);

      // Refresh list
      fetchDownloadables();
    }

    if (bootstrapDeleteModal) {
      bootstrapDeleteModal.hide();
    }

    deleteBtn.disabled = true;
  });


  // Enable delete button if at least one checkbox is checked
  container.addEventListener("change", () => {
    const checked = container.querySelectorAll(".form-check-input:checked");
    deleteBtn.disabled = checked.length === 0;
    // Enable/disable Edit button
    document.getElementById("editBtn").disabled = checked.length !== 1;
  });

  // --- Search functionality ---
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const container = document.getElementById("downloadablesContainer");
    const cards = container.querySelectorAll(".col-md-3");

    cards.forEach(card => {
      const title = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
      const type = (card.dataset.requirementType || "").toLowerCase();
      if (title.includes(query) || type.includes(query)) {
        card.style.display = ""; // show
      } else {
        card.style.display = "none"; // hide
      }
    });
  });

});


// SUBMISSION (SUBMITTED DOCUMENTS)

// document.addEventListener("DOMContentLoaded", () => {
//   // ---------- Approve / Decline ----------
//   document.querySelectorAll("tr").forEach(row => {
//     const approveBtn = row.querySelector(".approve-btn");
//     const declineBtn = row.querySelector(".decline-btn");
//     const statusCell = row.querySelector(".status-cell");
//     const remarksDiv = row.querySelector(".remarks-input");

//     if (approveBtn && declineBtn && statusCell && remarksDiv) {
//       // Approve
//       approveBtn.addEventListener("click", () => {
//         statusCell.textContent = "Approved";
//         statusCell.classList.remove("text-danger");
//         statusCell.classList.add("text-success");
//         remarksDiv.classList.add("d-none");
//       });

//       // Decline
//       declineBtn.addEventListener("click", () => {
//         statusCell.textContent = "Declined";
//         statusCell.classList.remove("text-success");
//         statusCell.classList.add("text-danger");
//         remarksDiv.classList.remove("d-none");
//       });
//       const feedbackModal = new bootstrap.Modal(document.getElementById("feedbackModal"));

//       // Send Remarks
//       const sendBtn = remarksDiv.querySelector(".send-btn");
//       if (sendBtn) {
//         sendBtn.addEventListener("click", () => {
//           const input = remarksDiv.querySelector("input");
//           const remarkText = input ? input.value : "";
//           document.getElementById("feedbackMessage").textContent = `✅ "${name}" details updated successfully!`;
//           feedbackModal.show();
//           setTimeout(() => feedbackModal.hide(), 1500);
//         });
//       }
//     }
//   });

//   // ---------- Filter ----------
//   const filterBtn = document.getElementById("filterToggleBtn");
//   const filterDropdown = document.getElementById("filterDropdown");
//   const filterSelect = document.getElementById("submissionFilter");
//   const allCards = document.querySelectorAll(".col-md-3[data-category]");

//   if (filterBtn && filterDropdown) {
//     // Toggle dropdown visibility
//     filterBtn.addEventListener("click", () => {
//       filterDropdown.style.display =
//         filterDropdown.style.display === "none" ? "block" : "none";
//     });
//   }

//   if (filterSelect) {
//     // Filter cards
//     filterSelect.addEventListener("change", function () {
//       const selected = this.value;
//       allCards.forEach(card => {
//         const category = card.getAttribute("data-category");
//         card.style.display =
//           selected === "all" || category === selected ? "block" : "none";
//       });
//     });
//   }

//   // ---------- Sorting ----------
//   function handleSort(table, sortType) {
//     const tbody = table.querySelector("tbody");
//     if (!tbody) return;

//     const rows = Array.from(tbody.querySelectorAll("tr"));
//     let colIndex;
//     let compareFn;

//     if (sortType.startsWith("name")) {
//       colIndex = 2; // Student Name column
//       compareFn = (a, b) => {
//         let textA = a.cells[colIndex].textContent.trim().toLowerCase();
//         let textB = b.cells[colIndex].textContent.trim().toLowerCase();
//         return textA.localeCompare(textB);
//       };
//     } else if (sortType.startsWith("id")) {
//       colIndex = 1; // Student ID column
//       compareFn = (a, b) => {
//         let numA = parseInt(a.cells[colIndex].textContent.trim(), 10);
//         let numB = parseInt(b.cells[colIndex].textContent.trim(), 10);
//         return numA - numB;
//       };
//     } else {
//       return; // unknown sort
//     }

//     rows.sort(compareFn);
//     if (sortType.endsWith("desc")) rows.reverse();

//     // Re-append sorted rows
//     rows.forEach((row, index) => {
//       if (row.cells[0]) row.cells[0].textContent = index + 1; // update row numbers
//       tbody.appendChild(row);
//     });
//   }

//   // Attach sort options
//   document.querySelectorAll(".dropdown-menu .dropdown-item[data-sort]").forEach(option => {
//     option.addEventListener("click", (e) => {
//       e.preventDefault();
//       const sortType = option.dataset.sort;

//       // Try to find the nearest table
//       let table = option.closest(".modal")?.querySelector("table");
//       if (!table) {
//         table = document.querySelector("table"); // fallback to first table
//       }

//       if (table) handleSort(table, sortType);
//     });
//   });
// });


// SUBMISSION (SUBMITTED DOCUMENTS)
document.addEventListener("DOMContentLoaded", function () {

  // Fetching of the submitted documents to the modal
  const modals = document.querySelectorAll(".modal[data-requirement-title]");

  modals.forEach(modalEl => {
    modalEl.addEventListener("show.bs.modal", async function () {
      const requirementTitle = modalEl.getAttribute("data-requirement-title");
      const tableBody = modalEl.querySelector("tbody");
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">Loading...</td></tr>`;

      try {
        const res = await fetch(`/api/submitted-requirements?title=${encodeURIComponent(requirementTitle)}`);
        const result = await res.json();

        if (!result.success) {
          tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No submitted documents found</td></tr>`;;
          return;
        }

        populateTable(tableBody, result.documents);
      } catch (error) {
        console.error("🔥 Error loading submitted documents:", error);
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error loading documents</td></tr>`;
      }
    });
  });

  function populateTable(tableBody, documents) {
    tableBody.innerHTML = '';

    if (documents.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No submitted documents found</td></tr>`;
      return;
    }

    documents.forEach((doc, index) => {
      let dateSubmitted = '';
      let timeSubmitted = '';

      if (doc.createdAt?.seconds) {
        const d = new Date(doc.createdAt.seconds * 1000);
        dateSubmitted = d.toLocaleDateString();
        timeSubmitted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (doc.createdAt) {
        const d = new Date(doc.createdAt);
        dateSubmitted = d.toLocaleDateString();
        timeSubmitted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      let displayStatus = '';
      let statusClass = '';

      if (doc.docustatus === 'Completed') {
        displayStatus = 'Approved';
        statusClass = 'text-success fw-bold';
      } else if (doc.docustatus === 'To Revise') {
        displayStatus = 'Declined';
        statusClass = 'text-danger fw-bold';
      } else {
        displayStatus = doc.docustatus || 'Pending';
        statusClass = 'text-secondary fw-bold';
      }

      const row = `
        <tr data-requirementid="${doc.requirementID}" data-submitteddocuid="${doc.submitteddocuID}">
          <td>${index + 1}</td>
          <td>${doc.studentID}</td>
          <td>${doc.studentName || "N/A"}</td>
          <td class="text-center">
            <a href="${doc.path}" class="btn btn-sm btn-primary" target="_blank">View File</a>
          </td>
          <td>${dateSubmitted || '—'}</td>
          <td>${timeSubmitted || '—'}</td>
          <td class="text-center">
            <button class="btn btn-success btn-sm approve-btn">Approve</button>
            <button class="btn btn-danger btn-sm decline-btn">Decline</button>
          </td>
          <td class="status-cell text-center ${statusClass}">${displayStatus}</td>
          <td class="remarks-cell text-center align-top position-relative">${doc.remarks || ""}</td>
        </tr>
      `;
      tableBody.insertAdjacentHTML('beforeend', row);

    });
  };

  // ==========================
  // MODAL INITIALIZATION
  // ==========================
  const confirmationModalEl = document.getElementById("confirmationModal");
  const sendConfirmationModalEl = document.getElementById("sendConfirmationModal");
  const feedbackModalEl = document.getElementById("feedbackModal");

  const confirmationModal = new bootstrap.Modal(confirmationModalEl);
  const sendConfirmationModal = new bootstrap.Modal(sendConfirmationModalEl);
  const feedbackModal = new bootstrap.Modal(feedbackModalEl);

  const confirmationMessage = document.getElementById("confirmationMessage");
  const confirmActionBtn = document.getElementById("confirmActionBtn");
  const confirmSendBtn = document.getElementById("confirmSendBtn");

  // Keep track of the last opened modal
  let previousModal = null;
  let currentAction = null;
  let currentRow = null;
  let currentRemarkInput = null;

  // ==========================
  // MODAL STACK HANDLING
  // ==========================
  function showConfirmationModal(targetModal, callback) {
    // Save which modal was open before confirmation
    const openModal = document.querySelector(".modal.show");
    if (openModal && openModal !== targetModal) {
      previousModal = bootstrap.Modal.getInstance(openModal);
    }

    targetModal.show();

    // When confirmation modal hides, show the previous one again
    targetModal._element.addEventListener(
      "hidden.bs.modal",
      () => {
        if (previousModal) {
          previousModal.show();
          previousModal = null;
        }
        if (callback) callback();
      },
      { once: true }
    );
  }


  // ==========================
  // APPROVE / DECLINE HANDLER
  // ==========================
  document.body.addEventListener("click", function (e) {
    if (e.target.classList.contains("approve-btn") || e.target.classList.contains("decline-btn")) {
      currentRow = e.target.closest("tr");
      currentAction = e.target.classList.contains("approve-btn") ? "approve" : "decline";
      const studentName = currentRow.querySelector("td:nth-child(3)").innerText;

      // Reset modal state
      const modalBody = confirmationModalEl.querySelector(".modal-body");
      const modalFooterBtn = document.getElementById("confirmActionBtn");
      modalBody.innerHTML = `<p id="confirmationMessage">Are you sure you want to ${currentAction} ${studentName}'s request?</p>`;
      modalFooterBtn.textContent = "Yes, Proceed";

      showConfirmationModal(confirmationModal);
    }
  });


  // ==========================
  // CONFIRM ACTION HANDLER
  // ==========================
  confirmActionBtn.addEventListener("click", async function () {
    if (!currentRow || !currentAction) return;

    const statusCell = currentRow.querySelector(".status-cell");
    const studentID = currentRow.querySelector("td:nth-child(2)").innerText;
    const requirementTitle = currentRow.closest(".modal")?.getAttribute("data-requirement-title");
    const docData = currentRow.dataset;
    const requirementID = docData.requirementid;
    const submitteddocuID = docData.submitteddocuid;

    const feedbackMessage = document.getElementById("feedbackMessage");

    // ✅ APPROVE — save immediately
    if (currentAction === "approve") {
      const newStatus = "Completed";
      const remarks = ""; // ✅ Set remarks to blank

      statusCell.textContent = "Approved";
      statusCell.classList.add("text-success", "fw-bold");
      statusCell.classList.remove("text-danger");

      const remarksCell = currentRow.querySelector(".remarks-cell");
      remarksCell.textContent = ""; // ✅ Clear remarks visually

      confirmationModal.hide();

      try {
        const res = await fetch("/api/update-docustatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requirementID,
            requirementTitle,
            studentID,
            submitteddocuID,
            newStatus,
            remarks,
          }),
        });

        const result = await res.json();

        if (!result.success) {
          console.error("❌ Failed to update Firestore:", result.message);
          feedbackMessage.textContent = `❌ Failed to approve document.`;
        } else {
          console.log(`✅ Firestore updated: ${newStatus}`);
          feedbackMessage.textContent = `Document approved successfully!`;
        }

        feedbackModal.show();
        setTimeout(() => feedbackModal.hide(), 2000);
      } catch (error) {
        console.error("🔥 Error sending update:", error);
      }
    }


    // ❌ DECLINE — ask for remarks before saving
    else if (currentAction === "decline") {
      const modalBody = confirmationModalEl.querySelector(".modal-body");
      const modalFooterBtn = document.getElementById("confirmActionBtn");

      // Replace modal content with remarks input
      modalBody.innerHTML = `
      <label for="declineRemark" class="form-label fw-semibold">Please enter remarks for declining:</label>
      <textarea id="declineRemark" class="form-control" rows="3" placeholder="Enter remarks here..."></textarea>
    `;

      // Change button text and behavior
      modalFooterBtn.textContent = "Send";
      currentAction = "submit-decline"; // track new phase
    }

    // 📤 SUBMIT DECLINE WITH REMARKS
    else if (currentAction === "submit-decline") {
      const remarkInput = document.getElementById("declineRemark");
      const remarkText = remarkInput?.value.trim();

      if (!remarkText) {
        alert("⚠ Please enter remarks before sending.");
        return;
      }

      const newStatus = "To Revise";
      statusCell.textContent = "Declined";
      statusCell.classList.add("text-danger", "fw-bold");
      statusCell.classList.remove("text-success");

      const remarksCell = currentRow.querySelector(".remarks-cell");
      remarksCell.textContent = remarkText;

      // ✅ Update status cell appearance
      statusCell.textContent = "Declined";
      statusCell.classList.add("text-danger", "fw-bold");
      statusCell.classList.remove("text-success");

      // ✅ Show the entered remarks in the table cell


      confirmationModal.hide();

      try {
        const res = await fetch("/api/update-docustatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requirementID,
            requirementTitle,
            studentID,
            submitteddocuID,
            newStatus,
            remarks: remarkText,
          }),
        });
        const result = await res.json();

        if (!result.success) {
          console.error("❌ Failed to update Firestore:", result.message);
          feedbackMessage.textContent = `❌ Failed to send remark.`;
        } else {
          console.log(`✅ Firestore updated: ${newStatus} with remark "${remarkText}"`);
          feedbackMessage.textContent = `Document declined with remarks: ${remarkText}`;
        }

        feedbackModal.show();
        setTimeout(() => feedbackModal.hide(), 2000);
      } catch (error) {
        console.error("🔥 Error sending update:", error);
        feedbackMessage.textContent = `🔥 Error sending remark.`;
        feedbackModal.show();
        setTimeout(() => feedbackModal.hide(), 2000);
      }
    }
  });


  // ==========================
  // FEEDBACK MODAL (already existing)
  // ==========================
  confirmSendBtn.addEventListener("click", function () {
    if (currentRemarkInput) {
      const remarkText = currentRemarkInput.value.trim();
      const feedbackMessage = document.getElementById("feedbackMessage");

      if (remarkText) {
        feedbackMessage.textContent = `✅ Remark sent successfully! ${remarkText}`;
      } else {
        feedbackMessage.textContent = `⚠ Please enter a remark before sending.`;
      }

      sendConfirmationModal.hide();
      feedbackModal.show();
      setTimeout(() => feedbackModal.hide(), 2000);
    }
  });


  // ==========================
  // FILTER HANDLERS
  // ==========================
  const filterBtn = document.getElementById('filterToggleBtn');
  const filterDropdown = document.getElementById('filterDropdown');
  const filterSelect = document.getElementById('submissionFilter');
  const allCards = document.querySelectorAll('.col-md-3[data-category]');

  if (filterBtn && filterDropdown) {
    filterBtn.addEventListener('click', () => {
      filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', function () {
      const selected = this.value;
      allCards.forEach(card => {
        const category = card.getAttribute('data-category');
        card.style.display = (selected === 'all' || category === selected) ? 'block' : 'none';
      });
    });
  }

  // ==========================
  // SORT HANDLER
  // ==========================
  function handleSort(table, sortType) {
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    let colIndex;
    let compareFn;

    if (sortType.startsWith("name")) {
      colIndex = 2;
      compareFn = (a, b) => a.cells[colIndex].textContent.trim().localeCompare(b.cells[colIndex].textContent.trim());
    } else if (sortType.startsWith("id")) {
      colIndex = 1;
      compareFn = (a, b) => parseInt(a.cells[colIndex].textContent) - parseInt(b.cells[colIndex].textContent);
    }

    rows.sort(compareFn);
    if (sortType.endsWith("desc")) rows.reverse();

    rows.forEach((row, index) => {
      row.cells[0].textContent = index + 1;
      tbody.appendChild(row);
    });
  }

  document.querySelectorAll(".dropdown-menu .dropdown-item[data-sort]").forEach(option => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      const sortType = option.dataset.sort;
      const modal = option.closest(".modal");
      const table = modal ? modal.querySelector("table") : null;
      if (table) handleSort(table, sortType);
    });
  });

  // ==========================
  // STATUS BADGE + FILTERING
  // ==========================
  function getStatusCell(tr) {
    return tr.querySelector('.status-cell') || tr.cells[7] || null;
  }

  function renderStatusBadge(cell, status) {
    if (!cell) return;
    const s = (status || '').trim().toLowerCase();
    const label = s ? (s[0].toUpperCase() + s.slice(1)) : 'Pending';
    let cls = 'bg-secondary';
    if (s === 'approved') cls = 'bg-success';
    else if (s === 'declined') cls = 'bg-danger';
    cell.innerHTML = `<span class="badge ${cls}">${label}</span>`;
  }

  document.querySelectorAll('table').forEach(table => {
    table.querySelectorAll('tbody tr').forEach(tr => {
      const sc = getStatusCell(tr);
      if (sc) renderStatusBadge(sc, sc.textContent.trim() || 'Pending');
    });
  });

  function applyFiltersToTable(table) {
    if (!table) return;
    const modal = table.closest('.modal');
    const filter = modal ? modal.querySelector('select[id$="Filter"], select[id$="filter"]') : null;
    const searchInput = modal ? modal.querySelector('input[id$="SearchInput"], input[id$="searchInput"]') : null;

    const filterVal = (filter ? filter.value : 'all').toLowerCase();
    const q = (searchInput ? searchInput.value : '').toLowerCase();

    table.querySelectorAll('tbody tr').forEach(tr => {
      const sc = getStatusCell(tr);
      const statusText = sc ? (sc.textContent.trim().toLowerCase() || 'pending') : 'pending';
      const matchFilter = (filterVal === 'all') || (statusText === filterVal);
      const matchSearch = !q || Array.from(tr.cells).map(td => td.textContent).join(' ').toLowerCase().includes(q);
      tr.style.display = (matchFilter && matchSearch) ? '' : 'none';
    });
  }

  document.querySelectorAll('select[id$="Filter"], select[id$="filter"]').forEach(sel => {
    sel.addEventListener('change', () => {
      const modal = sel.closest('.modal');
      const table = modal ? modal.querySelector('table') : null;
      applyFiltersToTable(table);
    });
  });

  document.querySelectorAll('input[id$="SearchInput"], input[id$="searchInput"]').forEach(inp => {
    inp.addEventListener('input', () => {
      const modal = inp.closest('.modal');
      const table = modal ? modal.querySelector('table') : null;
      applyFiltersToTable(table);
    });
  });

  document.querySelectorAll('.modal').forEach(modalEl => {
    modalEl.addEventListener('shown.bs.modal', function () {
      const table = modalEl.querySelector('table');
      if (table) applyFiltersToTable(table);
    });
  });

  document.querySelectorAll('.search-bar').forEach(input => {
    input.addEventListener('keyup', function () {
      let value = this.value.toLowerCase();
      let targetTable = document.querySelector(this.dataset.target);
      if (targetTable) {
        targetTable.querySelectorAll('tbody tr').forEach(row => {
          row.style.display = row.innerText.toLowerCase().includes(value) ? '' : 'none';
        });
      }
    });
  });
});


// USER ACCOUNTS (REG-ACCOUNTS)
document.addEventListener("DOMContentLoaded", () => {

  const addAccountForm = document.getElementById("addAccountForm");
  const addAccountModal = document.getElementById("addAccountModal");
  const feedbackBox = document.getElementById("formFeedback"); // <-- Add this in HTML for user messages
  setupLiveValidation(addAccountForm);


  let targetBlock = "A";
  let loadedStudents = []; // store fetched students for duplicate checking

  // --- Track which Add button was clicked ---
  document.querySelectorAll('[data-bs-target="#addAccountModal"]').forEach(btn => {
    btn.addEventListener("click", () => {
      targetBlock = btn.getAttribute("data-block"); // "A" or "B"
    });
  });

  // --- Load students from Firestore ---
  async function loadStudents() {
    try {
      const response = await fetch("/get-students");
      const result = await response.json();

      document.getElementById("noEntriesMessageBlockA").style.display = "";
      document.getElementById("noEntriesMessageBlockB").style.display = "";

      if (!result.success || !result.students.length) {
        console.warn("⚠️ No students found or failed to fetch.");
        return;
      }

      loadedStudents = result.students; // cache them for duplicate check

      result.students.forEach(student => {
        const tableId = student.targetBlock === "A" ? "blockATable" : "blockBTable";
        addAccountToTable(tableId, student);
      });

      const hasA = result.students.some(s => s.targetBlock === "A");
      const hasB = result.students.some(s => s.targetBlock === "B");

      document.getElementById("noEntriesMessageBlockA").style.display = hasA ? "none" : "";
      document.getElementById("noEntriesMessageBlockB").style.display = hasB ? "none" : "";

      console.log("✅ Students loaded successfully");
    } catch (error) {
      console.error("🔥 Error loading students:", error);
    }
  }

  // --- Insert a new row into the correct table ---
  function addAccountToTable(tableId, accountData) {
    const tableBody = document.querySelector(`#${tableId} tbody`);

    // Check if password was reset
    let passwordDisplay = accountData.password;
    let resetLogDisplay = '--';

    if (accountData.updatedAt) {
      passwordDisplay = '**********';
      resetLogDisplay = formatDate(accountData.updatedAt);
    }

    const newRow = document.createElement("tr");
    newRow.innerHTML = `
    <td><input type="checkbox" /></td>
    <td>${accountData.student_id}</td>
    <td>${accountData.email}</td>
    <td>${accountData.surname}</td>
    <td>${accountData.firstname}</td>
    <td>${accountData.middlename || ""}</td>
    <td>${accountData.suffix || ""}</td>
    <td>${accountData.birthdate}</td>
    <td>${accountData.gender}</td>
    <td>${accountData.contact}</td>
    <td>${accountData.reg_date}</td>
    <td>${passwordDisplay}</td>
    <td class="reset-log">${resetLogDisplay}</td>
    <td>
      <div class="d-flex gap-1">
        <button class="btn btn-primary btn-sm" onclick="updateStatus(this, 'Active')">Active</button>
        <button class="btn btn-danger btn-sm" onclick="updateStatus(this, 'Inactive')">Inactive</button>
      </div>
    </td>
    <td class="status-cell">${accountData.status || "Active"}</td>
    <td>--</td>
  `;
    tableBody.appendChild(newRow);
  }

  // --- Helper function to format timestamp like "Oct 29, 2025, 11:08 PM" ---
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }


  // --- Check if student already exists ---
  function studentExists(student_id) {
    return loadedStudents.some(student => student.student_id === student_id);
  }

  // --- Show feedback ---
  function showFeedback(message, type = "danger") {
    if (!feedbackBox) return;
    feedbackBox.innerHTML = `
      <div class="alert alert-${type} py-2 mb-2">${message}</div>
    `;
    setTimeout(() => (feedbackBox.innerHTML = ""), 4000);
  }

  // --- Handle form submission ---
  addAccountForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const saveBtn = document.getElementById("saveAccountBtn");
    const spinner = document.getElementById("saveSpinner");
    const btnTextOriginal = saveBtn.innerHTML; // Save original button HTML

    // --- Validate before saving ---
    if (!validateFormBeforeSubmit(addAccountForm)) {
      showFeedback("⚠️ Please fix the highlighted errors.", "warning");
      return;
    }

    const formData = new FormData(addAccountForm);
    const accountData = Object.fromEntries(formData.entries());
    accountData.targetBlock = targetBlock;

    const now = new Date();
    accountData.reg_date = now.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    accountData.status = "Active";
    accountData.internshipstatus = "Pending";

    if (studentExists(accountData.student_id)) {
      showFeedback(`⚠️ Student ID "${accountData.student_id}" already exists.`, "warning");
      return;
    }

    // --- Show loading spinner ---
    saveBtn.disabled = true;
    spinner.classList.remove("d-none");

    // Instead of replacing the whole text, find text node and update it
    saveBtn.querySelector("span.spinner-border").classList.remove("d-none");
    saveBtn.lastChild.textContent = " Saving...";

    try {
      const response = await fetch("/save-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountData),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Account saved:", accountData.student_id);

        const feedbackMessage = document.getElementById("feedbackMessage");
        feedbackMessage.textContent = `✅ Account successfully added!`;
        const feedbackModal = new bootstrap.Modal(document.getElementById("feedbackModal"));
        feedbackModal.show();

        setTimeout(() => feedbackModal.hide(), 2000);

        const tableId = targetBlock === "A" ? "blockATable" : "blockBTable";
        addAccountToTable(tableId, accountData);
        loadedStudents.push(accountData);

        setTimeout(() => {
          addAccountForm.reset();
          bootstrap.Modal.getInstance(addAccountModal).hide();
        }, 2500);
      } else {
        showFeedback("⚠️ Failed to save account.", "danger");
      }
    } catch (error) {
      console.error("🔥 Error saving:", error);
      showFeedback("🔥 Error saving account.", "danger");
    } finally {
      // --- Hide spinner & reset button ---
      spinner.classList.add("d-none");
      saveBtn.disabled = false;
      saveBtn.innerHTML = btnTextOriginal; // Restore original button HTML
    }
  });


  loadStudents();

  // --- Sorting Function ---

  document.querySelectorAll('.blockA-filter-option').forEach(option => {
    option.addEventListener('click', function () {
      const value = this.getAttribute('data-value');
      const select = document.getElementById('filterActionBlockA');
      select.value = value;
      const button = document.getElementById('filterActionBlockAButton');
      button.innerHTML = `<i class="bi bi-funnel-fill"></i> ${value}`;
      applyFilterSingle('blockATable', 'filterActionBlockA', 'noEntriesMessageBlockA');
    });
  });

  // --- Connect dropdown items to hidden select ---
  document.querySelectorAll('.blockB-filter-option').forEach(option => {
    option.addEventListener('click', function () {
      const value = this.getAttribute('data-value');
      const select = document.getElementById('filterActionBlockB');
      select.value = value; // update hidden select value

      // Update dropdown button text for clarity
      const button = document.getElementById('filterActionBlockBButton');
      button.innerHTML = `<i class="bi bi-funnel-fill"></i> ${value}`;

      // Trigger filter
      applyFilterSingle('blockBTable', 'filterActionBlockB', 'noEntriesMessageBlockB');
    });
  });


  function makeTableSortable(tableId) {
    const table = document.getElementById(tableId);
    const headers = table.querySelectorAll("th");

    headers.forEach((header, index) => {
      if (header.textContent.trim() === "" || header.textContent === "Action") return;

      header.classList.add("sortable");
      header.title = "Click to sort";

      header.addEventListener("click", () => {
        const tbody = table.querySelector("tbody");
        const rows = Array.from(tbody.querySelectorAll("tr:not([id])"))
          // ✅ Only include visible rows
          .filter(row => row.style.display !== "none");

        const type = header.getAttribute("data-type") || "string";
        const asc = !header.classList.contains("asc");

        headers.forEach(h => h.classList.remove("asc", "desc"));
        header.classList.add(asc ? "asc" : "desc");

        rows.sort((a, b) => {
          let valA = a.cells[index] ? a.cells[index].innerText.trim() : "";
          let valB = b.cells[index] ? b.cells[index].innerText.trim() : "";

          if (type === "date") {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
          } else if (!isNaN(valA) && !isNaN(valB)) {
            valA = Number(valA);
            valB = Number(valB);
          }

          if (valA < valB) return asc ? -1 : 1;
          if (valA > valB) return asc ? 1 : -1;
          return 0;
        });

        // ✅ Append only sorted visible rows (keep hidden ones untouched)
        rows.forEach(row => tbody.appendChild(row));
      });
    });
  }

  // --- Apply Filter ---
  function applyFilterSingle(tableId, filterId, noEntriesMessageId) {
    const table = document.getElementById(tableId);
    const filter = document.getElementById(filterId);
    const noEntriesMessage = document.getElementById(noEntriesMessageId);
    if (!table || !filter || !noEntriesMessage) return;

    const value = filter.value;
    let visibleRows = 0;

    Array.from(table.querySelectorAll("tbody tr")).forEach(row => {
      if (row.id && row.id === noEntriesMessageId) return;
      const statusCell = row.querySelector(".status-cell");
      if (!statusCell) return;

      const status = statusCell.textContent.trim();
      if (value === "All" || status === value) {
        row.style.display = "";
        visibleRows++;
      } else {
        row.style.display = "none";
      }
    });

    // Show "No Entries" if nothing is visible
    noEntriesMessage.style.display = visibleRows === 0 ? "" : "none";
  }

  function makeTableFilterable(tableId, filterId, noEntriesMessageId) {
    const filter = document.getElementById(filterId);
    if (!filter) return;
    filter.addEventListener("change", () => {
      applyFilterSingle(tableId, filterId, noEntriesMessageId);
    });
    applyFilterSingle(tableId, filterId, noEntriesMessageId);
  }

  // --- Initialize sorting and filtering ---
  makeTableSortable("blockATable");
  makeTableSortable("blockBTable");
  makeTableFilterable("blockATable", "filterActionBlockA", "noEntriesMessageBlockA");
  makeTableFilterable("blockBTable", "filterActionBlockB", "noEntriesMessageBlockB");

  // --- Search Function ---
  function applySearchSingle(tableId, searchInputId, noEntriesMessageId) {
    const table = document.getElementById(tableId);
    const searchInput = document.getElementById(searchInputId);
    const noEntriesMessage = document.getElementById(noEntriesMessageId);

    if (!table || !searchInput || !noEntriesMessage) return;

    const searchTerm = searchInput.value.trim().toLowerCase();
    let visibleRows = 0;

    Array.from(table.querySelectorAll("tbody tr")).forEach(row => {
      if (row.id && row.id === noEntriesMessageId) return;

      // Combine all cell texts into one string
      const rowText = Array.from(row.cells)
        .map(cell => cell.innerText.trim().toLowerCase())
        .join(" ");

      if (rowText.includes(searchTerm)) {
        row.style.display = "";
        visibleRows++;
      } else {
        row.style.display = "none";
      }
    });

    // Show "No Entries" if nothing is visible
    noEntriesMessage.style.display = visibleRows === 0 ? "" : "none";
  }

  // --- Make Searchable ---
  function makeTableSearchable(tableId, searchInputId, noEntriesMessageId) {
    const searchInput = document.getElementById(searchInputId);
    if (!searchInput) return;

    // Trigger search on input
    searchInput.addEventListener("input", () => {
      applySearchSingle(tableId, searchInputId, noEntriesMessageId);
    });

    // Initial search
    applySearchSingle(tableId, searchInputId, noEntriesMessageId);
  }

  // --- Initialize search ---
  makeTableSearchable("blockATable", "searchInputBlockA", "noEntriesMessageBlockA");
  makeTableSearchable("blockBTable", "searchInputBlockB", "noEntriesMessageBlockB");



  // --- Delete buttons logic ---
  const blockADeleteBtn = document.getElementById("blockADeleteBtn");
  const blockBDeleteBtn = document.getElementById("blockBDeleteBtn");
  const blockATable = document.getElementById("blockATable");
  const blockBTable = document.getElementById("blockBTable");
  const confirmDeleteBtn = document.querySelector("#regAccConfirmDeleteModal .btn-danger");

  let selectedTable = null;

  function toggleDeleteButton(table, deleteBtn) {
    const checkboxes = table.querySelectorAll("tbody input[type='checkbox']");
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    deleteBtn.disabled = !anyChecked;
  }

  // --- Event delegation for checkbox monitoring ---
  blockATable.addEventListener("change", (e) => {
    if (e.target.matches("input[type='checkbox']")) {
      toggleDeleteButton(blockATable, blockADeleteBtn);
    }
  });

  blockBTable.addEventListener("change", (e) => {
    if (e.target.matches("input[type='checkbox']")) {
      toggleDeleteButton(blockBTable, blockBDeleteBtn);
    }
  });


  blockADeleteBtn.addEventListener("click", () => { selectedTable = blockATable; });
  blockBDeleteBtn.addEventListener("click", () => { selectedTable = blockBTable; });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (!selectedTable) return;

    const checkboxes = selectedTable.querySelectorAll("tbody input[type='checkbox']:checked");
    const rowsToDelete = [];

    for (const cb of checkboxes) {
      const row = cb.closest("tr");
      const student_id = row.children[1]?.textContent?.trim(); // assuming 2nd column is student_id

      if (!student_id) continue;
      rowsToDelete.push({ row, student_id });
    }

    for (const { row, student_id } of rowsToDelete) {
      try {
        const block = selectedTable.id === "blockATable" ? "A" : "B";
        const response = await fetch(`/delete-student/${block}/${student_id}`, { method: "DELETE" });
        const result = await response.json();

        if (result.success) {
          console.log(`🗑️ Deleted ${student_id} from Firestore`);
          row.remove(); // remove from table
          loadedStudents = loadedStudents.filter(s => s.student_id !== student_id); // remove from cache
        } else {
          console.warn(`⚠️ Failed to delete ${student_id}: ${result.message}`);
        }
      } catch (error) {
        console.error(`🔥 Error deleting ${student_id}:`, error);
      }
    }

    // Auto-show "No Entries" if table is empty
    const noEntriesMessage = selectedTable.querySelector(`#noEntriesMessage${selectedTable.id === "blockATable" ? "BlockA" : "BlockB"}`);
    const remainingRows = selectedTable.querySelectorAll("tbody tr:not([id])");
    noEntriesMessage.style.display = remainingRows.length === 0 ? "" : "none";

    toggleDeleteButton(selectedTable, selectedTable.id === "blockATable" ? blockADeleteBtn : blockBDeleteBtn);

    const modal = bootstrap.Modal.getInstance(document.getElementById("regAccConfirmDeleteModal"));
    modal.hide();
  });


  // --- Auto-generate password ---
  function generatePassword(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    let pass = "";
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  addAccountModal.addEventListener('shown.bs.modal', function () {
    document.getElementById('tempPassword').value = generatePassword();
  });

  // --- Reset modal when closed ---
  addAccountModal.addEventListener('hidden.bs.modal', () => {
    addAccountForm.reset(); // Clear all inputs
    feedbackBox.innerHTML = ''; // Clear feedback
    addAccountForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    addAccountForm.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    document.getElementById('tempPassword').value = generatePassword(); // Generate fresh password
  });


  document.getElementById('regenPassBtn').addEventListener('click', function () {
    document.getElementById('tempPassword').value = generatePassword();
  });


});


// Update status function 
async function updateStatus(button, newStatus) {
  const row = button.closest("tr");
  const statusCell = row.querySelector(".status-cell");
  const student_id = row.children[1]?.textContent?.trim();

  // Determine which block (A or B)
  const table = row.closest("table");
  const block = table.id === "blockATable" ? "A" : "B";

  // Update visually first
  statusCell.textContent = newStatus;

  try {
    // Save to Firestore via backend
    const response = await fetch(`/update-status/${block}/${student_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();
    if (result.success) {
      console.log(`✅ Status updated for ${student_id}: ${newStatus}`);
    } else {
      console.warn(`⚠️ Failed to update status: ${result.message}`);
    }
  } catch (error) {
    console.error(`🔥 Error updating status for ${student_id}:`, error);
  }
}

// Inputs Validation

const nameRegex = /^[A-Za-z\s.]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactRegex = /^[0-9]+$/;

const validators = {
  surname: value => nameRegex.test(value) || "Surname must contain letters only.",
  firstname: value => nameRegex.test(value) || "First name must contain letters only.",
  middlename: value => value === "" || nameRegex.test(value) || "Middle name must contain letters only.",
  email: value => emailRegex.test(value) || "Please enter a valid email address.",
  contact: value => contactRegex.test(value) || "Contact number must contain numbers only."
};

// --- Live Validation Setup ---
function setupLiveValidation(form) {
  // --- Attach event listeners to inputs ---
  Object.keys(validators).forEach(fieldName => {
    const input = form.querySelector(`input[name="${fieldName}"]`);
    if (!input) return;

    input.addEventListener("input", () => {
      validateField(input, validators[fieldName]);
    });
  });
}

// --- Individual Field Validator ---
function validateField(input, validatorFn) {
  const value = input.value.trim();
  const feedback = input.nextElementSibling?.classList.contains("invalid-feedback")
    ? input.nextElementSibling
    : null;

  const result = validatorFn(value);

  if (result !== true) {
    // Invalid
    input.classList.add("is-invalid");
    if (!feedback) {
      const msg = document.createElement("div");
      msg.className = "invalid-feedback";
      msg.textContent = result;
      input.insertAdjacentElement("afterend", msg);
    } else {
      feedback.textContent = result;
    }
  } else {
    // Valid
    input.classList.remove("is-invalid");
    if (feedback) feedback.remove();
  }
}

// --- Final check on submit (in case user skips typing)
function validateFormBeforeSubmit(form) {
  let allValid = true;
  form.querySelectorAll("input").forEach(input => {
    const name = input.getAttribute("name");
    if (!name) return;
    const validatorFn = validators[name];
    if (validatorFn) {
      const result = validatorFn(input.value.trim());
      if (result !== true) {
        allValid = false;
        validateField(input, validatorFn);
      }
    }
  });
  return allValid;
}

// PARTNER ESTABLISHMENTS 
document.addEventListener("DOMContentLoaded", () => {

  async function loadPartners() {
    try {
      const res = await fetch("/api/get-partners");
      const data = await res.json();

      if (!data.success) throw new Error("Failed to fetch partners");

      const container = document.querySelector(".dashboard .row");
      container.innerHTML = ""; // clear existing cards

      data.partners.forEach((partner, index) => {
        const col = document.createElement("div");
        col.className = "col-lg-4 mb-4";
        col.dataset.moaStatus = partner.moaStatus;
        col.dataset.name = partner.establishmentName;
        col.dataset.moaDate = partner.moaSince;
        col.dataset.address = partner.address;
        col.dataset.positions = partner.positions;

        col.innerHTML = `
        <div class="card hte-card shadow-lg border-0 h-100 custom-card-hover position-relative">
          <div class="card-body custom-card-shadow">
            <div class="d-flex justify-content-left">
              <div class="flex align-items-center justify-content-left">
                <input type="checkbox" data-id="${partner.id}" style="width: 16px; height: 16px; margin-top: 16px;" />
              </div>
            </div>

            <div class="text-center mt-4 mb-3">
              <h5 class="card-title fw-semibold text-uppercase" style="font-size: 1.1rem;">
                ${partner.establishmentName}
              </h5>
            </div>
          </div>

          <!-- Icon Button to trigger modal -->
          <button class="btn btn-light position-absolute bottom-0 end-0 m-3 rounded-circle shadow border"
            data-bs-toggle="modal" data-bs-target="#detailsModal${index}">
            <i class="bi bi-card-list color-violet"></i>
          </button>
        </div>
      `;

        container.appendChild(col);

        // Create modal dynamically
        // Create modal dynamically
        const modal = document.createElement("div");
        modal.className = "modal fade";
        modal.id = `detailsModal${index}`;
        modal.tabIndex = -1;
        modal.setAttribute("aria-labelledby", `detailsModalLabel${index}`);
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = `
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <form id="detailsForm${index}">
                <div class="modal-header">
                  <h5 class="modal-title" id="detailsModalLabel${index}">Establishment Details</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <!-- Establishment Name -->
                  <label><strong>Name:</strong></label>
                  <input type="text" class="form-control mb-2" id="hte${index}Name" value="${partner.establishmentName || ''}">

                  <!-- Address -->
                  <label><strong>Address:</strong></label>
                  <input type="text" class="form-control mb-2" id="hte${index}Address" value="${partner.address || ''}">

                  <!-- Company Profile -->
                  <label><strong>Company Profile (PDF/DOC):</strong></label>
                  <input type="file" class="form-control mb-2" id="hte${index}ProfileFile" accept=".pdf,.doc,.docx">
                  ${partner.documents?.profileFilePath
            ? `<a href="/${partner.documents.profileFilePath}" target="_blank" class="large text-primary d-block mb-2">View existing company profile</a>`
            : `<span class="text-muted small d-block mb-2">No file uploaded</span>`}

                  <!-- MOA Status -->
                  <label><strong>MOA Status:</strong></label>
                  <select class="form-control mb-2" id="hte${index}MoaStatus">
                    <option value="New" ${partner.moaStatus === "New" ? "selected" : ""}>New</option>
                    <option value="Renewed" ${partner.moaStatus === "Renewed" ? "selected" : ""}>Renewed</option>
                    <option value="Expired" ${partner.moaStatus === "Expired" ? "selected" : ""}>Expired</option>
                  </select>

                  <!-- MOA Date -->
                  <label><strong>MOA Established Since:</strong></label>
                  <input type="date" class="form-control mb-2" id="hte${index}MoaDate" value="${partner.moaSince || ''}">

                  <!-- Signed MOA -->
                  <label><strong>Signed MOA Image (JPG/PNG):</strong></label>
                  <input type="file" class="form-control mb-2" id="hte${index}MoaImage" accept=".jpg,.jpeg,.png">
                  ${partner.documents?.moaFilePath
            ? `<a href="/${partner.documents.moaFilePath}" target="_blank" class="large text-primary d-block mb-2">View existing signed MOA</a>`
            : `<span class="text-muted small d-block mb-2">No MOA uploaded</span>`}

                  <!-- Positions -->
                  <label><strong>Available Positions:</strong></label>
                  <input type="text" class="form-control" id="hte${index}Positions" value="${partner.positions || ''}">
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-main" onclick="saveDetails(${index}, '${partner.id}')">Save</button>
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
              </form>
            </div>
          </div>
        `;
        document.body.appendChild(modal);


      });

    } catch (err) {
      console.error("❌ Error loading partners:", err);
    }
  }

  loadPartners();

  const mainEl = document.getElementById('main') || document.body;
  const deleteBtn = document.getElementById('deleteBtn');
  const deleteModalEl = document.getElementById('deleteConfirmModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  if (!deleteBtn || !deleteModalEl || !confirmDeleteBtn) {
    console.warn('Delete button / modal elements not found. Make sure IDs: deleteBtn, deleteConfirmModal, confirmDeleteBtn exist.');
    return;
  }

  const deleteModal = new bootstrap.Modal(deleteModalEl);

  // find checkboxes that represent selectable rows/cards
  function getAllSelectableCheckboxes() {
    return Array.from(mainEl.querySelectorAll('input[type="checkbox"]'))
      .filter(cb => cb.closest('table') || cb.closest('.notification-card') || cb.closest('.col-lg-4') || cb.closest('.hte-card') || cb.closest('.card'));
  }

  function anyChecked() {
    return getAllSelectableCheckboxes().some(cb => cb.checked);
  }

  function updateDeleteButtonState() {
    deleteBtn.disabled = !anyChecked();
  }

  mainEl.addEventListener('change', function (e) {
    if (!e.target || e.target.type !== 'checkbox') return;
    const pcs = getAllSelectableCheckboxes();
    if (pcs.includes(e.target)) updateDeleteButtonState();
  });

  updateDeleteButtonState();

  deleteBtn.addEventListener('click', function () {
    if (!anyChecked()) return;
    deleteModal.show();
  });

  function getRemovableElementFromCheckbox(cb) {
    return cb.closest('tr') ||
      cb.closest('.notification-card') ||
      cb.closest('.col-lg-4') ||
      cb.closest('.hte-card') ||
      cb.closest('.card') ||
      cb.closest('li') ||
      cb.parentElement;
  }

  confirmDeleteBtn.addEventListener('click', async function () {
    const checked = getAllSelectableCheckboxes().filter(cb => cb.checked);

    if (checked.length === 0) {
      deleteModal.hide();
      updateDeleteButtonState();
      return;
    }

    // Collect all establishment IDs (assuming each checkbox has a data-id attribute)
    const idsToDelete = checked.map(cb => cb.getAttribute('data-id')).filter(Boolean);

    if (idsToDelete.length > 0) {
      try {
        const res = await fetch("/api/delete-partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: idsToDelete })
        });
        const data = await res.json();

        if (data.success) {
          // Remove from DOM visually
          checked.forEach(cb => {
            const removable = getRemovableElementFromCheckbox(cb);
            if (removable) removable.remove();
          });

          console.log(`${idsToDelete.length} partner(s) deleted successfully.`);
        } else {
          console.error("Failed to delete partners:", data.message);
        }
      } catch (err) {
        console.error("Error deleting partners:", err);
      }
    }

    deleteModal.hide();
    updateDeleteButtonState();
  });

  deleteModalEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      confirmDeleteBtn.click();
    }
  });

  // ---- FILTER ----
  const filterOptions = document.querySelectorAll(".filter-option");
  const cardContainer = document.querySelector(".row.align-items-top");

  filterOptions.forEach(option => {
    option.addEventListener("click", function (e) {
      e.preventDefault();

      const selectedRaw = (this.getAttribute("data-filter") || "");
      const selected = selectedRaw.trim().toLowerCase();

      // re-query cards each time
      const cards = Array.from(cardContainer.querySelectorAll(".col-lg-4"));

      cards.forEach(card => {
        const status = (card.dataset.moaStatus || "").trim().toLowerCase();
        if (selected === "all" || status === selected) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  // ---- SORT ----
  const sortOptions = document.querySelectorAll(".sort-option");

  sortOptions.forEach(option => {
    option.addEventListener("click", function () {
      const selected = this.getAttribute("data-sort");
      const cards = Array.from(cardContainer.querySelectorAll(".col-lg-4"));

      cards.sort((a, b) => {
        const nameA = (a.dataset.name || "").toLowerCase();
        const nameB = (b.dataset.name || "").toLowerCase();
        const dateA = new Date(a.dataset.moaDate || 0);
        const dateB = new Date(b.dataset.moaDate || 0);

        switch (selected) {
          case "nameAsc": return nameA.localeCompare(nameB);
          case "nameDesc": return nameB.localeCompare(nameA);
          case "dateNew": return dateB - dateA;
          case "dateOld": return dateA - dateB;
          default: return 0;
        }
      });

      cards.forEach(card => cardContainer.appendChild(card));
    });
  });

  // ---- ADD & SAVE CARDS ----
  let hteCounter = document.querySelectorAll(".hte-card").length;

  // click handler to open Add modal
  document.getElementById("addButton").addEventListener("click", function () {
    const addCardModal = new bootstrap.Modal(document.getElementById("addCardModal"));
    addCardModal.show();
  });

  // Save edits from detail modal
  async function saveDetails(index, partnerId) {
    const name = document.getElementById(`hte${index}Name`).value.trim();
    const address = document.getElementById(`hte${index}Address`).value.trim();
    const moaStatus = document.getElementById(`hte${index}MoaStatus`).value.trim();
    const moaDate = document.getElementById(`hte${index}MoaDate`).value || "";
    const positions = document.getElementById(`hte${index}Positions`).value.trim();

    const profileFileInput = document.getElementById(`hte${index}ProfileFile`);
    const moaFileInput = document.getElementById(`hte${index}MoaImage`);

    const feedbackModal = new bootstrap.Modal(document.getElementById("feedbackModal"));

    // FormData for sending files + text fields
    const formData = new FormData();
    formData.append("partnerId", partnerId);
    formData.append("establishmentName", name);
    formData.append("address", address);
    formData.append("moaStatus", moaStatus);
    formData.append("moaSince", moaDate);
    formData.append("positions", positions);

    // Attach files only if user uploaded new ones
    if (profileFileInput.files.length > 0) {
      formData.append("profileFile", profileFileInput.files[0]);
    }

    if (moaFileInput.files.length > 0) {
      formData.append("moaFile", moaFileInput.files[0]);
    }

    try {
      const res = await fetch("/api/update-partner", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        document.getElementById("feedbackMessage").textContent = `✅ "${name}" details updated successfully!`;
        feedbackModal.show();
        setTimeout(() => feedbackModal.hide(), 1500);

        // Optionally reload partner list or update card UI dynamically

        // Reset the form
        const form = document.getElementById(`detailsForm${index}`);
        if (form) form.reset();

        // Clear file previews manually if needed
        const profilePreview = document.querySelector(`#detailsModal${index} a[href*='profile']`);
        if (profilePreview) profilePreview.remove();
        const moaPreview = document.querySelector(`#detailsModal${index} a[href*='moa']`);
        if (moaPreview) moaPreview.remove();

        loadPartners();

      } else {
        document.getElementById("feedbackMessage").textContent = "⚠ Failed to update details.";
        feedbackModal.show();
        setTimeout(() => feedbackModal.hide(), 1500);
      }
    } catch (err) {
      console.error("❌ Error saving details:", err);
      document.getElementById("feedbackMessage").textContent = "⚠ Error saving details.";
      feedbackModal.show();
      setTimeout(() => feedbackModal.hide(), 1500);
    }

    // Close modal after save
    const modalEl = document.getElementById(`detailsModal${index}`);
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  }

  window.saveDetails = saveDetails;



  document.getElementById("saveCardBtn").addEventListener("click", async function (ev) {
    ev.preventDefault();

    const name = document.getElementById("establishmentName").value.trim();
    const address = document.getElementById("establishmentAddress").value.trim();
    const moaStatus = document.getElementById("moaStatus").value;
    const moaSince = document.getElementById("moaSince").value;
    const positions = document.getElementById("availablePositions").value.trim();
    const companyProfile = document.getElementById("companyProfile").files[0];
    const signedMoa = document.getElementById("signedMoa").files[0];

    // Validation
    if (!name || !address || !positions || !companyProfile || !signedMoa) {
      document.getElementById("feedbackMessage").textContent = "⚠ Please fill in all required fields and upload files.";
      const fb = new bootstrap.Modal(document.getElementById("feedbackModal"));
      fb.show();
      setTimeout(() => fb.hide(), 1500);
      return;
    }

    try {
      // 🔹 Prepare FormData for backend upload
      const formData = new FormData();
      formData.append("establishmentName", name);
      formData.append("address", address);
      formData.append("moaStatus", moaStatus);
      formData.append("moaSince", moaSince);
      formData.append("positions", positions);
      formData.append("companyProfile", companyProfile);
      formData.append("signedMoa", signedMoa);

      // 🔹 Send to backend
      const response = await fetch("/api/save-partner", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to save partner.");
      }

      const establishmentID = result.establishmentID;

      // 🔹 Add card visually
      hteCounter++;
      const newCol = document.createElement("div");
      newCol.className = "col-lg-4 mb-4";
      newCol.dataset.moaStatus = moaStatus;
      newCol.dataset.name = name;
      newCol.dataset.moaDate = moaSince;
      newCol.dataset.address = address;
      newCol.dataset.positions = positions;
      newCol.dataset.establishmentId = establishmentID; // store Firestore ID

      newCol.innerHTML = `
      <div class="card hte-card shadow-lg border-0 h-100 custom-card-hover position-relative">
        <div class="card-body custom-card-shadow">
          <div class="d-flex justify-content-left">
            <div class="flex align-items-center justify-content-left">
              <input type="checkbox" style="width: 16px; height: 16px; margin-top: 16px;" />
            </div>
          </div>
          <div class="text-center mt-4 mb-3">
            <h5 class="card-title fw-semibold text-uppercase" style="font-size: 1.1rem;">${name}</h5>
          </div>
        </div>
        <button class="btn btn-light position-absolute bottom-0 end-0 m-3 rounded-circle shadow border"
          data-bs-toggle="modal" data-bs-target="#detailsModal${hteCounter}">
          <i class="bi bi-card-list color-violet"></i>
        </button>
      </div>
    `;

      cardContainer.appendChild(newCol);

      // 🔹 Create modal for details
      const newModal = document.createElement("div");
      newModal.className = "modal fade";
      newModal.id = `detailsModal${hteCounter}`;
      newModal.setAttribute("tabindex", "-1");
      newModal.setAttribute("aria-labelledby", `detailsModalLabel${hteCounter}`);
      newModal.setAttribute("aria-hidden", "true");
      newModal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-dark-purple text-white">
            <h5 class="modal-title" id="detailsModalLabel${hteCounter}">Establishment Details</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <label><strong>Name:</strong></label>
            <input type="text" class="form-control" value="${name}">
            <label><strong>Address:</strong></label>
            <input type="text" class="form-control" value="${address}">
            <label><strong>MOA Status:</strong></label>
            <select class="form-control">
              <option ${moaStatus === "New" ? "selected" : ""}>New</option>
              <option ${moaStatus === "Renewed" ? "selected" : ""}>Renewed</option>
              <option ${moaStatus === "Expired" ? "selected" : ""}>Expired</option>
            </select>
            <label><strong>MOA Established Since:</strong></label>
            <input type="date" class="form-control" value="${moaSince}">
            <label><strong>Available Positions:</strong></label>
            <input type="text" class="form-control" value="${positions}">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-main">Save</button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
      document.body.appendChild(newModal);

      // 🔹 Close Add Modal
      const addCardModalEl = document.getElementById("addCardModal");
      const addCardModalInst = bootstrap.Modal.getInstance(addCardModalEl);
      if (addCardModalInst) addCardModalInst.hide();

      // 🔹 Reset form
      document.getElementById("addCardForm").reset();

      // 🔹 Success Feedback
      document.getElementById("feedbackMessage").textContent = `✅ "${name}" has been added successfully!`;
      const fb = new bootstrap.Modal(document.getElementById("feedbackModal"));
      fb.show();
      setTimeout(() => fb.hide(), 1500);

    } catch (error) {
      console.error("🔥 Error saving partner:", error);
      document.getElementById("feedbackMessage").textContent = "❌ Failed to save partner establishment.";
      const fb = new bootstrap.Modal(document.getElementById("feedbackModal"));
      fb.show();
      setTimeout(() => fb.hide(), 2000);
    }
  });
});


// PUBLISH REQUIREMENTS (DUEDATE)
document.addEventListener("DOMContentLoaded", () => {

  async function loadRequirements() {
    try {
      const res = await fetch("/get-requirements");
      const data = await res.json();

      if (data.success) {
        // 🕒 Sort by createdAt (oldest first)
        const sorted = data.requirements.sort((a, b) => {
          const dateA = a.createdAt?.seconds
            ? new Date(a.createdAt.seconds * 1000)
            : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.seconds
            ? new Date(b.createdAt.seconds * 1000)
            : new Date(b.createdAt || 0);
          return dateA - dateB; // oldest first
        });

        // Clear existing container before appending
        container.innerHTML = "";

        // Render sorted requirements
        sorted.forEach(req => {
          const createdAt = req.createdAt?.seconds
            ? new Date(req.createdAt.seconds * 1000)
            : new Date(req.createdAt || 0);

          const col = document.createElement("div");
          const formattedTime = new Date(`1970-01-01T${req.dueTime}`).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          col.classList.add("col-md-4", "position-relative");
          col.setAttribute("data-created-at", createdAt.toISOString());
          col.dataset.id = req.id; // 🔑 store Firestore document ID here
          col.innerHTML = `
            <input type="checkbox" class="form-check-input position-absolute top-2 start-2 m-2 z-3">
              <div class="card h-100 border-success">
                <div class="card-body d-flex flex-column">
                <h5 class="card-title">${req.type}</h5>
                <h5>${req.title}</h5>
                <p><strong>Due:</strong> ${new Date(req.dueDate).toLocaleDateString()} ${formattedTime || ''}</p>
                <p><strong>Date Posted:</strong> ${createdAt.toLocaleDateString()}</p>
                <p class="text-muted small" style="flex-grow: 1;">${req.notes || ""}</p>
              </div>
            </div>
            `;
          container.appendChild(col);
        });

      }
    } catch (error) {
      console.error("🔥 Error loading requirements:", error);
    }
  }

  loadRequirements();


  // Auto-set today's date when Add Modal opens
  document.getElementById('addDeadlineModal').addEventListener('show.bs.modal', function () {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    document.getElementById('autoDatePosted').textContent = formattedDate;
    document.getElementById('datePosted').value = formattedDate; // hidden input
  });

  const deadlineForm = document.getElementById('deadlineForm');
  const container = document.getElementById('deadlineContainer');
  const addDeadlineModal = new bootstrap.Modal(document.getElementById('addDeadlineModal'));

  // Add new requirement card
  deadlineForm.addEventListener('submit', async function (e) {
    e.preventDefault();


    const type = document.getElementById('requirementType').value;
    const title = document.getElementById('deadlineTitle').value;
    const dueDate = document.getElementById('dueDate').value;
    const dueTime = document.getElementById('dueTime').value; // ⏰ new line
    const datePosted = document.getElementById('datePosted').value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById('notes').value;

    const formattedTime = new Date(`1970-01-01T${dueTime}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const col = document.createElement('div');
    col.classList.add('col-md-4', 'position-relative');
    col.setAttribute("data-date-posted", datePosted);
    col.innerHTML = `
      <input type="checkbox" class="form-check-input position-absolute top-2 start-2 m-2 z-3">
      <div class="card h-100 border-success">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${type}</h5>
          <h5>${title}</h5>
          <p><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString()} ${formattedTime}</p>
          <p><strong>Date Posted:</strong> ${new Date(datePosted).toLocaleDateString()}</p>
          <p class="text-muted small" style="flex-grow: 1;">${notes}</p>
        </div>
      </div>
    `;

    try {
      const response = await fetch("/save-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, dueDate, dueTime, datePosted, notes })
      });

      const result = await response.json();
      if (result.success) {
        console.log("✅ Requirement saved to Firestore");
      } else {
        console.warn("⚠️ Failed to save:", result.message);
      }
    } catch (error) {
      console.error("🔥 Error saving requirement:", error);
    }

    // Then update UI
    container.appendChild(col);
    deadlineForm.reset();
    addDeadlineModal.hide();
  });


  const requirementTitles = {
    "Initial Requirements": [
      "Student Information Sheet (SIS)",
      "Medical Certificate (PE & Nuero)",
      "Insurance",
      "Certificate of Registration",
      "Certificate of Academic Records",
      "Good Moral"
    ],
    "Pre-Deployment Requirements": [
      "Letter of Application",
      "Resume",
      "OJT Orientation Certificate",
      "Parent Waiver",
      "Letter of Endorsement",
      "Notice of Acceptance",
      "Internship Contract",
      "Work Plan"
    ],
    "In-Progress Requirements": [
      "DTR",
      "Monthly Progress Report",
      "Midterm/Final Assessment"
    ],
    "Final Requirements": [
      "Certificate of Completion",
      "Written Report",
      "Final Presentation"
    ]
  };

  const categorySelect = document.getElementById("requirementType");
  const titleSelect = document.getElementById("deadlineTitle");

  // When category changes, update title options
  categorySelect.addEventListener("change", () => {
    const selectedCategory = categorySelect.value;
    titleSelect.innerHTML = '<option value="">Select Title</option>';

    if (requirementTitles[selectedCategory]) {
      requirementTitles[selectedCategory].forEach(title => {
        const option = document.createElement("option");
        option.value = title;
        option.textContent = title;
        titleSelect.appendChild(option);
      });
    }
  });


  // --- DELETE LOGIC ---
  const deleteBtn = document.querySelector(".btn-outline-danger[title='Delete']");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const deleteModal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"));

  function toggleDeleteButton() {
    const checkboxes = document.querySelectorAll("#deadlineContainer .form-check-input");
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    deleteBtn.disabled = !anyChecked;
  }

  container.addEventListener("change", toggleDeleteButton);
  toggleDeleteButton();

  deleteBtn.addEventListener("click", () => {
    deleteModal.show();
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    const checkedCards = document.querySelectorAll("#deadlineContainer .form-check-input:checked");

    for (const cb of checkedCards) {
      const card = cb.closest(".col-md-4");
      const docID = card.dataset.id;

      if (!docID) {
        console.warn("⚠️ Missing document ID for card, skipping.");
        continue;
      }

      try {
        const response = await fetch(`/delete-requirement/${docID}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          console.log(`✅ Deleted requirement: ${docID}`);
          card.remove(); // remove from UI
        } else {
          console.warn(`⚠️ Failed to delete ${docID}:`, result.message);
        }
      } catch (error) {
        console.error(`🔥 Error deleting requirement ${docID}:`, error);
      }
    }

    deleteModal.hide();
    toggleDeleteButton();
  });

  // --- EDIT LOGIC ---
  const editBtn = document.querySelector(".btn-outline-primary[title='Edit']");
  const editForm = document.getElementById("editRequirementForm"); // ✅ correct form id
  const editModal = new bootstrap.Modal(document.getElementById("editDeadlineModal"));
  let selectedCard = null;
  let selectedTitle = "";

  editBtn.addEventListener("click", () => {
    const checkedBoxes = document.querySelectorAll("#deadlineContainer .form-check-input:checked");

    if (checkedBoxes.length !== 1) {
      document.getElementById("feedbackMessage").textContent = "⚠ Please select exactly one requirement to edit.";
      const fb = new bootstrap.Modal(document.getElementById("feedbackModal"));
      fb.show();
      setTimeout(() => fb.hide(), 2000);
      return;
    }

    selectedCard = checkedBoxes[0].closest(".col-md-4");

    const category = selectedCard.querySelector(".card-title").textContent.trim();
    const title = selectedCard.querySelectorAll("h5")[1].textContent.trim();
    const dueText = selectedCard.querySelector("p:nth-of-type(1)").textContent.replace("Due:", "").trim();
    const [dueDatePart, dueTimePart] = dueText.split(" "); // split date and time

    document.getElementById("editDueDate").value = new Date(dueDatePart).toISOString().split("T")[0];
    document.getElementById("editDueTime").value = dueTimePart || "";

    const postedText = selectedCard.querySelector("p:nth-of-type(2)").textContent.replace("Date Posted:", "").trim();
    const notes = selectedCard.querySelector("p.text-muted").textContent.trim();

    const editCategorySelect = document.getElementById("editRequirementType");
    const editTitleSelect = document.getElementById("editDeadlineTitle");

    selectedTitle = title; // store current title

    // Set category
    editCategorySelect.value = category;

    // Populate titles based on category
    populateEditTitles(category, selectedTitle);

    // Other fields
    document.getElementById("editDueDate").value = new Date(dueText).toISOString().split("T")[0];
    document.getElementById("editDatePosted").textContent = postedText;
    document.getElementById("editNotes").value = notes;

    editModal.show();
  });

  function populateEditTitles(category, selectedTitle = "") {
    const editTitleSelect = document.getElementById("editDeadlineTitle");
    editTitleSelect.innerHTML = '<option value="">Select Title</option>';

    if (requirementTitles[category]) {
      requirementTitles[category].forEach(t => {
        const option = document.createElement("option");
        option.value = t;
        option.textContent = t;
        editTitleSelect.appendChild(option);
      });
    }

    if (selectedTitle) {
      editTitleSelect.value = selectedTitle;
    }
  }

  document.getElementById("editRequirementType").addEventListener("change", (e) => {
    const selectedCategory = e.target.value;
    populateEditTitles(selectedCategory);
  });


  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedCard) return;

    const newCategory = document.getElementById("editRequirementType").value;
    const newTitle = document.getElementById("editDeadlineTitle").value;
    const newDueDate = document.getElementById("editDueDate").value;
    const newDueTime = document.getElementById("editDueTime").value;
    const newDatePosted = document.getElementById("editDatePosted").textContent; // not editable
    const newNotes = document.getElementById("editNotes").value;

    // 🔑 Get the document ID stored as a data attribute
    const docID = selectedCard.dataset.id;

    try {
      const response = await fetch(`/update-requirement/${docID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newCategory,
          title: newTitle,
          dueDate: newDueDate,
          dueTime: newDueTime,
          notes: newNotes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Requirement updated successfully in Firestore");

        const formattedTime = new Date(`1970-01-01T${newDueTime}`).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        // Update UI
        selectedCard.querySelector(".card-title").textContent = newCategory;
        selectedCard.querySelectorAll("h5")[1].textContent = newTitle;
        selectedCard.querySelector("p:nth-of-type(1)").innerHTML = `<strong>Due:</strong> ${new Date(newDueDate).toLocaleDateString()} ${formattedTime}`;
        selectedCard.querySelector("p:nth-of-type(2)").innerHTML = `<strong>Date Posted:</strong> ${newDatePosted}`;
        selectedCard.querySelector("p.text-muted").textContent = newNotes;

        selectedCard.setAttribute("data-date-posted", new Date(newDatePosted).toISOString().split("T")[0]);
        editModal.hide();
      } else {
        alert("⚠ Failed to update requirement: " + result.message);
      }
    } catch (error) {
      console.error("🔥 Error updating requirement:", error);
      alert("An error occurred while updating the requirement.");
    }
  });


  // --- SORTING ---
  const sortMenuItems = document.querySelectorAll('.dropdown-menu[aria-labelledby="sortDropdown"] .sort-option');

  sortMenuItems.forEach(item => {
    item.addEventListener('click', function (ev) {
      ev.preventDefault();
      const sortType = this.dataset.sort; // "newest" | "oldest"

      const cards = Array.from(container.querySelectorAll('.col-md-4'));

      cards.sort((a, b) => {
        // Use data-created-at first, then fallback to data-date-posted
        const daStr = a.getAttribute("data-created-at") || a.getAttribute("data-date-posted");
        const dbStr = b.getAttribute("data-created-at") || b.getAttribute("data-date-posted");

        const da = new Date(daStr);
        const db = new Date(dbStr);

        if (isNaN(da) && isNaN(db)) return 0;
        if (isNaN(da)) return sortType === 'newest' ? 1 : -1;
        if (isNaN(db)) return sortType === 'newest' ? -1 : 1;

        return sortType === 'newest' ? db - da : da - db;
      });

      // Append sorted cards back to container
      cards.forEach(c => container.appendChild(c));
    });
  });




});

// STUDENT PROGRESS(STUDENT CHECKLIST)

// STUDENT PROGRESS (STUDENT CHECKLIST) — Scoped, robust per-block implementation
document.addEventListener("DOMContentLoaded", async () => {


  // keep current filters/search per block so both apply at once
  const currentFilter = { A: "all", B: "all" };
  const currentSearch = { A: "", B: "" };


  // Apply both status filter and search for a block
  function applyFilters(block) {
    const tableId = `progressblock${block}Table`;
    const table = document.getElementById(tableId);
    if (!table || !table.tBodies[0]) return;
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);
    const status = currentFilter[block];
    const searchTerm = (currentSearch[block] || "").toLowerCase();

    rows.forEach(row => {
      const statusSelect = row.querySelector("select.status-select");
      const passesStatus = (status === "all") || (statusSelect && statusSelect.value === status);
      const passesSearch = row.textContent.toLowerCase().includes(searchTerm);
      row.style.display = (passesStatus && passesSearch) ? "" : "none";
    });

    updateDeleteButton(block);
  }

  // enable/disable delete button for the block
  function updateDeleteButton(block) {
    const tableId = `block${block}Table`;
    const deleteBtnId = `delete${block}`;
    const table = document.getElementById(tableId);
    const deleteBtn = document.getElementById(deleteBtnId);
    if (!table || !deleteBtn) return;
    const anyChecked = table.querySelectorAll('input[name="select-row"]:checked').length > 0;
    deleteBtn.disabled = !anyChecked;
  }

  // Delete selected rows for a block (uses confirm())
  function setupDelete(block) {
    const tableId = `block${block}Table`;
    const deleteBtnId = `delete${block}`;
    const table = document.getElementById(tableId);
    const deleteBtn = document.getElementById(deleteBtnId);
    if (!table || !deleteBtn) return;

    // Toggle delete button when checkboxes change (only in this table)
    table.addEventListener("change", (e) => {
      if (e.target && e.target.matches('input[name="select-row"]')) {
        updateDeleteButton(block);
      }
    });

    // Delete click: confirm then remove rows from THIS table's tbody
    deleteBtn.addEventListener("click", (e) => {
      // Prevent accidental propagation (won't break bootstrap if used)
      e.preventDefault();

      const confirmed = window.confirm("Delete selected row(s)?");
      if (!confirmed) return;

      const tbody = table.tBodies[0];
      // iterate over static array to avoid mutation problems
      Array.from(tbody.rows).forEach(row => {
        const chk = row.querySelector('input[name="select-row"]');
        if (chk && chk.checked) row.remove();
      });

      applyFilters(block);
      updateDeleteButton(block);
    });
  }

  // Search setup: updates currentSearch and reapplies filters
  function setupSearch(block) {
    const input = document.getElementById(`search${block}`);
    if (!input) return;
    input.addEventListener("input", () => {
      currentSearch[block] = input.value || "";
      applyFilters(block);
    });
  }

  // Filter options (anchors with .filter-option[data-block="A"|"B"])
  function setupFilterOptions(block) {
    document.querySelectorAll(`.filter-option[data-block="${block}"]`).forEach(option => {
      option.addEventListener("click", (ev) => {
        ev.preventDefault();
        const status = option.getAttribute("data-status") || "all";
        currentFilter[block] = status;
        applyFilters(block);
      });
    });
  }

  // Sorting that ONLY touches the targeted table's first tbody
  function sortTable(tableId, columnIndex, order = "asc") {
    const table = document.getElementById(tableId);
    if (!table || !table.tBodies[0]) return;
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);

    rows.sort((a, b) => {
      const aCell = (a.cells[columnIndex] && a.cells[columnIndex].innerText) ? a.cells[columnIndex].innerText.trim().toLowerCase() : "";
      const bCell = (b.cells[columnIndex] && b.cells[columnIndex].innerText) ? b.cells[columnIndex].innerText.trim().toLowerCase() : "";

      // Student ID column (index 2) sort numerically
      if (columnIndex === 2) {
        const na = parseInt(aCell.replace(/\D/g, ""), 10) || 0;
        const nb = parseInt(bCell.replace(/\D/g, ""), 10) || 0;
        return order === "asc" ? na - nb : nb - na;
      }

      if (aCell < bCell) return order === "asc" ? -1 : 1;
      if (aCell > bCell) return order === "asc" ? 1 : -1;
      return 0;
    });

    const frag = document.createDocumentFragment();
    rows.forEach(r => frag.appendChild(r));
    tbody.appendChild(frag);

    // 🔑 Fix: update row numbers for this specific table
    updateRowNumbers(tableId);

    // Maintain filter/search visibility
    const block = tableId.includes("A") ? "A" : "B";
    applyFilters(block);
  }

  function updateRowNumbers(tableId) {
    const table = document.getElementById(tableId);
    if (!table || !table.tBodies[0]) return;
    Array.from(table.tBodies[0].rows).forEach((row, index) => {
      const numCell = row.querySelector(".row-num");
      if (numCell) numCell.textContent = index + 1;
    });
  }


  // Setup sort menu listeners per block, scoped to .sort-option[data-block="..."]
  function setupSortOptions(block) {
    const tableId = `block${block}Table`;
    document.querySelectorAll(`.sort-option[data-block="${block}"]`).forEach(option => {
      option.addEventListener("click", (ev) => {
        ev.preventDefault();
        const sortType = option.getAttribute("data-sort"); // asc | desc | name-asc | name-desc
        if (sortType === "asc") {
          sortTable(tableId, 2, "asc");     // Student ID ↑ (col index 2)
        } else if (sortType === "desc") {
          sortTable(tableId, 2, "desc");    // Student ID ↓
        } else if (sortType === "name-asc") {
          sortTable(tableId, 3, "asc");     // Name A–Z (col index 3)
        } else if (sortType === "name-desc") {
          sortTable(tableId, 3, "desc");    // Name Z–A
        }
      });
    });
  }

  // Re-evaluate filters when a row's status-select changes
  function setupStatusChange(block) {
    const table = document.getElementById(`progressblock${block}Table`);
    if (!table) return;

    table.addEventListener("change", async (e) => {
      if (e.target && e.target.matches("select.status-select")) {
        applyFilters(block);

        const row = e.target.closest("tr");
        const studentID = row.cells[1]?.innerText.trim();
        const newStatus = e.target.value;

        if (!studentID) return;

        try {
          const res = await fetch("/api/update-internshipstatus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ block, studentID, newStatus }),
          });

          const result = await res.json();

          if (result.success) {
            console.log(`✅ Internship status for ${studentID} updated to ${newStatus}`);
          } else {
            console.error(`❌ Failed to update internship status: ${result.message}`);
          }
        } catch (err) {
          console.error("🔥 Error updating internship status:", err);
        }
      }
    });
  }

  // Initialize both blocks
  ["A", "B"].forEach(block => {
    setupDelete(block);
    setupSearch(block);
    setupFilterOptions(block);
    setupSortOptions(block);
    setupStatusChange(block);

    currentFilter[block] = "all";
    currentSearch[block] = "";
    applyFilters(block);
    updateDeleteButton(block);
  });

  // Show loading state for both tables first
  ["A", "B"].forEach(block => {
    const tableBody = document.querySelector(`#progressblock${block}Table tbody`);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="40" class="text-center text-muted py-3">Loading...</td></tr>`;
    }
  });

  try {
    const res = await fetch("/api/student-progress");
    const data = await res.json();

    console.log(data);

    if (!data.success) {
      ["A", "B"].forEach(block => {
        const tableBody = document.querySelector(`#progressblock${block}Table tbody`);
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="40" class="text-center text-danger py-3">Failed to fetch data</td></tr>`;
        }
      });
      return;
    }

    // ✅ Get due dates and pass them to populateBlockTable
    const dueDates = data.dueDates || {}; // store globally if you’ll reuse
    populateBlockTable("A", data.results.A || [], dueDates);
    populateBlockTable("B", data.results.B || [], dueDates);

    // ✅ After populating, check if tables are empty
    ["A", "B"].forEach(block => {
      const tableBody = document.querySelector(`#progressblock${block}Table tbody`);
      if (tableBody && (!tableBody.children.length || tableBody.innerHTML.trim() === "")) {
        tableBody.innerHTML = `<tr><td colspan="40" class="text-center text-muted py-3">No submissions</td></tr>`;
      }
    });

  } catch (err) {
    console.error("Error loading progress:", err);
    ["A", "B"].forEach(block => {
      const tableBody = document.querySelector(`#progressblock${block}Table tbody`);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="40" class="text-center text-danger py-3">Error loading data</td></tr>`;
      }
    });
  }


  function populateBlockTable(block, students, dueDates = {}) {
    const tableBody = document.querySelector(`#progressblock${block}Table tbody`);
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const allReqs = [
      "SIS", "MedCertPhysical", "MedCertNeuro", "Insurance", "COR", "CAR",
      "GoodMoral", "LOA", "Resume", "PreOrientation", "WaiverSigned", "LOE", "NOA",
      "InternshipContract", "Workplan",
      "DTR_JAN", "DTR_FEB", "DTR_MAR", "DTR_APR", "DTR_MAY",
      "MPR_JAN", "MPR_FEB", "MPR_MAR", "MPR_APR", "MPR_MAY",
      "MidtermAssessment", "FinalAssessment",
      "CertCompletion", "WrittenReport", "ECopy", "FinalPresentation"
    ];

    students.forEach((student, index) => {
      const req = student.requirements || {};
      const now = new Date();

      allReqs.forEach((key) => {
        const dueStr = dueDates[key]?.dueDate; // get the date
        const dueTime = dueDates[key]?.dueTime; // fallback to end of day if no time
        if (dueStr) {
          // Combine date and time into a single ISO string
          const dueDate = new Date(`${dueStr}T${dueTime}:00`);
          if (!req[key] || req[key] === "Pending" || req[key] === "To Revise") {
            if (now > dueDate) {
              const daysPast = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
              req[key] = "Overdue";
              req[`${key}_pastDue`] = `${daysPast} days past due`;
            }
          }
        }
      });


      // 🧮 Count completed
      const completed = allReqs.filter(
        (key) => req[key] && !["Pending", "Overdue", "To Revise"].includes(req[key])
      ).length;

      const total = allReqs.length;
      const percentage = Math.round((completed / total) * 100);
      const hasOverdue = allReqs.some((key) => req[key] === "Overdue");
      let barClass = hasOverdue ? "bg-danger" : percentage < 50 ? "bg-warning" : "bg-success";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="row-num">${index + 1}</td>
        <td>${student.studentID}</td>
        <td>${student.studentName}</td>
        ${allReqs.map((key) => {
        const val = req[key];
        const tooltip = req[`${key}_pastDue`] ? `title="${req[`${key}_pastDue`]}"` : "";
        return `<td class="${getStatusClass(val)}" ${tooltip}></td>`;
      }).join("")}
        <td>
          <select class="status-select">
            <option value="Pending" ${student.internshipstatus === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Ready for Deployment" ${student.internshipstatus === "Ready for Deployment" ? "selected" : ""}>Ready for Deployment</option>
            <option value="Deployed" ${student.internshipstatus === "Deployed" ? "selected" : ""}>Deployed</option>
            <option value="Completed" ${student.internshipstatus === "Completed" ? "selected" : ""}>Completed</option>
          </select>
        </td>
        <td>
          <div class="progress">
            <div class="progress-bar ${barClass}" role="progressbar" style="width: ${percentage}%;">${percentage}%</div>
          </div>
        </td>
      `;
      tableBody.appendChild(row);

    });
  }


  function getStatusClass(status) {
    if (!status) return "status-default"; // white default
    const formatted = status.toLowerCase().replace(/\s+/g, "-");
    return `status-${formatted}`;
  }

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
                    <button type="button" class="btn btn-outline-primary btn-sm">See Reviews</button>
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

