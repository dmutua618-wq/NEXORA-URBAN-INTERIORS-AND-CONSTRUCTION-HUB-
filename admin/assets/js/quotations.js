/* admin/assets/js/quotations.js */
NexoraAdmin.onComponentsReady(async () => {
    console.log('quotations.js initialized');

    const content = document.querySelector('.dashboard-content');
    if(!content) return;

    const html = `
        <section class="module-grid grid-3 gap-20">
            <article class="stat-card card shadow-md">
                <h5>Total Quotations</h5>
                <h2 id="quoteTotal">0</h2>
                <small>All incoming quotation requests.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Approved</h5>
                <h2 id="quoteApproved">0</h2>
                <small>Accepted projects ready for scheduling.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Pending</h5>
                <h2 id="quotePending">0</h2>
                <small>Pending approvals waiting review.</small>
            </article>
        </section>

        <section class="card shadow-md">
            <div class="page-header">
                <div>
                    <h2>Quotation Pipeline</h2>
                    <p class="page-description">Review, filter and manage quote requests from clients.</p>
                </div>
                <div class="d-flex gap-10 wrap">
                    <button id="exportPdf" class="btn btn-secondary">Export PDF</button>
                    <button id="exportExcel" class="btn btn-secondary">Export Excel</button>
                </div>
            </div>
            <div class="module-actions d-flex align-center gap-10 wrap">
                <input id="quoteSearch" type="search" placeholder="Search by client or project" class="input-field" />
                <select id="quoteStatus" class="input-field">
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>
            <div class="table-responsive">
                <table class="data-table" id="quotationsTable">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Project</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Source</th>
                            <th>Requested</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="quotationsTableBody">
                        <tr><td colspan="7">Loading quotations...</td></tr>
                    </tbody>
                </table>
            </div>
        </section>
        <style>
            .data-table{width:100%;border:1px solid rgba(0,0,0,.08);border-radius:12px;overflow:hidden;}
            .data-table th, .data-table td{padding:14px 16px;border-bottom:1px solid rgba(0,0,0,.06);}
            .data-table th{background:rgba(200,148,69,.08);font-weight:700;color:var(--secondary);}
            .data-table tr:hover{background:rgba(200,148,69,.05);}
            .status-pill{padding:6px 10px;border-radius:999px;font-size:.85rem;font-weight:700;display:inline-block;}
            .status-pending{background:rgba(245,158,11,.12);color:#92400e;}
            .status-approved{background:rgba(34,197,94,.12);color:#166534;}
            .status-rejected{background:rgba(239,68,68,.12);color:#991b1b;}
            .btn{border-radius:10px;padding:10px 16px;}
            .btn-secondary{background:#f3f1eb;color:var(--secondary);}
        </style>
    `;

    content.insertAdjacentHTML('beforeend', html);

    const quoteSearch = document.getElementById('quoteSearch');
    const quoteStatus = document.getElementById('quoteStatus');
    const quotesTableBody = document.getElementById('quotationsTableBody');
    const quoteTotal = document.getElementById('quoteTotal');
    const quoteApproved = document.getElementById('quoteApproved');
    const quotePending = document.getElementById('quotePending');
    const exportPdf = document.getElementById('exportPdf');
    const exportExcel = document.getElementById('exportExcel');

    let quotes = [];

    function filterQuotes(){
        const query = quoteSearch.value.trim().toLowerCase();
        return quotes.filter(item => {
            const matchesStatus = quoteStatus.value === 'All' || item.status === quoteStatus.value;
            const matchesQuery = !query || item.client.toLowerCase().includes(query) || item.project.toLowerCase().includes(query);
            return matchesStatus && matchesQuery;
        });
    }

    function renderStats(){
        quoteTotal.textContent = quotes.length;
        quoteApproved.textContent = quotes.filter(item => item.status === 'Approved').length;
        quotePending.textContent = quotes.filter(item => item.status === 'Pending').length;
    }

    function renderQuotes(){
        const filtered = filterQuotes();
        quotesTableBody.innerHTML = filtered.length ? filtered.map(item => `
            <tr>
                <td>${item.client}</td>
                <td>${item.project}</td>
                <td>KES ${item.amount.toLocaleString()}</td>
                <td><span class="status-pill status-${item.status.toLowerCase()}">${item.status}</span></td>
                <td>${item.source}</td>
                <td>${NexoraAdmin.formatDateTime(item.createdAt)}</td>
                <td class="d-flex gap-8 wrap">
                    <button class="btn btn-secondary" data-id="${item.id}" data-action="approve">Approve</button>
                    <button class="btn btn-secondary" data-id="${item.id}" data-action="reject">Reject</button>
                    <button class="btn btn-secondary" data-id="${item.id}" data-action="delete">Delete</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="7">No quotation requests match your criteria.</td></tr>';
        attachActions();
    }

    function attachActions(){
        quotesTableBody.querySelectorAll('button[data-action]').forEach(button => {
            button.addEventListener('click', async () => {
                const id = button.dataset.id;
                const action = button.dataset.action;
                const item = quotes.find(q => q.id === id);
                if(!item) return;
                if(action === 'approve' || action === 'reject'){
                    const status = action === 'approve' ? 'Approved' : 'Rejected';
                    try{
                        await NexoraAdmin.apiPut(`/api/admin/quotations/${encodeURIComponent(id)}`, { ...item, status });
                        item.status = status;
                        renderStats();
                        renderQuotes();
                        NexoraAdmin.showToast(`Quotation ${status.toLowerCase()}.`);
                    }catch(err){
                        NexoraAdmin.showToast(err.message || 'Unable to update quotation.', 'error');
                    }
                    return;
                }
                if(action === 'delete'){
                    if(!confirm('Delete this quotation?')) return;
                    try{
                        await NexoraAdmin.apiDelete(`/api/admin/quotations/${encodeURIComponent(id)}`);
                        quotes = quotes.filter(q => q.id !== id);
                        renderStats();
                        renderQuotes();
                        NexoraAdmin.showToast('Quotation deleted.');
                    }catch(err){
                        NexoraAdmin.showToast(err.message || 'Unable to delete quotation.', 'error');
                    }
                }
            });
        });
    }

    async function loadQuotes(){
        try{
            const res = await NexoraAdmin.apiGet('/api/admin/quotations');
            quotes = res.items || [];
            renderStats();
            renderQuotes();
        }catch(err){
            quotesTableBody.innerHTML = '<tr><td colspan="7">Failed to load quotation data.</td></tr>';
            NexoraAdmin.showToast(err.message || 'Unable to load quotations.', 'error');
        }
    }

    function renderExportHtml(items){
        return `
            <html>
                <head>
                    <title>Quotation Export</title>
                    <style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{padding:10px;border:1px solid #ccc;text-align:left;}th{background:#f3f1eb;}</style>
                </head>
                <body>
                    <h1>Quotation Export</h1>
                    <table>
                        <thead>
                            <tr><th>Client</th><th>Project</th><th>Amount</th><th>Status</th><th>Source</th><th>Requested</th></tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.client}</td>
                                    <td>${item.project}</td>
                                    <td>KES ${item.amount.toLocaleString()}</td>
                                    <td>${item.status}</td>
                                    <td>${item.source}</td>
                                    <td>${NexoraAdmin.formatDateTime(item.createdAt)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
    }

    function downloadData(type){
        const filtered = filterQuotes();
        if(type === 'pdf'){
            const html = renderExportHtml(filtered);
            const printWindow = window.open('', '_blank');
            if(!printWindow){
                NexoraAdmin.showToast('Unable to open print preview.', 'error');
                return;
            }
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            return;
        }

        const csv = filtered.map(item => [item.client, item.project, `KES ${item.amount}`, item.status, item.source, item.createdAt].map(value => `"${String(value).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([`Client,Project,Amount,Status,Source,Requested\n${csv}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'quotations.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        NexoraAdmin.showToast('Excel export ready.');
    }

    quoteSearch.addEventListener('input', renderQuotes);
    quoteStatus.addEventListener('change', renderQuotes);
    exportPdf.addEventListener('click', () => downloadData('pdf'));
    exportExcel.addEventListener('click', () => downloadData('csv'));

    await loadQuotes();
});
