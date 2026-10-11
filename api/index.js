'use strict';
const { createApplication } = require('../lib/handler.cjs');
let application;
module.exports = async function (req, res) {
  try {
    if (!application) application = createApplication({ publicDeployment: true });
    const url = new URL(req.url, 'http://localhost');
    const route = req.query?.route || url.searchParams.get('route');
    if (route) {
      url.searchParams.delete('route');
      const query=url.searchParams.toString();
      req.url='/api/'+(Array.isArray(route)?route.join('/'):route)+(query?'?'+query:'');
    }
    return await application.handler(req, res);
  } catch (_) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Hosting configuration is incomplete. Set DATABASE_URL and DEMO_PASSWORD.' }));
  }
};
