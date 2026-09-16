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
    const slideNames = ['Pool', 'Garden', 'Bedroom', 'Hall', 'Balcony', 'Kitchen'];
    let heroIndex = 0;
    let heroTimer = null;
    let userPaused = reducedMotion.matches;
    let heroInView = true;
    let heroHovered = false;
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
        if (!userPaused && heroInView && !heroHovered && !heroFocused && !document.hidden && heroSlides.length > 1) {
            heroTimer = window.setInterval(() => setHeroSlide(heroIndex + 1), 5200);
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

    hero?.addEventListener('mouseenter', () => { heroHovered = true; refreshHeroTimer(); });
    hero?.addEventListener('mouseleave', () => { heroHovered = false; refreshHeroTimer(); });
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
    const galleryAutoToggle = document.querySelector('.gallery-autoplay-toggle');
    const galleryAutoText = galleryAutoToggle?.querySelector('span:last-child');
    const lightbox = document.querySelector('#lightbox');
    const lightboxImage = lightbox?.querySelector('img');
    const lightboxCaption = lightbox?.querySelector('figcaption');
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

    const showImage = index => {
        if (!galleryButtons.length || !lightboxImage || !lightboxCaption) return;
        activeIndex = (index + galleryButtons.length) % galleryButtons.length;
        const source = galleryButtons[activeIndex].querySelector('img');
        lightboxImage.src = source.src;
        lightboxImage.alt = source.alt;
        lightboxCaption.textContent = source.alt;
    };

    galleryButtons.forEach((button, index) => button.addEventListener('click', event => {
        if (suppressGalleryClick) {
            event.preventDefault();
            return;
        }
        showImage(index);
        lightbox?.showModal();
    }));
    lightbox?.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.close());
    lightbox?.querySelector('.lightbox-prev')?.addEventListener('click', () => showImage(activeIndex - 1));
    lightbox?.querySelector('.lightbox-next')?.addEventListener('click', () => showImage(activeIndex + 1));
    lightbox?.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
    lightbox?.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') showImage(activeIndex - 1);
        if (event.key === 'ArrowRight') showImage(activeIndex + 1);
    });
})();
