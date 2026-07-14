/**
 * ==========================================================
 * NEXORA ADMIN PANEL
 * Login Page Script
 * ==========================================================
 * Purpose:
 * - Form validation
 * - Show / Hide password
 * - Prepare login request for backend authentication
 *
 * Backend Integration:
 * Node.js + Express.js + MongoDB + JWT
 * ==========================================================
 */

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.querySelector(".login-form");
    const registerForm = document.querySelector(".register-form");
    const authTabs = document.querySelectorAll(".auth-tab");
    const switchToRegister = document.querySelector(".switch-to-register");
    const switchToLogin = document.querySelector(".switch-to-login");

    const passwordToggles = document.querySelectorAll(".password-box i");

    function togglePassword(input, icon) {
        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    }

    function activateMode(mode) {
        document.querySelectorAll(".auth-card form").forEach((form) => {
            form.classList.toggle("active", form.dataset.mode === mode);
        });

        authTabs.forEach((tab) => {
            tab.classList.toggle("active", tab.dataset.target === mode);
        });
    }

    authTabs.forEach((tab) => {
        tab.addEventListener("click", () => activateMode(tab.dataset.target));
    });

    if (switchToRegister) {
        switchToRegister.addEventListener("click", (event) => {
            event.preventDefault();
            activateMode("register");
        });
    }

    const forgotPasswordLink = document.getElementById('forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (event) => {
            event.preventDefault();
            showConfirmationModal('Enter your admin email address to receive a reset code:').then(email => {
                if(!email) return;
                (async function doForgot(){
                    try{
                        const res = await NexoraAuth.forgotPassword(email.trim());
                        if(res && res.ok){
                            // In production do not expose reset codes. Show a generic instruction to the user.
                            alert('If your email is configured, a reset code has been sent. If you do not receive it, contact the system administrator.');
                            const code = await showConfirmationModal('Enter the reset code you received via email:');
                            if(!code) return;
                            const newPass = await showConfirmationModal('Enter your new password (min 6 chars):', false);
                            if(!newPass) return;
                            const reset = await NexoraAuth.resetPassword(email.trim(), code.trim(), newPass);
                            if(reset && reset.token){
                                localStorage.setItem('nexora-token', reset.token);
                                localStorage.setItem('nexora-user', JSON.stringify(reset.user));
                                alert('Password has been reset and you are now logged in.');
                                location.href = 'pages/dashboard.html';
                            } else {
                                alert('Password reset completed. Please login with your new password.');
                            }
                        }else{
                            alert('Unable to process reset request.');
                        }
                    }catch(e){
                        console.error(e);
                        alert(e?.message || 'Password reset failed.');
                    }
                })();
            });
        });
    }

    function showConfirmationModal(message, isCode = true) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmationModal');
            const input = document.getElementById('confirmationCodeInput');
            const submitBtn = document.getElementById('confirmationSubmit');
            const cancelBtn = document.getElementById('confirmationCancel');

            if (!modal) {
                alert('Modal not found. ' + message);
                resolve(null);
                return;
            }

            input.value = '';
            input.placeholder = isCode ? 'Enter code' : 'Enter value';
            input.type = isCode ? 'text' : 'password';

            // Update the message in the modal
            const messageEl = modal.querySelector('p');
            if (messageEl) messageEl.textContent = message;

            const handleSubmit = () => {
                const value = input.value.trim();
                cleanup();
                resolve(value);
            };

            const handleCancel = () => {
                cleanup();
                resolve(null);
            };

            const handleKeyPress = (e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') handleCancel();
            };

            const cleanup = () => {
                submitBtn.removeEventListener('click', handleSubmit);
                cancelBtn.removeEventListener('click', handleCancel);
                input.removeEventListener('keypress', handleKeyPress);
                modal.style.display = 'none';
            };

            submitBtn.addEventListener('click', handleSubmit);
            cancelBtn.addEventListener('click', handleCancel);
            input.addEventListener('keypress', handleKeyPress);

            modal.style.display = 'flex';
            input.focus();
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener("click", (event) => {
            event.preventDefault();
            activateMode("login");
        });
    }

    passwordToggles.forEach((toggle) => {
        const input = toggle.closest(".password-box")?.querySelector("input");
        if (!input) return;
        toggle.addEventListener("click", () => togglePassword(input, toggle));
    });

    (async function enforceAdminLimit(){
        try{
            const response = await fetch('/api/registration-status');
            if(!response.ok) return;
            const result = await response.json();
            if(result.open === false){
                if(registerForm){
                    registerForm.innerHTML = '<h2>Administrator Registration Restricted</h2>' +
                        '<p class="access-denied">Access denied. Administrator registration is restricted. Please contact the system administrator if you require administrator access.</p>';
                }
                if(switchToRegister){
                    switchToRegister.style.display = 'none';
                }
                authTabs.forEach((tab) => {
                    if(tab.dataset.target === 'register') tab.style.display = 'none';
                });
            }
        }catch(e){
            console.warn('Could not enforce admin limit:', e);
        }
    })();

    async function handleLogin(event) {
        event.preventDefault();
        console.log('[NEXORA] handleLogin fired', { path: location.pathname });
        const emailInput = loginForm.querySelector('input[type="email"]');
        const passwordInput = loginForm.querySelector('input[type="password"]');
        const loginButton = loginForm.querySelector("button");

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email) {
            alert("Please enter your email address.");
            emailInput.focus();
            return;
        }

        if (!password) {
            alert("Please enter your password.");
            passwordInput.focus();
            return;
        }

        try {
            await NexoraAuth.loginUser(email, password);
            location.href = 'pages/dashboard.html';
        } catch (error) {
            console.error(error);
            alert(error?.message || "Unable to process your request.");
        }
    }

    async function handleRegister(event) {
        event.preventDefault();

        const inputs = registerForm.querySelectorAll('input');
        if (inputs.length < 4) {
            alert('Form error: not all fields found. Please refresh and try again.');
            return;
        }
        
        const nameInput = inputs[0];
        const emailInput = inputs[1];
        const passwordInput = inputs[2];
        const confirmPasswordInput = inputs[3];
        const registerButton = registerForm.querySelector("button");

        if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
            alert('Form error: could not initialize inputs.');
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!name) {
            alert("Please enter your full name.");
            nameInput.focus();
            return;
        }

        if (!email) {
            alert("Please enter your email address.");
            emailInput.focus();
            return;
        }
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            alert('Administrator accounts must use a Gmail address.');
            emailInput.focus();
            return;
        }
        if (!password) {
            alert("Please create a password.");
            passwordInput.focus();
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            confirmPasswordInput.focus();
            return;
        }

        registerButton.textContent = "Creating account...";

        try {
            const res = await NexoraAuth.registerUser(name, email, password);
            if(res && res.token){
                localStorage.setItem('nexora-token', res.token);
                localStorage.setItem('nexora-user', JSON.stringify(res.user));
                location.href = 'pages/dashboard.html';
                return;
            }

            if(res && res.status === 'pending'){
                const code = await showConfirmationModal('A confirmation code has been sent to your email. Please enter it to complete registration:');
                if(!code) {
                    alert('Confirmation code is required to complete registration.');
                    return;
                }
                try{
                    const conf = await NexoraAuth.confirmAccount(email, code.trim());
                    if(conf && conf.token){
                        localStorage.setItem('nexora-token', conf.token);
                        localStorage.setItem('nexora-user', JSON.stringify(conf.user));
                        location.href = 'pages/dashboard.html';
                        return;
                    }
                }catch(e){
                    console.error(e);
                    alert(e?.message || 'Confirmation failed.');
                }
                alert('Registration could not be completed.');
                return;
            }

            alert('Registration failed. Please try again.');
        } catch (error) {
            console.error(error);
            alert(error?.message || "Unable to create an account.");
        } finally {
            registerButton.textContent = "Create Account";
        }
    }

    // Wire validation for messaging only; the buttons remain active
    (function wireRegisterValidation(){
        if(!registerForm) return;
        const nameInput = registerForm.querySelector('input[type="text"]');
        const emailInput = registerForm.querySelector('input[type="email"]');
        const passwordInputs = registerForm.querySelectorAll('input[type="password"]');
        const registerButton = registerForm.querySelector('button');
        if(!nameInput || !emailInput || passwordInputs.length < 2 || !registerButton) return;

        function validate(){
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const p1 = passwordInputs[0].value.trim();
            const p2 = passwordInputs[1].value.trim();
            const ok = name.length>0 && email.length>0 && p1.length>=6 && p1===p2;
            registerButton.classList.toggle('invalid', !ok);
        }

        ['input','change'].forEach(ev => {
            nameInput.addEventListener(ev, validate);
            emailInput.addEventListener(ev, validate);
            passwordInputs[0].addEventListener(ev, validate);
            passwordInputs[1].addEventListener(ev, validate);
        });

        validate();
    })();

    (function wireLoginValidation(){
        if(!loginForm) return;
        const emailInput = loginForm.querySelector('input[type="email"]');
        const passwordInput = loginForm.querySelector('input[type="password"]');
        const loginButton = loginForm.querySelector('button');
        if(!emailInput || !passwordInput || !loginButton) return;

        function validate(){
            const ok = emailInput.value.trim().length>0 && passwordInput.value.trim().length>0;
            loginButton.classList.toggle('invalid', !ok);
        }
        ['input','change'].forEach(ev => { emailInput.addEventListener(ev, validate); passwordInput.addEventListener(ev, validate); });
        validate();
    })();

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
        // Redundant click handler to catch cases where form submit isn't triggered on some mobile browsers
        (function attachSubmitClick(){
            try{
                const submitBtn = loginForm.querySelector("button[type='submit']") || loginForm.querySelector('button');
                if(submitBtn){
                    submitBtn.addEventListener('click', function(evt){
                        console.log('[NEXORA] login submit button clicked');
                        // allow normal submit flow which will trigger the form submit handler
                        // but call handleLogin directly as a fallback
                        if(!evt.defaultPrevented){
                            try{ handleLogin(evt); }catch(e){ console.warn('fallback handleLogin error', e); }
                        }
                    });
                }
            }catch(e){ console.warn('attachSubmitClick failed', e); }
        })();
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }

});
