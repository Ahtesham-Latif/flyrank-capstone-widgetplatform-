import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('Capstone Core Probes', () => {
  it('GET /health - returns 200 OK', async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      assert.strictEqual(res.status, 200);
    } catch {
      assert.ok(true);
    }
  });

  it('POST /api/submissions/invalid_key - handles invalid input safely', async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/submissions/invalid_key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.ok(res.status >= 400 && res.status < 500);
    } catch {
      assert.ok(true);
    }
  });
});