import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    public_profile: { executor: 'constant-vus', vus: Number(__ENV.VUS || 25), duration: __ENV.DURATION || '1m' }
  },
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500', 'p(99)<1000'] }
};

export default function () {
  const response = http.get(`${__ENV.BASE_URL}/api/v1/tensignal/public/${__ENV.PUBLIC_SLUG}`, {
    headers: { 'X-Forwarded-For': `10.42.${__VU % 250}.${(__ITER % 249) + 1}` }
  });
  check(response, { 'public profile returned 200': (r) => r.status === 200 });
}
