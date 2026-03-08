/* Hjernebarometeret — Shared Navigation
   Injects nav into <div id="site-nav"></div>
   Set data-active on the div to mark the active page: "tests", "rapporter", "om-os", "faq"
   Set data-test-mode="true" to show simplified nav (logo + exit button only)
*/
(function(){
  var el = document.getElementById('site-nav');
  if(!el) return;

  var active = (el.getAttribute('data-active') || '').toLowerCase();
  var testMode = el.getAttribute('data-test-mode') === 'true';

  var logoSvg = '<svg width="28" height="28" viewBox="0 0 100 100" fill="none"><path d="M50 5 A45 45 0 0 1 95 50" stroke="#d45454" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M50 5 A45 45 0 0 0 5 50" stroke="#4a8ec2" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="6" fill="#1c1b1a"/><line x1="50" y1="50" x2="50" y2="18" stroke="#1c1b1a" stroke-width="3" stroke-linecap="round" transform="rotate(-30,50,50)"/></svg>';

  var userSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

  var hamburgerSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

  var closeSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  function act(page){ return active === page ? ' sn-act' : ''; }

  // Simplified test mode nav
  if(testMode){
    el.innerHTML = '<nav id="nav" class="sn">' +
      '<a href="index.html" class="sn-logo">' + logoSvg + ' Hjernebarometeret</a>' +
      '<a href="index.html#tests" class="sn-exit">Afslut test</a>' +
    '</nav>';
    // Scroll effect
    var nav = document.getElementById('nav');
    window.addEventListener('scroll', function(){ nav.classList.toggle('scrolled', scrollY > 20); });
    return;
  }

  // Full nav
  el.innerHTML = '<nav id="nav" class="sn">' +
    '<a href="index.html" class="sn-logo">' + logoSvg + ' Hjernebarometeret</a>' +
    '<button class="sn-hamburger" id="sn-hamburger" aria-label="Menu">' + hamburgerSvg + '</button>' +
    '<div class="sn-right" id="sn-right">' +
      '<button class="sn-close" id="sn-close" aria-label="Luk menu">' + closeSvg + '</button>' +
      '<a href="index.html#tests" class="sn-link sn-hm' + act('tests') + '">Tests</a>' +
      '<a href="rapporter.html" class="sn-link sn-hm' + act('rapporter') + '">Rapporter</a>' +
      '<a href="om-os.html" class="sn-link sn-hm' + act('om-os') + '">Om os</a>' +
      '<a href="index.html#faq" class="sn-link sn-hm' + act('faq') + '">FAQ</a>' +
      '<a href="index.html#tests" class="sn-cta sn-hm">Tag en test</a>' +
      '<a href="#" class="sn-login" onclick="event.preventDefault();if(window.HB_AUTH)HB_AUTH.showLogin();">' + userSvg + ' Log ind</a>' +
    '</div>' +
  '</nav>';

  // Scroll border effect
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function(){ nav.classList.toggle('scrolled', scrollY > 20); });

  // Mobile hamburger toggle
  var hamburger = document.getElementById('sn-hamburger');
  var right = document.getElementById('sn-right');
  var closeBtn = document.getElementById('sn-close');

  function openMenu(){ right.classList.add('sn-open'); document.body.style.overflow = 'hidden'; }
  function closeMenu(){ right.classList.remove('sn-open'); document.body.style.overflow = ''; }

  hamburger.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);

  // Close on link click (mobile)
  right.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });

  // Close on escape
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeMenu();
  });
})();
