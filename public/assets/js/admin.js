// DOWNLOADABLE REQUIREMENTS

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
document.getElementById('deleteBtn').addEventListener('click', function() {
  const container = document.querySelector('.row.text-center');
  const selectedCards = container.querySelectorAll('.form-check-input:checked');

  if (selectedCards.length === 0) {
    alert('Please select at least one form to delete.');
    return;
  }

  if (!confirm(`Are you sure you want to delete ${selectedCards.length} selected form(s)?`)) {
    return;
  }

  selectedCards.forEach(checkbox => {
    const cardWrapper = checkbox.closest('.col-md-3');
    if (cardWrapper) container.removeChild(cardWrapper);
  });
});


// REGISTERED ACCOUNTS

