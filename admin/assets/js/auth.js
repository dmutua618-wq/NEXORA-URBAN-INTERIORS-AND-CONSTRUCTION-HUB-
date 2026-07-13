/*
 * admin/assets/js/auth.js
 * Simple login guard for admin pages with client-side confirmation and hashing.
 */

(function(){
    const loginPath = location.pathname.endsWith('login.html');

    const storageKeys = {
        token: 'nexora-token',
        currentUser: 'nexora-user',
        accounts: 'nexora-admin-users'
    };

    function isLoggedIn(){
        try{
            return Boolean(localStorage.getItem(storageKeys.token));
        }catch(e){
            return false;
        }
    }

    function getAuthHeader(){
        try{
            const token = localStorage.getItem(storageKeys.token);
            return token ? `Bearer ${token}` : '';
        }catch(e){
            return '';
        }
    }

    function requestJson(path, body){
        const authHeader = getAuthHeader();
        const base = window.__NEXORA_API_BASE__ || '';
        const url = (path.startsWith('http') || path.startsWith('//')) ? path : (base ? base + path : path);
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { 'Authorization': authHeader } : {})
            },

            body: JSON.stringify(body)
        })

        .then(async (res) => {
            const payload = await res.json().catch(() => ({}));
            if(!res.ok){
                throw new Error(payload.message || 'Request failed.');
            }
            return payload;
        });
    }

    function redirectToLogin(){
        if(!loginPath){
            location.href = '../login.html';
        }
    }

    function protectPage(){
        if(loginPath) return;
        if(!isLoggedIn()){
            redirectToLogin();
        }
    }

    async function loginUser(email, password){
        const data = await requestJson('/api/login', { email, password });
        localStorage.setItem(storageKeys.token, data.token);
        localStorage.setItem(storageKeys.currentUser, JSON.stringify(data.user));
        return data;
    }


    function getApiBase(){
        return window.__NEXORA_API_BASE__ || '';
    }

    async function registerUser(name, email, password){
        return requestJson('/api/register', { name, email, password });
    }

    async function confirmAccount(email, code){
        return requestJson('/api/confirm', { email, code });
    }

    async function forgotPassword(email){
        return requestJson('/api/forgot-password', { email });
    }

    async function resetPassword(email, code, newPassword){
        return requestJson('/api/reset-password', { email, code, newPassword });
    }

    function logout(){
        localStorage.removeItem(storageKeys.token);
        localStorage.removeItem(storageKeys.currentUser);
    }

    function initLoginForm(){
        if(!loginPath) return;

        // Intentionally do not auto-redirect logged-in users to the dashboard.
        // The login page should always prompt for explicit login or account creation.
    }

    document.addEventListener('DOMContentLoaded', ()=>{
        if(loginPath){
            initLoginForm();
            return;
        }
        protectPage();
    });

    window.NexoraAuth = {
        isLoggedIn,
        loginUser,
        registerUser,
        confirmAccount,
        logout,
        forgotPassword,
        resetPassword
    };

})();
