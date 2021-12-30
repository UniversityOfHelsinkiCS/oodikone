const router = require('express').Router()
const config = require('../conf-backend')

// Produces the Matomo tracker initialization script for the frontend.
// Matomo URL and site id are baked here instead of in the frontend
// so we can fix them on the fly instead of rebuilding the entire frontend.

const acual = `
var _paq = window._paq || [];
/* tracker methods like "setCustomDimension" should be called before "trackPageView" */
_paq.push(["trackPageView"]);
_paq.push(["enableLinkTracking"]);
(function() {
  var u = "${config.MATOMO_URL}";
  _paq.push(["setTrackerUrl", u + "matomo.php"]);
  _paq.push(["setSiteId", "${config.MATOMO_SITE_ID}"]);
  _paq.push(["enableHeartBeatTimer"]);
  var d = document,
    g = d.createElement("script"),
    s = d.getElementsByTagName("script")[0];
  g.type = "text/javascript";
  g.async = true;
  g.defer = true;
  g.src = u + "matomo.js";
  s.parentNode.insertBefore(g, s);
})();
`

const script = config.MATOMO_URL ? acual : ''

router.get('/matomo-init', (_, res) => {
  res.contentType('text/javascript; charset=UTF-8')
  res.send(script)
})

module.exports = router
