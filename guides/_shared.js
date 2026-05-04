// Truvida Guides — shared behavior: tabs, FAQ, language toggle

(function(){
  // --- Language toggle ---
  const LANG_KEY = 'truvida_lang';
  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }
  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
  }
  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-en]').forEach(el => {
      const en = el.getAttribute('data-en');
      const es = el.getAttribute('data-es');
      if (lang === 'es' && es !== null) {
        el.innerHTML = es;
      } else if (en !== null) {
        el.innerHTML = en;
      }
    });
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('on', b.dataset.lang === lang);
    });
  }
  window.applyGuideLang = applyLang;
  window.getGuideLang = getLang;

  // --- Tabs ---
  window.showTab = function(id, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const section = document.getElementById(id);
    if (section) section.classList.add('active');
    if (btn) btn.classList.add('active');
    // Scroll to just below the sticky tab nav
    const tabNav = document.querySelector('.tab-nav');
    if (tabNav) {
      const y = tabNav.offsetTop;
      window.scrollTo({ top: y - 80, behavior: 'smooth' });
    }
  };

  // --- FAQ ---
  window.toggleFaq = function(btn) {
    const a = btn.nextElementSibling;
    const open = a.classList.contains('open');
    a.classList.toggle('open', !open);
    btn.classList.toggle('open', !open);
  };

  // --- Init ---
  document.addEventListener('DOMContentLoaded', function() {
    applyLang(getLang());
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });
  });
})();
