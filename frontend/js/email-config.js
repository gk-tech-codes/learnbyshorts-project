// Email Configuration for LearnByShorts Contact Form
// 
// This file contains optional configurations for email services.
// The contact form will work with basic mailto: functionality by default.
// 
// To enable advanced email sending, uncomment and configure one of the options below:

// Option 1: EmailJS (Recommended for client-side email sending)
// 1. Sign up at https://www.emailjs.com/
// 2. Create a service and template
// 3. Get your public key
// 4. Uncomment and configure below:

/*
window.EMAIL_CONFIG = {
    serviceId: 'your_emailjs_service_id',
    templateId: 'your_emailjs_template_id', 
    publicKey: 'your_emailjs_public_key'
};

// Add EmailJS script to contact.html:
// <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
*/

// Option 2: Formspree (Simple form handling service)
// 1. Sign up at https://formspree.io/
// 2. Create a form and get your endpoint
// 3. Uncomment and configure below:

/*
window.FORMSPREE_ENDPOINT = 'https://formspree.io/f/your_form_id';
*/

// Option 3: Netlify Forms (If hosting on Netlify)
// 1. Add netlify attribute to form in contact.html
// 2. No additional configuration needed

// Default behavior: Opens user's default email client with pre-filled message
// This works on all devices and doesn't require any external services.
