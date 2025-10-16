// FACULTY DETAILS
document.addEventListener('DOMContentLoaded', () => {
  const facultyData = JSON.parse(localStorage.getItem('facultyData'));
  console.log(facultyData);

  if (!facultyData) {
    console.warn("No faculty data found in localStorage.");
    return;
  }

  // Identify which page you're on
  const path = location.pathname;

  const isRegisteredAcc = path === '/admin/registered-accounts';
  const isDownloadable = path === '/admin/downloadable';
  const isEstablishments = path === '/admin/partner-establishments';
  const isSubmittedDocs = path === '/admin/submitted-documents';
  const isStudentProgess = path === '/admin/student-progress';
  const isPublishReq = path === '/admin/publish-requirements';
  const isNotifications = path === '/admin/notifications';
  const isFacultyProfile = path === '/admin/user-profile';

  // Common header elements
  const headerProfile = document.getElementById('headerProfile');
  const headerName = document.querySelector('.nav-profile span');

  // 🧩 Display faculty info in header (for specified pages)
  if (isRegisteredAcc || isDownloadable || isEstablishments || isSubmittedDocs
    || isStudentProgess || isPublishReq || isNotifications || isFacultyProfile
  ) {
    if (headerName) headerName.textContent = `${facultyData.firstname} ${facultyData.lastname}`;
    if (headerProfile) headerProfile.src = facultyData.profilePic || '/assets/img/account-green.png';
  }
});


