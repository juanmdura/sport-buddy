// Registration Page JavaScript

class RegistrationManager {
    constructor() {
        this.isSubmitting = false;
        this.validationRules = {
            username: {
                minLength: 3,
                maxLength: 20,
                pattern: /^[a-zA-Z0-9_]+$/,
                message: 'Username must be 3-20 characters, letters, numbers, and underscores only'
            },
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            displayName: {
                minLength: 1,
                maxLength: 50,
                message: 'Display name must be 1-50 characters'
            },
            password: {
                minLength: 6,
                message: 'Password must be at least 6 characters long'
            }
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupValidation();
        this.checkExistingSession();
    }

    bindEvents() {
        // Registration form submission
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // Toggle password visibility
        document.getElementById('toggle-password').addEventListener('click', () => {
            this.togglePasswordVisibility('password', 'toggle-password');
        });

        document.getElementById('toggle-confirm-password').addEventListener('click', () => {
            this.togglePasswordVisibility('confirmPassword', 'toggle-confirm-password');
        });

        // Terms and privacy links (placeholder for now)
        document.getElementById('terms-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showTermsModal();
        });

        document.getElementById('privacy-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPrivacyModal();
        });

        // Real-time validation
        document.getElementById('confirmPassword').addEventListener('input', () => {
            this.validatePasswordMatch();
        });

        document.getElementById('password').addEventListener('input', () => {
            this.validatePasswordMatch();
        });

