/* admin/assets/js/requirements.js */
NexoraAdmin.onComponentsReady(async () => {
    console.log('requirements.js initialized');

    const content = document.querySelector('.dashboard-content');
    if(!content) return;

    content.insertAdjacentHTML('beforeend', `
        <section class="module-grid grid-3 gap-20">
            <article class="stat-card card shadow-md">
                <h5>Total Requirements</h5>
                <h2 id="reqTotal">0</h2>
                <small>All client requirement requests.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Open</h5>
                <h2 id="reqOpen">0</h2>
                <small>Requests waiting assignment.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Completed</h5>
                <h2 id="reqCompleted">0</h2>
                <small>Requests marked complete.</small>
            </article>
        </section>
        <section class="card shadow-md">
            <div class="page-header">
                <div>
                    <h2>Requirement Intake</h2>
                    <p class="page-description">Track client requirements, prioritize projects, and move requests through review.</p>
                </div>
                <button id="openReqModal" class="btn btn-primary">Add Requirement</button>
            </div>
            <div class="module-actions d-flex align-center gap-10 wrap">
                <input id="reqSearch" type="search" placeholder="Search by client or project" class="input-field" />
                <select id="reqStatus" class="input-field">
                    <option value="All">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                </select>
                <select id="reqPriority" class="input-field">
                    <option value="All">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Project Type</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Requested</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="reqTableBody"><tr><td colspan="6">Loading requirements...</td></tr></tbody>
                </table>
            </div>
        </section>
        <div id="reqModal" class="modal-overlay hidden">
            <div class="modal-card card shadow-md">
                <div class="modal-header d-flex justify-between align-center">
                    <div>
                        <h3 id="reqModalTitle">Add Requirement</h3>
                        <p class="page-description">Create a new client requirement request.</p>
                    </div>
                    <button type="button" class="icon-btn" id="closeReqModal"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="reqForm" class="grid grid-1 gap-16">
                    <input type="hidden" id="reqId" value="" />
                    <div class="form-group"><label>Client Name</label><input id="reqClient" type="text" class="input-field" required /></div>
                    <div class="form-group"><label>Project Type</label><input id="reqProjectType" type="text" class="input-field" required /></div>
                    <div class="form-group"><label>Priority</label><select id="reqPriorityInput" class="input-field"><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div>
                    <div class="form-group"><label>Status</label><select id="reqStatusInput" class="input-field"><option value="Open">Open</option><option value="In Review">In Review</option><option value="Completed">Completed</option></select></div>
                    <div class="form-group"><label>Summary</label><textarea id="reqSummary" rows="4" class="input-field" required></textarea></div>
                    <div class="d-flex justify-between gap-10 wrap">
                        <button type="button" id="cancelReqButton" class="btn btn-secondary">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Requirement</button>
                    </div>
                </form>
            </div>
        </div>
        <style>
            .btn{border-radius:10px;padding:10px 16px;}
            .btn-primary{background:var(--primary);color:#fff;}
            .btn-secondary{background:#f3f1eb;color:var(--secondary);}
            .input-field{width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:#fff;}
            .status-pill{padding:6px 10px;border-radius:999px;font-size:.82rem;font-weight:700;display:inline-block;}
            .status-Open{background:rgba(245,158,11,.12);color:#92400e;}
            .status-In\ Review{background:rgba(59,130,246,.12);color:#1d4ed8;}
            .status-Completed{background:rgba(34,197,94,.12);color:#166534;}
            .priority-High{color:#b91c1c;font-weight:700;}
            .priority-Medium{color:#d97706;font-weight:700;}
            .priority-Low{color:#065f46;font-weight:700;}
            .modal-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:20px;z-index:10000;}
            .modal-overlay.hidden{display:none !important;}
            .modal-card{width:min(800px,100%);padding:24px;}
            .icon-btn{background:transparent;border:none;color:var(--secondary);font-size:1.1rem;}
        </style>
    `);

    const reqSearch = document.getElementById('reqSearch');
    const reqStatus = document.getElementById('reqStatus');
    const reqPriority = document.getElementById('reqPriority');
    const reqTableBody = document.getElementById('reqTableBody');
    const reqTotal = document.getElementById('reqTotal');
    const reqOpen = document.getElementById('reqOpen');
    const reqCompleted = document.getElementById('reqCompleted');
    const openReqModal = document.getElementById('openReqModal');
    const reqModal = document.getElementById('reqModal');
    const closeReqModal = document.getElementById('closeReqModal');
    const cancelReqButton = document.getElementById('cancelReqButton');
    const reqForm = document.getElementById('reqForm');
    const reqId = document.getElementById('reqId');
    const reqClient = document.getElementById('reqClient');
    const reqProjectType = document.getElementById('reqProjectType');
    const reqPriorityInput = document.getElementById('reqPriorityInput');
    const reqStatusInput = document.getElementById('reqStatusInput');
    const reqSummary = document.getElementById('reqSummary');

    let requirements = [];

    function renderStats(){
        reqTotal.textContent = requirements.length;
        reqOpen.textContent = requirements.filter(item => item.status === 'Open').length;
        reqCompleted.textContent = requirements.filter(item => item.status === 'Completed').length;
    }

    function filterRequirements(){
        const query = reqSearch.value.trim().toLowerCase();
        return requirements.filter(item => {
            const statusMatch = reqStatus.value === 'All' || item.status === reqStatus.value;
            const priorityMatch = reqPriority.value === 'All' || item.priority === reqPriority.value;
            const searchMatch = !query || item.client.toLowerCase().includes(query) || item.projectType.toLowerCase().includes(query) || item.summary.toLowerCase().includes(query);
            return statusMatch && priorityMatch && searchMatch;
        });
    }

    function renderTable(){
        const filtered = filterRequirements();
        reqTableBody.innerHTML = filtered.length ? filtered.map(item => {
            const statusClass = item.status.replace(/\s+/g, '-');
            return `
            <tr>
                <td>${item.client}</td>
                <td>${item.projectType}</td>
                <td class="priority-${item.priority}">${item.priority}</td>
                <td><span class="status-pill status-${statusClass}">${item.status}</span></td>
                <td>${NexoraAdmin.formatDateTime(item.requestedAt)}</td>
                <td class="d-flex gap-8 wrap">
                    <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
                    <button class="btn btn-secondary" data-action="complete" data-id="${item.id}">Complete</button>
                    <button class="btn btn-secondary" data-action="delete" data-id="${item.id}">Delete</button>
                </td>
            </tr>
        `; }).join('') : '<tr><td colspan="6">No requirements match your filters.</td></tr>';
        bindActions();
    }

    function bindActions(){
        reqTableBody.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                const item = requirements.find(req => req.id === id);
                if(!item) return;
                if(action === 'edit'){
                    reqId.value = item.id;
                    reqClient.value = item.client;
                    reqProjectType.value = item.projectType;
                    reqPriorityInput.value = item.priority;
                    reqStatusInput.value = item.status;
                    reqSummary.value = item.summary;
                    reqModal.classList.remove('hidden');
                    document.getElementById('reqModalTitle').textContent = 'Edit Requirement';
                    return;
                }
                if(action === 'complete'){
                    try{
                        await NexoraAdmin.apiPut(`/api/admin/requirements/${encodeURIComponent(id)}`, { ...item, status: 'Completed' });
                        item.status = 'Completed';
                        renderStats();
                        renderTable();
                        NexoraAdmin.showToast('Marked requirement as completed.');
                    }catch(err){
                        NexoraAdmin.showToast(err.message || 'Unable to update requirement.', 'error');
                    }
                    return;
                }
                if(action === 'delete'){
                    if(!confirm('Delete this requirement?')) return;
                    try{
                        await NexoraAdmin.apiDelete(`/api/admin/requirements/${encodeURIComponent(id)}`);
                        requirements = requirements.filter(req => req.id !== id);
                        renderStats();
                        renderTable();
                        NexoraAdmin.showToast('Requirement removed.');
                    }catch(err){
                        NexoraAdmin.showToast(err.message || 'Unable to delete requirement.', 'error');
                    }
                }
            });
        });
    }

    async function loadRequirements(){
        try{
            const res = await NexoraAdmin.apiGet('/api/admin/requirements');
            requirements = res.items || [];
            renderStats();
            renderTable();
        }catch(err){
            reqTableBody.innerHTML = '<tr><td colspan="6">Unable to load requirements.</td></tr>';
            NexoraAdmin.showToast(err.message || 'Unable to load requirements.', 'error');
        }
    }

    function openModal(){ 
        reqModal.classList.remove('hidden'); 
        reqForm.reset();
    }
    
    function closeModal(){ 
        try{
            reqModal.classList.add('hidden'); 
            reqForm.reset(); 
            reqId.value = ''; 
            document.getElementById('reqModalTitle').textContent = 'Add Requirement';
        }catch(e){ 
            console.error('Error closing modal:', e);
            reqModal.style.display = 'none';
        }
    }

    reqForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            client: reqClient.value.trim(),
            projectType: reqProjectType.value.trim(),
            priority: reqPriorityInput.value,
            status: reqStatusInput.value,
            summary: reqSummary.value.trim(),
            requestedAt: new Date().toISOString()
        };
        if(!payload.client || !payload.projectType || !payload.summary){
            NexoraAdmin.showToast('Client, project type, and summary are required.', 'error');
            return;
        }
        try{
            if(reqId.value){
                await NexoraAdmin.apiPut(`/api/admin/requirements/${encodeURIComponent(reqId.value)}`, payload);
                const updated = requirements.find(item => item.id === reqId.value);
                Object.assign(updated, payload);
                NexoraAdmin.showToast('Requirement updated.');
            } else {
                const created = await NexoraAdmin.apiPost('/api/admin/requirements', payload);
                requirements.unshift(created.item);
                NexoraAdmin.showToast('Requirement created.');
            }
            renderStats();
            renderTable();
            closeModal();
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Unable to save requirement.', 'error');
        }
    });

    openReqModal.addEventListener('click', openModal);
    closeReqModal.addEventListener('click', closeModal);
    cancelReqButton.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
    reqModal.addEventListener('click', (e) => { if(e.target === reqModal) closeModal(); });
    reqSearch.addEventListener('input', renderTable);
    reqStatus.addEventListener('change', renderTable);
    reqPriority.addEventListener('change', renderTable);

    await loadRequirements();
});