// DOWNLOADABLE REQUIREMENTS
document.addEventListener("DOMContentLoaded", () => {
  let cardBeingEdited = null;

  // Show modal for adding new file
  document.getElementById('addFileBtn').addEventListener('click', function () {
    cardBeingEdited = null;
    document.getElementById('addRequirementLabel').textContent = 'New Downloadable Form';
    document.getElementById('addRequirementForm').reset();
    const addModal = new bootstrap.Modal(document.getElementById('addRequirementModal'));
    addModal.show();
  });

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

    document.getElementById('requirementName').value = cardTitle;
    document.getElementById('requirementFile').value = '';

    document.getElementById('addRequirementLabel').textContent = 'Edit Downloadable Form';
    const addModal = new bootstrap.Modal(document.getElementById('addRequirementModal'));
    addModal.show();
  });

  // Add / Edit submit handler
  document.getElementById('addRequirementForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const nameInput = document.getElementById('requirementName');
    const fileInput = document.getElementById('requirementFile');
    const name = nameInput.value.trim();
    const file = fileInput.files[0];

    if (!name) {
      alert('Please provide a name for the form.');
      return;
    }

    if (cardBeingEdited) {
      cardBeingEdited.querySelector('.card-title').textContent = name;
      if (file) {
        const fileURL = URL.createObjectURL(file);
        cardBeingEdited.querySelector('iframe').src = `${fileURL}#toolbar=0`;
      }
      cardBeingEdited = null;
    } else {
      if (!file) {
        alert('Please provide a PDF file.');
        return;
      }
      const fileURL = URL.createObjectURL(file);
      const newCard = document.createElement('div');
      newCard.className = 'col-md-3 mb-3';
      newCard.innerHTML = `
        <div class="card h-100 position-relative shadow">
          <input type="checkbox" class="form-check-input position-absolute" style="top:5px;left:5px;z-index:3;">
          <div class="card-body d-flex flex-column" style="height: 400px;">
            <h6 class="card-title">${name}</h6>
            <div class="flex-grow-1 mb-2">
              <iframe src="${fileURL}#toolbar=0" width="100%" height="100%" style="border:none;"></iframe>
            </div>
          </div>
        </div>
      `;
      addTimestamp(newCard);
      document.querySelector('.row.text-center').appendChild(newCard);
    }

    document.getElementById('addRequirementForm').reset();
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('addRequirementModal'));
    modalInstance.hide();
    document.getElementById('addRequirementLabel').textContent = 'New Downloadable Form';
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
  const container = document.querySelector(".row.text-center");
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

  // Handle confirm delete
  confirmDeleteBtn.addEventListener("click", () => {
    const selectedCards = container.querySelectorAll(".form-check-input:checked");
    selectedCards.forEach((checkbox) => {
      const cardWrapper = checkbox.closest(".col-md-3");
      if (cardWrapper) cardWrapper.remove();
    });

    if (bootstrapDeleteModal) {
      bootstrapDeleteModal.hide();
    }

    // Optionally disable deleteBtn after deletion
    deleteBtn.disabled = true;
  });

  // Enable delete button if at least one checkbox is checked
  container.addEventListener("change", () => {
    const checked = container.querySelectorAll(".form-check-input:checked");
    deleteBtn.disabled = checked.length === 0;
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

      // Clear previous table content
      tableBody.innerHTML = `
        <tr><td colspan="9" class="text-center text-muted">Loading...</td></tr>
      `;

      try {
        const res = await fetch('/api/submitted-requirements');
        const result = await res.json();

        if (!result.success) {
          tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to fetch documents</td></tr>`;
          return;
        }

        // Filter only matching requirements
        const filteredDocs = result.documents.filter(doc => doc.requirementTitle === requirementTitle);

        console.log(`📄 ${filteredDocs.length} documents found for "${requirementTitle}"`);
        populateTable(tableBody, filteredDocs);

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

      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${doc.studentID}</td>
          <td>${doc.studentName || "N/A"}</td>
          <td class="text-center"><a href="${doc.path}" class="btn btn-sm btn-primary" target="_blank">View File</a></td>
          <td>${dateSubmitted || '—'}</td>
          <td>${timeSubmitted || '—'}</td>
          <td class="text-center">
            <button class="btn btn-success btn-sm approve-btn">Approve</button>
            <button class="btn btn-danger btn-sm decline-btn">Decline</button>
          </td>
          <td class="status-cell text-center">${doc.docustatus}</td>
          <td class="remarks-cell text-center align-top position-relative">
            <div class="remarks-input d-none w-100 h-100">
              <input type="text" class="form-control form-control-sm" placeholder="Enter remarks">
              <button class="btn btn-secondary btn-sm send-btn position-absolute">
                <i class="bi bi-send"></i>
              </button>
            </div>
          </td>
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
      previousModal.hide();
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

      confirmationMessage.textContent = `Are you sure you want to ${currentAction} ${studentName}'s request?`;

      // Show confirmation modal with stack behavior
      showConfirmationModal(confirmationModal);
    }
  });

  // ==========================
  // CONFIRM ACTION
  // ==========================
  confirmActionBtn.addEventListener("click", function () {
    if (!currentRow || !currentAction) return;

    const statusCell = currentRow.querySelector(".status-cell");
    const remarksDiv = currentRow.querySelector(".remarks-input");

    if (currentAction === "approve") {
      statusCell.textContent = "Approved";
      statusCell.classList.add("text-success", "fw-bold");
      statusCell.classList.remove("text-danger");
      remarksDiv.classList.add("d-none");
    } else if (currentAction === "decline") {
      statusCell.textContent = "Declined";
      statusCell.classList.add("text-danger", "fw-bold");
      statusCell.classList.remove("text-success");
      remarksDiv.classList.remove("d-none");
      currentRemarkInput = remarksDiv.querySelector("input");
    }

    confirmationModal.hide();
  });

  // ==========================
  // SEND REMARK HANDLER
  // ==========================
  document.body.addEventListener("click", function (e) {
    if (e.target.closest(".send-btn")) {
      currentRow = e.target.closest("tr");
      currentRemarkInput = currentRow.querySelector(".remarks-input input");

      // Show send confirmation modal with stack behavior
      showConfirmationModal(sendConfirmationModal);
    }
  });

  // ==========================
  // CONFIRM SENDING REMARK
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


// NOTIFICATION
document.addEventListener("DOMContentLoaded", () => {
  const sortOptions = document.querySelectorAll('.sort-option');
  const notificationList = document.getElementById('notificationList');
  const notifDeleteBtn = document.getElementById('notifDeleteNotifBtn');
  const notifConfirmDeleteBtn = document.getElementById('notifConfirmDeleteBtn');
  let selectedCards = [];

  // Sorting
  sortOptions.forEach(option => {
    option.addEventListener('click', function () {
      const sortType = this.getAttribute('data-sort');
      const cards = Array.from(notificationList.querySelectorAll('.notification-card'));

      cards.sort((a, b) => {
        const dateA = new Date(a.querySelector('.notification-time').textContent.trim());
        const dateB = new Date(b.querySelector('.notification-time').textContent.trim());
        return sortType === 'newest' ? dateB - dateA : dateA - dateB;
      });

      cards.forEach(card => notificationList.appendChild(card));
    });
  });

  // Mark selected as Read/Unread
  const markOptions = document.querySelectorAll('.mark-option');
  markOptions.forEach(option => {
    option.addEventListener('click', function () {
      const action = this.getAttribute('data-action');
      const selected = document.querySelectorAll('.notif-checkbox:checked');

      selected.forEach(checkbox => {
        const card = checkbox.closest('.notification-card');
        if (action === 'read') {
          card.classList.remove('highlight');
        } else {
          card.classList.add('highlight');
        }
        checkbox.checked = false;
      });
    });
  });

  // Delete selected (show modal first)
  notifDeleteBtn.addEventListener('click', function () {
    selectedCards = document.querySelectorAll('.notif-checkbox:checked');
    if (selectedCards.length === 0) {
      alert("Please select at least one notification to delete.");
      return;
    }
    const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    modal.show();
  });

  // Confirm delete inside modal
  notifConfirmDeleteBtn.addEventListener('click', function () {
    selectedCards.forEach(checkbox => {
      const card = checkbox.closest('.notification-card');
      card.remove();
    });
    const modalEl = document.getElementById('confirmDeleteModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  });
});

// USER ACCOUNTS (REG-ACCOUNTS)
document.addEventListener("DOMContentLoaded", () => {

  const addAccountForm = document.getElementById("addAccountForm");
  const addAccountModal = document.getElementById("addAccountModal");
  const feedbackBox = document.getElementById("formFeedback"); // <-- Add this in HTML for user messages

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
      <td>${accountData.password}</td>
      <td class="reset-log">--</td>
      <td>
        <div class="d-flex gap-1">
          <button class="btn btn-primary btn-sm" onclick="updateStatus(this, 'Active')">Active</button>
          <button class="btn btn-success btn-sm" onclick="updateStatus(this, 'Completed')">Completed</button>
          <button class="btn btn-danger btn-sm" onclick="updateStatus(this, 'Inactive')">Inactive</button>
        </div>
      </td>
      <td class="status-cell">${accountData.status || "Active"}</td>
      <td>--</td>
    `;
    tableBody.appendChild(newRow);
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

    const formData = new FormData(addAccountForm);
    const accountData = Object.fromEntries(formData.entries());
    accountData.targetBlock = targetBlock;

    const now = new Date();
    accountData.reg_date = now.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    accountData.status = "Active";
    // --- Duplicate check ---
    if (studentExists(accountData.student_id)) {
      showFeedback(`⚠️ Student ID "${accountData.student_id}" already exists.`, "warning");
      return;
    }

    // --- Save to Firestore ---
    try {
      const response = await fetch("/save-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountData)
      });

      const result = await response.json();
      if (result.success) {
        console.log("✅ Account saved:", accountData.student_id);
        showFeedback("✅ Account successfully added!", "success");

        const tableId = targetBlock === "A" ? "blockATable" : "blockBTable";
        addAccountToTable(tableId, accountData);
        loadedStudents.push(accountData);
      } else {
        console.error("⚠️ Failed:", result.message);
        showFeedback("⚠️ Failed to save account.", "danger");
      }
    } catch (error) {
      console.error("🔥 Error saving:", error);
      showFeedback("🔥 Error saving account.", "danger");
    }

    addAccountForm.reset();
    bootstrap.Modal.getInstance(addAccountModal).hide();
  });

  loadStudents();

  // --- Sorting Function ---
  function makeTableSortable(tableId) {
    const table = document.getElementById(tableId);
    const headers = table.querySelectorAll("th");

    headers.forEach((header, index) => {
      if (header.textContent.trim() === "" || header.textContent === "Action") return;

      header.classList.add("sortable");
      header.title = "Click to sort";

      header.addEventListener("click", () => {
        const rows = Array.from(table.querySelector("tbody").querySelectorAll("tr:not([id])"));
        const type = header.getAttribute("data-type") || "string";
        const asc = header.classList.contains("asc") ? false : true;

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

        rows.forEach(row => table.querySelector("tbody").appendChild(row));
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


// PARTNER ESTABLISHMENTS 
document.addEventListener("DOMContentLoaded", () => {
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

  confirmDeleteBtn.addEventListener('click', function () {
    const checked = getAllSelectableCheckboxes().filter(cb => cb.checked);

    if (checked.length === 0) {
      deleteModal.hide();
      updateDeleteButtonState();
      return;
    }

    checked.forEach(cb => {
      const removable = getRemovableElementFromCheckbox(cb);
      if (removable) {
        removable.remove();
      } else {
        cb.remove();
      }
    });

    deleteModal.hide();
    updateDeleteButtonState();
    console.log(`${checked.length} item(s) deleted.`);
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
  function saveDetails(hteNumber) {
    const name = document.getElementById(`hte${hteNumber}Name`).value.trim();
    const address = document.getElementById(`hte${hteNumber}Address`).value.trim();
    const moaStatus = document.getElementById(`hte${hteNumber}MoaStatus`).value.trim();
    const moaDate = document.getElementById(`hte${hteNumber}MoaDate`).value || "";
    const positions = document.getElementById(`hteAve${hteNumber}`).value.trim();

    const modalEl = document.getElementById(`detailsModal${hteNumber}`);
    // find the button that opens this modal, then the card
    const openerBtn = document.querySelector(`[data-bs-target="#detailsModal${hteNumber}"]`);
    const cardEl = openerBtn ? openerBtn.closest(".hte-card") : null;
    if (!cardEl) {
      // nothing to update
      const fb = new bootstrap.Modal(document.getElementById("feedbackModal"));
      document.getElementById("feedbackMessage").textContent = "⚠ Unable to find the related card to update.";
      fb.show();
      setTimeout(() => fb.hide(), 1500);
      // Close modal if exists
      const instance = bootstrap.Modal.getInstance(modalEl);
      if (instance) instance.hide();
      return;
    }

    const parentCol = cardEl.closest(".col-lg-4");
    const currentName = (cardEl.querySelector(".card-title")?.textContent || "").trim();
    const currentMoaStatus = (parentCol?.dataset.moaStatus || "").trim();
    const currentMoaDate = (parentCol?.dataset.moaDate || "").trim();
    const currentAddress = (parentCol?.dataset.address || "").trim();
    const currentPositions = (parentCol?.dataset.positions || "").trim();

    const hasChanges = (
      name !== currentName ||
      address !== currentAddress ||
      moaStatus !== currentMoaStatus ||
      moaDate !== currentMoaDate ||
      positions !== currentPositions
    );

    // close details modal first
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    const feedbackModal = new bootstrap.Modal(document.getElementById("feedbackModal"));

    if (!hasChanges) {
      document.getElementById("feedbackMessage").textContent = "⚠ No changes made.";
      feedbackModal.show();
      setTimeout(() => feedbackModal.hide(), 1500);
      return;
    }

    // Apply changes to card DOM & data-attributes
    const titleEl = cardEl.querySelector(".card-title");
    if (titleEl) titleEl.textContent = name;

    if (parentCol) {
      parentCol.dataset.name = name;
      parentCol.dataset.address = address;
      parentCol.dataset.moaStatus = moaStatus;
      parentCol.dataset.moaDate = moaDate;
      parentCol.dataset.positions = positions;
    }

    document.getElementById("feedbackMessage").textContent = `✅ "${name}" details updated successfully!`;
    feedbackModal.show();
    setTimeout(() => feedbackModal.hide(), 1500);
  }
  window.saveDetails = saveDetails;

  // SINGLE saveCardBtn handler (create new card)
  document.getElementById("saveCardBtn").addEventListener("click", function (ev) {
    ev.preventDefault();
    const name = document.getElementById("establishmentName").value.trim();
    const address = document.getElementById("establishmentAddress").value.trim();
    const moaStatus = document.getElementById("moaStatus").value;
    const moaSince = document.getElementById("moaSince").value;
    const positions = document.getElementById("availablePositions").value.trim();

    // Validation
    if (!name || !address || !positions) {
      document.getElementById("feedbackMessage").textContent = "⚠ Please fill in all required fields.";
      const fb = new bootstrap.Modal(document.getElementById("feedbackModal"));
      fb.show();
      setTimeout(() => fb.hide(), 1500);
      return;
    }

    // Add card
    hteCounter++;
    const newCol = document.createElement("div");
    newCol.className = "col-lg-4 mb-4";
    // set dataset attributes (use dataset for easy access)
    newCol.dataset.moaStatus = moaStatus;
    newCol.dataset.name = name;
    newCol.dataset.moaDate = moaSince;
    newCol.dataset.address = address;
    newCol.dataset.positions = positions;

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

    // Create modal for this card
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
            <input type="text" class="form-control" id="hte${hteCounter}Name" value="${name}">
            <label><strong>Address:</strong></label>
            <input type="text" class="form-control" id="hte${hteCounter}Address" value="${address}">
            <label><strong>MOA Status:</strong></label>
            <select class="form-control" id="hte${hteCounter}MoaStatus">
              <option ${moaStatus === "New" ? "selected" : ""}>New</option>
              <option ${moaStatus === "Renewed" ? "selected" : ""}>Renewed</option>
              <option ${moaStatus === "Expired" ? "selected" : ""}>Expired</option>
            </select>
            <label><strong>MOA Established Since:</strong></label>
            <input type="date" class="form-control" id="hte${hteCounter}MoaDate" value="${moaSince}">
            <label><strong>Available Positions:</strong></label>
            <input type="text" class="form-control" id="hteAve${hteCounter}" value="${positions}">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-main" onclick="saveDetails(${hteCounter})">Save</button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(newModal);

    // Close Add Modal
    const addCardModalEl = document.getElementById("addCardModal");
    const addCardModalInst = bootstrap.Modal.getInstance(addCardModalEl);
    if (addCardModalInst) addCardModalInst.hide();

    // Reset form
    document.getElementById("addCardForm").reset();

    // Success feedback
    document.getElementById("feedbackMessage").textContent = `✅ "${name}" has been added successfully!`;
    const fb = new bootstrap.Modal(document.getElementById("feedbackModal"));
    fb.show();
    setTimeout(() => fb.hide(), 1500);
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
          col.classList.add("col-md-4", "position-relative");
          col.setAttribute("data-created-at", createdAt.toISOString());
          col.dataset.id = req.id; // 🔑 store Firestore document ID here
          col.innerHTML = `
    <input type="checkbox" class="form-check-input position-absolute top-2 start-2 m-2 z-3">
    <div class="card h-100 border-success">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${req.type}</h5>
        <h5>${req.title}</h5>
        <p><strong>Due:</strong> ${new Date(req.dueDate).toLocaleDateString()}</p>
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
    const datePosted = document.getElementById('datePosted').value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById('notes').value;

    const col = document.createElement('div');
    col.classList.add('col-md-4', 'position-relative');
    col.setAttribute("data-date-posted", datePosted); // 🔑 store raw date for sorting
    col.innerHTML = `
      <input type="checkbox" class="form-check-input position-absolute top-2 start-2 m-2 z-3">
      <div class="card h-100 border-success">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${type}</h5>
          <h5>${title}</h5>
          <p><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          <p><strong>Date Posted:</strong> ${new Date(datePosted).toLocaleDateString()}</p>
          <p class="text-muted small" style="flex-grow: 1;">${notes}</p>
        </div>
      </div>
    `;

    try {
      const response = await fetch("/save-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, dueDate, datePosted, notes })
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
          notes: newNotes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Requirement updated successfully in Firestore");

        // Update UI
        selectedCard.querySelector(".card-title").textContent = newCategory;
        selectedCard.querySelectorAll("h5")[1].textContent = newTitle;
        selectedCard.querySelector("p:nth-of-type(1)").innerHTML = `<strong>Due:</strong> ${new Date(newDueDate).toLocaleDateString()}`;
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
        const da = new Date(a.getAttribute("data-date-posted"));
        const db = new Date(b.getAttribute("data-date-posted"));

        if (isNaN(da) && isNaN(db)) return 0;
        if (isNaN(da)) return sortType === 'newest' ? 1 : -1;
        if (isNaN(db)) return sortType === 'newest' ? -1 : 1;

        return sortType === 'newest' ? db - da : da - db;
      });

      cards.forEach(c => container.appendChild(c));
    });
  });

});

// STUDENT PROGRESS(STUDENT CHECKLIST)

// STUDENT PROGRESS (STUDENT CHECKLIST) — Scoped, robust per-block implementation
document.addEventListener("DOMContentLoaded", () => {
  // keep current filters/search per block so both apply at once
  const currentFilter = { A: "all", B: "all" };
  const currentSearch = { A: "", B: "" };

  // Apply both status filter and search for a block
  function applyFilters(block) {
    const tableId = `block${block}Table`;
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
    const table = document.getElementById(`block${block}Table`);
    if (!table) return;
    table.addEventListener("change", (e) => {
      if (e.target && e.target.matches("select.status-select")) {
        applyFilters(block);
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

  // ---- Important: if you have DataTables/jQuery code targeting blockATable/blockBTable, remove it.
  // DataTables manipulates DOM and WILL conflict with this plain-JS implementation.
});