        // Enter key support
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isSubmitting) {
                const form = document.getElementById('register-form');
                if (document.activeElement && form.contains(document.activeElement)) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    setupValidation() {
        const inputs = document.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) {
                    this.validateField(input);
                }
            });
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

    async handleRegistration() {
        if (this.isSubmitting) return;

        // Get form data
        const formData = this.getFormData();

        // Validate all fields
        if (!this.validateAllFields(formData)) {
            return;
        }

        this.isSubmitting = true;
        this.showLoading(true);
        this.hideMessages();

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showSuccess('Account created successfully! Redirecting to login...');
                
                // Short delay to show success message
                setTimeout(() => {
                    window.location.href = '/login?message=Account created successfully. Please sign in.';
                }, 2000);
            } else {
                this.showError(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.isSubmitting = false;
            this.showLoading(false);
        }
    }

    getFormData() {
        return {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            displayName: document.getElementById('displayName').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            agreeTerms: document.getElementById('agree-terms').checked,
            newsletter: document.getElementById('newsletter').checked
        };
    }

    validateAllFields(formData) {
        let isValid = true;

        // Validate username
        if (!this.validateUsername(formData.username)) {
            isValid = false;
        }

        // Validate email
        if (!this.validateEmail(formData.email)) {
            isValid = false;
        }

        // Validate display name
        if (!this.validateDisplayName(formData.displayName)) {
            isValid = false;
        }

        // Validate password
        if (!this.validatePassword(formData.password)) {
            isValid = false;
        }

        // Validate password match
        if (!this.validatePasswordsMatch(formData.password, formData.confirmPassword)) {
            isValid = false;
        }

        // Validate terms agreement
        if (!formData.agreeTerms) {
            this.showError('You must agree to the Terms of Service and Privacy Policy to create an account.');
            isValid = false;
        }

        return isValid;
    }

    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.name;
        let isValid = true;
        let message = '';

        switch (fieldName) {
            case 'username':
                isValid = this.validateUsername(value);
                break;
            case 'email':
                isValid = this.validateEmail(value);
                break;
            case 'displayName':
                isValid = this.validateDisplayName(value);
                break;
            case 'password':
                isValid = this.validatePassword(value);
                break;
        }

        if (isValid) {
            input.classList.remove('invalid');
            input.style.borderColor = '#e2e8f0';
        } else {
            input.classList.add('invalid');
            input.style.borderColor = '#e53e3e';
        }

        return isValid;
    }

    validateUsername(username) {
        const rules = this.validationRules.username;
        return username.length >= rules.minLength && 
               username.length <= rules.maxLength && 
               rules.pattern.test(username);
    }

    validateEmail(email) {
        return this.validationRules.email.pattern.test(email);
    }

    validateDisplayName(displayName) {
        const rules = this.validationRules.displayName;
        return displayName.length >= rules.minLength && 
               displayName.length <= rules.maxLength;
    }

    validatePassword(password) {
        return password.length >= this.validationRules.password.minLength;
    }

    validatePasswordsMatch(password, confirmPassword) {
        return password === confirmPassword && password.length > 0;
    }

    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');

        if (confirmPassword.length > 0) {
            if (this.validatePasswordsMatch(password, confirmPassword)) {
                confirmInput.classList.remove('invalid');
                confirmInput.style.borderColor = '#27ae60';
            } else {
                confirmInput.classList.add('invalid');
                confirmInput.style.borderColor = '#e53e3e';
            }
        }
    }

    togglePasswordVisibility(inputId, buttonId) {
        const passwordInput = document.getElementById(inputId);
        const toggleButton = document.getElementById(buttonId);
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

    showTermsModal() {
        alert('Terms of Service\n\nBy using Sports Buddy, you agree to:\n\n1. Use the service responsibly\n2. Respect other users\n3. Provide accurate information\n4. Follow all applicable laws\n\nThis is a demo application. In a production environment, you would have detailed terms of service.');
    }

    showPrivacyModal() {
        alert('Privacy Policy\n\nWe value your privacy:\n\n1. We only collect necessary information\n2. Your data is stored securely\n3. We don\'t share your information\n4. You can delete your account anytime\n\nThis is a demo application. In a production environment, you would have a detailed privacy policy.');
    }

    showLoading(show) {
        const loading = document.getElementById('register-loading');
        const form = document.getElementById('register-form');
        const submitBtn = document.querySelector('.login-btn');

        if (show) {
            loading.style.display = 'block';
            form.style.opacity = '0.6';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        } else {
            loading.style.display = 'none';
            form.style.opacity = '1';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('register-error');
        const errorText = document.getElementById('register-error-text');
        
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
        const successDiv = document.getElementById('register-success');
        const successText = document.getElementById('register-success-text');
        
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
        document.getElementById('register-error').style.display = 'none';
        document.getElementById('register-success').style.display = 'none';
    }
}

// Utility functions for enhanced registration UX
const RegistrationUtils = {
    // Check username availability (debounced)
    checkUsernameAvailability: (() => {
        let timeout;
        return (username) => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                if (username.length >= 3) {
                    try {
                        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
                        const data = await response.json();
                        
                        const usernameInput = document.getElementById('username');
                        if (data.available) {
                            usernameInput.style.borderColor = '#27ae60';
                        } else {
                            usernameInput.style.borderColor = '#e53e3e';
                        }
                    } catch (error) {
                        console.error('Username check failed:', error);
                    }
                }
            }, 500);
        };
    })(),

    // Add password strength indicator
    setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        passwordInput.addEventListener('input', (e) => {
            // This would show a password strength indicator
            // For now, just basic validation
        });
    },

    // Add form auto-save (to localStorage)
    setupAutoSave() {
        const form = document.getElementById('register-form');
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"]');
        
        inputs.forEach(input => {
            // Load saved value
            const saved = localStorage.getItem(`register_${input.name}`);
            if (saved) {
                input.value = saved;
            }

            // Save on change
            input.addEventListener('input', () => {
                localStorage.setItem(`register_${input.name}`, input.value);
            });
        });

        // Clear saved data on successful registration
        window.addEventListener('beforeunload', () => {
            // Only clear if form was successfully submitted
            if (window.registrationManager?.isSubmitting) {
                inputs.forEach(input => {
                    localStorage.removeItem(`register_${input.name}`);
                });
            }
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.registrationManager = new RegistrationManager();
    RegistrationUtils.setupPasswordStrength();
    RegistrationUtils.setupAutoSave();
    
    console.log('📝 Registration Manager initialized');

    // Add username availability checking
    document.getElementById('username').addEventListener('input', (e) => {
        RegistrationUtils.checkUsernameAvailability(e.target.value);
    });

    // Add some visual flair
    setTimeout(() => {
        const card = document.querySelector('.login-card');
        card.style.animation = 'fadeInUp 0.6s ease-out';
    }, 100);
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    // Clear any existing timers or ongoing operations
    if (window.registrationManager) {
        window.registrationManager.isSubmitting = false;
        window.registrationManager.showLoading(false);
        window.registrationManager.hideMessages();
    }
});
