(function(){

    function q(selector, root = document){
        return root.querySelector(selector);
    }

    function qAll(selector, root = document){
        return Array.from(root.querySelectorAll(selector));
    }

    function onComponentsReady(callback){
        if(document.getElementById('sidebar') && document.querySelector('.navbar')){
            callback();
            return;
        }

        document.addEventListener('componentLoaded', () => {
            if(document.getElementById('sidebar') && document.querySelector('.navbar')){
                callback();
            }
        });
    }

    function showToast(message, type = 'info'){
        const existing = document.getElementById('admin-toast-container');
        let container = existing;

        if(!container){
            container = document.createElement('div');
            container.id = 'admin-toast-container';
            container.style.position = 'fixed';
            container.style.top = '16px';
            container.style.right = '16px';
            container.style.zIndex = 9999;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.background = type === 'error' ? '#c33' : type === 'success' ? '#15803d' : '#333';
        toast.style.color = '#fff';
        toast.style.padding = '10px 14px';
        toast.style.marginTop = '8px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        toast.style.opacity = '1';
        toast.style.transition = 'opacity 300ms ease';

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 350);
        }, 3000);
    }

    function getAuthToken(){
        try{ return localStorage.getItem('nexora-token') || ''; }
        catch(e){ return ''; }
    }

    function buildHeaders(options = {}){
        const headers = new Headers();
        if(options.json !== false){ headers.set('Content-Type', 'application/json'); }
        const token = getAuthToken();
        if(token) headers.set('Authorization', `Bearer ${token}`);
        return headers;
    }

    async function apiRequest(path, { method = 'GET', body = null, json = true } = {}){
        const opts = { method, headers: buildHeaders({ json }) };
        if(body !== null){
            opts.body = json ? JSON.stringify(body) : body;
        }
        const response = await fetch(path, opts);
        const text = await response.text();
        let data = {};
        if(text){
            try{
                data = JSON.parse(text);
            }catch(e){
                // If response is not JSON (e.g., HTML error page), create a safe error object
                if(text.includes('<html') || text.includes('<!DOCTYPE')){
                    data = { message: `Server error (${response.status}). Please try again.` };
                } else {
                    data = { message: text };
                }
            }
        }
        if(!response.ok){
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }
        return data;
    }

    async function apiGet(path){
        return apiRequest(path, { method:'GET' });
    }

    async function apiPost(path, body, json = true){
        return apiRequest(path, { method:'POST', body, json });
    }

    async function apiPut(path, body, json = true){
        return apiRequest(path, { method:'PUT', body, json });
    }

    async function apiDelete(path){
        return apiRequest(path, { method:'DELETE' });
    }

    function formatDateTime(value){
        if(!value) return '—';
        const date = new Date(value);
        return date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    }

    window.NexoraAdmin = window.NexoraAdmin || {};
    Object.assign(window.NexoraAdmin, {
        q,
        qAll,
        onComponentsReady,
        showToast,
        apiRequest,
        apiGet,
        apiPost,
        apiPut,
        apiDelete,
        formatDateTime
    });

})();
