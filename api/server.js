import express from 'express';
import { randomUUID } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 3000);
const baseLatency = Number(process.env.BASE_LATENCY_MS || 40);

app.use(express.json());
app.use((request, response, next) => {
  const jitter = Math.floor(Math.random() * 20);
  setTimeout(next, baseLatency + jitter);
});

const items = Array.from({ length: 50 }, (_, index) => ({
  id: index + 1,
  name: `Demo item ${index + 1}`,
  price: Number((10 + index * 1.5).toFixed(2)),
}));

const orders = new Map();

app.get('/health', (request, response) => {
  response.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/login', (request, response) => {
  const { username, password } = request.body ?? {};
  if (username !== 'demo' || password !== 'demo') {
    return response.status(401).json({ error: 'invalid credentials' });
  }
  return response.json({ token: randomUUID(), expiresIn: 3600 });
});

app.get('/items', (request, response) => {
  const requested = Number(request.query.limit || 20);
  const limit = Math.min(Math.max(requested, 1), items.length);
  response.json({ items: items.slice(0, limit) });
});

app.post('/orders', (request, response) => {
  const { itemId, quantity } = request.body ?? {};
  const item = items.find((entry) => entry.id === Number(itemId));
  const count = Number(quantity);

  if (!item || !Number.isInteger(count) || count < 1) {
    return response.status(400).json({ error: 'invalid order' });
  }

  const order = {
    id: randomUUID(),
    itemId: item.id,
    quantity: count,
    total: Number((item.price * count).toFixed(2)),
    status: 'created',
  };

  orders.set(order.id, order);
  return response.status(201).json(order);
});

app.get('/orders/:id', (request, response) => {
  const order = orders.get(request.params.id);
  if (!order) {
    return response.status(404).json({ error: 'not found' });
  }
  return response.json(order);
});

app.listen(port, () => {
  console.log(`demo api listening on ${port}`);
});
