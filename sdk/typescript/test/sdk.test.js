const test = require('node:test');
const assert = require('node:assert');
const { deriveSecureTopic, encryptPayload } = require('../dist/crypto');
const { NotifyPushClient } = require('../dist/index');

test('deriveSecureTopic generates consistent hex hash with vcl- prefix', () => {
  const topic1 = deriveSecureTopic('secret123', 'production');
  const topic2 = deriveSecureTopic('secret123', 'production');
  const topicDifferent = deriveSecureTopic('secret123', 'staging');

  assert.strictEqual(topic1, topic2);
  assert.strictEqual(topic1.startsWith('vcl-'), true);
  assert.strictEqual(topic1.length, 28); // 'vcl-' + 24 chars
  assert.notStrictEqual(topic1, topicDifferent);
});

test('encryptPayload encrypts and produces valid iv, tag and ciphertext', () => {
  const testKey = Buffer.alloc(32, 1).toString('base64');
  const encrypted = encryptPayload('Hello NotifyPush Security', testKey);

  assert.ok(encrypted.ciphertext);
  assert.ok(encrypted.iv);
  assert.ok(encrypted.tag);
  assert.notStrictEqual(encrypted.ciphertext, 'Hello NotifyPush Security');
});

test('NotifyPushClient validates missing topic gracefully without crashing', async () => {
  const client = new NotifyPushClient({
    serverUrl: 'https://push.example.com'
  });

  const result = await client.send({
    topic: '',
    title: 'Test Warning',
    message: 'Test message'
  });

  assert.strictEqual(result.success, false);
  assert.match(result.error || '', /No topic configured/);
});
