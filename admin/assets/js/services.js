/* admin/assets/js/services.js */
NexoraAdmin.onComponentsReady(()=>{
    console.log('services.js initialized');

    const page = document.querySelector('.dashboard-content');
    if(!page) return;

    page.innerHTML = `
      <section class="welcome-section">
        <div class="welcome-text">
          <h1>Services</h1>
          <p>Manage services offered by Nexora.</p>
        </div>
      </section>

      <section class="admin-section">
        <div class="admin-flex">
          <div class="admin-card">
            <h2>Add / Update Service</h2>

            <form id="service-form">
              <input type="hidden" id="service-id" value="">

              <div class="input-group">
                <label>Title</label>
                <input id="service-title" type="text" placeholder="Service title" required />
              </div>

              <div class="input-group">
                <label>Description</label>
                <textarea id="service-description" placeholder="Short description" rows="4"></textarea>
              </div>

              <div class="input-group">
                <label>Icon (FontAwesome class or text)</label>
                <input id="service-icon" type="text" placeholder="e.g. fa-solid fa-screwdriver-wrench" />
              </div>

              <button type="submit" id="service-submit">Save Service</button>
              <button type="button" id="service-cancel" class="secondary">Cancel</button>
            </form>
          </div>

          <div class="admin-card">
            <div class="admin-card-header">
              <h2>All Services</h2>
              <button type="button" id="services-refresh" class="secondary">Refresh</button>
            </div>

            <div id="services-list" class="services-list">Loading...</div>
          </div>
        </div>
      </section>

      <style>
        .admin-section{ padding:18px 0; }
        .admin-flex{ display:flex; gap:16px; flex-wrap:wrap; }
        .admin-card{ flex:1 1 420px; background:#fff; border-radius:12px; padding:16px; box-shadow:0 8px 30px rgba(0,0,0,0.06); }
        .admin-card-header{ display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:10px; }
        form .input-group{ margin-bottom:12px; }
        input, textarea{ width:100%; padding:10px 12px; border:1px solid #e5e5e5; border-radius:10px; outline:none; }
        textarea{ resize:vertical; }
        button{ padding:10px 14px; border:0; border-radius:10px; background:#111827; color:#fff; cursor:pointer; }
        button.secondary{ background:#e5e7eb; color:#111827; }
        .services-list .row{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid #f1f1f1; }
        .services-list .meta{ flex:1; }
        .services-list .actions{ display:flex; gap:8px; }
        .services-list .actions button{ padding:8px 10px; border-radius:10px; background:#111827; }
        .services-list .actions button.secondary{ background:#e5e7eb; }
        .services-list .empty{ color:#6b7280; }
        .service-title{ font-weight:700; margin-bottom:4px; }
        .service-desc{ color:#4b5563; font-size:13px; white-space:pre-wrap; }
        .service-icon{ color:#6b7280; font-size:12px; margin-top:6px; }
      </style>
    `;

    const form = document.getElementById('service-form');
    const idEl = document.getElementById('service-id');
    const titleEl = document.getElementById('service-title');
    const descEl = document.getElementById('service-description');
    const iconEl = document.getElementById('service-icon');
    const listEl = document.getElementById('services-list');
    const refreshBtn = document.getElementById('services-refresh');
    const cancelBtn = document.getElementById('service-cancel');

    function toast(msg, type='info'){
        if(window.NexoraAdmin?.showToast) return window.NexoraAdmin.showToast(msg, type);
        alert(msg);
    }

    async function apiGet(url){
        const token = localStorage.getItem('nexora-token');
        const res = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        const payload = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(payload.message || 'Request failed.');
        return payload;
    }

    async function apiPost(url, body){
        const token = localStorage.getItem('nexora-token');
        const res = await fetch(url, {
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body)
        });
        const payload = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(payload.message || 'Request failed.');
        return payload;
    }

    async function apiPut(url, body){
        const token = localStorage.getItem('nexora-token');
        const res = await fetch(url, {
            method:'PUT',
            headers:{
                'Content-Type':'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(body)
        });
        const payload = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(payload.message || 'Request failed.');
        return payload;
    }

    async function apiDelete(url){
        const token = localStorage.getItem('nexora-token');
        const res = await fetch(url, {
            method:'DELETE',
            headers:{
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        const payload = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(payload.message || 'Request failed.');
        return payload;
    }

    function resetForm(){
        idEl.value = '';
        titleEl.value = '';
        descEl.value = '';
        iconEl.value = '';
    }

    function renderList(items){
        if(!items || items.length === 0){
            listEl.innerHTML = '<div class="empty">No services available.</div>';
            return;
        }

        listEl.innerHTML = items.map(s => {
            const title = s.title || 'Untitled';
            const desc = s.description || '';
            const icon = s.icon || s.faIcon || '';
            return `
              <div class="row">
                <div class="meta">
                  <div class="service-title">${title}</div>
                  ${desc ? `<div class="service-desc">${escapeHtml(desc)}</div>` : ''}
                  ${icon ? `<div class="service-icon">Icon: ${escapeHtml(icon)}</div>` : ''}
                </div>
                <div class="actions">
                  <button type="button" class="secondary" data-action="edit" data-id="${s.id}">Edit</button>
                  <button type="button" data-action="delete" data-id="${s.id}">Delete</button>
                </div>
              </div>
            `;
        }).join('');

        listEl.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async ()=>{
                const action = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');
                if(!action || !id) return;

                if(action === 'edit'){
                    const service = items.find(x => x.id === id);
                    if(!service) return;
                    idEl.value = service.id || '';
                    titleEl.value = service.title || '';
                    descEl.value = service.description || '';
                    iconEl.value = service.icon || service.faIcon || '';
                    toast('Loaded service into form');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }

                if(action === 'delete'){
                    if(!confirm('Delete this service?')) return;
                    await apiDelete(`/api/admin/services/${encodeURIComponent(id)}`);
                    toast('Service deleted', 'success');
                    await loadServices();
                }
            });
        });
    }

    function escapeHtml(str){
        return String(str)
            .replaceAll('&','&amp;')
            .replaceAll('<','<')
            .replaceAll('>','>')
            .replaceAll('"','"')
            .replaceAll("'",'&#039;');
    }


    async function loadServices(){
        listEl.textContent = 'Loading...';
        try{
            let adminItems = [];
            let publicItems = [];
            try{
                const res = await apiGet('/api/admin/services');
                adminItems = Array.isArray(res.items) ? res.items : [];
            }catch(err){
                console.warn('Admin services load failed, continuing with public services:', err.message);
            }
            try{
                const pub = await apiGet('/api/services');
                publicItems = Array.isArray(pub.items) ? pub.items : [];
            }catch(err){
                console.warn('Public services load failed:', err.message);
            }
            const merged = [];
            const seen = new Set();
            [...adminItems, ...publicItems].forEach(item => {
                const id = String(item.id || item._id || item.uid || item.title || '');
                if(!id || seen.has(id)) return;
                seen.add(id);
                merged.push(item);
            });
            renderList(merged);
        }catch(err){
            console.error(err);
            listEl.innerHTML = '<div class="empty">Unable to load services.</div>';
            toast(err.message || 'Failed to load services','error');
        }
    }

    form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const id = idEl.value.trim();
        const body = {
            title: titleEl.value.trim(),
            description: descEl.value.trim(),
            icon: iconEl.value.trim()
        };

        if(!body.title){
            toast('Please enter a title.', 'error');
            titleEl.focus();
            return;
        }

        try{
            const submitBtn = document.getElementById('service-submit');
            const prev = submitBtn.textContent;
            submitBtn.textContent = id ? 'Updating...' : 'Creating...';

            if(id){
                await apiPut(`/api/admin/services/${encodeURIComponent(id)}`, body);
                toast('Service updated', 'success');
            }else{
                await apiPost('/api/admin/services', body);
                toast('Service created', 'success');
            }

            resetForm();
            await loadServices();
        }catch(err){
            console.error(err);
            toast(err?.message || 'Unable to save service', 'error');
        }finally{
            const submitBtn = document.getElementById('service-submit');
            submitBtn.textContent = 'Save Service';
        }
    });

    if(refreshBtn){
        refreshBtn.addEventListener('click', async ()=>{
            await loadServices();
        });
    }

    if(cancelBtn){
        cancelBtn.addEventListener('click', ()=>{
            resetForm();
        });
    }

    loadServices();
});

