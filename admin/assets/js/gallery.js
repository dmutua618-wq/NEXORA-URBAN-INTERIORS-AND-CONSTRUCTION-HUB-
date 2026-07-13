/* admin/assets/js/gallery.js */
NexoraAdmin.onComponentsReady(()=>{
    console.log('gallery.js initialized (upgraded)');

    const page = document.querySelector('.dashboard-content');
    if(!page) return;

    page.innerHTML = `
      <section class="welcome-section">
        <div class="welcome-text">
          <h1>Gallery</h1>
          <p>Manage gallery images and collections.</p>
        </div>
      </section>

      <section class="admin-section">
        <div class="toolbar">
          <div class="stats">
            <div class="stat-card" data-key="totalImages"><div class="stat-num">—</div><div class="stat-label">Total Images</div></div>
            <div class="stat-card" data-key="albums"><div class="stat-num">—</div><div class="stat-label">Albums</div></div>
            <div class="stat-card" data-key="featured"><div class="stat-num">—</div><div class="stat-label">Featured</div></div>
            <div class="stat-card" data-key="pending"><div class="stat-num">—</div><div class="stat-label">Pending</div></div>
          </div>

          <div class="controls">
            <input id="gallery-search" class="search" placeholder="Search by title or description" />
            <select id="gallery-category" class="select"><option value="">All categories</option></select>
            <select id="gallery-sort" class="select"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="title_asc">Title A–Z</option><option value="title_desc">Title Z–A</option></select>
            <div class="bulk-actions">
              <button id="bulk-delete" class="danger" disabled>Delete Selected</button>
            </div>
          </div>
        </div>

        <div class="admin-grid">
          <div class="left-col">
            <div class="uploader-card admin-card">
              <h2>Upload Image</h2>
              <form id="uploader-form" class="uploader">
                <div id="dropzone" class="dropzone">Drag & drop an image here or <label for="file-input" class="link">browse</label>
                  <input id="file-input" type="file" accept="image/*" hidden />
                </div>
                <div id="preview" class="preview"></div>
                <datalist id="category-suggestions"></datalist>
                <div class="input-group">
                  <label>Title</label>
                  <input id="item-title" type="text" placeholder="Image title" />
                </div>
                <div class="input-group">
                  <label>Category</label>
                  <input id="item-category" type="text" placeholder="e.g. Architecture" list="category-suggestions" />
                </div>
                <div class="input-group">
                  <label>Description</label>
                  <textarea id="item-desc" rows="3" placeholder="Short description"></textarea>
                </div>
                <div class="form-actions">
                  <button id="upload-submit">Upload</button>
                  <button id="upload-cancel" type="button" class="secondary">Clear</button>
                </div>
              </form>
            </div>
          </div>

          <div class="right-col">
            <div class="admin-card list-card">
              <div class="list-header">
                <h2>Gallery Items</h2>
                <div class="list-actions">
                  <button id="refresh-list" class="secondary">Refresh</button>
                </div>
              </div>

              <div id="gallery-list" class="cards-grid"></div>

              <div class="pagination" id="pagination"></div>
            </div>
          </div>
        </div>
      </section>

      <style>
        :root{ --nex-black:#0b0b0b; --nex-gold:#b8860b; --nex-white:#ffffff; }
        .welcome-section{ padding:8px 0 16px; }
        .welcome-text h1{ margin:0 0 6px; color:#ffffff; }
        .welcome-text p{ color:rgba(255,255,255,0.85); }
        .admin-section{ padding:8px 0 30px; }
        .toolbar{ display:flex; flex-direction:column; gap:12px; margin-bottom:14px; }
        .stats{ display:flex; gap:12px; flex-wrap:wrap; }
        .stat-card{ background:var(--nex-black); color:var(--nex-white); padding:14px; border-radius:10px; min-width:140px; display:flex; flex-direction:column; align-items:flex-start; }
        .stat-num{ font-size:20px; font-weight:700; color:var(--nex-gold); }
        .stat-label{ font-size:12px; opacity:0.9; }
        .controls{ display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-top:8px; }
        .search{ flex:1 1 280px; min-width:220px; padding:10px; border-radius:10px; border:1px solid #e6e6e6; }
        .select{ flex:0 1 180px; min-width:140px; padding:10px; border-radius:10px; border:1px solid #e6e6e6; }
        .bulk-actions{ flex:0 1 auto; }
        .bulk-actions button{ padding:8px 12px; border-radius:8px; }
        .admin-grid{ display:grid; grid-template-columns:360px 1fr; gap:16px; align-items:start; }
        .admin-card{ background:#fff; border-radius:12px; padding:14px; box-shadow:0 10px 30px rgba(0,0,0,0.06); }
        .uploader .input-group{ display:block; margin-top:14px; }
        .uploader .input-group label{ display:block; margin-bottom:6px; color:#111827; font-weight:600; }
        .uploader .input-group input,
        .uploader .input-group textarea{ width:100%; padding:10px 12px; border:1px solid #e6e6e6; border-radius:10px; background:#fff; box-sizing:border-box; }
        .uploader .input-group textarea{ resize:vertical; min-height:80px; }
        .uploader h2{ margin-top:0; }
        .uploader .dropzone{ margin-top:10px; }
        .uploader .link{ color:var(--nex-gold); font-weight:700; cursor:pointer; }
        .uploader .dropzone{ border:2px dashed #e6e6e6; padding:22px; border-radius:10px; text-align:center; color:#6b7280; cursor:pointer; }
        .uploader .preview{ margin-top:12px; display:flex; gap:8px; flex-wrap:wrap; }
        .uploader .preview img{ width:120px; height:80px; object-fit:cover; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.08); }
        .form-actions{ display:flex; gap:8px; margin-top:10px; }
        button{ background:var(--nex-black); color:var(--nex-white); border:0; padding:10px 14px; border-radius:10px; cursor:pointer; }
        button.secondary{ background:#f3f3f3; color:var(--nex-black); }
        button.danger{ background:#b91c1c; }
        .list-card .list-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .cards-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; }
        .card{ background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.06); display:flex; flex-direction:column; transition:transform .18s ease, box-shadow .18s ease; }
        .card:hover{ transform:translateY(-6px); box-shadow:0 18px 40px rgba(0,0,0,0.12); }
        .card-thumb{ width:100%; height:140px; object-fit:cover; background:#f3f3f3; }
        .card-body{ padding:10px; display:flex; gap:8px; align-items:flex-start; }
        .card-info{ flex:1; }
        .card-title{ font-weight:700; margin:0 0 6px; }
        .card-meta{ font-size:12px; color:#6b7280; }
        .card-actions{ display:flex; gap:8px; align-items:center; }
        .select-checkbox{ margin-right:8px; }
        .pagination{ margin-top:12px; display:flex; gap:6px; justify-content:center; }
        .page-btn{ padding:8px 10px; border-radius:8px; background:#f3f3f3; cursor:pointer; }
        .skeleton{ background:linear-gradient(90deg,#f3f3f3 25%,#ececec 37%,#f3f3f3 63%); background-size:400% 100%; animation:shimmer 1.6s linear infinite; border-radius:8px; }
        @keyframes shimmer{ 0%{background-position:200% 0}100%{background-position:-200% 0} }
        .empty-state{ text-align:center; padding:30px; color:#6b7280; }
        @media(max-width:900px){ .admin-grid{ grid-template-columns:1fr; } .stats{ flex-wrap:wrap; } }
      </style>
    `;

    // Element refs
    const galleryListEl = document.getElementById('gallery-list');
    const searchEl = document.getElementById('gallery-search');
    const categoryEl = document.getElementById('gallery-category');
    const sortEl = document.getElementById('gallery-sort');
    const refreshBtn = document.getElementById('refresh-list');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const previewEl = document.getElementById('preview');
    const uploadForm = document.getElementById('uploader-form');
    const uploadSubmit = document.getElementById('upload-submit');
    const uploadCancel = document.getElementById('upload-cancel');
    const titleInput = document.getElementById('item-title');
    const catInput = document.getElementById('item-category');
    const descInput = document.getElementById('item-desc');
    const paginationEl = document.getElementById('pagination');
    const bulkDeleteBtn = document.getElementById('bulk-delete');

    const defaultCategories = ['Architecture', 'Interior Design', 'Renovation', 'Commercial', 'Residential'];

    // State
    let items = [];
    let filtered = [];
    let selected = new Set();
    let currentPage = 1;
    const pageSize = 12;

    function toast(msg, type='info'){
        if(window.NexoraAdmin?.showToast) return window.NexoraAdmin.showToast(msg, type);
        // simple fallback alert but non-blocking
        const el = document.createElement('div');
        el.textContent = msg;
        el.style.position='fixed'; el.style.right='16px'; el.style.bottom='16px'; el.style.background='rgba(11,11,11,.9)'; el.style.color='#fff'; el.style.padding='10px 14px'; el.style.borderRadius='8px'; el.style.zIndex=9999; el.style.boxShadow='0 6px 20px rgba(0,0,0,0.3)';
        document.body.appendChild(el);
        setTimeout(()=> el.remove(), 3500);
    }

    async function apiGet(url){
        const token = localStorage.getItem('nexora-token');
        const res = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        const payload = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(payload.message || 'Request failed.');
        return payload;
    }

    async function apiPost(url, body, isForm=false){
        const token = localStorage.getItem('nexora-token');
        const headers = isForm ? { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) } : { 'Content-Type':'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
        const res = await fetch(url, {
            method:'POST',
            headers,
            body: isForm ? body : JSON.stringify(body)
        });
        const payload = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(payload.message || 'Request failed.');
        return payload;
    }

    async function apiPut(url, body){
        const token = localStorage.getItem('nexora-token');
        const res = await fetch(url, {
            method:'PUT', headers:{ 'Content-Type':'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify(body)
        });
        const payload = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(payload.message || 'Request failed.');
        return payload;
    }

    async function apiDelete(url){
        const token = localStorage.getItem('nexora-token');
        const res = await fetch(url, { method:'DELETE', headers:{ ...(token ? { 'Authorization': `Bearer ${token}` } : {}) } });
        const payload = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(payload.message || 'Request failed.');
        return payload;
    }

    function bytesToSize(bytes){ const sizes=['Bytes','KB','MB','GB']; if(bytes===0) return '0 Byte'; const i = parseInt(Math.floor(Math.log(bytes)/Math.log(1024)),10); return Math.round(bytes/Math.pow(1024,i),2)+' '+sizes[i]; }

    // File validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    function validateFile(file){
        if(!file) return 'No file provided';
        if(!file.type.startsWith('image/')) return 'Invalid file type';
        if(file.size > MAX_FILE_SIZE) return `File too large (${bytesToSize(file.size)}). Max ${bytesToSize(MAX_FILE_SIZE)}`;
        return null;
    }

    // Loading state
    function showSkeletonGrid(){
        galleryListEl.innerHTML = Array.from({length:8}).map(()=>`<div class="card"><div class="skeleton" style="height:140px"></div><div class="card-body"><div class="skeleton" style="height:14px;width:60%"></div><div style="height:8px"></div><div class="skeleton" style="height:10px;width:40%"></div></div></div>`).join('');
    }

    function renderStats(data){
        const map = { totalImages: data.total || 0, albums: data.albums || 0, featured: data.featured || 0, pending: data.pending || 0 };
        document.querySelectorAll('.stat-card').forEach(c=>{ const k=c.getAttribute('data-key'); c.querySelector('.stat-num').textContent = map[k] ?? '—'; });
    }

    function renderPagination(total){
        const pages = Math.max(1, Math.ceil(total / pageSize));
        paginationEl.innerHTML = '';
        for(let i=1;i<=pages;i++){
            const btn = document.createElement('button'); btn.className='page-btn'; btn.textContent = i; if(i===currentPage) btn.style.background='var(--nex-black)';
            btn.addEventListener('click', ()=>{ currentPage = i; renderCards(); });
            paginationEl.appendChild(btn);
        }
    }

    function renderCards(){
        const start = (currentPage-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize);
        if(!pageItems.length){
            galleryListEl.innerHTML = '<div class="empty-state">No images found. Try changing filters or upload new images.</div>';
            renderPagination(filtered.length);
            return;
        }

        galleryListEl.innerHTML = pageItems.map(it=>{
            const thumb = it.url || it.image || it.file || '';
            const uploadDate = new Date(it.createdAt || it.uploadedAt || it.date || Date.now()).toLocaleString();
            return `
              <div class="card" data-id="${it.id}">
                <img class="card-thumb" src="${escapeHtml(thumb)}" onerror="this.style.background='#f3f3f3'; this.src='';" />
                <div class="card-body">
                  <input type="checkbox" class="select-checkbox" data-id="${it.id}" ${selected.has(it.id)?'checked':''} />
                  <div class="card-info">
                    <div class="card-title">${escapeHtml(it.title||'Untitled')}</div>
                    <div class="card-meta">${escapeHtml(it.category||'Uncategorized')} • ${escapeHtml(uploadDate)}</div>
                  </div>
                  <div class="card-actions">
                    <button class="secondary" data-action="view" data-id="${it.id}">View</button>
                    <button class="secondary" data-action="edit" data-id="${it.id}">Edit</button>
                    <button data-action="delete" data-id="${it.id}">Delete</button>
                  </div>
                </div>
              </div>
            `;
        }).join('');

        // wire up actions
        galleryListEl.querySelectorAll('[data-action]').forEach(btn=> btn.addEventListener('click', onCardAction));
        galleryListEl.querySelectorAll('.select-checkbox').forEach(cb=> cb.addEventListener('change', onSelectToggle));
        renderPagination(filtered.length);
    }

    function onSelectToggle(e){
        const id = e.target.getAttribute('data-id');
        if(e.target.checked) selected.add(id); else selected.delete(id);
        bulkDeleteBtn.disabled = selected.size === 0;
    }

    async function onCardAction(e){
        const action = e.target.getAttribute('data-action');
        const id = e.target.getAttribute('data-id');
        if(!action || !id) return;

        const item = items.find(x=>x.id===id);
        if(action==='view'){
            window.open(item.url || item.image || item.file || '#','_blank');
            return;
        }

        if(action==='edit'){
            // load into uploader for quick edit
            titleInput.value = item.title || '';
            catInput.value = item.category || '';
            descInput.value = item.description || '';
            previewEl.innerHTML = `<img src="${escapeHtml(item.url||item.image||item.file||'')}" />`;
            // attach special attribute to submit to update
            uploadForm.setAttribute('data-edit-id', id);
            window.scrollTo({top:0,behavior:'smooth'});
            return;
        }

        if(action==='delete'){
            if(!confirm('Delete this image?')) return;
            try{
                await apiDelete(`/api/admin/gallery/${encodeURIComponent(id)}`);
                toast('Deleted', 'success');
                await loadGalleryItems();
            }catch(err){ console.error(err); toast(err.message || 'Delete failed','error'); }
        }
    }

    function escapeHtml(str){ if(!str && str!==0) return ''; return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;"); }

    // Filtering and sorting
    function applyFilters(){
        const q = (searchEl.value||'').toLowerCase().trim();
        const cat = (categoryEl.value||'').trim();
        const sort = sortEl.value;
        filtered = items.filter(it=>{
            if(cat && (it.category||'') !== cat) return false;
            if(q){ const hay = ((it.title||'')+' '+(it.description||'')).toLowerCase(); if(!hay.includes(q)) return false; }
            return true;
        });
        if(sort==='newest') filtered.sort((a,b)=> new Date(b.createdAt||b.uploadedAt||0) - new Date(a.createdAt||a.uploadedAt||0));
        if(sort==='oldest') filtered.sort((a,b)=> new Date(a.createdAt||a.uploadedAt||0) - new Date(b.createdAt||b.uploadedAt||0));
        if(sort==='title_asc') filtered.sort((a,b)=> (a.title||'').localeCompare(b.title||''));
        if(sort==='title_desc') filtered.sort((a,b)=> (b.title||'').localeCompare(a.title||''));
        currentPage = 1;
        renderCards();
    }

    // Load items from API
    async function loadGalleryItems(){
        showSkeletonGrid();
        try{
            let adminItems = [];
            let publicItems = [];
            let stats = {};
            try{
                const res = await apiGet('/api/admin/gallery');
                adminItems = Array.isArray(res.items) ? res.items : [];
                stats = res.stats || {};
            }catch(err){
                console.warn('Admin gallery load failed, continuing with public gallery:', err.message);
            }
            try{
                const pub = await apiGet('/api/gallery');
                publicItems = Array.isArray(pub.items) ? pub.items : [];
            }catch(err){
                console.warn('Public gallery load failed:', err.message);
            }
            const merged = [];
            const seen = new Set();
            [...adminItems, ...publicItems].forEach(item => {
                const id = String(item.id || item._id || item.uid || '');
                if(!id || seen.has(id)) return;
                seen.add(id);
                merged.push(item);
            });
            items = merged.map(it=> ({ id:String(it.id||it._id||it.uid||''), title:it.title, description:it.description, category:it.category, image:it.image, file:it.file, url:it.url, createdAt:it.createdAt||it.uploadedAt||it.date }));
            const itemCategories = Array.from(new Set(items.map(i=>i.category).filter(Boolean)));
            const cats = Array.from(new Set([ ...defaultCategories, ...itemCategories ])).sort((a,b)=> a.localeCompare(b));
            categoryEl.innerHTML = '<option value="">All categories</option>' + cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
            document.getElementById('category-suggestions').innerHTML = cats.map(c=>`<option value="${escapeHtml(c)}">`).join('');
            applyFilters();
            const statsToRender = Object.keys(stats).length ? stats : { total: items.length, albums: cats.length, featured: 0, pending: 0 };
            renderStats(statsToRender);
        }catch(err){
            console.error(err);
            galleryListEl.innerHTML = '<div class="empty-state">Unable to load gallery items.</div>';
            toast(err.message || 'Failed to load items','error');
        }
    }

    // Upload handling
    function clearUploadForm(){ fileInput.value=''; previewEl.innerHTML=''; titleInput.value=''; catInput.value=''; descInput.value=''; uploadForm.removeAttribute('data-edit-id'); }

    function handleFiles(files){
        previewEl.innerHTML='';
        Array.from(files).slice(0,6).forEach(file=>{
            const v = validateFile(file);
            if(v){ toast(v,'error'); return; }
            const img = document.createElement('img'); img.src = URL.createObjectURL(file); img.onload = ()=> URL.revokeObjectURL(img.src); previewEl.appendChild(img);
        });
    }

    dropzone.addEventListener('click', ()=> fileInput.click());
    dropzone.addEventListener('dragover', e=>{ e.preventDefault(); dropzone.style.borderColor='var(--nex-gold)'; });
    dropzone.addEventListener('dragleave', e=>{ e.preventDefault(); dropzone.style.borderColor=''; });
    dropzone.addEventListener('drop', e=>{
        e.preventDefault();
        dropzone.style.borderColor='';
        const files = e.dataTransfer.files;
        handleFiles(files);
        try{
            const dt = new DataTransfer();
            Array.from(files).forEach(file => dt.items.add(file));
            fileInput.files = dt.files;
        }catch(err){
            console.warn('Unable to assign drop files to input:', err);
        }
    });
    fileInput.addEventListener('change', e=> handleFiles(e.target.files));

    uploadCancel.addEventListener('click', ()=> clearUploadForm());

    uploadForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const files = fileInput.files;
        if(!(files && files.length>0) && !uploadForm.getAttribute('data-edit-id')){ toast('Please choose an image to upload','error'); return; }

        try{
            uploadSubmit.textContent = 'Uploading...';
            let uploadResult = null;
            if(files && files[0]){
                const fd = new FormData(); fd.append('file', files[0]); fd.append('title', titleInput.value || ''); fd.append('category', catInput.value || ''); fd.append('description', descInput.value || '');
                // primary upload endpoint -- backend should accept multipart
                try{ uploadResult = await apiPost('/api/admin/gallery/upload', fd, true); }catch(err){ console.warn('upload endpoint failed, trying generic /api/admin/upload',err); uploadResult = await apiPost('/api/admin/upload', fd, true); }
            }

            const payload = { title: titleInput.value||'', description: descInput.value||'', category: catInput.value||'' };
            if(uploadResult && (uploadResult.filename || uploadResult.url)){
                payload.image = uploadResult.filename || uploadResult.url;
                payload.url = uploadResult.url || uploadResult.filename;
            }

            const editId = uploadForm.getAttribute('data-edit-id');
            if(editId){
                await apiPut(`/api/admin/gallery/${encodeURIComponent(editId)}`, payload);
                toast('Image updated','success');
            }else{
                await apiPost('/api/admin/gallery', payload);
                toast('Image uploaded','success');
            }

            clearUploadForm();
            await loadGalleryItems();
        }catch(err){ console.error(err); toast(err.message || 'Upload failed','error'); }
        finally{ uploadSubmit.textContent = 'Upload'; }
    });

    refreshBtn.addEventListener('click', ()=> loadGalleryItems());
    searchEl.addEventListener('input', ()=> applyFilters());
    categoryEl.addEventListener('change', ()=> applyFilters());
    sortEl.addEventListener('change', ()=> applyFilters());

    bulkDeleteBtn.addEventListener('click', async ()=>{
        if(selected.size===0) return;
        if(!confirm(`Delete ${selected.size} selected images?`)) return;
        try{
            const ids = Array.from(selected);
            // try bulk endpoint first
            try{ await apiPost('/api/admin/gallery/bulk-delete', { ids }); }
            catch(err){ // fallback to individual deletes
                await Promise.all(ids.map(id=> apiDelete(`/api/admin/gallery/${encodeURIComponent(id)}`)));
            }
            toast('Deleted selected','success'); selected.clear(); bulkDeleteBtn.disabled=true; await loadGalleryItems();
        }catch(err){ console.error(err); toast(err.message || 'Bulk delete failed','error'); }
    });

    // initial load
    loadGalleryItems();
});

