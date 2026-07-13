/* admin/assets/js/messages.js */
NexoraAdmin.onComponentsReady(async () => {
    const content = document.querySelector('.dashboard-content');
    if(!content) return;

    content.innerHTML = `
        <section class="module-grid grid-3 gap-20">
            <article class="stat-card card shadow-md">
                <h5>Total Conversations</h5>
                <h2 id="messageTotal">0</h2>
                <small>All received messages from clients.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Unread</h5>
                <h2 id="messageUnread">0</h2>
                <small>New messages that need review.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Resolved</h5>
                <h2 id="messageResolved">0</h2>
                <small>Messages that have been handled.</small>
            </article>
        </section>

        <section class="card shadow-md">
            <div class="page-header d-flex justify-between align-center gap-10">
                <div>
                    <h2>Inbox</h2>
                    <p class="page-description">Manage contact form submissions and customer communication.</p>
                </div>
                <button id="refreshMessages" class="btn btn-secondary">Refresh</button>
            </div>
            <div class="module-actions d-flex align-center gap-10 wrap">
                <input id="messageSearch" type="search" class="input-field" placeholder="Search by sender, subject or message" />
                <select id="messageStatus" class="input-field">
                    <option value="All">All Statuses</option>
                    <option value="Unread">Unread</option>
                    <option value="Read">Read</option>
                    <option value="Resolved">Resolved</option>
                </select>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>From</th>
                            <th>Subject</th>
                            <th>Received</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="messageTableBody"><tr><td colspan="5">Loading messages...</td></tr></tbody>
                </table>
            </div>
        </section>

        <div id="messageModal" class="modal-overlay hidden">
            <div class="modal-card card shadow-md">
                <div class="modal-header d-flex justify-between align-center">
                    <div>
                        <h3>Message Details</h3>
                        <p class="page-description">View and manage the message content.</p>
                    </div>
                    <button class="icon-btn" id="closeMessageModal"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="messageDetails" class="message-details"></div>
            </div>
        </div>

        <style>
            .message-details{display:grid;gap:12px;}
            .message-row{display:flex;justify-content:space-between;padding:14px 16px;border:1px solid rgba(0,0,0,.08);border-radius:12px;background:#fff;}
            .message-label{font-weight:700;}
            .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:10000;}
            .modal-overlay.hidden{display:none !important;}
            .modal-card{width:min(820px,100%);padding:24px;}
            .icon-btn{background:transparent;border:none;color:var(--text);font-size:1.1rem;cursor:pointer;}
            .btn-secondary{background:#f3f1eb;color:var(--secondary);}
        </style>
    `;

    const messageTotal = document.getElementById('messageTotal');
    const messageUnread = document.getElementById('messageUnread');
    const messageResolved = document.getElementById('messageResolved');
    const messageSearch = document.getElementById('messageSearch');
    const messageStatus = document.getElementById('messageStatus');
    const refreshMessages = document.getElementById('refreshMessages');
    const messageTableBody = document.getElementById('messageTableBody');
    const messageModal = document.getElementById('messageModal');
    const closeMessageModal = document.getElementById('closeMessageModal');
    const messageDetails = document.getElementById('messageDetails');

    let messages = [];

    function renderStats(){
        messageTotal.textContent = messages.length;
        messageUnread.textContent = messages.filter(msg => msg.status === 'Unread').length;
        messageResolved.textContent = messages.filter(msg => msg.status === 'Resolved').length;
    }

    function filterMessages(){
        const query = messageSearch.value.trim().toLowerCase();
        return messages.filter(msg => {
            const statusMatch = messageStatus.value === 'All' || msg.status === messageStatus.value;
            const queryMatch = !query || msg.name.toLowerCase().includes(query) || msg.subject.toLowerCase().includes(query) || msg.message.toLowerCase().includes(query);
            return statusMatch && queryMatch;
        });
    }

    function renderMessageRows(){
        const filtered = filterMessages();
        messageTableBody.innerHTML = filtered.length ? filtered.map(item => `
            <tr>
                <td>${item.name}<br><small>${item.email}</small></td>
                <td>${item.subject}</td>
                <td>${NexoraAdmin.formatDateTime(item.receivedAt)}</td>
                <td><span class="status-pill" style="background:${item.status==='Unread'?'rgba(239,68,68,.12)':'rgba(34,197,94,.12)'};color:${item.status==='Unread'?'#991b1b':'#166534'}">${item.status}</span></td>
                <td class="d-flex gap-8 wrap">
                    <button class="btn btn-secondary" data-action="view" data-id="${item.id}">View</button>
                    <button class="btn btn-secondary" data-action="toggle" data-id="${item.id}">${item.status==='Unread'?'Mark Read':'Mark Unread'}</button>
                    <button class="btn btn-secondary" data-action="delete" data-id="${item.id}">Delete</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="5">No messages match your search.</td></tr>';
        bindMessageButtons();
    }

    function bindMessageButtons(){
        messageTableBody.querySelectorAll('button[data-action]').forEach(button => {
            button.addEventListener('click', async () => {
                const action = button.dataset.action;
                const id = button.dataset.id;
                const item = messages.find(msg => msg.id === id);
                if(!item) return;
                if(action === 'view'){
                    messageDetails.innerHTML = `
                        <div class="message-row"><span class="message-label">From</span><span>${item.name} &lt;${item.email}&gt;</span></div>
                        <div class="message-row"><span class="message-label">Subject</span><span>${item.subject}</span></div>
                        <div class="message-row"><span class="message-label">Received</span><span>${NexoraAdmin.formatDateTime(item.receivedAt)}</span></div>
                        <div class="message-row"><span class="message-label">Status</span><span>${item.status}</span></div>
                        <div class="message-row"><span class="message-label">Message</span><span style="white-space:pre-wrap;word-break:break-word;">${item.message}</span></div>
                    `;
                    if(item.status === 'Unread'){
                        item.status = 'Read';
                        await updateMessageStatus(id, 'Read');
                    }
                    messageModal.classList.remove('hidden');
                    renderStats();
                    renderMessageRows();
                    return;
                }
                if(action === 'toggle'){
                    const nextStatus = item.status === 'Unread' ? 'Read' : 'Unread';
                    try{
                        await updateMessageStatus(id, nextStatus);
                        item.status = nextStatus;
                        messageTableBody.querySelectorAll('button[data-id="'+id+'"]').forEach(btn => {
                            if(btn.dataset.action === 'toggle') btn.textContent = nextStatus === 'Unread' ? 'Mark Read' : 'Mark Unread';
                        });
                        renderStats();
                        renderMessageRows();
                        NexoraAdmin.showToast(`Message marked ${nextStatus.toLowerCase()}.`);
                    }catch(err){
                        NexoraAdmin.showToast(err.message || 'Unable to update message.', 'error');
                    }
                    return;
                }
                if(action === 'delete'){
                    if(!confirm('Delete this message?')) return;
                    try{
                        await NexoraAdmin.apiDelete(`/api/admin/messages/${encodeURIComponent(id)}`);
                        messages = messages.filter(msg => msg.id !== id);
                        renderStats();
                        renderMessageRows();
                        NexoraAdmin.showToast('Message deleted.');
                    }catch(err){
                        NexoraAdmin.showToast(err.message || 'Unable to delete message.', 'error');
                    }
                }
            });
        });
    }

    async function loadMessages(){
        try{
            const result = await NexoraAdmin.apiGet('/api/admin/messages');
            messages = result.items || result.messages || [];
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Unable to load messages.', 'error');
            messages = [];
        }
        renderStats();
        renderMessageRows();
    }

    async function updateMessageStatus(id, status){
        await NexoraAdmin.apiPut(`/api/admin/messages/${encodeURIComponent(id)}`, { status });
    }

    function closeModal(){
        messageModal.classList.add('hidden');
    }

    messageSearch.addEventListener('input', renderMessageRows);
    messageStatus.addEventListener('change', renderMessageRows);
    refreshMessages.addEventListener('click', loadMessages);
    closeMessageModal.addEventListener('click', closeModal);
    messageModal.addEventListener('click', (e) => { if(e.target === messageModal) closeModal(); });

    await loadMessages();
});
