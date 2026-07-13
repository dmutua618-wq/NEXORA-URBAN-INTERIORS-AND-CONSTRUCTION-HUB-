/* admin/assets/js/users.js */
NexoraAdmin.onComponentsReady(async () => {
    console.log('users.js initialized');

    const content = document.querySelector('.dashboard-content');
    if(!content) return;

    const pageHtml = `
        <section class="module-grid grid-3 gap-20">
            <article class="stat-card card shadow-md">
                <h5>Total Users</h5>
                <h2 id="totalUsers">0</h2>
                <small>All registered admin and staff users.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Active Users</h5>
                <h2 id="activeUsers">0</h2>
                <small>Users currently marked as active.</small>
            </article>
            <article class="stat-card card shadow-md">
                <h5>Administrators</h5>
                <h2 id="adminUsers">0</h2>
                <small>Accounts with admin or super admin access.</small>
            </article>
        </section>

        <section class="card shadow-md">
            <div class="page-header">
                <div>
                    <h2>User Directory</h2>
                    <p class="page-description">Find, manage and invite team members to the Nexora admin panel.</p>
                </div>
                <div class="d-flex align-center gap-10">
                    <button id="newUserBtn" class="btn btn-primary">Add User</button>
                </div>
            </div>
            <div class="module-actions d-flex align-center gap-10 wrap gap-10">
                <input id="userSearch" type="search" placeholder="Search by name or email" class="input-field" />
                <select id="roleFilter" class="input-field">
                    <option value="All">All Roles</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                </select>
                <select id="statusFilter" class="input-field">
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            <div class="table-responsive">
                <table class="data-table" id="usersTable">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr><td colspan="7">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination-bar d-flex justify-between align-center">
                <div id="userStatsText">0 users found.</div>
                <div>
                    <button id="prevPage" class="btn btn-secondary">Previous</button>
                    <button id="nextPage" class="btn btn-secondary">Next</button>
                </div>
            </div>
        </section>

        <div id="userModal" class="modal-overlay hidden">
            <div class="modal-card card shadow-md">
                <div class="modal-header d-flex justify-between align-center">
                    <div>
                        <h3 id="userModalTitle">Add New User</h3>
                        <p class="page-description">Create or update account access for your team.</p>
                    </div>
                    <button class="icon-btn" id="closeUserModal"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="userForm" class="modal-form">
                    <input type="hidden" id="selectedUserId" value="" />
                    <div class="grid grid-2 gap-20">
                        <div class="form-group">
                            <label>Name</label>
                            <input id="userName" type="text" placeholder="Full name" required class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input id="userEmail" type="email" placeholder="Email address" required class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input id="userPhone" type="tel" placeholder="Phone number" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select id="userRole" class="input-field">
                                <option value="Super Admin">Super Admin</option>
                                <option value="Admin">Admin</option>
                                <option value="Editor">Editor</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="userStatus" class="input-field">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="form-group hidden" id="passwordGroup">
                        <label>Password</label>
                        <input id="userPassword" type="password" placeholder="Set temporary password" class="input-field" />
                    </div>
                    <div class="modal-actions d-flex justify-end gap-10">
                        <button type="button" class="btn btn-secondary" id="cancelUserButton">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="saveUserButton">Save User</button>
                    </div>
                </form>
            </div>
        </div>

        <style>
            .module-grid{grid-template-columns:repeat(3,1fr);}
            .module-actions{padding:20px 0;}
            .data-table{width:100%;border:1px solid rgba(0,0,0,.08);border-radius:12px;overflow:hidden;}
            .data-table th, .data-table td{padding:14px 16px;text-align:left;border-bottom:1px solid rgba(0,0,0,.06);}
            .data-table th{background:rgba(200,148,69,.08);color:var(--secondary);font-weight:700;}
            .data-table tr:hover{background:rgba(200,148,69,.06);}
            .status-badge{padding:6px 10px;border-radius:999px;font-size:.78rem;font-weight:700;display:inline-block;}
            .status-active{background:rgba(34,197,94,.12);color:#166534;}
            .status-inactive{background:rgba(239,68,68,.12);color:#b91c1c;}
            .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:10000;}
            .modal-overlay.hidden{display:none !important;}
            .modal-card{width:min(900px,100%);padding:24px;}
            .modal-header{margin-bottom:20px;}
            .icon-btn{background:transparent;color:var(--text);font-size:1.1rem;border:none;cursor:pointer;}
            .modal-form .form-group{margin-bottom:16px;}
            .input-field{width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:#fff;}
            .pagination-bar{margin-top:20px;}
            .btn{padding:10px 16px;border-radius:10px;cursor:pointer;}
            .btn-primary{background:var(--primary);color:#fff;}
            .btn-secondary{background:#f3f1eb;color:var(--secondary);}
            .btn:disabled{opacity:0.6;cursor:not-allowed;}
            .card{background:var(--surface);border-radius:16px;padding:24px;}
            @media(max-width:992px){.module-grid{grid-template-columns:repeat(2,1fr);}} 
            @media(max-width:768px){.grid-2{grid-template-columns:1fr;}.module-actions{flex-direction:column;}.modal-card{padding:18px;}}
        </style>
    `;

    content.insertAdjacentHTML('beforeend', pageHtml);

    const userSearch = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const usersTableBody = document.getElementById('usersTableBody');
    const totalUsersEl = document.getElementById('totalUsers');
    const activeUsersEl = document.getElementById('activeUsers');
    const adminUsersEl = document.getElementById('adminUsers');
    const userStatsText = document.getElementById('userStatsText');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const newUserBtn = document.getElementById('newUserBtn');
    const userModal = document.getElementById('userModal');
    const closeUserModal = document.getElementById('closeUserModal');
    const cancelUserButton = document.getElementById('cancelUserButton');
    const userForm = document.getElementById('userForm');
    const selectedUserId = document.getElementById('selectedUserId');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPhone = document.getElementById('userPhone');
    const userRole = document.getElementById('userRole');
    const userStatus = document.getElementById('userStatus');
    const passwordGroup = document.getElementById('passwordGroup');
    const userPassword = document.getElementById('userPassword');

    let state = { users: [], page: 1, pageSize: 6, query: '', role: 'All', status: 'All' };

    function notify(message, type='success'){
        NexoraAdmin.showToast(message, type);
    }

    function getFilteredUsers(){
        const q = state.query.toLowerCase().trim();
        return state.users.filter(user => {
            if(state.role !== 'All' && user.role !== state.role) return false;
            if(state.status !== 'All' && user.status !== state.status) return false;
            if(!q) return true;
            return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || user.phone.toLowerCase().includes(q);
        });
    }

    function updateStats(){
        totalUsersEl.textContent = state.users.length;
        activeUsersEl.textContent = state.users.filter(u => u.active).length;
        adminUsersEl.textContent = state.users.filter(u => u.role === 'Admin' || u.role === 'Super Admin').length;
    }

    function renderUsers(){
        const filtered = getFilteredUsers();
        const start = (state.page - 1) * state.pageSize;
        const pageItems = filtered.slice(start, start + state.pageSize);
        usersTableBody.innerHTML = pageItems.length ? pageItems.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.phone || '—'}</td>
                <td><span class="status-badge ${user.status === 'Active' ? 'status-active' : 'status-inactive'}">${user.status}</span></td>
                <td>${NexoraAdmin.formatDateTime(user.lastLogin)}</td>
                <td class="d-flex gap-8">
                    <button class="btn btn-secondary" data-action="view" data-id="${user.id}">View</button>
                    <button class="btn btn-secondary" data-action="edit" data-id="${user.id}">Edit</button>
                    <button class="btn btn-secondary" data-action="delete" data-id="${user.id}">Delete</button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="7">No users match your filters.</td></tr>';

        userStatsText.textContent = `${filtered.length} user${filtered.length === 1 ? '' : 's'} found.`;
        prevPage.disabled = state.page === 1;
        nextPage.disabled = start + state.pageSize >= filtered.length;
        attachRowActions();
    }

    function attachRowActions(){
        usersTableBody.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', async () => {
                const action = button.dataset.action;
                const id = button.dataset.id;
                const user = state.users.find(item => item.id === id);
                if(!user) return;
                if(action === 'view'){
                    selectedUserId.value = user.id;
                    userName.value = user.name;
                    userEmail.value = user.email;
                    userPhone.value = user.phone || '';
                    userRole.value = user.role;
                    userStatus.value = user.status;
                    passwordGroup.classList.add('hidden');
                    document.getElementById('userModalTitle').textContent = 'View User';
                    userForm.querySelectorAll('input,select').forEach(input => input.disabled = true);
                    userForm.querySelector('#saveUserButton').classList.add('hidden');
                    openModal();
                    return;
                }
                if(action === 'edit'){
                    selectedUserId.value = user.id;
                    userName.value = user.name;
                    userEmail.value = user.email;
                    userPhone.value = user.phone || '';
                    userRole.value = user.role;
                    userStatus.value = user.status;
                    passwordGroup.classList.remove('hidden');
                    userPassword.value = '';
                    document.getElementById('userModalTitle').textContent = 'Edit User';
                    userForm.querySelectorAll('input,select').forEach(input => input.disabled = false);
                    userForm.querySelector('#saveUserButton').classList.remove('hidden');
                    openModal();
                    return;
                }
                if(action === 'delete'){
                    if(!confirm('Delete this user?')) return;
                    try{
                        await NexoraAdmin.apiDelete(`/api/admin/users/${encodeURIComponent(id)}`);
                        notify('User deleted successfully.');
                        await loadUsers();
                    }catch(err){
                        notify(err.message || 'Unable to delete user.', 'error');
                    }
                }
            });
        });
    }

    function openModal(){
        userModal.classList.remove('hidden');
    }

    function closeModal(){
        userModal.classList.add('hidden');
        selectedUserId.value = '';
        userForm.reset();
        userForm.querySelectorAll('input,select').forEach(input => input.disabled = false);
        userForm.querySelector('#saveUserButton').classList.remove('hidden');
        passwordGroup.classList.remove('hidden');
    }

    async function loadUsers(){
        try{
            const data = await NexoraAdmin.apiGet('/api/admin/users');
            state.users = data.items || [];
            updateStats();
            renderUsers();
        }catch(err){
            usersTableBody.innerHTML = '<tr><td colspan="7">Failed to load users.</td></tr>';
            notify(err.message || 'Unable to load users.', 'error');
        }
    }

    userSearch.addEventListener('input', () => { state.query = userSearch.value; state.page = 1; renderUsers(); });
    roleFilter.addEventListener('change', () => { state.role = roleFilter.value; state.page = 1; renderUsers(); });
    statusFilter.addEventListener('change', () => { state.status = statusFilter.value; state.page = 1; renderUsers(); });
    prevPage.addEventListener('click', () => { if(state.page > 1){ state.page -= 1; renderUsers(); }});
    nextPage.addEventListener('click', () => { state.page += 1; renderUsers(); });

    newUserBtn.addEventListener('click', () => {
        selectedUserId.value = '';
        userForm.reset();
        passwordGroup.classList.remove('hidden');
        document.getElementById('userModalTitle').textContent = 'Add New User';
        userForm.querySelectorAll('input,select').forEach(input => input.disabled = false);
        userForm.querySelector('#saveUserButton').classList.remove('hidden');
        openModal();
    });

    closeUserModal.addEventListener('click', closeModal);
    cancelUserButton.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
    userModal.addEventListener('click', (e) => { if(e.target === userModal) closeModal(); });

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = selectedUserId.value.trim();
        const payload = {
            name: userName.value.trim(),
            email: userEmail.value.trim(),
            phone: userPhone.value.trim(),
            role: userRole.value,
            status: userStatus.value,
            active: userStatus.value === 'Active'
        };
        if(!payload.name || !payload.email){ notify('Name and email are required.', 'error'); return; }
        if(!id && !userPassword.value.trim()){ notify('A password is required for new users.', 'error'); return; }
        const button = document.getElementById('saveUserButton');
        const label = button.textContent;
        button.textContent = id ? 'Saving...' : 'Creating...';
        button.disabled = true;
        try{
            if(id){
                await NexoraAdmin.apiPut(`/api/admin/users/${encodeURIComponent(id)}`, payload);
                notify('User updated successfully.');
            } else {
                payload.password = userPassword.value.trim();
                await NexoraAdmin.apiPost('/api/admin/users', payload);
                notify('User added successfully.');
            }
            closeModal();
            await loadUsers();
        }catch(err){
            notify(err.message || 'Unable to save user.', 'error');
        }finally{
            button.disabled = false;
            button.textContent = label;
        }
    });

    await loadUsers();
});
