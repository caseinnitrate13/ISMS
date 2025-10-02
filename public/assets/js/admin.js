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
  document.getElementById('editBtn').addEventListener('click', function() {
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
  document.getElementById('addRequirementForm').addEventListener('submit', function(e) {
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
    option.addEventListener('click', function() {
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
  document.getElementById('filterBtn').addEventListener('click', function() {
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
          <p><strong>Due:</strong> ${new Date(dueDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
          <p><strong>Date Posted:</strong> ${new Date(datePosted).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
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

  // ✅ Sorting
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

  // ✅ Mark selected as Read/Unread
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

  // ✅ Delete selected (show modal first)
  notifDeleteBtn.addEventListener('click', function () {
    selectedCards = document.querySelectorAll('.notif-checkbox:checked');
    if (selectedCards.length === 0) {
      alert("Please select at least one notification to delete.");
      return;
    }
    const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    modal.show();
  });

  // ✅ Confirm delete inside modal
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
