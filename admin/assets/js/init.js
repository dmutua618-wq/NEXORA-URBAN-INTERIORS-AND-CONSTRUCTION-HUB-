/*
 * admin/assets/js/init.js
 * Initialize behaviors after shared components load
 */

(function(){

    const loaded = new Set();

    function onComponentLoaded(detail){
        loaded.add(detail.id);
        console.log('init.js: componentLoaded', detail.id);
        if(loaded.has('sidebar')) setupSidebar();
        if(loaded.has('navbar')) setupNavbar();
    }

    function onComponentFailed(detail){
        console.warn('init.js: componentLoadFailed', detail);
        showToast(`Failed to load ${detail.id}`, 'error');
    }

    // Basic toast for notifications
    function showToast(message, type = 'info'){
        try{
            const existing = document.getElementById('admin-toast-container');
            let container = existing;
            if(!container){
                container = document.createElement('div');
                container.id = 'admin-toast-container';
                container.style.position = 'fixed';
                container.style.right = '16px';
                container.style.top = '16px';
                container.style.zIndex = 9999;
                document.body.appendChild(container);
            }

            const t = document.createElement('div');
            t.textContent = message;
            t.style.background = type === 'error' ? '#c33' : '#333';
            t.style.color = '#fff';
            t.style.padding = '8px 12px';
            t.style.marginTop = '8px';
            t.style.borderRadius = '6px';
            t.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

            container.appendChild(t);

            setTimeout(()=>{
                t.style.transition = 'opacity 300ms';
                t.style.opacity = '0';
                setTimeout(()=> t.remove(), 350);
            }, 3000);

        }catch(e){ console.error(e); }
    }

    // Sidebar behaviours
    function setupSidebar(){
        try{
            const sidebarEl = document.getElementById('sidebar');
            if(!sidebarEl) return;

            // Menu toggle (in navbar) - delegated: button with id menuToggle
            const menuToggle = document.getElementById('menuToggle');
            if(menuToggle){
                menuToggle.addEventListener('click', ()=>{
                    sidebarEl.classList.toggle('collapsed');
                    menuToggle.querySelector('i')?.classList.toggle('fa-rotate-90');
                });
            }

            const collapseBtn = document.getElementById('collapseSidebar');
            if(collapseBtn){
                collapseBtn.addEventListener('click', ()=>{
                    sidebarEl.classList.toggle('collapsed');
                });
            }

            // Highlight active nav link
            const links = sidebarEl.querySelectorAll('.nav-link');
            const path = location.pathname.split('/').pop();
            links.forEach(a => {
                try{
                    const href = a.getAttribute('href') || '';
                    if(href.endsWith(path)){
                        a.classList.add('active');
                    }
                    a.addEventListener('click', ()=>{
                        links.forEach(x=>x.classList.remove('active'));
                        a.classList.add('active');
                    });
                }catch(e){}
            });

            // Logout button
            const logoutBtn = sidebarEl.querySelector('.logout-btn');
            if(logoutBtn){
                logoutBtn.addEventListener('click', ()=> doLogout());
            }

        }catch(e){ console.error('setupSidebar', e); }
    }

    function applyTheme(isDark){
        const root = document.documentElement;
        const body = document.body;

        root.classList.toggle('dark', isDark);
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        body?.classList.toggle('dark', isDark);
        body?.setAttribute('data-theme', isDark ? 'dark' : 'light');

        document.querySelectorAll('.theme-toggle').forEach((toggle)=>{
            const icon = toggle.querySelector('i');
            if(icon){
                icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            }
            toggle.setAttribute('aria-pressed', String(isDark));
            toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        });
    }

    function handleThemeToggleClick(event){
        const toggle = event.target.closest('.theme-toggle');
        if(!toggle) return;

        event.preventDefault();
        const isDark = !document.documentElement.classList.contains('dark');
        applyTheme(isDark);
        try{ localStorage.setItem('nexora-theme', isDark ? 'dark' : 'light'); }catch(e){}
    }

    // Navbar behaviours
    function setupNavbar(){
        try{
            const navbar = document.querySelector('.navbar') || document.getElementById('navbar');
            if(!navbar) return;

            // Apply saved theme
            const saved = localStorage.getItem('nexora-theme');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(saved ? saved === 'dark' : prefersDark);

            // Profile dropdown
            const profileBtn = navbar.querySelector('.profile-btn');
            if(profileBtn){
                const dropdown = navbar.querySelector('.profile-dropdown');
                profileBtn.addEventListener('click', (e)=>{
                    dropdown?.classList.toggle('visible');
                });
                // logout inside dropdown
                const logoutDrop = navbar.querySelector('.logout-dropdown');
                if(logoutDrop) logoutDrop.addEventListener('click', ()=> doLogout());
            }

            // direct navbar logout button
            const logoutButton = navbar.querySelector('.logout-button');
            if(logoutButton){
                logoutButton.addEventListener('click', ()=> doLogout());
            }

            // Search box
            const search = navbar.querySelector('#globalSearch');
            if(search){
                let timer;
                search.addEventListener('input', ()=>{
                    clearTimeout(timer);
                    timer = setTimeout(()=>{
                        const query = search.value.trim();
                        const event = new CustomEvent('globalSearch', { detail: { query } });
                        document.dispatchEvent(event);
                        console.log('Global search triggered:', query);
                        showToast(query ? `Searching for '${query}'...` : 'Search cleared.');
                    }, 300);
                });
            }

            // Notifications
            const notifBtn = navbar.querySelector('.notification-btn');
            if(notifBtn){
                notifBtn.addEventListener('click', ()=>{
                    const badge = notifBtn.querySelector('.badge');
                    if(badge) badge.textContent = '0';
                    let panel = navbar.querySelector('.notifications-panel');
                    if(!panel){
                        panel = document.createElement('div');
                        panel.className = 'notifications-panel';
                        panel.style.position = 'absolute';
                        panel.style.right = '16px';
                        panel.style.top = '60px';
                        panel.style.width = '320px';
                        panel.style.maxHeight = '420px';
                        panel.style.overflowY = 'auto';
                        panel.style.background = '#fff';
                        panel.style.border = '1px solid rgba(0,0,0,.12)';
                        panel.style.boxShadow = '0 16px 40px rgba(0,0,0,.12)';
                        panel.style.borderRadius = '16px';
                        panel.style.padding = '14px';
                        panel.style.zIndex = '9999';
                        panel.innerHTML = `
                            <strong>Notifications</strong>
                            <p class="small-text">No new notifications right now.</p>
                        `;
                        navbar.appendChild(panel);
                    }
                    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
                });
            }

        }catch(e){ console.error('setupNavbar', e); }
    }

    function doLogout(){
        try{
            // Clear auth state and redirect to login
            try{ localStorage.removeItem('nexora-token'); }catch(e){}
            try{ localStorage.removeItem('nexora-user'); }catch(e){}
            location.href = '../login.html';
        }catch(e){ console.error(e); }
    }

    // Listen for component events
    document.addEventListener('componentLoaded', (ev)=> onComponentLoaded(ev.detail));
    document.addEventListener('componentLoadFailed', (ev)=> onComponentFailed(ev.detail));
    document.addEventListener('click', handleThemeToggleClick);

    // Defensive: if components already in DOM (in case components loaded before this script), attempt setup
    window.addEventListener('load', ()=>{
        if(document.getElementById('sidebar')) setupSidebar();
        if(document.querySelector('.navbar')) setupNavbar();
    });

})();
