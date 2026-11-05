
const toggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
if (toggle && sidebar) {
  toggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    sidebar.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}
const links = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('#presentacion, #modulo-emociones, #modulo-comunicacion')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
      }
    });
  }, {rootMargin: '-20% 0px -65% 0px'});
  sections.forEach(section => observer.observe(section));
}
