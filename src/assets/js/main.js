/**
 * Main JavaScript file for Vaperelax Theme
 * Optimized for performance and Core Web Vitals
 */

// Performance optimization: Use passive event listeners
const passiveSupported = (() => {
    let passiveSupported = false;
    try {
        const options = {
            get passive() {
                passiveSupported = true;
                return false;
            }
        };
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
    } catch (err) {
        passiveSupported = false;
    }
    return passiveSupported;
})();

// Global theme object
const VaperelaxTheme = {
    // Configuration
    config: {
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        },
        animations: {
            duration: 300,
            easing: 'ease-in-out'
        },
        lazyLoading: {
            rootMargin: '50px 0px',
            threshold: 0.1
        }
    },

    // Initialize theme
    init() {
        this.setupLazyLoading();
        this.setupSmoothScrolling();
        this.setupFormValidation();
        this.setupCartFunctionality();
        this.setupSearchFunctionality();
        this.setupPerformanceOptimizations();
        this.setupAccessibility();
        this.setupAnalytics();
        
        // Initialize components after DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.setupImageOptimization();
            this.setupIntersectionObserver();
            this.setupServiceWorker();
        });
    },

    // Lazy loading implementation
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        // Load the image
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            img.classList.remove('lazy');
                            
                            // Remove observer
                            observer.unobserve(img);
                            
                            // Trigger custom event
                            img.dispatchEvent(new CustomEvent('imageLoaded'));
                        }
                    }
                });
            }, this.config.lazyLoading);

            // Observe all lazy images
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for older browsers
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.classList.add('loaded');
                img.classList.remove('lazy');
            });
        }
    },

    // Smooth scrolling for anchor links
    setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update URL without triggering scroll
                    history.pushState(null, null, `#${targetId}`);
                }
            }
        });
    },

    // Form validation
    setupFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
            
            // Real-time validation
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
                
                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
            });
        });
    },

    // Validate individual field
    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (required && !value) {
            isValid = false;
            errorMessage = 'هذا الحقل مطلوب';
        }
        
        // Email validation
        else if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'يرجى إدخال بريد إلكتروني صحيح';
            }
        }
        
        // Phone validation
        else if (type === 'tel' && value) {
            const phoneRegex = /^(\+966|0)?[5][0-9]{8}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'يرجى إدخال رقم هاتف صحيح';
            }
        }

        // Show/hide error
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    },

    // Show field error
    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #e74c3c;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        `;
    },

    // Clear field error
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    },

    // Validate entire form
    validateForm(form) {
        const fields = form.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    },

    // Cart functionality
    setupCartFunctionality() {
        // Add to cart
        document.addEventListener('click', (e) => {
            const addToCartBtn = e.target.closest('.add-to-cart-btn');
            if (addToCartBtn) {
                e.preventDefault();
                this.addToCart(addToCartBtn);
            }
        });

        // Update cart count on page load
        this.updateCartCount();
    },

    // Add product to cart
    async addToCart(button) {
        const productId = button.dataset.productId;
        const quantity = button.dataset.quantity || 1;
        
        if (button.classList.contains('loading')) {
            return;
        }
        
        button.classList.add('loading');
        
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.getCSRFToken()
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: parseInt(quantity)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateCartCount(data.cart_count);
                this.showNotification('تم إضافة المنتج للسلة بنجاح', 'success');
                
                // Update button temporarily
                const originalText = button.innerHTML;
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    تم الإضافة
                `;
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                }, 2000);
                
                // Trigger cart update event
                document.dispatchEvent(new CustomEvent('cartUpdated', {
                    detail: { count: data.cart_count, total: data.cart_total }
                }));
                
            } else {
                this.showNotification(data.message || 'حدث خطأ أثناء إضافة المنتج', 'error');
            }
            
        } catch (error) {
            console.error('Cart error:', error);
            this.showNotification('حدث خطأ أثناء إضافة المنتج', 'error');
        } finally {
            button.classList.remove('loading');
        }
    },

    // Update cart count display
    updateCartCount(count) {
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        if (count !== undefined) {
            cartCountElements.forEach(element => {
                element.textContent = count;
                
                // Add animation
                element.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            });
        } else {
            // Fetch current cart count
            fetch('/api/cart/count')
                .then(response => response.json())
                .then(data => {
                    cartCountElements.forEach(element => {
                        element.textContent = data.count || 0;
                    });
                })
                .catch(error => {
                    console.error('Failed to fetch cart count:', error);
                });
        }
    },

    // Search functionality
    setupSearchFunctionality() {
        const searchInputs = document.querySelectorAll('.search-input');
        
        searchInputs.forEach(input => {
            let searchTimeout;
            
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length >= 2) {
                    searchTimeout = setTimeout(() => {
                        this.performSearch(query, input);
                    }, 300);
                } else {
                    this.hideSearchResults(input);
                }
            });
            
            // Hide results when clicking outside
            document.addEventListener('click', (e) => {
                if (!input.closest('.search-container').contains(e.target)) {
                    this.hideSearchResults(input);
                }
            });
        });
    },

    // Perform search
    async performSearch(query, input) {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
            const data = await response.json();
            
            if (data.success) {
                this.showSearchResults(data.results, input);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    },

    // Show search results
    showSearchResults(results, input) {
        let resultsContainer = input.parentNode.querySelector('.search-results');
        
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'search-results';
            input.parentNode.appendChild(resultsContainer);
        }
        
        if (results.length > 0) {
            resultsContainer.innerHTML = results.map(result => `
                <a href="${result.url}" class="search-result-item">
                    <img src="${result.image}" alt="${result.name}" width="40" height="40">
                    <div class="search-result-info">
                        <span class="search-result-name">${result.name}</span>
                        <span class="search-result-price">${result.price} ر.س</span>
                    </div>
                </a>
            `).join('');
        } else {
            resultsContainer.innerHTML = '<div class="search-no-results">لا توجد نتائج</div>';
        }
        
        resultsContainer.style.display = 'block';
    },

    // Hide search results
    hideSearchResults(input) {
        const resultsContainer = input.parentNode.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    },

    // Performance optimizations
    setupPerformanceOptimizations() {
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Optimize images
        this.optimizeImages();
        
        // Setup resource hints
        this.setupResourceHints();
        
        // Monitor performance
        this.monitorPerformance();
    },

    // Preload critical resources
    preloadCriticalResources() {
        const criticalResources = [
            { href: '/assets/css/main.css', as: 'style' },
            { href: '/assets/fonts/arabic-font.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            Object.assign(link, resource);
            document.head.appendChild(link);
        });
    },

    // Optimize images
    optimizeImages() {
        // Add loading="lazy" to images below the fold
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach((img, index) => {
            if (index > 3) { // Skip first 3 images (likely above the fold)
                img.loading = 'lazy';
            }
        });
    },

    // Setup resource hints
    setupResourceHints() {
        const hints = [
            { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
            { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
            { rel: 'preconnect', href: 'https://api.salla.sa' }
        ];
        
        hints.forEach(hint => {
            const link = document.createElement('link');
            Object.assign(link, hint);
            document.head.appendChild(link);
        });
    },

    // Monitor performance
    monitorPerformance() {
        if ('PerformanceObserver' in window) {
            // Monitor LCP
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                // Send to analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'LCP', {
                        event_category: 'Web Vitals',
                        value: Math.round(lastEntry.startTime),
                        non_interaction: true
                    });
                }
            });
            
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Monitor FID
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'FID', {
                            event_category: 'Web Vitals',
                            value: Math.round(entry.processingStart - entry.startTime),
                            non_interaction: true
                        });
                    }
                });
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
        }
    },

    // Setup accessibility features
    setupAccessibility() {
        // Skip to main content link
        this.addSkipToMainLink();
        
        // Keyboard navigation
        this.setupKeyboardNavigation();
        
        // Focus management
        this.setupFocusManagement();
        
        // ARIA live regions
        this.setupLiveRegions();
    },

    // Add skip to main content link
    addSkipToMainLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'تخطي إلى المحتوى الرئيسي';
        skipLink.className = 'skip-to-main';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 10000;
            border-radius: 4px;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    },

    // Setup keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escape key closes modals/dropdowns
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeAllDropdowns();
            }
            
            // Enter key activates buttons
            if (e.key === 'Enter' && e.target.matches('button, [role="button"]')) {
                e.target.click();
            }
        });
    },

    // Setup focus management
    setupFocusManagement() {
        // Trap focus in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal.active');
                if (modal) {
                    this.trapFocus(e, modal);
                }
            }
        });
    },

    // Trap focus within element
    trapFocus(e, element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    },

    // Setup ARIA live regions
    setupLiveRegions() {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    },

    // Announce to screen readers
    announceToScreenReader(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    },

    // Setup analytics
    setupAnalytics() {
        // Track page views
        this.trackPageView();
        
        // Track user interactions
        this.trackUserInteractions();
        
        // Track performance metrics
        this.trackPerformanceMetrics();
    },

    // Track page view
    trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: window.location.href
            });
        }
    },

    // Track user interactions
    trackUserInteractions() {
        // Track button clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, .btn');
            if (button && typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    event_category: 'UI',
                    event_label: button.textContent.trim() || button.className
                });
            }
        });
        
        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form && typeof gtag !== 'undefined') {
                gtag('event', 'form_submit', {
                    event_category: 'Form',
                    event_label: form.id || form.className
                });
            }
        });
    },

    // Track performance metrics
    trackPerformanceMetrics() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                
                if (perfData && typeof gtag !== 'undefined') {
                    gtag('event', 'page_load_time', {
                        event_category: 'Performance',
                        value: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                        non_interaction: true
                    });
                }
            }, 0);
        });
    },

    // Utility functions
    getCSRFToken() {
        const token = document.querySelector('meta[name="csrf-token"]');
        return token ? token.getAttribute('content') : '';
    },

    // Show notification
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Announce to screen readers
        this.announceToScreenReader(message);
    },

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    },

    // Close all dropdowns
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    },

    // Setup intersection observer for animations
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        animationObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            document.querySelectorAll('[data-animate]').forEach(element => {
                animationObserver.observe(element);
            });
        }
    },

    // Setup service worker for caching
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    },

    // Image optimization
    setupImageOptimization() {
        // Convert images to WebP if supported
        if (this.supportsWebP()) {
            document.querySelectorAll('img[data-src]').forEach(img => {
                const src = img.dataset.src;
                if (src && !src.includes('.webp')) {
                    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                    img.dataset.src = webpSrc;
                }
            });
        }
    },

    // Check WebP support
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
};

// Initialize theme when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VaperelaxTheme.init());
} else {
    VaperelaxTheme.init();
}

// Export for global access
window.VaperelaxTheme = VaperelaxTheme;

