/* Kavro Works — edit these settings when the review link / offer are ready. */
const KAVRO_CONFIG = {
  phone: '+14049196460',
  website: 'https://kavroworks.com/',
  googleReviewsUrl: '', // Paste the Google "Get more reviews" link here.
  promotion: {
    live: false, // Preview only until the details below are complete.
    startsAt: '2026-10-12T14:50:28-04:00',
    endsAt: '2026-10-27T14:50:28-04:00', // One deadline for everyone; never resets.
    sharePostUrl: '',
    prizeDetails: '', // Specify what 50% applies to and the maximum discount.
    eligibility: '', // Eligible entrants / area and any entry limits.
    winnerSelection: '', // Number of winners, how chosen, notification / redemption.
    officialRules: [] // Complete plain-text rule paragraphs. No purchase/review requirement.
  }
};

function countdownParts(end, now = Date.now()) {
  const milliseconds = Date.parse(end) - now;
  if (!Number.isFinite(milliseconds)) return null;
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  return { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60, seconds: total % 60, expired: total === 0 };
}

function smsHref(phone, message, apple = false) {
  return `sms:${phone}${message ? (apple ? '&' : '?') + 'body=' + encodeURIComponent(message) : ''}`;
}

function promotionState(promotion, now = Date.now()) {
  const start = Date.parse(promotion.startsAt);
  const end = Date.parse(promotion.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 'unavailable';
  if (now >= end) return 'ended';
  const ready = promotion.live && /^https:\/\//.test(promotion.sharePostUrl) &&
    promotion.prizeDetails.trim() && promotion.eligibility.trim() &&
    promotion.winnerSelection.trim() && promotion.officialRules.length;
  if (!ready) return 'preview';
  return now < start ? 'upcoming' : 'live';
}

// Pure helpers can be checked with Node without a browser or a build tool.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { countdownParts, smsHref, promotionState, KAVRO_CONFIG };
}

