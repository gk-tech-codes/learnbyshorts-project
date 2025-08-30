// EmailJS Contact Form - Real Email Sending
document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS with your public key
    emailjs.init("K68OWjN_1T6feZOKt");
    
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value.trim();
            
            // Basic validation
            if (!name || !email || !subject || !message) {
                showMessage('❌ Please fill in all fields.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showMessage('❌ Please enter a valid email address.', 'error');
                return;
            }
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Prepare template parameters
            const templateParams = {
                name: name,
                email: email,
                message: message,
                time: new Date().toLocaleString(),
                subject: subject
            };
            
            console.log('📧 Sending email with params:', templateParams);
            
            // Send email using EmailJS
            emailjs.send('service_131em3d', 'template_pm6c2fw', templateParams)
                .then(function(response) {
                    console.log('✅ Email sent successfully:', response);
                    showMessage('✅ Thank you! Your message has been sent successfully. We\'ll get back to you soon at ' + email, 'success');
                    form.reset();
                })
                .catch(function(error) {
                    console.error('❌ Email sending failed:', error);
                    showMessage('❌ Sorry, there was an error sending your message. Please try again or email us directly at learningbyshorts@gmail.com', 'error');
                })
                .finally(function() {
                    // Reset button state
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
        });
    }
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'form-message';
    
    const bgColor = type === 'success' ? '#d4edda' : '#f8d7da';
    const textColor = type === 'success' ? '#155724' : '#721c24';
    const borderColor = type === 'success' ? '#c3e6cb' : '#f5c6cb';
    
    messageDiv.innerHTML = `
        <div style="
            background: ${bgColor};
            color: ${textColor};
            padding: 15px;
            border-radius: 5px;
            border: 1px solid ${borderColor};
            margin: 20px 0;
            font-weight: 500;
        ">
            ${message}
        </div>
    `;
    
    const form = document.getElementById('contactForm');
    form.appendChild(messageDiv);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 8000);
}
