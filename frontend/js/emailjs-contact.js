(function () {
    'use strict';

    const form = document.getElementById('contactForm');
    if (!form) return;

    function showMessage(message, type) {
        document.querySelector('.form-message')?.remove();
        const notice = document.createElement('p');
        notice.className = `form-message is-${type}`;
        notice.textContent = message;
        notice.setAttribute('role', type === 'error' ? 'alert' : 'status');
        form.append(notice);
    }

    form.addEventListener('submit', event => {
        event.preventDefault();

        const name = document.getElementById('name')?.value.trim().slice(0, 100) || '';
        const email = document.getElementById('email')?.value.trim().slice(0, 254) || '';
        const subject = document.getElementById('subject')?.value || '';
        const message = document.getElementById('message')?.value.trim().slice(0, 5000) || '';

        if (!name || !email || !subject || !message) {
            showMessage('Please complete every required field.', 'error');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }

        const labels = {
            feedback: 'General Feedback',
            bug: 'Bug Report',
            feature: 'Feature Request',
            content: 'Content Suggestion',
            partnership: 'Partnership',
            other: 'Other'
        };
        const mailSubject = `[LearnByShorts] ${labels[subject] || 'Website message'}`;
        const mailBody = [
            `Name: ${name}`,
            `Reply email: ${email}`,
            '',
            message
        ].join('\n');
        const mailto = new URL('mailto:learningbyshorts@gmail.com');
        mailto.searchParams.set('subject', mailSubject);
        mailto.searchParams.set('body', mailBody);

        showMessage('Opening your email app. Review the draft, then choose whether to send it.', 'success');
        window.location.href = mailto.href;
        window.Analytics?.trackContactSubmission?.('email_draft');
    });
})();
