import { runFlow } from './lib/flow.js';

export const options = {
  vus: 5,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    business_errors: ['rate<0.01'],
  },
};

export default function () {
  runFlow();
}
