/* admin/assets/js/settings.js */
NexoraAdmin.onComponentsReady(async () => {
    console.log('settings.js initialized');

    const content = document.querySelector('.dashboard-content');
    if(!content) return;

    const pageHtml = `
        <section class="card shadow-md">
            <div class="page-header">
                <div>
                    <h2>Settings</h2>
                    <p class="page-description">Configure application settings, contacts, email, security and appearance.</p>
                </div>
            </div>
            <form id="settingsForm" class="settings-form">
                <div class="settings-group card shadow-sm">
                    <h3>Company Information</h3>
                    <div class="grid grid-2 gap-20">
                        <div class="form-group">
                            <label>Company Name</label>
                            <input id="companyName" type="text" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Tagline</label>
                            <input id="companyTagline" type="text" class="input-field" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <input id="companyAddress" type="text" class="input-field" />
                    </div>
                </div>

                <div class="settings-group card shadow-sm">
                    <h3>Website Settings</h3>
                    <div class="grid grid-2 gap-20">
                        <div class="form-group">
                            <label>Site Title</label>
                            <input id="siteTitle" type="text" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Site Tagline</label>
                            <input id="siteTagline" type="text" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Timezone</label>
                            <input id="siteTimezone" type="text" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Language</label>
                            <input id="siteLanguage" type="text" class="input-field" />
                        </div>
                    </div>
                </div>

                <div class="settings-group card shadow-sm">
                    <h3>Contact Information</h3>
                    <div class="grid grid-2 gap-20">
                        <div class="form-group">
                            <label>Phone</label>
                            <input id="contactPhone" type="text" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input id="contactEmail" type="email" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Support Hours</label>
                            <input id="contactHours" type="text" class="input-field" />
                        </div>
                    </div>
                </div>

                <div class="settings-group card shadow-sm">
                    <h3>Social Media Links</h3>
                    <div class="grid grid-2 gap-20">
                        <div class="form-group">
                            <label>Instagram</label>
                            <input id="socialInstagram" type="url" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Facebook</label>
                            <input id="socialFacebook" type="url" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>LinkedIn</label>
                            <input id="socialLinkedin" type="url" class="input-field" />
                        </div>
                    </div>
                </div>

                <div class="settings-group card shadow-sm">
                    <h3>Email (SMTP) Configuration</h3>
                    <div class="grid grid-2 gap-20">
                        <div class="form-group">
                            <label>SMTP Host</label>
                            <input id="smtpHost" type="text" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>SMTP Port</label>
                            <input id="smtpPort" type="number" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Secure Connection</label>
                            <select id="smtpSecure" class="input-field">
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Sender Email</label>
                            <input id="smtpSender" type="email" class="input-field" />
                        </div>
                    </div>
                </div>

                <div class="settings-group card shadow-sm">
                    <h3>Security Settings</h3>
                    <div class="grid grid-2 gap-20">
                        <div class="form-group">
                            <label>Session Timeout (minutes)</label>
                            <input id="securityTimeout" type="number" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Require 2FA</label>
                            <select id="security2FA" class="input-field">
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label>Password Policy</label>
                            <input id="securityPolicy" type="text" class="input-field" />
                        </div>
                    </div>
                </div>

                <div class="settings-group card shadow-sm">
                    <h3>Theme & Appearance</h3>
                    <div class="grid grid-2 gap-20">
                        <div class="form-group">
                            <label>Primary Color</label>
                            <input id="themePrimary" type="color" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Theme</label>
                            <select id="themeMode" class="input-field">
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Logo URL</label>
                            <input id="logoUrl" type="text" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Favicon URL</label>
                            <input id="faviconUrl" type="text" class="input-field" />
                        </div>
                    </div>
                </div>

                <div class="settings-group card shadow-sm">
                    <h3>Backup & Restore</h3>
                    <div class="form-group">
                        <button id="downloadBackup" type="button" class="btn btn-secondary">Export Settings</button>
                        <button id="restoreBackup" type="button" class="btn btn-secondary">Restore Settings</button>
                        <input id="restoreFile" type="file" accept="application/json" class="input-field hidden" />
                    </div>
                </div>

                <div class="form-actions d-flex justify-between align-center gap-10">
                    <button id="resetSettings" type="button" class="btn btn-secondary">Reset</button>
                    <button type="submit" class="btn btn-primary">Save Settings</button>
                </div>
            </form>
        </section>
        <style>
            .settings-form{display:flex;flex-direction:column;gap:22px;}
            .settings-group{padding:22px;background:var(--surface);border-radius:18px;}
            .form-group{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
            .input-field{width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:#fff;}
            .full-width{grid-column:span 2;}
            .form-actions{padding:22px;background:var(--surface);border-radius:18px;}
            .btn{border-radius:10px;padding:10px 16px;}
            .btn-primary{background:var(--primary);color:#fff;}
            .btn-secondary{background:#f3f1eb;color:var(--secondary);}
            @media(max-width:992px){.grid-2{grid-template-columns:1fr;}.full-width{grid-column:auto;}}
        </style>
    `;

    content.insertAdjacentHTML('beforeend', pageHtml);

    const settingsForm = document.getElementById('settingsForm');
    const fields = {
        companyName: document.getElementById('companyName'),
        companyTagline: document.getElementById('companyTagline'),
        companyAddress: document.getElementById('companyAddress'),
        siteTitle: document.getElementById('siteTitle'),
        siteTagline: document.getElementById('siteTagline'),
        siteTimezone: document.getElementById('siteTimezone'),
        siteLanguage: document.getElementById('siteLanguage'),
        contactPhone: document.getElementById('contactPhone'),
        contactEmail: document.getElementById('contactEmail'),
        contactHours: document.getElementById('contactHours'),
        socialInstagram: document.getElementById('socialInstagram'),
        socialFacebook: document.getElementById('socialFacebook'),
        socialLinkedin: document.getElementById('socialLinkedin'),
        smtpHost: document.getElementById('smtpHost'),
        smtpPort: document.getElementById('smtpPort'),
        smtpSecure: document.getElementById('smtpSecure'),
        smtpSender: document.getElementById('smtpSender'),
        securityTimeout: document.getElementById('securityTimeout'),
        security2FA: document.getElementById('security2FA'),
        securityPolicy: document.getElementById('securityPolicy'),
        themePrimary: document.getElementById('themePrimary'),
        themeMode: document.getElementById('themeMode'),
        logoUrl: document.getElementById('logoUrl'),
        faviconUrl: document.getElementById('faviconUrl')
    };
    const downloadBackup = document.getElementById('downloadBackup');
    const restoreBackup = document.getElementById('restoreBackup');
    const restoreFile = document.getElementById('restoreFile');
    const resetSettings = document.getElementById('resetSettings');

    let initialSettings = {};

    function populate(data){
        if(!data) return;
        initialSettings = JSON.parse(JSON.stringify(data));
        const company = data.companyInformation || {};
        const website = data.websiteSettings || {};
        const contact = data.contactInformation || {};
        const social = data.socialMedia || {};
        const smtp = data.smtp || {};
        const security = data.security || {};
        const appearance = data.appearance || {};

        fields.companyName.value = company.name || '';
        fields.companyTagline.value = company.tagline || '';
        fields.companyAddress.value = company.address || '';
        fields.siteTitle.value = website.siteTitle || '';
        fields.siteTagline.value = website.tagline || '';
        fields.siteTimezone.value = website.timezone || '';
        fields.siteLanguage.value = website.language || '';
        fields.contactPhone.value = contact.phone || '';
        fields.contactEmail.value = contact.email || '';
        fields.contactHours.value = contact.supportHours || '';
        fields.socialInstagram.value = social.instagram || '';
        fields.socialFacebook.value = social.facebook || '';
        fields.socialLinkedin.value = social.linkedin || '';
        fields.smtpHost.value = smtp.host || '';
        fields.smtpPort.value = smtp.port || '';
        fields.smtpSecure.value = smtp.secure ? 'true' : 'false';
        fields.smtpSender.value = smtp.senderEmail || '';
        fields.securityTimeout.value = security.sessionTimeout || 30;
        fields.security2FA.value = security.require2FA ? 'true' : 'false';
        fields.securityPolicy.value = security.passwordPolicy || '';
        fields.themePrimary.value = appearance.primaryColor || '#c89445';
        fields.themeMode.value = appearance.theme || 'dark';
        fields.logoUrl.value = appearance.logoUrl || '';
        fields.faviconUrl.value = appearance.faviconUrl || '';
    }

    async function loadSettings(){
        try{
            const res = await NexoraAdmin.apiGet('/api/admin/settings');
            populate(res.item || {});
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Unable to load settings.', 'error');
        }
    }

    async function saveSettings(){
        const payload = {
            companyInformation: {
                name: fields.companyName.value.trim(),
                tagline: fields.companyTagline.value.trim(),
                address: fields.companyAddress.value.trim()
            },
            websiteSettings: {
                siteTitle: fields.siteTitle.value.trim(),
                tagline: fields.siteTagline.value.trim(),
                timezone: fields.siteTimezone.value.trim(),
                language: fields.siteLanguage.value.trim()
            },
            contactInformation: {
                phone: fields.contactPhone.value.trim(),
                email: fields.contactEmail.value.trim(),
                supportHours: fields.contactHours.value.trim()
            },
            socialMedia: {
                instagram: fields.socialInstagram.value.trim(),
                facebook: fields.socialFacebook.value.trim(),
                linkedin: fields.socialLinkedin.value.trim()
            },
            smtp: {
                host: fields.smtpHost.value.trim(),
                port: Number(fields.smtpPort.value) || 465,
                secure: fields.smtpSecure.value === 'true',
                senderEmail: fields.smtpSender.value.trim()
            },
            security: {
                sessionTimeout: Number(fields.securityTimeout.value) || 30,
                require2FA: fields.security2FA.value === 'true',
                passwordPolicy: fields.securityPolicy.value.trim()
            },
            appearance: {
                theme: fields.themeMode.value,
                primaryColor: fields.themePrimary.value,
                logoUrl: fields.logoUrl.value.trim(),
                faviconUrl: fields.faviconUrl.value.trim()
            }
        };
        try{
            await NexoraAdmin.apiPut('/api/admin/settings', payload);
            initialSettings = JSON.parse(JSON.stringify(payload));
            NexoraAdmin.showToast('Settings saved successfully.');
        }catch(err){
            NexoraAdmin.showToast(err.message || 'Unable to save settings.', 'error');
        }
    }

    function resetForm(){
        populate(initialSettings);
        NexoraAdmin.showToast('Settings reset to last saved values.');
    }

    function exportSettings(){
        const data = new Blob([JSON.stringify(initialSettings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(data);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'nexora-settings.json';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        NexoraAdmin.showToast('Settings exported.');
    }

    function restoreSettings(){
        if(!restoreFile.files.length){
            NexoraAdmin.showToast('Choose a JSON file to restore.', 'error');
            return;
        }
        const file = restoreFile.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            try{
                const data = JSON.parse(e.target.result);
                populate(data);
                NexoraAdmin.showToast('Settings file restored into the form. Save to apply.');
            }catch(err){
                NexoraAdmin.showToast('Invalid settings file.', 'error');
            }
        };
        reader.readAsText(file);
    }

    settingsForm.addEventListener('submit', async (e) => { e.preventDefault(); await saveSettings(); });
    resetSettings.addEventListener('click', (e) => { e.preventDefault(); resetForm(); });
    downloadBackup.addEventListener('click', exportSettings);
    restoreBackup.addEventListener('click', () => restoreFile.click());
    restoreFile.addEventListener('change', restoreSettings);

    await loadSettings();
});
