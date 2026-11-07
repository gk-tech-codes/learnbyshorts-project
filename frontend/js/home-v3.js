(function () {
    'use strict';

    const header = document.querySelector('[data-header]');
    const menuButton = document.querySelector('[data-menu-button]');
    const mobileNav = document.querySelector('[data-mobile-nav]');

    function updateHeader() {
        header?.classList.toggle('is-scrolled', window.scrollY > 10);
    }

    function closeMenu() {
        if (!menuButton || !mobileNav) return;
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open menu');
        mobileNav.hidden = true;
        document.body.classList.remove('menu-open');
    }

    menuButton?.addEventListener('click', () => {
        const opening = menuButton.getAttribute('aria-expanded') !== 'true';
        menuButton.setAttribute('aria-expanded', String(opening));
        menuButton.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
        mobileNav.hidden = !opening;
        document.body.classList.toggle('menu-open', opening);
    });

    mobileNav?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    const demo = document.querySelector('[data-demo]');
    const feedback = document.querySelector('[data-demo-feedback]');

    demo?.querySelectorAll('[data-answer]').forEach(button => {
        button.addEventListener('click', () => {
            const correct = button.dataset.answer === 'correct';
            demo.querySelectorAll('[data-answer]').forEach(option => {
                option.disabled = true;
            });
            button.classList.add(correct ? 'is-correct' : 'is-wrong');

            const correctButton = demo.querySelector('[data-answer="correct"]');
            if (!correct) correctButton?.classList.add('is-correct');

            if (feedback) {
                feedback.textContent = correct
                    ? 'Exactly. Checkout can use one contract while each payment type handles its own behavior.'
                    : 'The shared interface is the stable contract. Checkout stays independent of each implementation.';
                feedback.classList.toggle('is-success', correct);
            }

            window.Analytics?.trackHomepageDemo?.(correct);
        });
    });
})();
