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

// STUDENT CHECKLIST - MODAL PREVIEW
document.addEventListener("DOMContentLoaded", () => {
  $(document).ready(function () {
    var table = $('#blockATable').DataTable({
      "lengthMenu": [5, 10, 25, 50],
      "columnDefs": [
        { "orderable": false, "targets": 0 } // disable sort on checkbox column
      ]
    });

    // Delete button function
    $('#deleteSelected').click(function () {
      $('#blockATable input[name="select-row"]:checked').each(function () {
        table.row($(this).closest('tr')).remove().draw();
      });
    });
  });
});

// DUEDATE 

document.addEventListener("DOMContentLoaded", () => {
  const deadlineForm = document.getElementById('deadlineForm');
  const container = document.getElementById('deadlineContainer');
  const modalEl = document.getElementById('addDeadlineModal');
  const addDeadlineModal = modalEl ? new bootstrap.Modal(modalEl) : null;

  if (!deadlineForm || !container) {
    console.error("Form or container not found!");
    return;
  }

  // ----- Handle Form Submit -----
  deadlineForm.addEventListener('submit', function (e) {
    e.preventDefault();
    console.log("Form submitted");

    const type = document.getElementById('requirementType').value;
    const title = document.getElementById('deadlineTitle').value;
    const dueDate = document.getElementById('dueDate').value;
    const datePosted = document.getElementById('datePosted').value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById('notes').value;

    const col = document.createElement('div');
    col.classList.add('col-md-4', 'position-relative');
    col.innerHTML = `
      <input type="checkbox" class="form-check-input position-absolute top-0 start-0 m-2 z-3">
      <div class="card h-100 border-success">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${type}</h5>
          <h5>${title}</h5>
          <p><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Date Posted:</strong> ${new Date(datePosted).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p class="text-muted small" style="flex-grow: 1;">${notes}</p>
        </div>
      </div>
    `;

    container.prepend(col);
    deadlineForm.reset();
    if (addDeadlineModal) addDeadlineModal.hide();
  });

  // ----- Handle Sorting -----
  document.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', function () {
      const sortType = this.dataset.sort;
      const cards = Array.from(container.querySelectorAll('.col-md-4'));

      cards.sort((a, b) => {
        const dateTextA = Array.from(a.querySelectorAll('p'))
          .find(p => p.textContent.includes('Date Posted'))
          .textContent.split(':')[1].trim();

        const dateTextB = Array.from(b.querySelectorAll('p'))
          .find(p => p.textContent.includes('Date Posted'))
          .textContent.split(':')[1].trim();

        const dateA = new Date(dateTextA);
        const dateB = new Date(dateTextB);

        return sortType === 'newest' ? dateB - dateA : dateA - dateB;
      });

      cards.forEach(card => container.appendChild(card));
    });
  });
});


// SUBMISSION (SUBMITTED DOCUMENTS)

document.addEventListener("DOMContentLoaded", () => {
  // ---------- Approve / Decline ----------
  document.querySelectorAll("tr").forEach(row => {
    const approveBtn = row.querySelector(".approve-btn");
    const declineBtn = row.querySelector(".decline-btn");
    const statusCell = row.querySelector(".status-cell");
    const remarksDiv = row.querySelector(".remarks-input");

    if (approveBtn && declineBtn && statusCell && remarksDiv) {
      // Approve
      approveBtn.addEventListener("click", () => {
        statusCell.textContent = "Approved";
        statusCell.classList.remove("text-danger");
        statusCell.classList.add("text-success");
        remarksDiv.classList.add("d-none");
      });

      // Decline
      declineBtn.addEventListener("click", () => {
        statusCell.textContent = "Declined";
        statusCell.classList.remove("text-success");
        statusCell.classList.add("text-danger");
        remarksDiv.classList.remove("d-none");
      });

      // Send Remarks
      const sendBtn = remarksDiv.querySelector(".send-btn");
      if (sendBtn) {
        sendBtn.addEventListener("click", () => {
          const input = remarksDiv.querySelector("input");
          const remarkText = input ? input.value : "";
          alert("Remarks sent to student: " + remarkText);
        });
      }
    }
  });

  // ---------- Filter ----------
  const filterBtn = document.getElementById("filterToggleBtn");
  const filterDropdown = document.getElementById("filterDropdown");
  const filterSelect = document.getElementById("submissionFilter");
  const allCards = document.querySelectorAll(".col-md-3[data-category]");

  if (filterBtn && filterDropdown) {
    // Toggle dropdown visibility
    filterBtn.addEventListener("click", () => {
      filterDropdown.style.display =
        filterDropdown.style.display === "none" ? "block" : "none";
    });
  }

  if (filterSelect) {
    // Filter cards
    filterSelect.addEventListener("change", function () {
      const selected = this.value;
      allCards.forEach(card => {
        const category = card.getAttribute("data-category");
        card.style.display =
          selected === "all" || category === selected ? "block" : "none";
      });
    });
  }

  // ---------- Sorting ----------
  function handleSort(table, sortType) {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll("tr"));
    let colIndex;
    let compareFn;

    if (sortType.startsWith("name")) {
      colIndex = 2; // Student Name column
      compareFn = (a, b) => {
        let textA = a.cells[colIndex].textContent.trim().toLowerCase();
        let textB = b.cells[colIndex].textContent.trim().toLowerCase();
        return textA.localeCompare(textB);
      };
    } else if (sortType.startsWith("id")) {
      colIndex = 1; // Student ID column
      compareFn = (a, b) => {
        let numA = parseInt(a.cells[colIndex].textContent.trim(), 10);
        let numB = parseInt(b.cells[colIndex].textContent.trim(), 10);
        return numA - numB;
      };
    } else {
      return; // unknown sort
    }

    rows.sort(compareFn);
    if (sortType.endsWith("desc")) rows.reverse();

    // Re-append sorted rows
    rows.forEach((row, index) => {
      if (row.cells[0]) row.cells[0].textContent = index + 1; // update row numbers
      tbody.appendChild(row);
    });
  }

  // Attach sort options
  document.querySelectorAll(".dropdown-menu .dropdown-item[data-sort]").forEach(option => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      const sortType = option.dataset.sort;

      // Try to find the nearest table
      let table = option.closest(".modal")?.querySelector("table");
      if (!table) {
        table = document.querySelector("table"); // fallback to first table
      }

      if (table) handleSort(table, sortType);
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
      <td class="status-cell">Active</td>
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

  confirmDeleteBtn.addEventListener("click", () => {
    if (!selectedTable) return;

    const checkboxes = selectedTable.querySelectorAll("tbody input[type='checkbox']:checked");
    checkboxes.forEach(cb => cb.closest("tr").remove());

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
function updateStatus(button, newStatus) {
  const row = button.closest("tr");
  const statusCell = row.querySelector(".status-cell");
  statusCell.textContent = newStatus;
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
