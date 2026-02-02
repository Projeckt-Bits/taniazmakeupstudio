/**
 * Tania's Makeup Studio - Main JavaScript
 * Handles all interactive functionality including scroll-based frame animation
 */

// ===== SCROLL-BASED FRAME ANIMATION =====
class ScrollFrameAnimation {
    constructor() {
        this.canvas = document.getElementById('hero-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.heroContainer = document.getElementById('home');
        this.contentWrapper = document.getElementById('hero-content-wrapper');
        this.scrollIndicator = document.getElementById('hero-scroll-indicator');
        this.progressBar = document.getElementById('progress-bar');
        this.scrollProgress = document.getElementById('scroll-progress');

        this.frameCount = 192;
        this.images = [];
        this.loadedCount = 0;
        this.currentFrame = 0;
        this.isLoaded = false;
        this.isAnimationComplete = false;

        // Frame stepping - show 2-3 frames per scroll step
        this.framesPerStep = 3;

        this.init();
    }

    getFramePath(index) {
        const frameNum = String(index + 1).padStart(3, '0');
        return `hero_images/ezgif-frame-${frameNum}.jpg`;
    }

    init() {
        this.setupCanvas();
        this.preloadImages();
        this.bindEvents();
    }

    setupCanvas() {
        const resize = () => {
            // Get the actual CSS-rendered size of the canvas
            const displayWidth = this.canvas.clientWidth || window.innerWidth;
            const displayHeight = this.canvas.clientHeight || window.innerHeight;

            // Use device pixel ratio for crisp rendering
            const dpr = window.devicePixelRatio || 1;

            // Set canvas internal buffer size for high DPI
            // This is the actual pixel resolution of the canvas
            this.canvas.width = displayWidth * dpr;
            this.canvas.height = displayHeight * dpr;

            // Store display dimensions for drawing (the CSS size, not buffer size)
            this.displayWidth = displayWidth;
            this.displayHeight = displayHeight;
            this.dpr = dpr;

            if (this.isLoaded && this.images[this.currentFrame]) {
                this.drawFrame(this.currentFrame);
            }
        };

        resize();
        window.addEventListener('resize', resize);
        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(resize, 100);
        });
    }

    preloadImages() {
        const preloader = document.getElementById('preloader');

        // Load first frame immediately
        const firstImage = new Image();
        firstImage.src = this.getFramePath(0);
        firstImage.onload = () => {
            this.images[0] = firstImage;
            this.drawFrame(0);
        };

        // Load rest of images
        for (let i = 0; i < this.frameCount; i++) {
            const img = new Image();
            img.src = this.getFramePath(i);

            img.onload = () => {
                this.images[i] = img;
                this.loadedCount++;

                // Update preloader if visible
                const percent = Math.round((this.loadedCount / this.frameCount) * 100);

                if (this.loadedCount === this.frameCount) {
                    this.isLoaded = true;
                    this.drawFrame(0);

                    // Hide preloader
                    setTimeout(() => {
                        if (preloader) {
                            preloader.classList.add('hidden');
                        }
                    }, 500);
                }
            };

            img.onerror = () => {
                console.warn(`Failed to load frame ${i + 1}`);
                this.loadedCount++;
            };
        }
    }

    drawFrame(frameIndex) {
        if (!this.images[frameIndex] || !this.ctx) return;

        const img = this.images[frameIndex];
        const dpr = this.dpr || window.devicePixelRatio || 1;
        const canvasWidth = this.displayWidth || window.innerWidth;
        const canvasHeight = this.displayHeight || window.innerHeight;

        // Reset transform before clearing
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Clear the entire canvas buffer (use actual canvas size, not display size)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Fill with background color as fallback
        this.ctx.fillStyle = '#0f0f0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply DPI scaling for drawing
        this.ctx.scale(dpr, dpr);

        // Guard against invalid image dimensions
        if (!img.width || !img.height) {
            return;
        }

        // Calculate COVER fit - image always completely fills the viewport
        // This means the image may be cropped but never shows blank spaces
        const imgAspect = img.width / img.height;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasAspect > imgAspect) {
            // Canvas is wider than image aspect ratio
            // Scale image to fill the width, let height overflow and crop
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgAspect;
        } else {
            // Canvas is taller than image aspect ratio (mobile portrait)
            // Scale image to fill the height, let width overflow and crop
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imgAspect;
        }

        // Center the image (this will crop the overflowing part)
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = (canvasHeight - drawHeight) / 2;

        // Draw the image to completely cover the canvas
        this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    bindEvents() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    handleScroll() {
        if (!this.isLoaded) return;

        const heroRect = this.heroContainer.getBoundingClientRect();
        const heroHeight = this.heroContainer.offsetHeight;
        const viewportHeight = window.innerHeight;

        // Calculate scroll progress within hero section (0 to 1)
        // The animation should complete when we've scrolled through the hero section
        const scrolled = -heroRect.top;
        const maxScroll = heroHeight - viewportHeight;
        const progress = Math.min(Math.max(scrolled / maxScroll, 0), 1);

        // Calculate current frame based on progress
        // Show 2-3 frames per scroll increment
        const targetFrame = Math.floor(progress * (this.frameCount - 1));

        // Clamp frame to valid range
        const newFrame = Math.min(Math.max(targetFrame, 0), this.frameCount - 1);

        if (newFrame !== this.currentFrame && this.images[newFrame]) {
            this.currentFrame = newFrame;
            this.drawFrame(newFrame);
        }

        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${progress * 100}%`;
        }

        // Show/hide progress bar
        if (this.scrollProgress) {
            if (progress > 0 && progress < 1) {
                this.scrollProgress.classList.add('visible');
            } else {
                this.scrollProgress.classList.remove('visible');
            }
        }

        // Fade out content and scroll indicator as user starts scrolling
        if (progress > 0.05) {
            this.contentWrapper?.classList.add('fade-out');
            this.scrollIndicator?.classList.add('hidden');
        } else {
            this.contentWrapper?.classList.remove('fade-out');
            this.scrollIndicator?.classList.remove('hidden');
        }

        // Handle fixed positioning of overlay
        const heroOverlay = document.querySelector('.hero-overlay');
        if (heroOverlay) {
            if (progress >= 1) {
                // Animation complete - transition to static
                this.isAnimationComplete = true;
                heroOverlay.style.position = 'absolute';
                heroOverlay.style.top = `${heroHeight - viewportHeight}px`;
            } else {
                this.isAnimationComplete = false;
                heroOverlay.style.position = 'fixed';
                heroOverlay.style.top = '0';
            }
        }

        // Handle fixed elements when animation completes
        if (this.contentWrapper) {
            if (progress >= 1) {
                this.contentWrapper.style.position = 'absolute';
                this.contentWrapper.style.top = `${heroHeight - viewportHeight}px`;
            } else {
                this.contentWrapper.style.position = 'fixed';
                this.contentWrapper.style.top = '0';
            }
        }
    }
}

// Initialize scroll frame animation
document.addEventListener('DOMContentLoaded', () => {
    new ScrollFrameAnimation();
});

// ===== DOM ELEMENTS =====
const elements = {
    preloader: document.getElementById('preloader'),
    header: document.getElementById('header'),
    navMenu: document.getElementById('nav-menu'),
    navToggle: document.getElementById('nav-toggle'),
    navClose: document.getElementById('nav-close'),
    navLinks: document.querySelectorAll('.nav-link'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightbox-img'),
    backToTop: document.getElementById('back-to-top'),
    toast: document.getElementById('toast'),
    testimonialsTrack: document.getElementById('testimonials-track'),
    bookingForm: document.getElementById('booking-form'),
    contactForm: document.getElementById('contact-form')
};

// ===== HEADER SCROLL EFFECT =====
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add/remove scrolled class
    if (currentScroll > 50) {
        elements.header.classList.add('scrolled');
    } else {
        elements.header.classList.remove('scrolled');
    }

    // Update active nav link based on section
    updateActiveNavLink();

    // Show/hide back to top button
    if (currentScroll > 500) {
        elements.backToTop.classList.add('visible');
    } else {
        elements.backToTop.classList.remove('visible');
    }

    lastScroll = currentScroll;
});

// ===== MOBILE NAVIGATION =====
elements.navToggle?.addEventListener('click', () => {
    elements.navMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
});

elements.navClose?.addEventListener('click', () => {
    elements.navMenu.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close menu when clicking a link
elements.navLinks.forEach(link => {
    link.addEventListener('click', () => {
        elements.navMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (elements.navMenu.classList.contains('active') &&
        !elements.navMenu.contains(e.target) &&
        !elements.navToggle.contains(e.target)) {
        elements.navMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// ===== ACTIVE NAV LINK =====
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            elements.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// ===== GALLERY LIGHTBOX =====
class Lightbox {
    constructor() {
        this.lightbox = elements.lightbox;
        this.img = elements.lightboxImg;
        this.galleryItems = document.querySelectorAll('.gallery-item');
        this.currentIndex = 0;
        this.images = [];

        this.init();
    }

    init() {
        // Collect all image sources
        this.galleryItems.forEach((item, index) => {
            const src = item.dataset.src;
            if (src) {
                this.images.push(src);
                item.addEventListener('click', () => this.open(index));
            }
        });

        // Close button
        this.lightbox?.querySelector('.lightbox-close')?.addEventListener('click', () => this.close());

        // Navigation
        this.lightbox?.querySelector('.lightbox-prev')?.addEventListener('click', () => this.prev());
        this.lightbox?.querySelector('.lightbox-next')?.addEventListener('click', () => this.next());

        // Close on background click
        this.lightbox?.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.close();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox?.classList.contains('active')) return;

            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });
    }

    open(index) {
        this.currentIndex = index;
        this.img.src = this.images[index];
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.img.src = this.images[this.currentIndex];
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.img.src = this.images[this.currentIndex];
    }
}

// Initialize lightbox
if (elements.lightbox) {
    new Lightbox();
}

// ===== TESTIMONIALS CAROUSEL =====
class TestimonialsCarousel {
    constructor(track) {
        this.track = track;
        this.cards = track.querySelectorAll('.testimonial-card');
        this.prevBtn = document.querySelector('.testimonial-prev');
        this.nextBtn = document.querySelector('.testimonial-next');
        this.currentIndex = 0;
        this.cardsToShow = this.getCardsToShow();

        this.init();
    }

    getCardsToShow() {
        if (window.innerWidth < 768) return 1;
        if (window.innerWidth < 992) return 2;
        return 3;
    }

    init() {
        this.prevBtn?.addEventListener('click', () => this.prev());
        this.nextBtn?.addEventListener('click', () => this.next());

        // Handle resize
        window.addEventListener('resize', () => {
            this.cardsToShow = this.getCardsToShow();
            this.goTo(0);
        });

        // Touch support
        let touchStartX = 0;
        let touchEndX = 0;

        this.track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.track.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }

    goTo(index) {
        const maxIndex = this.cards.length - this.cardsToShow;
        this.currentIndex = Math.max(0, Math.min(index, maxIndex));

        const cardWidth = this.cards[0].offsetWidth + 30; // Include gap
        const offset = -this.currentIndex * cardWidth;

        this.track.style.transform = `translateX(${offset}px)`;
    }

    next() {
        this.goTo(this.currentIndex + 1);
    }

    prev() {
        this.goTo(this.currentIndex - 1);
    }

    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
    }
}

// Initialize testimonials carousel
if (elements.testimonialsTrack) {
    new TestimonialsCarousel(elements.testimonialsTrack);
}

// ===== FAQ ACCORDION =====
const accordionItems = document.querySelectorAll('.accordion-item');

accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');

    header?.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all items
        accordionItems.forEach(i => i.classList.remove('active'));

        // Open clicked item if it wasn't active
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// ===== SCROLL REVEAL ANIMATIONS =====
const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== BACK TO TOP =====
elements.backToTop?.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ===== FORM HANDLING =====
function showToast(message = 'Message sent successfully!') {
    elements.toast.querySelector('span').textContent = message;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Form validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#e74c3c';
        } else {
            input.style.borderColor = '';
        }

        // Email validation
        if (input.type === 'email' && input.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                isValid = false;
                input.style.borderColor = '#e74c3c';
            }
        }

        // Phone validation
        if (input.type === 'tel' && input.value) {
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            if (!phoneRegex.test(input.value)) {
                isValid = false;
                input.style.borderColor = '#e74c3c';
            }
        }
    });

    return isValid;
}

// Booking form
elements.bookingForm?.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm(this)) {
        showToast('Please fill in all required fields correctly.');
        return;
    }

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(this);
        const response = await fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showToast('Appointment request sent successfully!');
            this.reset();
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        showToast('Something went wrong. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Contact form
elements.contactForm?.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm(this)) {
        showToast('Please fill in all required fields correctly.');
        return;
    }

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(this);
        const response = await fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showToast('Message sent successfully!');
            this.reset();
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        showToast('Something went wrong. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Set minimum date for booking
const dateInput = document.getElementById('booking-date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// ===== LAZY LOADING IMAGES =====
const lazyImages = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
        }
    });
});

lazyImages.forEach(img => imageObserver.observe(img));

// ===== CONSOLE BRANDING =====
console.log(
    '%c Tania\'s Makeup Studio ',
    'background: linear-gradient(135deg, #d4a574, #e8c4b8); color: #1a1a1a; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 5px;'
);
console.log(
    '%c Website crafted with ❤️ ',
    'color: #d4a574; font-size: 12px;'
);
