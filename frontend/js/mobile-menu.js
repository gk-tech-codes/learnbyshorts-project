// Standard Mobile Menu - Hamburger transforms to Cross
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍔 Mobile menu script loaded');
    
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    
    console.log('🍔 Elements found:', {
        hamburger: !!hamburger,
        navMenu: !!navMenu,
        menuOverlay: !!menuOverlay
    });
    
    function openMenu() {
        console.log('🍔 Opening menu');
        hamburger.classList.add('active');
        navMenu.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.classList.add('menu-open');
    }
    
    function closeMenu() {
        console.log('🍔 Closing menu');
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
    
    // Toggle menu on hamburger click (hamburger becomes cross when active)
    if (hamburger) {
        hamburger.addEventListener('click', function(e) {
            console.log('🍔 Hamburger clicked');
            e.preventDefault();
            e.stopPropagation();
            
            if (hamburger.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        console.log('🍔 Hamburger click listener added');
    } else {
        console.error('🍔 Hamburger element not found!');
    }
    
    // Close menu on overlay click
    if (menuOverlay) {
        menuOverlay.addEventListener('click', function(e) {
            closeMenu();
        });
    }
    
    // Close menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            closeMenu();
        });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Close menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
});
