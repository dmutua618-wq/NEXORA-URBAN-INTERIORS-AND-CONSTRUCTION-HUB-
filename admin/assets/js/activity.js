/* admin/assets/js/activity.js */
NexoraAdmin.onComponentsReady(async () => {
    const content = document.querySelector('.dashboard-content');
    if(!content) return;

    content.innerHTML = `
        <section class="module-grid grid-3 gap-20">
            <article class="stat-card card shadow-md">
                <h5>Total Records</h5>
                <h2 id="activityTotal">0</h2>
                <small>All activity items captured.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Today</h5>
                <h2 id="activityToday">0</h2>
                <small>Events logged in the last 24 hours.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Alerts</h5>
                <h2 id="activityAlerts">0</h2>
                <small>High priority items requiring attention.</small>
            </article>
        </section>

        <section class="card shadow-md">
            <div class="page-header d-flex justify-between align-center gap-10">
                <div>
                    <h2>Activity Feed</h2>
                    <p class="page-description">Review recent admin activity and audit logs.</p>
                </div>
                <button id="refreshActivity" class="btn btn-secondary">Refresh</button>
            </div>
            <div class="module-actions d-flex align-center gap-10 wrap">
                <input id="activitySearch" type="search" class="input-field" placeholder="Search activity" />
                <select id="activitySeverity" class="input-field">
                    <option value="All">All Severities</option>
                    <option value="Info">Info</option>
                    <option value="Warning">Warning</option>
                    <option value="Error">Error</option>
                </select>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Severity</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody id="activityTableBody"><tr><td colspan="5">Loading activity...</td></tr></tbody>
                </table>
            </div>
        </section>

        <div id="activityModal" class="modal-overlay hidden">
            <div class="modal-card card shadow-md">
                <div class="modal-header d-flex justify-between align-center">
                    <div>
                        <h3>Activity Details</h3>
                        <p class="page-description">Full information for the selected activity record.</p>
                    </div>
                    <button class="icon-btn" id="closeActivityModal"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="activityDetails" class="activity-details"></div>
            </div>
        </div>

        <style>
            .activity-details{display:grid;grid-template-columns:1fr;gap:12px;}
            .activity-detail-row{display:flex;justify-content:space-between;padding:12px 14px;border:1px solid rgba(0,0,0,.08);border-radius:12px;background:#fff;}
            .modal-overlay.hidden{display:none !important;}
            .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:10000;}
            .modal-card{width:min(760px,100%);padding:24px;}
            .icon-btn{background:transparent;border:none;color:var(--text);font-size:1.1rem;cursor:pointer;}
            .btn-secondary{background:#f3f1eb;color:var(--secondary);}
        </style>
    `;

    const activityTotal = document.getElementById('activityTotal');
    const activityToday = document.getElementById('activityToday');
    const activityAlerts = document.getElementById('activityAlerts');
    const activitySearch = document.getElementById('activitySearch');
    const activitySeverity = document.getElementById('activitySeverity');
    const activityTableBody = document.getElementById('activityTableBody');
    const refreshActivity = document.getElementById('refreshActivity');
    const activityModal = document.getElementById('activityModal');
    const closeActivityModal = document.getElementById('closeActivityModal');
    const activityDetails = document.getElementById('activityDetails');

    let activities = [];

    function getSeverityIndicator(severity){
        const colors = {
            Info: 'rgba(59,130,246,.12)',
            Warning: 'rgba(245,158,11,.12)',
            Error: 'rgba(239,68,68,.12)'
        };
        return `<span class="status-pill" style="background:${colors[severity]||'rgba(107,114,128,.12)'};color:${severity==='Error'?'#991b1b':severity==='Warning'?'#92400e':'#1d4ed8'}">${severity}</span>`;
    }

    function renderStats(){
        activityTotal.textContent = activities.length;
        const now = Date.now();
        activityToday.textContent = activities.filter(item => now - new Date(item.time).getTime() < 86400000).length;
        activityAlerts.textContent = activities.filter(item => item.severity === 'Warning' || item.severity === 'Error').length;
    }

    function filterActivities(){
        const query = activitySearch.value.trim().toLowerCase();
        return activities.filter(item => {
            const severityMatch = activitySeverity.value === 'All' || item.severity === activitySeverity.value;
            const queryMatch = !query || item.user.toLowerCase().includes(query) || item.action.toLowerCase().includes(query) || item.details.toLowerCase().includes(query);
            return severityMatch && queryMatch;
        });
    }

    function renderActivityRows(){
        const filtered = filterActivities();
        activityTableBody.innerHTML = filtered.length ? filtered.map(item => `
            <tr>
                <td>${NexoraAdmin.formatDateTime(item.time)}</td>
                <td>${item.user}</td>
                <td>${item.action}</td>
                <td>${getSeverityIndicator(item.severity)}</td>
                <td><button class="btn btn-secondary" data-id="${item.id}" data-action="details">View</button></td>
            </tr>
        `).join('') : '<tr><td colspan="5">No activity records match.</td></tr>';
        bindActivityButtons();
    }

    function bindActivityButtons(){
        activityTableBody.querySelectorAll('button[data-action="details"]').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.dataset.id;
                const item = activities.find(entry => entry.id === id);
                if(!item) return;
                activityDetails.innerHTML = `
                    <div class="activity-detail-row"><strong>Time</strong><span>${NexoraAdmin.formatDateTime(item.time)}</span></div>
                    <div class="activity-detail-row"><strong>User</strong><span>${item.user}</span></div>
                    <div class="activity-detail-row"><strong>Action</strong><span>${item.action}</span></div>
                    <div class="activity-detail-row"><strong>Severity</strong><span>${item.severity}</span></div>
                    <div class="activity-detail-row"><strong>IP Address</strong><span>${item.ip || 'Unknown'}</span></div>
                    <div class="activity-detail-row"><strong>Details</strong><span style="white-space:pre-wrap;word-break:break-word;">${item.details}</span></div>
                `;
                activityModal.classList.remove('hidden');
            });
        });
    }

    function closeModal(){
        activityModal.classList.add('hidden');
    }

    async function loadActivities(){
        try{
            const result = await NexoraAdmin.apiGet('/api/admin/activity');
            activities = result.items || result.activity || result.records || [];
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Unable to load activity records.', 'error');
            activities = [
                { id: 'a1', time: new Date(Date.now() - 3600000).toISOString(), user: 'Admin', action: 'Logged in', severity: 'Info', details: 'User signed into the admin panel.', ip: '192.168.1.12' },
                { id: 'a2', time: new Date(Date.now() - 7200000).toISOString(), user: 'Admin', action: 'Updated settings', severity: 'Warning', details: 'SMTP settings were modified.', ip: '192.168.1.12' },
                { id: 'a3', time: new Date(Date.now() - 10800000).toISOString(), user: 'Editor', action: 'Deleted project', severity: 'Error', details: 'Project record ID 42 was deleted.', ip: '192.168.1.15' }
            ];
        }
        renderStats();
        renderActivityRows();
    }

    activitySearch.addEventListener('input', renderActivityRows);
    activitySeverity.addEventListener('change', renderActivityRows);
    refreshActivity.addEventListener('click', loadActivities);
    closeActivityModal.addEventListener('click', closeModal);
    activityModal.addEventListener('click', (e) => { if(e.target === activityModal) closeModal(); });

    await loadActivities();
});
