/**
 * Resilient HTTP Client with DNS-over-HTTPS (DoH) & TLS SNI Bypass
 * Seamlessly bypasses ISP carrier blocks across Node.js CLI & React Native
 */

import { resolveUrlWithDoh } from '../../utils/DnsResolver.js';

export async function resilientHttpGet(url, referer = "", timeoutMs = 8000) {
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ...(referer ? { 'Referer': referer } : {})
  };

  // 1. Try standard fetch first with quick failover
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const initialTimeout = Math.min(timeoutMs, 3000);
  const timer = controller ? setTimeout(() => controller.abort(), initialTimeout) : null;

  try {
    const res = await fetch(url, {
      headers: defaultHeaders,
      signal: controller ? controller.signal : undefined
    });
    if (timer) clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return await res.text();
  } catch (err) {
    if (timer) clearTimeout(timer);

    // 2. Carrier DNS poisoning / ISP block fallback via DoH & SNI
    try {
      const doh = await resolveUrlWithDoh(url);
      if (doh && (doh.ip || doh.url)) {
        if (typeof process !== 'undefined' && process.versions && process.versions.node && doh.ip) {
          const https = await import('https');
          return await new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const req = https.request({
              hostname: doh.ip,
              port: 443,
              path: parsedUrl.pathname + parsedUrl.search,
              method: 'GET',
              headers: {
                Host: doh.originalHost,
                ...defaultHeaders
              },
              servername: doh.originalHost,
              timeout: timeoutMs
            }, (res) => {
              let data = '';
              res.on('data', chunk => { data += chunk; });
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                  resolve(data);
                } else {
                  reject(new Error(`DoH HTTPS ${res.statusCode} for ${url}`));
                }
              });
            });

            req.on('timeout', () => {
              req.destroy();
              reject(new Error(`DoH request timeout after ${timeoutMs}ms`));
            });
            req.on('error', reject);
            req.end();
          });
        }

        // In React Native / mobile environment
        const dohRes = await fetch(doh.url, {
          headers: {
            Host: doh.originalHost,
            ...defaultHeaders
          }
        });
        if (dohRes.ok) return await dohRes.text();
      }
    } catch (_) {
      // Fallback failed
    }

    throw err;
  }
}

export default resilientHttpGet;
