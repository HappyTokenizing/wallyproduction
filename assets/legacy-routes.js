/* Old shared links remain usable; fragments are now reserved for in-page anchors. */
(() => {
  const routes={home:'/',foundation:'/members/',members:'/members/',eco:'/ecosystem/',ecosystem:'/ecosystem/',brand:'/media-kit/',brandkit:'/media-kit/',meet:'/meet/',jobs:'/jobs/',careers:'/jobs/',news:'/news/',articles:'/research/',admin:'/admin/',learn:'/learn/',wallynft:'/wally-nft/',newsletter:'/newsletter/'};
  function migrate(){
  const match=location.hash.match(/^#\/([\w-]+)\/?$/);
  let to=match&&routes[match[1].toLowerCase()];
  if(location.pathname==='/'&&!to)to={'#primer':'/learn/','#wallynft':'/wally-nft/','#news':'/newsletter/'}[location.hash];
  if(/^\/research\/?$/.test(location.pathname))to={'#wally':'/research/wally/','#zeus':'/research/zeus/','#reports':'/research/'}[location.hash]||to;
  if(to)location.replace(to+location.search);
  }
  addEventListener('hashchange',migrate);
  migrate();
})();
