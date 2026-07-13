/* admin/assets/js/testimonials.js */
NexoraAdmin.onComponentsReady(async () => {
    console.log('testimonials.js initialized');

    const content = document.querySelector('.dashboard-content');
    if(!content) return;

    const html = `
        <section class="module-grid grid-3 gap-20">
            <article class="stat-card card shadow-md">
                <h5>Total Testimonials</h5>
                <h2 id="testTotal">0</h2>
                <small>All client reviews and feedback.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Approved</h5>
                <h2 id="testApproved">0</h2>
                <small>Live testimonials displayed publicly.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Pending</h5>
                <h2 id="testPending">0</h2>
                <small>Awaiting review and approval.</small>
            </article>
        </section>

        <section class="card shadow-md">
            <div class="page-header">
                <div>
                    <h2>Testimonials Manager</h2>
                    <p class="page-description">Review customer quotes, approve feedback, and publish testimonials.</p>
                </div>
            </div>
            <div class="grid grid-2 gap-20">
                <div class="card shadow-sm">
                    <h3>Add Testimonial</h3>
                    <form id="testimonialForm" class="grid grid-1 gap-16">
                        <div class="form-group">
                            <label>Customer Name</label>
                            <input id="customerName" type="text" class="input-field" required />
                        </div>
                        <div class="form-group">
                            <label>Company</label>
                            <input id="customerCompany" type="text" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Photo URL</label>
                            <input id="customerPhoto" type="text" class="input-field" placeholder="Image URL or upload" />
                        </div>
                        <div class="form-group">
                            <label>Rating</label>
                            <select id="customerRating" class="input-field">
                                <option value="5">5 stars</option>
                                <option value="4">4 stars</option>
                                <option value="3">3 stars</option>
                                <option value="2">2 stars</option>
                                <option value="1">1 star</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Message</label>
                            <textarea id="customerMessage" rows="4" class="input-field" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="testimonialStatus" class="input-field">
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div class="d-flex justify-between gap-10 wrap">
                            <button type="button" id="resetTestimonial" class="btn btn-secondary">Reset</button>
                            <button type="submit" class="btn btn-primary">Save Testimonial</button>
                        </div>
                    </form>
                </div>
                <div class="card shadow-sm">
                    <h3>Testimonials Feed</h3>
                    <div id="testimonialsCards" class="grid grid-1 gap-16"></div>
                </div>
            </div>
        </section>
        <style>
            .testimonial-card{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:18px;padding:18px;display:flex;gap:16px;align-items:flex-start;}
            .testimonial-photo{width:72px;height:72px;border-radius:18px;overflow:hidden;background:#f3f1eb;}
            .testimonial-photo img{width:100%;height:100%;object-fit:cover;}
            .testimonial-meta{flex:1;}
            .testimonial-stars{color:#f59e0b;font-size:0.95rem;margin-bottom:8px;}
            .status-pill{padding:6px 10px;border-radius:999px;font-size:.82rem;font-weight:700;display:inline-block;}
            .status-approved{background:rgba(34,197,94,.12);color:#166534;}
            .status-pending{background:rgba(245,158,11,.12);color:#92400e;}
            .status-rejected{background:rgba(239,68,68,.12);color:#991b1b;}
            .testimonial-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;}
            .btn{border-radius:10px;padding:10px 14px;}
            .btn-primary{background:var(--primary);color:#fff;}
            .btn-secondary{background:#f3f1eb;color:var(--secondary);}
            .input-field{width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:#fff;}
        </style>
    `;

    content.insertAdjacentHTML('beforeend', html);

    const customerName = document.getElementById('customerName');
    const customerCompany = document.getElementById('customerCompany');
    const customerPhoto = document.getElementById('customerPhoto');
    const customerRating = document.getElementById('customerRating');
    const customerMessage = document.getElementById('customerMessage');
    const testimonialStatus = document.getElementById('testimonialStatus');
    const testimonialForm = document.getElementById('testimonialForm');
    const resetTestimonial = document.getElementById('resetTestimonial');
    const testimonialsCards = document.getElementById('testimonialsCards');
    const testTotal = document.getElementById('testTotal');
    const testApproved = document.getElementById('testApproved');
    const testPending = document.getElementById('testPending');

    let testimonials = [];

    function renderStats(){
        testTotal.textContent = testimonials.length;
        testApproved.textContent = testimonials.filter(t => t.status === 'Approved').length;
        testPending.textContent = testimonials.filter(t => t.status === 'Pending').length;
    }

    function renderTestimonials(){
        testimonialsCards.innerHTML = testimonials.length ? testimonials.map(item => `
            <article class="testimonial-card">
                <div class="testimonial-photo"><img src="${item.photoUrl || '/assets/nexora-logo.jpeg'}" alt="${item.customerName}" /></div>
                <div class="testimonial-meta">
                    <div class="d-flex justify-between align-center">
                        <div>
                            <h4>${item.customerName}</h4>
                            <p>${item.company || 'Private Client'}</p>
                        </div>
                        <span class="status-pill status-${item.status.toLowerCase()}">${item.status}</span>
                    </div>
                    <div class="testimonial-stars">${'★'.repeat(item.rating)}${'☆'.repeat(5-item.rating)}</div>
                    <p>${item.message}</p>
                    <div class="testimonial-actions">
                        <button class="btn btn-secondary" data-action="approve" data-id="${item.id}">Approve</button>
                        <button class="btn btn-secondary" data-action="reject" data-id="${item.id}">Reject</button>
                        <button class="btn btn-secondary" data-action="delete" data-id="${item.id}">Delete</button>
                    </div>
                </div>
            </article>
        `).join('') : '<p>No testimonials have been added yet.</p>';
        attachActions();
    }

    function attachActions(){
        testimonialsCards.querySelectorAll('button[data-action]').forEach(button => {
            button.addEventListener('click', async () => {
                const id = button.dataset.id;
                const action = button.dataset.action;
                const item = testimonials.find(t => t.id === id);
                if(!item) return;
                if(action === 'approve' || action === 'reject'){
                    const status = action === 'approve' ? 'Approved' : 'Rejected';
                    try{
                        await NexoraAdmin.apiPut(`/api/admin/testimonials/${encodeURIComponent(id)}`, { ...item, status });
                        item.status = status;
                        renderStats();
                        renderTestimonials();
                        NexoraAdmin.showToast(`Testimonial ${status.toLowerCase()}.`);
                    }catch(err){
                        NexoraAdmin.showToast(err.message || 'Unable to update testimonial.', 'error');
                    }
                    return;
                }
                if(action === 'delete'){
                    if(!confirm('Delete this testimonial?')) return;
                    try{
                        await NexoraAdmin.apiDelete(`/api/admin/testimonials/${encodeURIComponent(id)}`);
                        testimonials = testimonials.filter(t => t.id !== id);
                        renderStats();
                        renderTestimonials();
                        NexoraAdmin.showToast('Testimonial deleted.');
                    }catch(err){
                        NexoraAdmin.showToast(err.message || 'Unable to delete testimonial.', 'error');
                    }
                }
            });
        });
    }

    async function loadTestimonials(){
        try{
            const res = await NexoraAdmin.apiGet('/api/admin/testimonials');
            testimonials = res.items || [];
            renderStats();
            renderTestimonials();
        }catch(err){
            testimonialsCards.innerHTML = '<p>Unable to load testimonials.</p>';
            NexoraAdmin.showToast(err.message || 'Unable to load testimonials.', 'error');
        }
    }

    function resetForm(){
        testimonialForm.reset();
    }

    testimonialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            customerName: customerName.value.trim(),
            company: customerCompany.value.trim(),
            photoUrl: customerPhoto.value.trim() || '/assets/nexora-logo.jpeg',
            rating: Number(customerRating.value),
            message: customerMessage.value.trim(),
            status: testimonialStatus.value,
            createdAt: new Date().toISOString()
        };
        if(!payload.customerName || !payload.message){
            NexoraAdmin.showToast('Name and message are required.', 'error');
            return;
        }
        try{
            const res = await NexoraAdmin.apiPost('/api/admin/testimonials', payload);
            testimonials.unshift(res.item);
            renderStats();
            renderTestimonials();
            resetForm();
            NexoraAdmin.showToast('Testimonial added successfully.');
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Unable to add testimonial.', 'error');
        }
    });
    resetTestimonial.addEventListener('click', (e) => { e.preventDefault(); resetForm(); });

    await loadTestimonials();
});
