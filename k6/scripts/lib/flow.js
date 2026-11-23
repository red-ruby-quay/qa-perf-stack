import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const businessErrors = new Rate('business_errors');
const loginDuration = new Trend('login_duration', true);

export function baseUrl() {
  return __ENV.API_BASE_URL || 'http://localhost:3000';
}

export function runFlow() {
  const url = baseUrl();
  const headers = { 'Content-Type': 'application/json' };

  const health = http.get(`${url}/health`);
  check(health, {
    'health is 200': (response) => response.status === 200,
  });

  const login = http.post(
    `${url}/login`,
    JSON.stringify({ username: 'demo', password: 'demo' }),
    { headers },
  );
  loginDuration.add(login.timings.duration);

  const loggedIn = check(login, {
    'login is 200': (response) => response.status === 200,
    'login returns a token': (response) => Boolean(response.json('token')),
  });
  businessErrors.add(!loggedIn);

  const list = http.get(`${url}/items?limit=10`);
  const hasItems = check(list, {
    'items is 200': (response) => response.status === 200,
    'items are present': (response) => {
      const body = response.json('items');
      return Array.isArray(body) && body.length > 0;
    },
  });
  businessErrors.add(!hasItems);
  if (!hasItems) {
    return;
  }

  const itemId = list.json('items')[0].id;
  const order = http.post(
    `${url}/orders`,
    JSON.stringify({ itemId, quantity: 1 }),
    { headers },
  );
  const ordered = check(order, {
    'order is 201': (response) => response.status === 201,
    'order has an id': (response) => Boolean(response.json('id')),
  });
  businessErrors.add(!ordered);
}
