/* admin/assets/js/projects.js */
NexoraAdmin.onComponentsReady(()=>{
    console.log('projects.js initialized');

    const page = document.querySelector('.dashboard-content');
    if(!page) return;

    page.innerHTML = `
      <section class="welcome-section">
        <div class="welcome-text">
          <h1>Projects</h1>
          <p>Manage projects and portfolios.</p>
        </div>
      </section>

      <section class="admin-section">
        <div class="admin-flex">
          <div class="admin-card">
            <h2>Add / Update Project</h2>
            <form id="project-form">
              <input type="hidden" id="project-id" value="">

              <div class="input-group">
                <label>Title</label>
                <input id="project-title" type="text" placeholder="Project title" required />
              </div>

              <div class="input-group">
                <label>Category</label>
                <input id="project-category" type="text" placeholder="e.g. Kitchen Cabinets" />
              </div>

              <div class="input-group">
                <label>Description</label>
                <textarea id="project-description" placeholder="Short description" rows="4"></textarea>
              </div>

              <div class="input-group">
                <label>Image</label>
                <input id="project-image" type="text" placeholder="e.g. img-1.jpeg" />
              </div>

              <button type="submit" id="project-submit">Save Project</button>
              <button type="button" id="project-cancel" class="secondary">Cancel</button>
            </form>
          </div>

          <div class="admin-card">
            <div class="admin-card-header">
              <h2>All Projects</h2>
              <button type="button" id="projects-refresh" class="secondary">Refresh</button>
            </div>
            <div id="projects-list" class="projects-list">Loading...</div>
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
        .projects-list .row{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid #f1f1f1; }
        .projects-list .meta{ flex:1; }
        .projects-list .actions{ display:flex; gap:8px; }
        .projects-list .actions button{ padding:8px 10px; border-radius:10px; background:#111827; }
        .projects-list .actions button.secondary{ background:#e5e7eb; }
        .projects-list .empty{ color:#6b7280; }
      </style>
    `;

    const form = document.getElementById('project-form');
    const idEl = document.getElementById('project-id');
    const titleEl = document.getElementById('project-title');
    const categoryEl = document.getElementById('project-category');
    const descEl = document.getElementById('project-description');
    const imageEl = document.getElementById('project-image');
    const listEl = document.getElementById('projects-list');
    const refreshBtn = document.getElementById('projects-refresh');
    const cancelBtn = document.getElementById('project-cancel');

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
        const res = await fetch(url, { method: 'DELETE', headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        const payload = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(payload.message || 'Request failed.');
        return payload;
    }

    function resetForm(){
        idEl.value = '';
        titleEl.value = '';
        categoryEl.value = '';
        descEl.value = '';
        imageEl.value = '';
    }

    function renderProjects(projects){
        if(!projects || projects.length === 0){
            listEl.innerHTML = '<div class="empty">No projects found.</div>';
            return;
        }
        listEl.innerHTML = projects.map(project => {
            const title = project.title || 'Untitled project';
            const category = project.category || 'General';
            const description = project.description || 'No description provided.';
            const image = project.image ? `<img src="${project.image}" alt="${title}" style="max-width:120px;border-radius:10px;object-fit:cover;" />` : '';
            return `
                <div class="row">
                    <div class="meta">
                        <div class="project-title">${title}</div>
                        <div class="project-category">${category}</div>
                        <div class="project-desc">${description}</div>
                        ${image}
                    </div>
                    <div class="actions">
                        <button type="button" class="secondary" data-action="edit" data-id="${project.id}">Edit</button>
                        <button type="button" data-action="delete" data-id="${project.id}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
        listEl.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', async () => {
                const action = button.getAttribute('data-action');
                const id = button.getAttribute('data-id');
                const project = projects.find(item => item.id === id);
                if(!project) return;
                if(action === 'edit'){
                    idEl.value = project.id || '';
                    titleEl.value = project.title || '';
                    categoryEl.value = project.category || '';
                    descEl.value = project.description || '';
                    imageEl.value = project.image || '';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    toast('Loaded project for editing.', 'success');
                }
                if(action === 'delete'){
                    if(!confirm('Delete this project?')) return;
                    try{
                        await apiDelete(`/api/admin/projects/${encodeURIComponent(id)}`);
                        toast('Project deleted.', 'success');
                        await loadProjects();
                    }catch(err){
                        console.error(err);
                        toast(err.message || 'Unable to delete project.', 'error');
                    }
                }
            });
        });
    }

    async function loadProjects(){
        listEl.textContent = 'Loading...';
        try{
            const result = await apiGet('/api/admin/projects');
            const projects = (result.items || []).map(item => ({
                id: String(item.id || item._id || item.uid || ''),
                title: item.title,
                category: item.category,
                description: item.description,
                image: item.image,
                createdAt: item.createdAt || item.createdAt || new Date().toISOString()
            }));
            renderProjects(projects);
        }catch(err){
            listEl.innerHTML = '<div class="empty">Unable to load projects.</div>';
            toast(err.message || 'Unable to load projects.', 'error');
        }
    }

    async function saveProject(event){
        event.preventDefault();
        const id = idEl.value.trim();
        const payload = {
            title: titleEl.value.trim(),
            category: categoryEl.value.trim(),
            description: descEl.value.trim(),
            image: imageEl.value.trim()
        };
        if(!payload.title){
            toast('Project title is required.', 'error');
            titleEl.focus();
            return;
        }
        const submitBtn = document.getElementById('project-submit');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = id ? 'Updating...' : 'Saving...';
        try{
            if(id){
                await apiPut(`/api/admin/projects/${encodeURIComponent(id)}`, payload);
                toast('Project updated.', 'success');
            } else {
                await apiPost('/api/admin/projects', payload);
                toast('Project created.', 'success');
            }
            resetForm();
            await loadProjects();
        }catch(err){
            console.error(err);
            toast(err.message || 'Unable to save project.', 'error');
        }finally{
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    form.addEventListener('submit', saveProject);
    cancelBtn.addEventListener('click', (e)=>{ e.preventDefault(); resetForm(); });
    refreshBtn.addEventListener('click', loadProjects);

    loadProjects();
});
