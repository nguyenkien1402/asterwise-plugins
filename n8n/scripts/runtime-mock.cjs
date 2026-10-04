// Test-only preload: intercept the real n8n HTTP helper; never contact Aster.
const assert = require('node:assert/strict');
const nock = require('nock');
nock.disableNetConnect();
const scope = nock('https://api.asterwise.dev', {
  reqheaders: { authorization: 'Bearer synthetic-runtime-fixture-not-a-real-key' },
})
  .post('/v1/chat/completions', {
    model: 'aster-work',
    messages: [
      { role: 'system', content: 'Use plain English.' },
      { role: 'user', content: 'Write a one-sentence welcome for a new teammate.' },
    ],
    max_tokens: 256,
    stream: false,
  })
  .reply(200, {
    id: 'mock-chat-runtime',
    choices: [{ message: { content: 'Welcome to the team.' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 20, completion_tokens: 6, total_tokens: 26 },
  });
process.on('exit', () => {
  try {
    assert.equal(scope.isDone(), true, 'Runtime did not make the expected mocked request');
    console.log('ASTER_RUNTIME_MOCK_REQUEST_VERIFIED');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
});
