(() => {
  const button = document.querySelector('.nav-burger');
  const menu = document.getElementById('site-menu');
  const setMenu = open => { menu.hidden = !open; button.setAttribute('aria-expanded', String(open)); };
  button.addEventListener('click', event => { event.stopPropagation(); setMenu(menu.hidden); });
  document.addEventListener('click', event => { if (!menu.hidden && !menu.contains(event.target)) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { setMenu(false); button.focus(); } });
  const printButton = document.getElementById('print-report');
  printButton.addEventListener('click', async () => {
    printButton.disabled = true;
    printButton.textContent = 'Preparing charts…';
    try {
      await Promise.all([...document.querySelectorAll('.report-copy img')].map(image => {
        image.loading = 'eager';
        return image.decode();
      }));
      window.print();
      printButton.textContent = 'Print / Save PDF ↓';
    } catch {
      printButton.textContent = 'Charts could not load — retry';
    } finally {
      printButton.disabled = false;
    }
  });
})();
