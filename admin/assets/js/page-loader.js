/*
 * admin/assets/js/page-loader.js
 * Automatically load page-specific scripts based on the current HTML page.
 */

(function(){
    const pageName = location.pathname.split('/').pop().replace('.html','');

    const scriptMap = {
        activity: 'activity.js',
        analytics: 'analytics.js',
        blog: 'blog.js',
        dashboard: 'dashboard.js',
        gallery: 'gallery.js',
        messages: 'messages.js',
        profile: 'profile.js',
        projects: 'projects.js',
        quotations: 'quotations.js',
        services: 'services.js',
        settings: 'settings.js',
        testimonials: 'testimonials.js',
        users: 'users.js',
        requirements: 'requirements.js'
    };

    const scriptFile = scriptMap[pageName];
    if(!scriptFile){
        console.log(`page-loader: no script mapped for page '${pageName}'`);
        return;
    }

    const scriptSrc = `../assets/js/${scriptFile}`;
    const scriptEl = document.createElement('script');
    scriptEl.src = scriptSrc;
    scriptEl.defer = true;
    scriptEl.addEventListener('error', ()=>{
        console.error(`page-loader: failed to load ${scriptSrc}`);
    });
    document.body.appendChild(scriptEl);
    console.log(`page-loader: loaded ${scriptFile}`);
})();