if (typeof document !== 'undefined') {
  document.documentElement.classList.add('js');
  (() => {
    'use strict';
    const all = (selector, root = document) => [...root.querySelectorAll(selector)];
    const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const genericMessage = 'Hi Kamran! I need help with ___. I’m in ___. I’m available ___. I’ll attach a photo of the job.';
    const setSMS = (link, message) => {
      link.dataset.sms = message;
      link.href = smsHref(KAVRO_CONFIG.phone, message, apple);
    };
    all('[data-sms]').forEach(link => setSMS(link, link.dataset.sms || genericMessage));

    // Mobile navigation also closes on Escape, outside click, and a wider viewport.
    const menuButton = document.querySelector('.menu-toggle');
    const nav = document.querySelector('#site-nav');
    const setMenu = open => {
      if (!menuButton || !nav) return;
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
      nav.classList.toggle('is-open', open);
    };
    menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    nav?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('click', event => {
      if (!event.target.closest('.site-header')) setMenu(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
        setMenu(false); menuButton.focus();
      }
    });
    const wideMenu = window.matchMedia('(min-width: 881px)');
    wideMenu.addEventListener('change', event => { if (event.matches) setMenu(false); });

    // Clipboard/share actions have an honest, manually selectable fallback.
    let toastTimer;
    const announce = message => {
      const toast = document.querySelector('#toast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('visible'), 4200);
    };
    const copyDialog = document.querySelector('#copy-dialog');
    const copyFallback = document.querySelector('#copy-fallback');
    async function copyText(text) {
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Use manual copy');
        await navigator.clipboard.writeText(text);
        announce('Copied. Ready to paste.');
        return true;
      } catch {
        if (copyDialog && typeof copyDialog.showModal === 'function') {
          copyFallback.value = text;
          copyDialog.showModal();
          document.body.classList.add('dialog-open');
          copyFallback.focus(); copyFallback.select();
        } else { window.prompt('Copy this text:', text); }
        return false;
      }
    }
    all('[data-copy]').forEach(button => button.addEventListener('click', () => copyText(button.dataset.copy)));
    all('[data-close-copy]').forEach(button => button.addEventListener('click', () => copyDialog.close()));
    copyDialog?.addEventListener('close', () => document.body.classList.remove('dialog-open'));
    all('[data-share-business]').forEach(button => button.addEventListener('click', async () => {
      const share = { title: 'Kavro Works', text: 'Know someone with a to-do list? Kavro Works helps with mounting, installation and furniture assembly in Metro Atlanta. Call or text (404) 919-6460.', url: KAVRO_CONFIG.website };
      if (navigator.share) {
        try { await navigator.share(share); return; }
        catch (error) { if (error.name === 'AbortError') return; }
      }
      await copyText(`${share.text}\n${share.url}`);
    }));

    // Ready-to-edit text templates; no job information is submitted to this website.
    const topics = {
      general: genericMessage,
      blinds: 'Hi Kamran! I need help with blinds for ___ windows. I’m in ___. I already have / need the blinds. I’ll attach photos and measurements.',
      furniture: 'Hi Kamran! I need ___ assembled. I’m in ___. Here is the product link: ___. I’m available ___.',
      installation: 'Hi Kamran! I need ___ installed or replaced. I’m in ___. I’ll attach photos of the item and existing setup. I’m available ___.'
    };
    const messageLink = document.querySelector('.message-link');
    if (messageLink) setSMS(messageLink, topics.general);
    all('[data-topic]').forEach(button => button.addEventListener('click', () => {
      all('[data-topic]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      const message = topics[button.dataset.topic] || topics.general;
      document.querySelector('#message-preview').textContent = message;
      setSMS(messageLink, message);
    }));

    // Service search/filter preserves the full service content when JS is off.
    let serviceFilter = 'all';
    const search = document.querySelector('#service-search');
    function filterServices() {
      const term = (search?.value || '').trim().toLowerCase();
      let count = 0;
      all('[data-service-group]').forEach(group => {
        let visible = 0;
        all('[data-service-item]', group).forEach(item => {
          const show = (serviceFilter === 'all' || group.dataset.serviceGroup === serviceFilter) && item.dataset.search.includes(term);
          item.hidden = !show;
          if (show) { visible++; count++; }
        });
        group.hidden = visible === 0;
      });
      const empty = document.querySelector('#service-empty');
      if (empty) empty.hidden = count !== 0;
      const status = document.querySelector('#service-results');
      if (status) status.textContent = `${count} services shown`;
    }
    all('[data-service-filter]').forEach(button => button.addEventListener('click', () => {
      serviceFilter = button.dataset.serviceFilter;
      all('[data-service-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      filterServices();
    }));
    search?.addEventListener('input', filterServices);

    const projects = [
      { id: 'blinds', title: 'Blind installation', before: 'blinds-before', after: 'blinds-after', labels: ['Before', 'After'], alts: ['Original horizontal blinds above the brown leather sofa', 'White zebra blinds installed above the same sofa'] },
      { id: 'bed', title: 'IKEA bed assembly', before: 'bed-before', after: 'bed-after', labels: ['In progress', 'Finished'], alts: ['Black bed components during assembly', 'Completed black bed frame with storage drawers and mattress'] },
      { id: 'fan', title: 'Ceiling fan replacement', before: 'fan-before', after: 'fan-after', labels: ['Before', 'After'], alts: ['Original multicolor ceiling fan in the lavender bedroom', 'New ceiling fan and integrated light in the same bedroom'] },
      { id: 'windows', title: 'Blinds & curtains · project views', before: 'windows-view-1', after: 'windows-view-2', labels: ['View 1', 'View 2'], alts: ['Three windows with horizontal blinds and curtains on a dark rod', 'Window treatments with sheer curtains on a silver rod'] },
      { id: 'disposal', title: 'Garbage disposal replacement', before: null, after: 'disposal-after', labels: ['', 'Completed'], alts: ['', 'Completed garbage disposal installation under the kitchen sink'] }
    ];
    const projectById = new Map(projects.map(project => [project.id, project]));
    const viewState = new Map(projects.map(project => [project.id, 'after']));
    all('[data-photo]').forEach(button => button.addEventListener('click', () => {
      const row = button.closest('[data-project-id]');
      const project = projectById.get(row.dataset.projectId);
      const side = button.dataset.photo;
      if (!project?.[side]) return;
      viewState.set(project.id, side);
      const image = row.querySelector('.project-photo img');
      image.removeAttribute('srcset');
      image.src = `images/${project[side]}.webp`;
      image.alt = project.alts[side === 'before' ? 0 : 1];
      row.querySelector('.project-photo').href = image.getAttribute('src');
      row.querySelector('.photo-state').textContent = project.labels[side === 'before' ? 0 : 1];
      all('[data-photo]', row).forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    }));
    all('[data-project-filter]').forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.projectFilter;
      let count = 0;
      all('[data-project-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      all('[data-project-category]').forEach(row => {
        row.hidden = filter !== 'all' && filter !== row.dataset.projectCategory;
        if (!row.hidden) count++;
      });
      document.querySelector('#project-results').textContent = `${count} projects shown`;
    }));

    // Native dialog: Escape, touch-sized controls, full uncropped photos, focus restoration.
    const lightbox = document.querySelector('#project-dialog');
    let activeIndex = 0;
    let activeSide = 'after';
    let openingLink = null;
    function showProject(index, side = 'after') {
      activeIndex = (index + projects.length) % projects.length;
      const project = projects[activeIndex];
      activeSide = project[side] ? side : 'after';
      const image = document.querySelector('#lightbox-img');
      const path = `images/${project[activeSide]}.webp`;
      image.src = path;
      image.alt = project.alts[activeSide === 'before' ? 0 : 1];
      document.querySelector('#lightbox-title').textContent = project.title;
      document.querySelector('#lightbox-original').href = path;
      document.querySelector('#lightbox-counter').textContent = `${activeIndex + 1} / ${projects.length}`;
      all('[data-lightbox-side]').forEach(button => {
        const before = button.dataset.lightboxSide === 'before';
        button.hidden = before && !project.before;
        button.textContent = project.labels[before ? 0 : 1];
        button.setAttribute('aria-pressed', String(button.dataset.lightboxSide === activeSide));
      });
    }
    all('[data-open-project]').forEach(link => link.addEventListener('click', event => {
      if (!lightbox || typeof lightbox.showModal !== 'function') return;
      event.preventDefault();
      openingLink = link;
      const id = link.dataset.openProject;
      showProject(projects.findIndex(project => project.id === id), viewState.get(id));
      lightbox.showModal();
      document.body.classList.add('dialog-open');
      document.querySelector('[data-close-lightbox]').focus();
    }));
    all('[data-lightbox-side]').forEach(button => button.addEventListener('click', () => showProject(activeIndex, button.dataset.lightboxSide)));
    all('[data-project-direction]').forEach(button => button.addEventListener('click', () => showProject(activeIndex + Number(button.dataset.projectDirection))));
    document.querySelector('[data-close-lightbox]')?.addEventListener('click', () => lightbox.close());
    lightbox?.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      openingLink?.focus();
    });
    lightbox?.addEventListener('click', event => {
      if (event.target !== lightbox) return;
      const box = lightbox.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) lightbox.close();
    });
    lightbox?.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); showProject(activeIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showProject(activeIndex - 1); }
    });

    // Honest review placeholder. A real link enables the CTA; no ratings are invented.
    if (/^https:\/\//.test(KAVRO_CONFIG.googleReviewsUrl)) {
      all('[data-google-reviews]').forEach(link => { link.href = KAVRO_CONFIG.googleReviewsUrl; link.hidden = false; });
      all('[data-review-heading]').forEach(node => { node.textContent = 'Hear from the neighbors.'; });
      all('[data-review-description]').forEach(node => { node.textContent = 'Read customer feedback on Google, or share your own experience with Kavro Works.'; });
      all('.review-fallback').forEach(node => { node.hidden = true; });
    }

    // A single real date powers every timer. Empty rules keep the giveaway in preview.
    const promotion = KAVRO_CONFIG.promotion;
    const timers = all('[data-countdown]');
    let lastOfferState;
    const dateLabel = value => new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    }).format(new Date(value));
    function paintOffer(state) {
      if (state === lastOfferState) return;
      lastOfferState = state;
      const live = state === 'live';
      const ended = state === 'ended';
      const badge = live ? 'Limited time · referral giveaway' : ended ? 'Referral offer · countdown ended' : 'Referral giveaway · draft preview';
      all('[data-offer-badge]').forEach(node => { node.textContent = badge; });
      all('[data-countdown-heading]').forEach(node => { node.textContent = live ? 'Time left to enter' : ended ? 'This countdown has ended' : '15-day preview countdown'; });
      all('[data-timer-date]').forEach(node => {
        node.textContent = state === 'unavailable' ? 'Offer date is being finalized.' : `${live ? 'Entry deadline' : 'Preview deadline'}: ${dateLabel(promotion.endsAt)}`;
      });
      const disclaimer = live ? 'Entry is by text. Share confirmation is reviewed by Kamran; an entry is not a guaranteed discount.' : ended ? 'Entries are closed. Contact Kamran for future offers.' : 'Preview only. The post, prize details, and rules are being finalized. Entries are not open.';
      all('[data-offer-disclaimer]').forEach(node => { node.textContent = disclaimer; });
      all('[data-offer-entry]').forEach(link => {
        link.hidden = !live;
        if (live) setSMS(link, 'Hi Kamran! I would like to enter the referral giveaway. I have read the rules, told five friends, and shared the designated post. Here are my details and confirmation: ');
      });
      if (live) {
        all('[data-offer-description]').forEach(node => { node.textContent = promotion.prizeDetails; });
        all('[data-offer-rules]').forEach(node => {
          node.replaceChildren();
          [promotion.eligibility, promotion.winnerSelection, ...promotion.officialRules].forEach(text => {
            const paragraph = document.createElement('p'); paragraph.textContent = text; node.append(paragraph);
          });
          const post = document.createElement('a'); post.href = promotion.sharePostUrl;
          post.textContent = 'Open the designated post ↗'; post.className = 'text-link';
          post.target = '_blank'; post.rel = 'noopener noreferrer'; node.append(post);
          node.closest('details').hidden = false;
        });
      } else { all('.offer-rules').forEach(node => { node.hidden = true; }); }
    }
    function tick() {
      const state = promotionState(promotion);
      paintOffer(state);
      const parts = countdownParts(promotion.endsAt);
      timers.forEach(timer => {
        all('[data-time]', timer).forEach(node => { node.textContent = parts ? String(parts[node.dataset.time]).padStart(2, '0') : '—'; });
        timer.setAttribute('aria-label', parts ? `${state === 'live' ? 'Entry' : 'Preview'} countdown: ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes remaining` : 'Offer date is being finalized');
      });
    }
    if (timers.length) { tick(); setInterval(tick, 1000); }
  })();
}
