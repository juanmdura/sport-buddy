// Login Page JavaScript

class LoginManager {
    constructor() {
        this.isSubmitting = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkExistingSession();
        this.checkUrlMessage();
    }

    bindEvents() {
        // Login form submission
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Demo login button
        document.getElementById('demo-login').addEventListener('click', () => {
            this.fillDemoCredentials();
        });

        // Toggle password visibility
        document.getElementById('toggle-password').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Register link - now handled by href in HTML

        // Enter key support
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isSubmitting) {
                const form = document.getElementById('login-form');
                if (document.activeElement && form.contains(document.activeElement)) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    async checkExistingSession() {
        try {
            const response = await fetch('/api/auth/check', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    // User is already logged in, redirect to dashboard
                    window.location.href = '/';
                }
            }
        } catch (error) {
            console.log('No existing session found');
        }
    }

    checkUrlMessage() {
        const urlParams = new URLSearchParams(window.location.search);
        const message = urlParams.get('message');
        
        if (message) {
            this.showSuccess(decodeURIComponent(message));
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    async handleLogin() {
        if (this.isSubmitting) return;

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        // Basic validation
        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        this.isSubmitting = true;
        this.showLoading(true);
        this.hideMessages();

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    username,
                    password,
                    rememberMe
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showSuccess('Login successful! Redirecting...');
                
                // Short delay to show success message
                setTimeout(() => {
                    // Redirect to the page user was trying to access, or dashboard
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectTo = urlParams.get('redirect') || '/';
                    window.location.href = redirectTo;
                }, 1500);
            } else {
                this.showError(data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.isSubmitting = false;
            this.showLoading(false);
        }
    }

    fillDemoCredentials() {
        document.getElementById('username').value = 'demo';
        document.getElementById('password').value = 'demo123';
        document.getElementById('remember-me').checked = false;
        
        // Add visual feedback
        this.showSuccess('Demo credentials filled. Click "Sign In" to continue.');
        
        // Focus on submit button
        document.querySelector('.login-btn').focus();
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleButton = document.getElementById('toggle-password');
        const icon = toggleButton.querySelector('i');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
            toggleButton.setAttribute('aria-label', 'Hide password');
        } else {
            passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
            toggleButton.setAttribute('aria-label', 'Show password');
        }
    }



    showLoading(show) {
        const loading = document.getElementById('login-loading');
        const form = document.getElementById('login-form');
        const submitBtn = document.querySelector('.login-btn');

        if (show) {
            loading.style.display = 'block';
            form.style.opacity = '0.6';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        } else {
            loading.style.display = 'none';
            form.style.opacity = '1';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('login-error');
        const errorText = document.getElementById('login-error-text');
        
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideMessages();
        }, 5000);

        // Scroll to error message if needed
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showSuccess(message) {
        const successDiv = document.getElementById('login-success');
        const successText = document.getElementById('login-success-text');
        
        successText.textContent = message;
        successDiv.style.display = 'flex';
        
        // Auto-hide after 3 seconds (unless it's a redirect message)
        if (!message.includes('Redirecting')) {
            setTimeout(() => {
                this.hideMessages();
            }, 3000);
        }
    }

    hideMessages() {
        document.getElementById('login-error').style.display = 'none';
        document.getElementById('login-success').style.display = 'none';
    }
}

// Utility functions for enhanced UX
const LoginUtils = {
    // Add input validation styling
    setupInputValidation() {
        const inputs = document.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value.trim() === '') {
                    input.style.borderColor = '#e53e3e';
                } else {
                    input.style.borderColor = '#e2e8f0';
                }
            });

            input.addEventListener('input', () => {
                if (input.style.borderColor === 'rgb(229, 62, 62)') {
                    input.style.borderColor = '#e2e8f0';
                }
            });
        });
    },

    // Add loading animation to form elements
    addLoadingAnimation() {
        const card = document.querySelector('.login-card');
        card.classList.add('loading-animation');
        
        setTimeout(() => {
            card.classList.remove('loading-animation');
        }, 300);
    },

    // Handle connection errors gracefully
    handleOfflineMode() {
        window.addEventListener('online', () => {
            const errorDiv = document.getElementById('login-error');
            if (errorDiv.style.display !== 'none') {
                errorDiv.style.display = 'none';
            }
        });

        window.addEventListener('offline', () => {
            const loginManager = window.loginManager;
            if (loginManager) {
                loginManager.showError('You are offline. Please check your internet connection.');
            }
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loginManager = new LoginManager();
    LoginUtils.setupInputValidation();
    LoginUtils.handleOfflineMode();
    
    console.log('🔐 Login Manager initialized');

    // Add some visual flair
    setTimeout(() => {
        LoginUtils.addLoadingAnimation();
    }, 100);
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    // Clear any existing timers or ongoing operations
    if (window.loginManager) {
        window.loginManager.isSubmitting = false;
        window.loginManager.showLoading(false);
        window.loginManager.hideMessages();
    }
});
