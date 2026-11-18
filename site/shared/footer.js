/* Hjernebarometeret — Shared Footer
   Injects footer into <div id="site-footer"></div>
*/
(function(){
  var el = document.getElementById('site-footer');
  if(!el) return;

  var logoSvg = '<svg width="24" height="24" viewBox="0 0 100 100" fill="none"><path d="M50 5 A45 45 0 0 1 95 50" stroke="#d45454" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M50 5 A45 45 0 0 0 5 50" stroke="#4a8ec2" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="6" fill="#1c1b1a"/><line x1="50" y1="50" x2="50" y2="18" stroke="#1c1b1a" stroke-width="3" stroke-linecap="round" transform="rotate(-30,50,50)"/></svg>';

  el.innerHTML = '<footer class="sf">' +
    '<div class="sf-top">' +
      '<div class="sf-brand"><div class="sn-logo">' + logoSvg + ' Hjernebarometeret</div>' +
      '<p>Selvtestene er midlertidigt på pause under en faglig gennemgang.</p></div>' +
      '<div class="sf-cols">' +
        '<div><h6>Tests</h6><a href="/#tests">Se testenes status</a><a href="/tests/virksomhed.html">Virksomhedsanalyse</a></div>' +
        '<div><h6>Information</h6><a href="/rapporter.html">Rapporter og tidligere køb</a><a href="/om-os.html">Om os</a><a href="/#faq">FAQ</a><a href="mailto:kontakt@hjernebarometeret.dk">Kontakt</a></div>' +
        '<div><h6>Juridisk</h6><a href="/handelsbetingelser.html">Handelsbetingelser</a><a href="/privatlivspolitik.html">Privatlivspolitik</a></div>' +
        '<div><h6>Konto</h6><a href="/profil.html">Min profil</a><a href="/rapporter.html">Hjælp med tidligere køb</a></div>' +
      '</div>' +
    '</div>' +
    '<div class="sf-bot">' +
      '<p>&copy; 2026 Hjernebarometeret.dk</p>' +
    '</div>' +
  '</footer>';
})();
