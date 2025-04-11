
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
       } else if (path.includes('/partner-agencies')) {
           progressTracker.classList.add('collapsed');
           submission.classList.add('collapsed');
           downloadableForms.classList.add('collapsed');
           partnerAgencies.classList.remove('collapsed');
           notifications.classList.add('collapsed');
           account.classList.add('collapsed');
           logout.classList.add('collapsed');
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

    const initialRequirements = [
        { title: 'Student Information Sheet', description: 'Description Description Description Description Description Description Description Description DescriptionDescriptionDescriptionDescriptionDescription DescriptionDescriptionDescription Description Description DescriptionDescription DescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescription.', status: 'Pending', dueDate: '2025/08/02' },
        { title: 'Medical Certificate', description: 'Description.', status: 'Pending', dueDate: '2025/08/20' },
        { title: 'Physical Examination Certificate', description: 'Description.', status: 'Requires Revision', dueDate: '2025/08/23', file:'assets/img/logo-fav.png' },
        { title: 'Neurology Exam Certificate', description: 'Description.', status: 'Completed', dueDate: '2025/08/12', file:'assets/img/3.pdf' },
    ];

    const preDepRequirements = [
        { title: 'Medical Certificate', description: 'Description.', status: 'Completed', dueDate: '2025/08/12', file:'assets/img/logo-fav.png' },
        { title: 'Student Information Sheet', description: 'Description.', status: 'Pending', dueDate: '2025/08/12' },
        { title: 'Insurance', description: 'Description.', status: 'Overdue', dueDate: '2025/01/20', pastDue: '3 days past due' },
        { title: 'Vaccination Record', description: 'Description.', status: 'Overdue', dueDate: '2025/02/12', pastDue: '3 days past due' },
    ];

    const inProgressRequirements = [
        { title: 'Student Information Sheet', description: 'Description.', status: 'Pending', dueDate: '2025/08/02' },
        { title: 'Medical Certificate', description: 'Description.', status: 'Pending', dueDate: '2025/08/20' },
        { title: 'Physical Examination Certificate', description: 'Description.', status: 'Requires Revision', dueDate: '2025/08/23', file:'assets/img/logo-fav.png' },
        { title: 'Neurology Exam Certificate', description: 'Description.', status: 'Completed', dueDate: '2025/08/12', file:'assets/img/logo-fav.png' },
    ];

    const finalRequirements = [
        { title: 'Medical Certificate', description: 'Description.', status: 'Pending', dueDate: '2025/08/12' },
        { title: 'Student Information Sheet', description: 'Description.', status: 'Pending', dueDate: '2025/08/12' },
        { title: 'Insurance', description: 'Description.', status: 'Overdue', dueDate: '2025/01/20', pastDue: '13 days past due'},
        { title: 'Vaccination Record', description: 'Description.', status: 'Completed', dueDate: '2025/02/12', file:'assets/img/logo-fav.png'},
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
                overdue.classList.add('d-none');
                    modalTitle.textContent = requirement.title;
                    modalDescription.textContent = requirement.description;
                    selectedRequirement = requirement;

                if (requirement.status === 'Pending' || requirement.status === 'Overdue'){
                    submissionModal.show();
                }

                if (requirement.status === 'Overdue'){
                    overdue.classList.remove('d-none');
                    modalFooter.classList.add('d-flex','justify-content-between');
                    overdue.textContent = `Overdue: ${requirement.pastDue}`;
                }

                if(requirement.status === "Requires Revision" || requirement.status === "Completed"){
                    const submitFile = document.getElementById('submitFile');

                    submitFile.disabled = true;
                    
                    const fileURL = requirement.file;
                    let previewHTML = "";
            
                    if (fileURL.endsWith(".pdf")) {
                        previewHTML = `<embed src="${fileURL}" type="application/pdf" width="100%" height="400px">`;
                    } else if (fileURL.match(/\.(jpeg|jpg|gif|png)$/)) {
                        previewHTML = `<img src="${fileURL}" alt="Image Preview" class="img-fluid mb-2" style="max-height: 300px;">`;
                    } else {
                        previewHTML = `<i class="bi bi-file-earmark-word" style="font-size: 30px; color: #2B579A;"></i> <span class="file-preview-name">${fileURL.split('/').pop()}</span>`;
                    }
            
                    fileUploadContainer.innerHTML = `
                        <div class="file-preview-wrapper">
                            ${previewHTML}
                            <span class="file-preview-name">${fileURL.split('/').pop()}</span>
                        </div>
                    `;

                    if (requirement.status === "Requires Revision") {

                        fileUploadContainer.innerHTML = `
                            <div class="file-preview-wrapper">
                                ${previewHTML}
                                <span class="file-preview-name">${fileURL.split('/').pop()}</span>
                                <button class="close-preview" title="Remove">&times;</button>
                            </div>
                        `;

                        const filePreviewName = fileUploadContainer.querySelector('.file-preview-name');
                        filePreviewName.style.marginRight = "20px";

                        const closeBtn = fileUploadContainer.querySelector(".close-preview");
                        closeBtn.addEventListener("click", () => {
                            fileUpload.value = "";
                            fileUploadContainer.innerHTML = `
                                <button id="fileUploadBtn" class="btn btn-outline-dark btn-rounded">
                                    <i class="bi bi-upload me-2"></i>Upload New File
                                </button>
                            `;
                            document.getElementById("fileUploadBtn").addEventListener("click", () => {
                                fileUpload.click();
                            });
                            
                            submitFile.disabled = false;
                        });
                    }
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
                loadRequirements('inProgressReq', inProgressRequirements, showAllInProgress, inProgressSelectedStatus);
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
            previewHTML = `<iframe src="${fileURL}#toolbar=0&navpanes=0&scrollbar=0" type="application/pdf"></iframe>`;
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

        const filePreviewName = fileUploadContainer.querySelector('.file-preview-name');
        filePreviewName.style.marginRight = "20px";

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
        if (fileUpload.value = ""){
            submitFile.disabled = true;
        }

        selectedRequirement.status = "Completed";
        submissionModal.hide();

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

// DOWNLOADABLE FORMS
document.addEventListener('DOMContentLoaded', function(){
    const documents = [
        { name: "Project PDF", file: "assets/img/3.pdf" },
        { name: "Lecture Notes", file: "assets/img/a.png" },
        { name: "Annual Report", file: "assets/img/1.docx" },
        { name: "Meeting Minutes", file: "assets/img/1.docx" },
        { name: "Research Paper", file: "assets/img/1.docx" },
        { name: "Summary Report", file: "assets/img/1.docx" },
        { name: "User Guide", file: "assets/img/1.docx" },
        { name: "Invoice", file: "assets/img/1.docx" },
        { name: "Presentation", file: "assets/img/1.docx" },
        { name: "Proposal", file: "assets/img/1.docx" }
    ];
      
    const cardContainer = document.getElementById("documentCards");
    
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
                <img src="${doc.file}" alt="${doc.name}" style="width: 100%; height: 150px; object-fit: cover;" />
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
        
        console.log(`Adding document: ${doc.name}`);
        
        const card = document.createElement("div");
        card.className = "col-md-3";
        card.innerHTML = `
            <div class="card shadow-sm h-100">
                ${previewHTML}
                <div class="card-body text-center">
                    <h5 class="card-title">${doc.name}</h5>
                    <a href="${doc.file}" download class="btn btn-primary">Download</a>
                </div>
            </div>
        `;
        cardContainer.appendChild(card);
        console.log('Documents Displayed');
    });
});


// PARTNER AGENCIES
document.addEventListener('DOMContentLoaded', function(){
    const agencies = [
        { name: "Project PDF", address: "Naga City, Camarines Sur", slots: "5 slots left"},
        { name: "Lecture Notes", address: "Daet, Camarines Norte", slots: "5 slots left"},
        { name: "Annual Report", address: "Daet, Camarines Norte", slots: "5 slots left"},
        { name: "Meeting Minutes", address: "Daet, Camarines Norte", slots: "5 slots left"},
        { name: "Research Paper", address: "Naga City, Camarines Sur", slots: "5 slots left"},
        { name: "Summary Report", address: "Daet, Camarines Norte", slots: "5 slots left"},
        { name: "User Guide", address: "Naga City, Camarines Sur", slots: "5 slots left"},
        { name: "Invoice", address: "Naga City, Camarines Sur", slots: "5 slots left"},
        { name: "Presentation", address: "Naga City, Camarines Sur", slots: "5 slots left"},
        { name: "Proposal", address: "Daet, Camarines Norte", slots: "5 slots left"}
    ];

    const agencyContainer = document.getElementById('agenciesCards');
    agencies.forEach(agency =>{
        const agencyCard = document.createElement("div");
        agencyCard.className = "col-md-3";
        agencyCard.innerHTML = `
            <div class="agencyCard card shadow-sm">
                <div class="card-body text-center">
                    <h5 class="card-title">${agency.name}</h5>
                    <div class="card-text">${agency.address}</div>
                    <p class="small">${agency.slots}</p> 
                </div>
            </div>
        `;
        agencyContainer.appendChild(agencyCard);
        console.log('Agency displayed');

        agencyCard.addEventListener('click', function(){
            const agencyModal = new bootstrap.Modal(document.getElementById('agencyModal'));
            let modalTitle = document.querySelector('#agencyModal, .modal-title');
            let agencyName = document.getElementById('agencyName');
            let agencyAddress = document.getElementById('agencyAddress');
            let positionNeeded = document.getElementById('positionNeeded');
            let agencyDescription = document.getElementById('agencyDescription');

            modalTitle.textContent = agency.name;
            agencyName.textContent = agency.name;
            agencyAddress.textContent = agency.address;


            agencyModal.show();
        })
    });
});

