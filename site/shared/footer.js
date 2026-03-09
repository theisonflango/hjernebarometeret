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
      '<p>Danmarks platform for professionelle selvtests inden for kognition, neuropsykologi og personlig udvikling.</p></div>' +
      '<div class="sf-cols">' +
        '<div><h6>Tests</h6><a href="/tests/iq.html">IQ-test</a><a href="/tests/adhd.html">ADHD-screening</a><a href="/tests/autisme.html">Autisme-test</a><a href="/tests/personlighed.html">Personlighedstest</a><a href="/tests/stress.html">Stress & udbrændthed</a></div>' +
        '<div><h6>Information</h6><a href="/rapporter.html">Rapporter & priser</a><a href="/om-os.html">Om os</a><a href="/#faq">FAQ</a><a href="mailto:kontakt@hjernebarometeret.dk">Kontakt</a></div>' +
        '<div><h6>Konto</h6><a href="#" onclick="event.preventDefault();if(window.HB_AUTH)HB_AUTH.showLogin();">Log ind</a><a href="#" onclick="event.preventDefault();if(window.HB_AUTH){HB_AUTH._toggleSignup({preventDefault:function(){}});HB_AUTH.showLogin();}">Opret konto</a></div>' +
      '</div>' +
    '</div>' +
    '<div class="sf-bot">' +
      '<p>&copy; 2026 Hjernebarometeret.dk</p>' +
      '<p class="sf-disc">Alle tests er screeningsv\u00e6rkt\u00f8jer \u2014 ikke kliniske diagnoser. S\u00f8g altid professionel r\u00e5dgivning. Betaling via Stripe.</p>' +
    '</div>' +
  '</footer>';
})();
