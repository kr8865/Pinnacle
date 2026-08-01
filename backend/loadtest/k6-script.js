// Load test for Pinnacle Tuition Classes backend.
//
// What this does: simulates a growing number of "virtual users" (VUs) browsing
// the public course list, and optionally logging in, at the same time — then
// reports how many requests/sec the server handled and how response times
// changed as load increased. That's how you get a *real* answer to
// "how many users can this handle" instead of a guess.
//
// HOW TO RUN
// 1. Install k6 (one-time):
//      macOS:   brew install k6
//      Windows: choco install k6
//      Linux:   see https://k6.io/docs/get-started/installation/
//
// 2. Point it at your LOCAL backend (recommended first — rate limiting is
//    skipped when NODE_ENV=development, so you're measuring the server's raw
//    capacity, not your own rate limiter):
//      cd backend && npm run dev        (leave this running in one terminal)
//      k6 run backend/loadtest/k6-script.js
//
// 3. Or point it at your LIVE Render backend (rate limiting IS active there —
//    200 requests / 15 min / IP by default — so you'll see 429s once you
//    cross that ceiling; that's expected and is itself a useful data point):
//      BASE_URL=https://pinnacle-2-ajdc.onrender.com k6 run backend/loadtest/k6-script.js
//
// 4. To also test the login endpoint (heavier — bcrypt cost 12 per login),
//    set TEST_LOGIN=1 and point at an account you don't mind hitting
//    repeatedly (use the seeded admin, or a seeded test student):
//      TEST_LOGIN=1 LOGIN_EMAIL=admin@pinnacletuition.com LOGIN_PASSWORD=Kr@30123 \
//        k6 run backend/loadtest/k6-script.js

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5003';
const TEST_LOGIN = __ENV.TEST_LOGIN === '1';
const LOGIN_EMAIL = __ENV.LOGIN_EMAIL || '';
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || '';

// Ramp profile: gradually increases concurrent virtual users so you can see
// exactly where response times start climbing or errors start appearing —
// that point is your real capacity ceiling, not a guess.
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // warm up to 20 concurrent users
    { duration: '1m', target: 20 },    // hold steady, see baseline latency
    { duration: '30s', target: 50 },   // ramp to 50 concurrent users
    { duration: '1m', target: 50 },    // hold, see if latency/errors climb
    { duration: '30s', target: 100 },  // ramp to 100 concurrent users
    { duration: '1m', target: 100 },   // hold at 100 — this is the real test
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    // If more than 1% of requests fail, or p95 latency exceeds 2s, k6 will
    // mark the test as failed — a quick pass/fail signal without reading
    // the whole report.
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  // Simulate a visitor browsing the public course list (real, read-only,
  // no side effects — safe to hit repeatedly, including on production).
  const coursesRes = http.get(`${BASE_URL}/api/v1/courses`);
  check(coursesRes, {
    'courses: status is 200': (r) => r.status === 200,
  });

  if (TEST_LOGIN && LOGIN_EMAIL && LOGIN_PASSWORD) {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(loginRes, {
      'login: status is 200 or handled': (r) => [200, 401, 403, 429].includes(r.status),
    });
  }

  // Real users don't hammer the server in a tight loop — they pause between
  // actions. This "think time" makes the test represent actual usage instead
  // of an artificial worst case.
  sleep(Math.random() * 2 + 1); // 1-3 seconds between actions
}
