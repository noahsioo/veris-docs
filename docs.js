document.addEventListener('DOMContentLoaded', () => {

  // ---- SCROLL ANIMATIONS ----
  const animEls = document.querySelectorAll('[data-animate]');
  if (animEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    animEls.forEach(el => io.observe(el));
  }

  // ---- CODE COPY ----
  window.copyCode = function(btn) {
    const block = btn.closest('.code-block');
    const code = block.querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
  };

  window.copyInstall = function(btn) {
    navigator.clipboard.writeText('npm install -g veris').then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
  };

  // ---- MOBILE SIDEBAR ----
  const hamburger = document.querySelector('.nav-hamburger');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.querySelector('.sidebar-overlay');
  const sidebarClose = document.querySelector('.sidebar-close');

  function openSidebar() { sidebar?.classList.add('open'); }
  function closeSidebar() { sidebar?.classList.remove('open'); }

  hamburger?.addEventListener('click', openSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);
  sidebarClose?.addEventListener('click', closeSidebar);

  // ---- CMD+K SEARCH ----
  const searchOverlay = document.querySelector('.search-overlay');
  const searchInput = document.querySelector('.search-input');
  const searchResults = document.querySelector('.search-results');
  const navSearch = document.querySelector('.nav-search');
  let searchData = null;
  let activeIdx = -1;

  function getBasePath() {
    const depth = (window.location.pathname.match(/\//g) || []).length - 1;
    if (depth <= 1) return './';
    return '../'.repeat(depth - 1) + (window.location.pathname.startsWith('/') ? '' : '');
  }

  async function loadSearch() {
    if (searchData) return;
    try {
      const paths = ['./search-index.json', '../search-index.json', '/search-index.json'];
      for (const p of paths) {
        try {
          const r = await fetch(p);
          if (r.ok) { searchData = await r.json(); return; }
        } catch(e) {}
      }
    } catch(e) {}
  }

  function openSearch() {
    loadSearch();
    searchOverlay?.classList.add('open');
    searchInput?.focus();
    searchInput && (searchInput.value = '');
    renderResults('');
    activeIdx = -1;
  }

  function closeSearch() {
    searchOverlay?.classList.remove('open');
    activeIdx = -1;
  }

  function renderResults(query) {
    if (!searchResults) return;
    if (!searchData || !query.trim()) {
      searchResults.innerHTML = query.trim()
        ? '<div class="search-empty">No results found</div>'
        : '<div class="search-empty">Type to search docs...</div>';
      return;
    }
    const q = query.toLowerCase();
    const matches = searchData.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.keywords || []).some(k => k.toLowerCase().includes(q))
    );
    if (!matches.length) {
      searchResults.innerHTML = '<div class="search-empty">No results found</div>';
      return;
    }
    searchResults.innerHTML = matches.map((m, i) =>
      `<a href="${m.url}" class="search-result${i === activeIdx ? ' active' : ''}">
        <div class="search-result-title">${m.title}</div>
        <div class="search-result-desc">${m.description || ''}</div>
      </a>`
    ).join('');
  }

  navSearch?.addEventListener('click', openSearch);
  searchOverlay?.addEventListener('click', (e) => { if (e.target === searchOverlay) closeSearch(); });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); return; }
    if (e.key === 'Escape' && searchOverlay?.classList.contains('open')) { closeSearch(); return; }

    if (!searchOverlay?.classList.contains('open')) return;
    const items = searchResults?.querySelectorAll('.search-result');
    if (!items?.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
      items[activeIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
      items[activeIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      items[activeIdx]?.click();
    }
  });

  searchInput?.addEventListener('input', (e) => {
    activeIdx = -1;
    renderResults(e.target.value);
  });

  // ---- SCROLL SPY (TOC) ----
  const tocLinks = document.querySelectorAll('.toc-link');
  if (tocLinks.length) {
    const headings = [];
    tocLinks.forEach(link => {
      const id = link.getAttribute('href')?.replace('#', '');
      const el = id && document.getElementById(id);
      if (el) headings.push({ el, link });
    });

    if (headings.length) {
      const spyIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            tocLinks.forEach(l => l.classList.remove('active'));
            const match = headings.find(h => h.el === entry.target);
            match?.link.classList.add('active');
          }
        });
      }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });
      headings.forEach(h => spyIO.observe(h.el));
    }
  }

  // ---- SIDEBAR ACTIVE STATE ----
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || currentPath.endsWith(href.replace('.html', '')) || (href === '/index.html' && currentPath === '/'))) {
      link.classList.add('active');
    }
  });

});
