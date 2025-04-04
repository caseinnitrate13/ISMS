// DOCUMENT SUBMISSION
document.addEventListener('DOMContentLoaded', function () {
    const modalTitle = document.querySelector("#submissionModal .modal-title");
    const modalDescription = document.getElementById("modaldescription");
    const submissionModal = new bootstrap.Modal(document.getElementById("submissionModal"));

    const initialRequirements = [
        { title: 'Student Information Sheet', description: 'DescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescription.', status: 'Pending', dueDate: '2025/08/02' },
        { title: 'Medical Certificate', description: 'Description.', status: 'Pending', dueDate: '2025/08/20' },
        { title: 'Physical Examination Certificate', description: 'Description.', status: 'Requires Revision', dueDate: '2025/08/23' },
        { title: 'Neurology Exam Certificate', description: 'Description.', status: 'Completed', dueDate: '2025/08/12' },
    ];

    const preDepRequirements = [
        { title: 'Medical Certificate', description: 'Description.', status: 'Completed', dueDate: '2025/08/12' },
        { title: 'Student Information Sheet', description: 'Description.', status: 'Pending', dueDate: '2025/08/12' },
        { title: 'Insurance', description: 'Description.', status: 'Overdue', dueDate: '2025/01/20' },
        { title: 'Vaccination Record', description: 'Description.', status: 'Overdue', dueDate: '2025/02/12' },
    ];

    const inProgressRequirements = [
        { title: 'Student Information Sheet', description: 'Description.', status: 'Pending', dueDate: '2025/08/02' },
        { title: 'Medical Certificate', description: 'Description.', status: 'Pending', dueDate: '2025/08/20' },
        { title: 'Physical Examination Certificate', description: 'Description.', status: 'Requires Revision', dueDate: '2025/08/23' },
        { title: 'Neurology Exam Certificate', description: 'Description.', status: 'Completed', dueDate: '2025/08/12' },
    ];

    const finalRequirements = [
        { title: 'Medical Certificate', description: 'Description.', status: 'Pending', dueDate: '2025/08/12' },
        { title: 'Student Information Sheet', description: 'Description.', status: 'Pending', dueDate: '2025/08/12' },
        { title: 'Insurance', description: 'Description.', status: 'Overdue', dueDate: '2025/01/20' },
        { title: 'Vaccination Record', description: 'Description.', status: 'Completed', dueDate: '2025/02/12' },
    ];

    const statusOrder = {
        'Pending': 'text-primary',
        'Overdue': 'text-danger',
        'Requires Revision': 'text-warning',
        'Completed': 'text-success'
    };

    let initialSelectedStatus = "Pending";
    let preDepSelectedStatus = "Pending";
    let inProgressSelectedStatus = "Pending";
    let finalSelectedStatus = "Pending";
    let showAllInitial = false;
    let showAllPreDep = false;
    let showAllInProgress = false;
    let showAllFinal = false;
    let selectedRequirement = null;

    function loadRequirements(containerId, requirements, showAll, statusFilter) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        let filteredRequirements = (statusFilter === "All") ? requirements : requirements.filter(n => n.status === statusFilter);
        
        if (filteredRequirements.length === 0) {
            container.innerHTML = "<div class='p-3 text-center'>No data to show</div>";
            return;
        }

        let displayRequirements = showAll ? filteredRequirements : filteredRequirements.slice(0, 2);

        displayRequirements.forEach(requirement => {
            const requirementElement = document.createElement("div");
            requirementElement.classList.add('p-3', 'd-flex', 'align-items-center', 'border-bottom', 'pointer');
            requirementElement.innerHTML = `
                <i class='bi bi-circle-fill me-3 ${statusOrder[requirement.status]}'></i>
                <div class='flex-grow-1'>
                    <div class='fw-bold'>${requirement.title}</div>
                    <div class='requirementDescription text-muted small'>${requirement.description}</div>
                </div>
                <div class='flex-grow-2'>
                    <div class='small'>Due date: ${requirement.dueDate} </div>
                    <div class='badge ${statusOrder[requirement.status]} p-2'>${requirement.status}</div>
                </div>
               
            `;

            // open moedal with necessary data
            requirementElement.addEventListener('click', function () {
                if (requirement.status === 'Pending' || requirement.status === 'Overdue'){
                    modalTitle.textContent = requirement.title;
                    modalDescription.textContent = requirement.description;
                    selectedRequirement = requirement;
                    submissionModal.show();
                }

            });

            container.appendChild(requirementElement);
        });
    }

    // status dropdown
    document.querySelectorAll('.dropdown-menu .view-option').forEach(option => {
        option.addEventListener('click', function (e) {
            e.preventDefault();
            const status = this.dataset.status;
            const parentDropdown = this.closest('.dropdown');

            if (parentDropdown.id === "initialDropdown") {
                initialSelectedStatus = status;
                document.getElementById("initialStatus").textContent = status;
                loadRequirements('initialReq', initialRequirements, showAllInitial, initialSelectedStatus);
            } else if (parentDropdown.id === "preDepDropdown"){
                preDepSelectedStatus = status;
                document.getElementById("preDepStatus").textContent = status;
                loadRequirements('preDepReq', preDepRequirements, showAllPreDep, preDepSelectedStatus);
            } else if (parentDropdown.id === "inProgressDropdown"){
                inProgressSelectedStatus = status;
                document.getElementById("inProgressStatus").textContent = status;
                loadRequirements('inProgressReq', inProgressRequirements, showAllinProgress, inProgressSelectedStatus);
            } else {
                finalSelectedStatus = status;
                document.getElementById("finalStatus").textContent = status;
                loadRequirements('finalReq', finalRequirements, showAllFinal, finalSelectedStatus);
            }
        });
    });

    // view all 
    document.getElementById("showAllInitial").addEventListener('click', function () {
        showAllInitial = !showAllInitial;
        loadRequirements('initialReq', initialRequirements, showAllInitial, initialSelectedStatus);
        this.textContent = showAllInitial ? 'Show Less' : 'Show All';
    });

    document.getElementById("showAllPreDep").addEventListener('click', function () {
        showAllPreDep = !showAllPreDep;
        loadRequirements('preDepReq', preDepRequirements, showAllPreDep, preDepSelectedStatus);
        this.textContent = showAllPreDep ? 'Show Less' : 'Show All';
    });

    document.getElementById("showAllInProgress").addEventListener('click', function () {
        showAllInProgress = !showAllInProgress;
        loadRequirements('inProgressReq', inProgressRequirements, showAllInProgress, inProgressSelectedStatus);
        this.textContent = showAllInProgress ? 'Show Less' : 'Show All';
    });

    document.getElementById("showAllFinal").addEventListener('click', function () {
        showAllFinal = !showAllFinal;
        loadRequirements('finalReq', finalRequirements, showAllFinal, finalSelectedStatus);
        this.textContent = showAllFinal ? 'Show Less' : 'Show All';
    });

    loadRequirements('initialReq', initialRequirements, showAllInitial, initialSelectedStatus);
    loadRequirements('preDepReq', preDepRequirements, showAllPreDep, preDepSelectedStatus);
    loadRequirements('inProgressReq', inProgressRequirements, showAllInProgress, inProgressSelectedStatus);
    loadRequirements('finalReq', finalRequirements, showAllFinal, finalSelectedStatus);


    //file upload
    const fileUploadContainer = document.getElementById("fileUploadContainer");
    const fileUpload = document.getElementById("fileUpload");
    const fileUploadBtn = document.getElementById("fileUploadBtn");
    const invalidFiletypeMessage = document.getElementById("invalidFiletype");

    fileUploadBtn.addEventListener("click", () => {
    fileUpload.click();
    });

    fileUpload.addEventListener("change", (event) => {
    if (event.target.files.length > 0) {
        handleFile(event.target.files[0]);
    }
    });

    function handleFile(file) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
        invalidFiletypeMessage.classList.remove("d-none"); 
        return; 
    }

    invalidFiletypeMessage.classList.add("d-none");

    const fileType = file.type;
    const fileURL = URL.createObjectURL(file);

    let previewHTML = "";
    if (fileType.startsWith("image/")) {
        previewHTML = `<img src="${fileURL}" alt="Image Preview">`;
    } else if (fileType === "application/pdf") {
        previewHTML = `<embed src="${fileURL}" type="application/pdf">`;
    } else {
        previewHTML = `<i class="bi bi-file-earmark-word" style="font-size: 30px; color: #2B579A;"></i>`;
    }

    fileUploadContainer.innerHTML = `
        <div class="file-preview-wrapper">
            ${previewHTML}
            <span class="file-preview-name">${file.name}</span>
            <button class="close-preview" title="Remove">&times;</button>
        </div>
    `;

    // Add close functionality
    const closeBtn = fileUploadContainer.querySelector(".close-preview");
    closeBtn.addEventListener("click", () => {
        fileUpload.value = ""; 
        fileUploadContainer.innerHTML = `<button id="fileUploadBtn" class="btn btn-outline-dark btn-rounded"> <i class="bi bi-upload me-2"></i>Upload File</button>`;
        document.getElementById("fileUploadBtn").addEventListener("click", () => {
        fileUpload.click();
        });
    });
    }



    // submit file
    submitFile.addEventListener('click', function(){
        selectedRequirement.status = "Completed";
        submissionModal.hide()

        loadRequirements('initialReq', initialRequirements, showAllInitial, initialSelectedStatus);
        loadRequirements('preDepReq', preDepRequirements, showAllPreDep, preDepSelectedStatus);
        loadRequirements('inProgressReq', inProgressRequirements, showAllInProgress, inProgressSelectedStatus);
        loadRequirements('finalReq', finalRequirements, showAllFinal, finalSelectedStatus);
    });

    // Reset modal content when closed
    document.getElementById('submissionModal').addEventListener("hidden.bs.modal", function () {
        fileUpload.value = ""; 
        fileUploadContainer.innerHTML = `<button id="fileUploadBtn" class="btn btn-outline-dark btn-rounded"><i class="bi bi-upload me-2"></i>Upload File</button>`;
    
        document.getElementById("fileUploadBtn").addEventListener("click", () => {
            fileUpload.click();
        });

        invalidFiletype.classList.add("d-none");
      });
  
});
