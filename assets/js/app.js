(() => {
    const header = document.querySelector('.site-header');
    const menuButton = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');

    const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    const closeMenu = () => {
        menuButton?.setAttribute('aria-expanded', 'false');
        menuButton?.setAttribute('aria-label', 'Open menu');
        nav?.classList.remove('open');
        document.body.classList.remove('menu-open');
    };

    menuButton?.addEventListener('click', () => {
        const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-expanded', String(!isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
        nav?.classList.toggle('open', !isOpen);
        document.body.classList.toggle('menu-open', !isOpen);
    });
    nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 980) closeMenu(); });

    const hero = document.querySelector('.hero');
    const heroSlides = [...document.querySelectorAll('.hero-slide')];
    const heroDots = [...document.querySelectorAll('[data-hero-slide]')];
    const heroToggle = document.querySelector('.hero-slider-toggle');
    const heroToggleText = document.querySelector('.hero-slider-toggle-text');
    const heroStatus = document.querySelector('[data-hero-status]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const slideNames = ['Villa and lawn', 'Pool', 'Garden', 'Bedroom', 'Hall', 'Balcony', 'Kitchen'];
    let heroIndex = 0;
    let heroTimer = null;
    let userPaused = reducedMotion.matches;
    let heroInView = true;
    let heroFocused = false;

    const setHeroSlide = index => {
        if (!heroSlides.length) return;
        heroIndex = (index + heroSlides.length) % heroSlides.length;
        heroSlides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === heroIndex));
        heroDots.forEach((dot, dotIndex) => {
            const active = dotIndex === heroIndex;
            dot.classList.toggle('is-active', active);
            if (active) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
        });
        if (heroStatus) heroStatus.textContent = `${slideNames[heroIndex]} photo, ${heroIndex + 1} of ${heroSlides.length}`;
    };

    const stopHeroTimer = () => {
        if (heroTimer) window.clearInterval(heroTimer);
        heroTimer = null;
    };

    const refreshHeroTimer = () => {
        stopHeroTimer();
        if (!userPaused && heroInView && !heroFocused && !document.hidden && heroSlides.length > 1) {
            heroTimer = window.setInterval(() => setHeroSlide(heroIndex + 1), 3000);
        }
    };

    const updateHeroToggle = () => {
        heroToggle?.classList.toggle('is-paused', userPaused);
        heroToggle?.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
        if (heroToggleText) heroToggleText.textContent = userPaused ? 'Play' : 'Pause';
    };

    heroDots.forEach((dot, index) => dot.addEventListener('click', () => {
        setHeroSlide(index);
        refreshHeroTimer();
    }));

    heroToggle?.addEventListener('click', () => {
        userPaused = !userPaused;
        updateHeroToggle();
        refreshHeroTimer();
    });

    hero?.addEventListener('focusin', () => { heroFocused = true; refreshHeroTimer(); });
    hero?.addEventListener('focusout', () => {
        window.setTimeout(() => {
            heroFocused = hero?.contains(document.activeElement) ?? false;
            refreshHeroTimer();
        }, 0);
    });
    document.addEventListener('visibilitychange', refreshHeroTimer);
    reducedMotion.addEventListener?.('change', event => {
        userPaused = event.matches;
        updateHeroToggle();
        refreshHeroTimer();
    });

    if ('IntersectionObserver' in window && hero) {
        const heroObserver = new IntersectionObserver(entries => {
            heroInView = entries[0]?.isIntersecting ?? true;
            refreshHeroTimer();
        }, { threshold: 0.1 });
        heroObserver.observe(hero);
    }

    updateHeroToggle();
    refreshHeroTimer();

    const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px' })
        : null;
    document.querySelectorAll('.reveal').forEach(element => observer ? observer.observe(element) : element.classList.add('visible'));

    const dateInput = document.querySelector('#date');
    if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

    document.querySelector('#booking-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const rawDate = String(data.get('date') || '');
        const date = rawDate
            ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${rawDate}T12:00:00`))
            : 'Not selected';
        const message = [
            'Hello GP Royal Farm! I would like to check availability.',
            '',
            `Name: ${data.get('name')}`,
            `Preferred date: ${date}`,
            `Guests: ${data.get('guests')}`,
            `Occasion: ${data.get('occasion')}`,
            data.get('message') ? `Message: ${data.get('message')}` : '',
        ].filter(Boolean).join('\n');
        window.open(`https://wa.me/919718457100?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    });

    const galleryTrack = document.querySelector('[data-gallery-track]');
    const galleryButtons = [...document.querySelectorAll('.gallery-item')];
    const collageTriggers = [...document.querySelectorAll('.experience-collage .gallery-trigger')];
    const galleryAutoToggle = document.querySelector('.gallery-autoplay-toggle');
    const galleryAutoText = galleryAutoToggle?.querySelector('span:last-child');
    const lightbox = document.querySelector('#lightbox');
    const lightboxImage = lightbox?.querySelector('img');
    const lightboxCaption = lightbox?.querySelector('.lightbox-caption');
    const lightboxCounter = lightbox?.querySelector('.lightbox-counter');
    const lightboxCanvas = lightbox?.querySelector('.lightbox-canvas');
    const lightboxZoomLevel = lightbox?.querySelector('.lightbox-zoom-level');
    let activeIndex = 0;
    let suppressGalleryClick = false;
    let galleryTimer = null;
    let galleryUserPaused = reducedMotion.matches;
    let galleryInView = false;
    let galleryFocused = false;
    let galleryDragging = false;
    let galleryMoved = false;
    let dragStartX = 0;
    let dragStartScroll = 0;

    const stopGalleryTimer = () => {
        if (galleryTimer) window.clearInterval(galleryTimer);
        galleryTimer = null;
    };

    const advanceGallery = () => {
        if (!galleryTrack || !galleryButtons.length) return;
        const firstCard = galleryButtons[0];
        const gap = Number.parseFloat(getComputedStyle(galleryTrack).columnGap || getComputedStyle(galleryTrack).gap) || 15;
        const step = firstCard.getBoundingClientRect().width + gap;
        const atEnd = galleryTrack.scrollLeft + galleryTrack.clientWidth >= galleryTrack.scrollWidth - step * 0.45;
        galleryTrack.scrollTo({ left: atEnd ? 0 : galleryTrack.scrollLeft + step, behavior: 'smooth' });
    };

    const refreshGalleryTimer = () => {
        stopGalleryTimer();
        if (!galleryUserPaused && galleryInView && !galleryFocused && !galleryDragging && !document.hidden) {
            galleryTimer = window.setInterval(advanceGallery, 4300);
        }
    };

    const updateGalleryToggle = () => {
        galleryAutoToggle?.classList.toggle('is-paused', galleryUserPaused);
        galleryAutoToggle?.setAttribute('aria-label', galleryUserPaused ? 'Play gallery auto-slide' : 'Pause gallery auto-slide');
        if (galleryAutoText) galleryAutoText.textContent = galleryUserPaused ? 'Play auto-slide' : 'Pause auto-slide';
    };

    galleryAutoToggle?.addEventListener('click', () => {
        galleryUserPaused = !galleryUserPaused;
        updateGalleryToggle();
        refreshGalleryTimer();
    });

    galleryTrack?.addEventListener('focusin', () => { galleryFocused = true; refreshGalleryTimer(); });
    galleryTrack?.addEventListener('focusout', () => {
        window.setTimeout(() => {
            galleryFocused = galleryTrack?.contains(document.activeElement) ?? false;
            refreshGalleryTimer();
        }, 0);
    });

    galleryTrack?.addEventListener('dragstart', event => event.preventDefault());
    galleryTrack?.addEventListener('pointerdown', event => {
        if (!galleryTrack || (event.pointerType === 'mouse' && event.button !== 0)) return;
        galleryDragging = true;
        galleryMoved = false;
        dragStartX = event.clientX;
        dragStartScroll = galleryTrack.scrollLeft;
        galleryTrack.setPointerCapture(event.pointerId);
        galleryTrack.classList.add('is-dragging');
        refreshGalleryTimer();
    });
    galleryTrack?.addEventListener('pointermove', event => {
        if (!galleryDragging || !galleryTrack) return;
        const distance = event.clientX - dragStartX;
        if (Math.abs(distance) > 5) galleryMoved = true;
        if (galleryMoved) {
            event.preventDefault();
            galleryTrack.scrollLeft = dragStartScroll - distance;
        }
    });

    const finishGalleryDrag = event => {
        if (!galleryDragging || !galleryTrack) return;
        galleryDragging = false;
        galleryTrack.classList.remove('is-dragging');
        if (galleryTrack.hasPointerCapture(event.pointerId)) galleryTrack.releasePointerCapture(event.pointerId);
        if (galleryMoved) {
            suppressGalleryClick = true;
            window.setTimeout(() => { suppressGalleryClick = false; }, 0);
        }
        refreshGalleryTimer();
    };
    galleryTrack?.addEventListener('pointerup', finishGalleryDrag);
    galleryTrack?.addEventListener('pointercancel', finishGalleryDrag);

    document.addEventListener('visibilitychange', refreshGalleryTimer);
    reducedMotion.addEventListener?.('change', event => {
        galleryUserPaused = event.matches;
        updateGalleryToggle();
        refreshGalleryTimer();
    });

    if ('IntersectionObserver' in window && galleryTrack) {
        const galleryObserver = new IntersectionObserver(entries => {
            galleryInView = entries[0]?.isIntersecting ?? false;
            refreshGalleryTimer();
        }, { threshold: 0.18 });
        galleryObserver.observe(galleryTrack);
    } else {
        galleryInView = true;
    }

    updateGalleryToggle();
    refreshGalleryTimer();

    const galleryImages = [
        ['assets/images/1.webp', 'Private swimming pool beside the GP Royal Farm villa'],
        ['assets/images/10.webp', 'Wide lawn and villa at GP Royal Farm Noida'],
        ['assets/images/18.webp', 'Spacious air-conditioned living and dining hall'],
        ['assets/images/12.webp', 'Large landscaped garden and event lawn'],
        ['assets/images/3.webp', 'Comfortable air-conditioned bedroom'],
        ['assets/images/4.webp', 'Illuminated private pool in the evening'],
        ['assets/images/16.webp', 'First-floor balcony overlooking the property'],
        ['assets/images/19.webp', 'Modern dining area and equipped kitchen'],
        ['assets/images/14.webp', 'Grand entrance of GP Royal Farm'],
        ['assets/images/15.webp', 'Aerial view of the event lawn'],
        ['assets/images/8.webp', 'Private luxury bedroom'],
        ['assets/images/17.webp', 'Fully equipped kitchen'],
        ['assets/images/2.webp', 'Poolside view at GP Royal Farm'],
        ['assets/images/5.webp', 'Spacious indoor gathering area'],
        ['assets/images/6.webp', 'Decorative lighting detail'],
        ['assets/images/7.webp', 'Open living area for guests'],
        ['assets/images/9.webp', 'Landscaped pool and garden view'],
        ['assets/images/11.webp', 'Villa overlooking the private lawn'],
        ['assets/images/13.webp', 'Balcony view across the grounds'],
        ['assets/images/wa/1.jpg', 'Bright first-floor gathering lounge'],
        ['assets/images/wa/2.jpg', 'Refreshed interior view'],
        ['assets/images/wa/3.jpg', 'GP Royal Farm property view'],
        ['assets/images/wa/16.jpg', 'New view of the farm stay'],
        ['assets/images/wa/17.jpg', 'New interior view of the villa'],
        ['assets/images/wa/18.jpg', 'New guest area view'],
        ['assets/images/wa/19.jpg', 'New property view'],
        ['assets/images/wa/31.jpg', 'New GP Royal Farm photo'],
        ['assets/images/wa/323.jpg', 'New GP Royal Farm photo'],
        ['assets/images/hero/hero-pool.jpg', 'Private pool with waterfall feature'],
        ['assets/images/hero/hero-lawn.jpg', 'Expansive celebration lawn'],
        ['assets/images/hero/hero-bedroom.jpg', 'Air-conditioned guest bedroom'],
        ['assets/images/hero/hero-hall.jpg', 'Large indoor hall for gatherings'],
        ['assets/images/hero/hero-balcony.jpg', 'Long first-floor balcony'],
        ['assets/images/hero/hero-kitchen.jpg', 'Kitchen and dining facilities'],
        ['assets/images/location-entrance.jpg', 'Entrance to GP Royal Farm in Noida'],
    ].map(([src, alt]) => ({ src, alt }));

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let swipeStartX = 0;
    let swipeStartY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pinchDistance = 0;
    let pinchScale = 1;
    const pointers = new Map();

    const clampPan = () => {
        if (!lightboxCanvas || !lightboxImage || scale <= 1) {
            translateX = 0;
            translateY = 0;
            return;
        }
        const maxX = Math.max(0, (lightboxImage.offsetWidth * scale - lightboxCanvas.clientWidth) / 2);
        const maxY = Math.max(0, (lightboxImage.offsetHeight * scale - lightboxCanvas.clientHeight) / 2);
        translateX = Math.max(-maxX, Math.min(maxX, translateX));
        translateY = Math.max(-maxY, Math.min(maxY, translateY));
    };

    const renderTransform = () => {
        if (!lightboxImage) return;
        clampPan();
        lightboxImage.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
        lightboxCanvas?.classList.toggle('is-zoomed', scale > 1);
        if (lightboxZoomLevel) lightboxZoomLevel.textContent = `${Math.round(scale * 100)}%`;
    };

    const resetZoom = () => {
        scale = 1;
        translateX = 0;
        translateY = 0;
        renderTransform();
    };

    const setZoom = value => {
        scale = Math.max(1, Math.min(4, value));
        renderTransform();
    };

    const preloadAround = () => {
        [-1, 1].forEach(offset => {
            const index = (activeIndex + offset + galleryImages.length) % galleryImages.length;
            const preload = new Image();
            preload.src = galleryImages[index].src;
        });
    };

    const showImage = index => {
        if (!galleryImages.length || !lightboxImage || !lightboxCaption) return;
        activeIndex = (index + galleryImages.length) % galleryImages.length;
        const image = galleryImages[activeIndex];
        resetZoom();
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;
        lightboxCaption.textContent = image.alt;
        if (lightboxCounter) lightboxCounter.textContent = `${activeIndex + 1} / ${galleryImages.length}`;
        preloadAround();
    };

    const findImageIndex = source => {
        if (!source) return 0;
        const normalized = source.replace(location.origin + '/', '').replace(/^\//, '');
        const index = galleryImages.findIndex(image => normalized.endsWith(image.src));
        return index < 0 ? 0 : index;
    };

    const openGallery = source => {
        showImage(findImageIndex(source));
        if (!lightbox?.open) lightbox?.showModal();
        document.body.classList.add('lightbox-open');
    };

    galleryButtons.forEach(button => button.addEventListener('click', event => {
        if (suppressGalleryClick) {
            event.preventDefault();
            return;
        }
        openGallery(button.querySelector('img')?.getAttribute('src'));
    }));

    collageTriggers.forEach(trigger => {
        const open = () => openGallery(trigger.dataset.gallerySrc || trigger.querySelector('img')?.getAttribute('src'));
        trigger.addEventListener('click', open);
        trigger.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });
    });

    lightbox?.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.close());
    lightbox?.querySelector('.lightbox-prev')?.addEventListener('click', () => showImage(activeIndex - 1));
    lightbox?.querySelector('.lightbox-next')?.addEventListener('click', () => showImage(activeIndex + 1));
    lightbox?.querySelector('.lightbox-zoom-out')?.addEventListener('click', () => setZoom(scale - .5));
    lightbox?.querySelector('.lightbox-zoom-in')?.addEventListener('click', () => setZoom(scale + .5));
    lightboxZoomLevel?.addEventListener('click', resetZoom);
    lightbox?.addEventListener('close', () => {
        document.body.classList.remove('lightbox-open');
        resetZoom();
    });
    lightbox?.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') showImage(activeIndex - 1);
        if (event.key === 'ArrowRight') showImage(activeIndex + 1);
        if (event.key === '+' || event.key === '=') setZoom(scale + .5);
        if (event.key === '-') setZoom(scale - .5);
        if (event.key === '0') resetZoom();
    });

    lightboxCanvas?.addEventListener('wheel', event => {
        event.preventDefault();
        setZoom(scale + (event.deltaY < 0 ? .25 : -.25));
    }, { passive: false });
    lightboxCanvas?.addEventListener('dblclick', () => setZoom(scale > 1 ? 1 : 2));
    lightboxCanvas?.addEventListener('pointerdown', event => {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        lightboxCanvas.setPointerCapture(event.pointerId);
        if (pointers.size === 1) {
            swipeStartX = lastPointerX = event.clientX;
            swipeStartY = lastPointerY = event.clientY;
            if (scale > 1) lightboxCanvas.classList.add('is-panning');
        } else if (pointers.size === 2) {
            const [first, second] = [...pointers.values()];
            pinchDistance = Math.hypot(second.x - first.x, second.y - first.y);
            pinchScale = scale;
        }
    });
    lightboxCanvas?.addEventListener('pointermove', event => {
        if (!pointers.has(event.pointerId)) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 2) {
            const [first, second] = [...pointers.values()];
            const distance = Math.hypot(second.x - first.x, second.y - first.y);
            if (pinchDistance) setZoom(pinchScale * distance / pinchDistance);
        } else if (pointers.size === 1 && scale > 1) {
            translateX += event.clientX - lastPointerX;
            translateY += event.clientY - lastPointerY;
            lastPointerX = event.clientX;
            lastPointerY = event.clientY;
            renderTransform();
        }
    });

    const finishViewerPointer = event => {
        const point = pointers.get(event.pointerId);
        pointers.delete(event.pointerId);
        if (lightboxCanvas?.hasPointerCapture(event.pointerId)) lightboxCanvas.releasePointerCapture(event.pointerId);
        lightboxCanvas?.classList.remove('is-panning');
        if (scale === 1 && point) {
            const distanceX = point.x - swipeStartX;
            const distanceY = point.y - swipeStartY;
            if (Math.abs(distanceX) > 52 && Math.abs(distanceX) > Math.abs(distanceY) * 1.2) {
                showImage(activeIndex + (distanceX < 0 ? 1 : -1));
            }
        }
        if (pointers.size < 2) pinchDistance = 0;
    };
    lightboxCanvas?.addEventListener('pointerup', finishViewerPointer);
    lightboxCanvas?.addEventListener('pointercancel', finishViewerPointer);
    window.addEventListener('resize', renderTransform);
})();
