/*
 * analytics.js – Cookieloses Tracking für mamabande.de (Umami)
 *
 * Eingebunden am Seitenende jeder Seite:  <script defer src="/analytics.js"></script>
 *
 * Prinzip (wie auf linja.me):
 *   - Cookieless, kein Consent-Banner nötig. Die Datenschutzerklärung nennt Umami bereits.
 *   - "Do Not Track" und eine lokale Opt-out-Flag werden respektiert.
 *   - Zusätzlich zu den automatischen Pageviews feuern wir die Funnel-Events,
 *     die für den Pilot zählen: Wie viele kommen von der Landing in die App?
 *   - Die Inline-Aufrufe track('...') in index.html laufen weiter, sie nutzen
 *     window.umami, das dieses Script bereitstellt.
 *
 * EINMALIGE KONFIGURATION:
 *   -> WEBSITE_ID unten durch die echte ID aus dem Umami-Dashboard ersetzen
 *      (cloud.umami.is -> Websites -> Add website -> mamabande.de -> ID kopieren).
 *      Solange der Platzhalter steht, lädt das Tracking bewusst NICHTS: die Seite
 *      bleibt vollständig tracking-frei, es gibt keine fehlschlagenden Requests.
 */
(function () {
    'use strict';

    // ====== KONFIG ======
    var WEBSITE_ID = '__MAMABANDE_WEBSITE_ID__'; // <- hier die echte Umami-Website-ID eintragen
    var SCRIPT_SRC = 'https://cloud.umami.is/script.js'; // gleiche Region wie linja.me
    // =====================

    // Noch nicht konfiguriert -> nichts laden (Seite bleibt tracking-frei)
    if (WEBSITE_ID.indexOf('__') === 0) return;

    // Respektiere "Do Not Track" und eine lokale Opt-out-Flag
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    try { if (localStorage.getItem('mamabande-no-track') === '1') return; } catch (e) {}

    // ---- Umami-Script laden ----
    var s = document.createElement('script');
    s.defer = true;
    s.src = SCRIPT_SRC;
    s.setAttribute('data-website-id', WEBSITE_ID);
    document.head.appendChild(s);

    // ---- Helfer: Event feuern (no-op falls umami noch nicht da) ----
    function track(name, data) {
        try {
            if (window.umami && typeof window.umami.track === 'function') {
                data ? window.umami.track(name, data) : window.umami.track(name);
            }
        } catch (e) {}
    }

    var slug = location.pathname.split('/').pop().replace('.html', '') || 'start';

    // ---- Klick-Events (Delegation, capture) ----
    document.addEventListener('click', function (e) {
        var el = e.target.closest ? e.target.closest('a, button') : null;
        if (!el) return;
        var href = (el.getAttribute('href') || '').toLowerCase();

        // Der eine Übergang, der zählt: Landing -> App
        if (href.indexOf('app.mamabande.de') !== -1) track('zur-app', { quelle: slug });
        else if (href.indexOf('mailto:') === 0)       track('kontakt-email', { quelle: slug });
        else if (href.indexOf('installieren') !== -1) track('cta-installieren', { quelle: slug });
        else if (href.indexOf('so-funktionierts') !== -1) track('cta-so-funktionierts', { quelle: slug });
        else if (href.indexOf('faq') !== -1)          track('cta-faq', { quelle: slug });
        else if (/^https?:\/\//.test(href) && href.indexOf('mamabande.de') === -1) {
            track('outbound', { ziel: href });
        }
    }, true);

    // ---- Aufgeklappte FAQ-Fragen (details/summary) ----
    document.addEventListener('toggle', function (e) {
        var d = e.target;
        if (d && d.tagName === 'DETAILS' && d.open) {
            var frage = (d.querySelector('summary') || {}).textContent || '';
            track('faq-geoeffnet', { frage: frage.trim().slice(0, 80) });
        }
    }, true);

    // ---- Lesetiefe: einmaliges Event bei 75% ----
    var read = false;
    window.addEventListener('scroll', function () {
        if (read) return;
        var doc = document.documentElement;
        var reached = (window.scrollY + window.innerHeight) / (doc.scrollHeight || 1);
        if (reached >= 0.75) {
            read = true;
            track('seite-gelesen', { seite: slug });
        }
    }, { passive: true });
})();
