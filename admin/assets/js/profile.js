/* admin/assets/js/profile.js */
NexoraAdmin.onComponentsReady(async () => {
    console.log('profile.js initialized');

    const content = document.querySelector('.dashboard-content');
    if(!content) return;

    const pageHtml = `
        <section class="grid grid-3 gap-20">
            <div class="card shadow-md">
                <h2>Profile Overview</h2>
                <p class="page-description">Update your profile details, upload your photo, and review recent account activity.</p>
                <div class="profile-box d-flex flex-column align-center text-center gap-16">
                    <div class="profile-avatar" id="profileAvatarWrapper">
                        <img id="profileAvatar" src="" alt="Profile photo" />
                    </div>
                    <input id="profilePhoto" type="file" accept="image/*" class="input-field" />
                    <button id="uploadPhotoBtn" class="btn btn-secondary">Upload Photo</button>
                </div>
            </div>
            <div class="card shadow-md grid grid-1 gap-16">
                <div>
                    <h3>Account Summary</h3>
                    <p class="page-description">Current profile status and login details.</p>
                </div>
                <div class="detail-row"><strong>Role</strong><span id="profileRole">—</span></div>
                <div class="detail-row"><strong>Last Login</strong><span id="profileLastLogin">—</span></div>
                <div class="detail-row"><strong>Location</strong><span id="profileLocation">—</span></div>
                <div class="detail-row"><strong>Timezone</strong><span id="profileTimezone">—</span></div>
            </div>
            <div class="card shadow-md">
                <h3>Recent Activity</h3>
                <ul id="activityList" class="activity-list"></ul>
            </div>
        </section>

        <section class="card shadow-md">
            <div class="page-header">
                <div>
                    <h2>Edit Profile</h2>
                    <p class="page-description">Save your updated profile and account settings.</p>
                </div>
            </div>
            <form id="profileForm" class="grid grid-2 gap-20">
                <div class="form-group">
                    <label>Full Name</label>
                    <input id="inputName" type="text" class="input-field" required />
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input id="inputEmail" type="email" class="input-field" required />
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input id="inputPhone" type="tel" class="input-field" />
                </div>
                <div class="form-group">
                    <label>Position / Role</label>
                    <input id="inputPosition" type="text" class="input-field" />
                </div>
                <div class="form-group grid grid-2 gap-20">
                    <div>
                        <label>New Password</label>
                        <input id="inputPassword" type="password" class="input-field" />
                    </div>
                    <div>
                        <label>Confirm Password</label>
                        <input id="inputPasswordConfirm" type="password" class="input-field" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Save Changes</label>
                    <div class="d-flex gap-10 wrap">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" id="resetProfile" class="btn btn-secondary">Reset</button>
                    </div>
                </div>
            </form>
        </section>

        <style>
            .profile-box{padding:24px;border-radius:18px;background:var(--surface);}
            .profile-avatar{width:128px;height:128px;border-radius:50%;overflow:hidden;border:4px solid rgba(200,148,69,.2);}
            .profile-avatar img{width:100%;height:100%;object-fit:cover;}
            .detail-row{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.06);}
            .activity-list{list-style:none;padding:0;margin:0;}
            .activity-list li{display:flex;justify-content:space-between;padding:14px 16px;border:1px solid rgba(0,0,0,.06);border-radius:14px;margin-bottom:10px;background:#fff;}
            .activity-list li strong{font-size:.95rem;}
            .card{padding:24px;background:var(--surface);border-radius:18px;}
            .grid-1{grid-template-columns:1fr;}
            .grid-2{grid-template-columns:repeat(2,minmax(0,1fr));}
            .input-field{width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:#fff;}
            .btn{border-radius:10px;padding:10px 16px;}
            .btn-primary{background:var(--primary);color:#fff;}
            .btn-secondary{background:#f3f1eb;color:var(--secondary);}
            @media(max-width:992px){.grid-2{grid-template-columns:1fr;}}
        </style>
    `;

    content.insertAdjacentHTML('beforeend', pageHtml);

    const profileAvatar = document.getElementById('profileAvatar');
    const profilePhoto = document.getElementById('profilePhoto');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const profileRole = document.getElementById('profileRole');
    const profileLastLogin = document.getElementById('profileLastLogin');
    const profileLocation = document.getElementById('profileLocation');
    const profileTimezone = document.getElementById('profileTimezone');
    const activityList = document.getElementById('activityList');
    const profileForm = document.getElementById('profileForm');
    const inputName = document.getElementById('inputName');
    const inputEmail = document.getElementById('inputEmail');
    const inputPhone = document.getElementById('inputPhone');
    const inputPosition = document.getElementById('inputPosition');
    const inputPassword = document.getElementById('inputPassword');
    const inputPasswordConfirm = document.getElementById('inputPasswordConfirm');
    const resetProfile = document.getElementById('resetProfile');

    let profileData = {};

    function renderProfile(){
        profileAvatar.src = profileData.photoUrl || '/assets/nexora-logo.jpeg';
        profileRole.textContent = profileData.role || 'Administrator';
        profileLastLogin.textContent = NexoraAdmin.formatDateTime(profileData.lastLogin);
        profileLocation.textContent = profileData.location || 'Nairobi, Kenya';
        profileTimezone.textContent = profileData.timezone || 'EAT';
        inputName.value = profileData.name || '';
        inputEmail.value = profileData.email || '';
        inputPhone.value = profileData.phone || '';
        inputPosition.value = profileData.position || '';
        activityList.innerHTML = (profileData.activity || []).map(item => `
            <li><span>${item.title}</span><strong>${NexoraAdmin.formatDateTime(item.time)}</strong></li>
        `).join('') || '<li>No activity yet.</li>';
    }

    async function loadProfile(){
        try{
            const result = await NexoraAdmin.apiGet('/api/admin/profile');
            profileData = result.item || {};
            renderProfile();
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Unable to load profile.', 'error');
        }
    }

    async function saveProfile(){
        const updated = {
            ...profileData,
            name: inputName.value.trim(),
            email: inputEmail.value.trim(),
            phone: inputPhone.value.trim(),
            position: inputPosition.value.trim(),
            photoUrl: profileData.photoUrl
        };
        if(!updated.name || !updated.email){
            NexoraAdmin.showToast('Name and email are required.', 'error');
            return;
        }
        if(inputPassword.value || inputPasswordConfirm.value){
            if(inputPassword.value !== inputPasswordConfirm.value){
                NexoraAdmin.showToast('Passwords do not match.', 'error');
                return;
            }
            updated.passwordChangedAt = new Date().toISOString();
        }
        try{
            await NexoraAdmin.apiPut('/api/admin/profile', updated);
            profileData = updated;
            renderProfile();
            NexoraAdmin.showToast('Profile saved successfully.');
            inputPassword.value = '';
            inputPasswordConfirm.value = '';
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Unable to save profile.', 'error');
        }
    }

    async function uploadPhoto(){
        if(!profilePhoto.files.length){
            NexoraAdmin.showToast('Choose an image first.', 'error');
            return;
        }
        const file = profilePhoto.files[0];
        const formData = new FormData();
        formData.append('file', file);
        try{
            const res = await NexoraAdmin.apiPost('/api/admin/upload', formData, false);
            profileData.photoUrl = res.url;
            profileAvatar.src = res.url;
            NexoraAdmin.showToast('Photo uploaded successfully.');
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Upload failed.', 'error');
        }
    }

    profileForm.addEventListener('submit', async (e) => { e.preventDefault(); await saveProfile(); });
    resetProfile.addEventListener('click', (e) => { e.preventDefault(); renderProfile(); inputPassword.value = ''; inputPasswordConfirm.value = ''; });
    uploadPhotoBtn.addEventListener('click', async (e) => { e.preventDefault(); await uploadPhoto(); });

    await loadProfile();
});
