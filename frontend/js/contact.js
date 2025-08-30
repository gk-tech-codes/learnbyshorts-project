// Contact Form Handler with Mailto
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Basic validation
            if (!name || !email || !message) {
                showMessage('Please fill in all fields.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showMessage('Please enter a valid email address.', 'error');
                return;
            }
            
            // Send email using mailto
            sendEmailViaMailto(name, email, message);
        });
    }
});

function sendEmailViaMailto(name, email, message) {
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Opening Email...';
    submitBtn.disabled = true;
    
    // Create mailto link
    const subject = encodeURIComponent(`Contact Form Message from ${name}`);
    const body = encodeURIComponent(`
Name: ${name}
Email: ${email}

Message:
${message}

---
Sent from LearnByShorts Contact Form
    `);
    
    const mailtoLink = `mailto:learningbyshorts@gmail.com?subject=${subject}&body=${body}`;
    
    // Open default email client
    window.location.href = mailtoLink;
    
    // Show success message
    setTimeout(() => {
        showMessage('Your email client should have opened. Please send the email to complete your message.', 'success');
        form.reset();
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1000);
}

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
    const icon = type === 'success' ? '✅' : '❌';
    
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
            ${icon} ${message}
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
