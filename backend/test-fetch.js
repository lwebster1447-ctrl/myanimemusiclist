// backend/test-fetch.js
// Test file to check if Node.js can reach MusicBrainz

import https from 'https';
import { URL } from 'url';

function httpsFetch(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Test/1.0'
      },
      rejectUnauthorized: false,
      timeout: 10000
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: json
          });
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

try {
  const response = await httpsFetch('https://musicbrainz.org/ws/2/release/?query=rezero&fmt=json&limit=5');
  console.log('✅ Success! Status:', response.status);
  console.log('📊 Releases found:', response.data.releases?.length || 0);
  if (response.data.releases?.length > 0) {
    console.log('📀 First release:', response.data.releases[0].title);
  }
} catch (error) {
  console.error('❌ Failed:', error.message);
}