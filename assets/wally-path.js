/* One responsive path connects the WALLY story; its ball follows reading progress. */
(() => {
  const journey = document.getElementById('mwJourney');
  if (!journey) return;
  const svg = journey.querySelector('svg');
  const paths = [...svg.querySelectorAll('path')];
  const line = journey.querySelector('.mw-path-line');
  const ball = journey.querySelector('.mw-path-ball');
  const rows = [...journey.querySelectorAll('.mw-reason')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let length = 0, frame = 0, firstY = 0;

  function position() {
    frame = 0;
    if (!length || !journey.getClientRects().length) return;
    const rect = journey.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const y = reduced.matches ? firstY : Math.max(firstY, Math.min(rect.height - 32, innerHeight * .5 - rect.top));
    // The path always moves downwards, so find the point at the viewport's reading line.
    let low = 0, high = length;
    for (let i = 0; i < 15; i++) {
      const mid = (low + high) / 2;
      if (line.getPointAtLength(mid).y < y) low = mid;
      else high = mid;
    }
    const point = line.getPointAtLength((low + high) / 2);
    ball.style.left = `${point.x}px`;
    ball.style.top = `${point.y}px`;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(position);
  }
  function draw() {
    const width = journey.clientWidth, height = journey.clientHeight;
    if (!width || !height) return;
    const mobile = width <= 860 && matchMedia('(max-width: 860px)').matches;
    const xs = rows.map((_, i) => mobile ? (i % 2 ? 31 : 19) : width * (i % 2 ? .22 : .78));
    const centers = rows.map(row => row.offsetTop + row.offsetHeight / 2);
    firstY = centers[0];
    let d = `M ${xs[0]} 24 L ${xs[0]} ${centers[0]}`;
    for (let i = 1; i < rows.length; i++) {
      const gap = rows[i].offsetTop;
      const bend = mobile ? 64 : 100;
      const before = gap - bend, after = gap + bend;
      d += ` L ${xs[i - 1]} ${before} C ${xs[i - 1]} ${gap - 10}, ${xs[i]} ${gap + 10}, ${xs[i]} ${after} L ${xs[i]} ${centers[i]}`;
    }
    d += ` L ${xs[2]} ${height - 24}`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    paths.forEach(path => path.setAttribute('d', d));
    length = line.getTotalLength();
    schedule();
  }
  new ResizeObserver(draw).observe(journey);
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', draw, {passive: true});
  reduced.addEventListener('change', schedule);
  document.fonts.ready.then(draw);
  draw();
})();
