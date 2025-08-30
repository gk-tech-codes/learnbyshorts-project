// Contact Form Security & Validation
class ContactFormValidator {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.addRealTimeValidation();
        }
    }

    // Sanitize input to prevent XSS
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    // Validate name (no special characters except spaces, hyphens, apostrophes)
    validateName(name) {
        const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
        return nameRegex.test(name);
    }

    // Validate message (reasonable length, no excessive special characters)
    validateMessage(message) {
        if (message.length < 10 || message.length > 1000) return false;
        
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i
        ];
        
        return !suspiciousPatterns.some(pattern => pattern.test(message));
    }

    // Rate limiting check (simple client-side)
    checkRateLimit() {
        const lastSubmit = localStorage.getItem('lastContactSubmit');
        const now = Date.now();
        const cooldown = 60000; // 1 minute

        if (lastSubmit && (now - parseInt(lastSubmit)) < cooldown) {
            return false;
        }
        
        localStorage.setItem('lastContactSubmit', now.toString());
        return true;
    }

    // Show validation error
    showError(field, message) {
        const errorDiv = field.parentNode.querySelector('.error-message') || 
                        document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.marginTop = '5px';
        
        if (!field.parentNode.querySelector('.error-message')) {
            field.parentNode.appendChild(errorDiv);
        }
        
        field.style.borderColor = '#dc3545';
    }

    // Clear validation error
    clearError(field) {
        const errorDiv = field.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.style.borderColor = '';
    }

    // Add real-time validation
    addRealTimeValidation() {
        const nameField = this.form.querySelector('#name');
        const emailField = this.form.querySelector('#email');
        const messageField = this.form.querySelector('#message');

        if (nameField) {
            nameField.addEventListener('blur', () => {
                const value = nameField.value.trim();
                if (value && !this.validateName(value)) {
                    this.showError(nameField, 'Name should contain only letters, spaces, hyphens, and apostrophes (2-50 characters)');
                } else {
                    this.clearError(nameField);
                }
            });
        }

        if (emailField) {
            emailField.addEventListener('blur', () => {
                const value = emailField.value.trim();
                if (value && !this.validateEmail(value)) {
                    this.showError(emailField, 'Please enter a valid email address');
                } else {
                    this.clearError(emailField);
                }
            });
        }

        if (messageField) {
            messageField.addEventListener('blur', () => {
                const value = messageField.value.trim();
                if (value && !this.validateMessage(value)) {
                    this.showError(messageField, 'Message should be 10-1000 characters and contain no suspicious content');
                } else {
                    this.clearError(messageField);
                }
            });
        }
    }

    // Handle form submission
    handleSubmit(e) {
        e.preventDefault();
        
        // Rate limiting check
        if (!this.checkRateLimit()) {
            alert('Please wait before sending another message (1 minute cooldown)');
            return;
        }

        const formData = new FormData(this.form);
        const name = formData.get('name')?.trim() || '';
        const email = formData.get('email')?.trim() || '';
        const message = formData.get('message')?.trim() || '';

        let isValid = true;

        // Clear previous errors
        this.form.querySelectorAll('.error-message').forEach(error => error.remove());
        this.form.querySelectorAll('input, textarea').forEach(field => {
            field.style.borderColor = '';
        });

        // Validate all fields
        if (!name) {
            this.showError(this.form.querySelector('#name'), 'Name is required');
            isValid = false;
        } else if (!this.validateName(name)) {
            this.showError(this.form.querySelector('#name'), 'Invalid name format');
            isValid = false;
        }

        if (!email) {
            this.showError(this.form.querySelector('#email'), 'Email is required');
            isValid = false;
        } else if (!this.validateEmail(email)) {
            this.showError(this.form.querySelector('#email'), 'Invalid email format');
            isValid = false;
        }

        if (!message) {
            this.showError(this.form.querySelector('#message'), 'Message is required');
            isValid = false;
        } else if (!this.validateMessage(message)) {
            this.showError(this.form.querySelector('#message'), 'Invalid message content or length');
            isValid = false;
        }

        if (isValid) {
            // Sanitize inputs before processing
            const sanitizedData = {
                name: this.sanitizeInput(name),
                email: this.sanitizeInput(email),
                message: this.sanitizeInput(message)
            };

            this.submitForm(sanitizedData);
        }
    }

    // Submit sanitized form data
    submitForm(data) {
        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Use Formspree for email sending
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('message', data.message);
        formData.append('_subject', `New Contact Form Message from ${data.name}`);
        formData.append('_replyto', data.email);

        fetch('https://formspree.io/f/xpwaqjqr', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                this.showSuccess('Thank you! Your message has been sent successfully. We\'ll get back to you soon.');
                this.form.reset();
                this.clearErrors();
            } else {
                throw new Error('Network response was not ok');
            }
        })
        .catch(error => {
            console.error('Form submission error:', error);
            this.showError('Sorry, there was an error sending your message. Please try again or email us directly at learningbyshorts@gmail.com');
        })
        .finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }

    // Show success message
    showSuccess(message) {
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'form-message success';
        successDiv.innerHTML = `
            <div style="
                background: #d4edda;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                border: 1px solid #c3e6cb;
                margin: 20px 0;
                font-weight: 500;
            ">
                ✅ ${message}
            </div>
        `;
        
        this.form.appendChild(successDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }

    // Show error message
    showError(message) {
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-message error';
        errorDiv.innerHTML = `
            <div style="
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 5px;
                border: 1px solid #f5c6cb;
                margin: 20px 0;
                font-weight: 500;
            ">
                ❌ ${message}
            </div>
        `;
        
        this.form.appendChild(errorDiv);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 8000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactFormValidator();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContactFormValidator;
}
