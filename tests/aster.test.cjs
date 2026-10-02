const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Aster } = require("../dist/nodes/Aster/Aster.node.js");
const { AsterApi } = require("../dist/credentials/AsterApi.credentials.js");
function context(overrides = {}) {
  const calls = [];
  return {
    calls,
    getInputData: () => [{ json: {} }],
    getNode: () => ({
      name: "Aster",
      type: "aster",
      typeVersion: 1,
      position: [0, 0],
      parameters: {},
    }),
    getNodeParameter: (name) =>
      ({
        operation: "generateText",
        prompt: "Summarize this",
        systemInstruction: "",
        maxTokens: 1024,
      })[name],
    continueOnFail: () => false,
    helpers: {
      httpRequestWithAuthentication: async function (credential, request) {
        calls.push({ credential, request });
        return {
          id: "chat-1",
          choices: [{ message: { content: "Summary" }, finish_reason: "stop" }],
          usage: { total_tokens: 4 },
        };
      },
    },
    ...overrides,
  };
}
test("credential uses password storage and bearer authentication", () => {
  const credential = new AsterApi();
  assert.equal(credential.properties[0].typeOptions.password, true);
  assert.equal(
    credential.authenticate.properties.headers.Authorization,
    "=Bearer {{$credentials.apiKey}}",
  );
  assert.equal(credential.test.request.method, "GET");
  assert.equal(credential.test.request.url, "/v1/models"); // Discovery only; no paid inference.
});
test("exact Aster Work request and useful text output", async () => {
  const ctx = context();
  const result = await Aster.prototype.execute.call(ctx);
  assert.equal(ctx.calls[0].credential, "asterApi");
  assert.deepEqual(ctx.calls[0].request, {
    method: "POST",
    url: "https://api.asterwise.dev/v1/chat/completions",
    body: {
      model: "aster-work",
      messages: [{ role: "user", content: "Summarize this" }],
      max_tokens: 1024,
      stream: false,
    },
    json: true,
    timeout: 300000,
  });
  assert.deepEqual(result[0][0], {
    json: {
      text: "Summary",
      model: "aster-work",
      finishReason: "stop",
      usage: { total_tokens: 4 },
      id: "chat-1",
    },
    pairedItem: { item: 0 },
  });
});
test("system instruction precedes user and item expressions are evaluated separately", async () => {
  const ctx = context({
    getInputData: () => [{ json: {} }, { json: {} }],
    getNodeParameter: (name, i) =>
      ({
        operation: "generateText",
        prompt: `Prompt ${i}`,
        systemInstruction: "Be concise",
        maxTokens: 10,
      })[name],
  });
  const result = await Aster.prototype.execute.call(ctx);
  assert.equal(result[0].length, 2);
  assert.equal(result[0][1].pairedItem.item, 1);
  assert.deepEqual(ctx.calls[1].request.body.messages, [
    { role: "system", content: "Be concise" },
    { role: "user", content: "Prompt 1" },
  ]);
});
for (const value of [0, 4097, 1.5, NaN, "1024"])
  test(`rejects invalid output limit ${value}`, async () => {
    const ctx = context();
    const original = ctx.getNodeParameter;
    ctx.getNodeParameter = (name) =>
      name === "maxTokens" ? value : original(name);
    await assert.rejects(
      () => Aster.prototype.execute.call(ctx),
      /integer from 1 to 4096/,
    );
    assert.equal(ctx.calls.length, 0);
  });
for (const prompt of ["", "  ", "x".repeat(100001)])
  test(`rejects invalid prompt length ${prompt.length}`, async () => {
    const ctx = context();
    const original = ctx.getNodeParameter;
    ctx.getNodeParameter = (name) =>
      name === "prompt" ? prompt : original(name);
    await assert.rejects(
      () => Aster.prototype.execute.call(ctx),
      /nonempty prompt/,
    );
    assert.equal(ctx.calls.length, 0);
  });
for (const [status, pattern] of [
  [400, /rejected/],
  [401, /invalid or revoked/],
  [402, /insufficient/],
  [403, /denied/],
  [429, /daily or concurrency/],
  [503, /temporarily unavailable/],
  [500, /request failed/],
])
  test(`safe HTTP ${status} distinction`, async () => {
    const ctx = context({
      helpers: {
        httpRequestWithAuthentication: async () => {
          throw {
            statusCode: status,
            message: "secret-key and private-prompt",
            request: { headers: { Authorization: "secret-key" } },
          };
        },
      },
    });
    await assert.rejects(
      () => Aster.prototype.execute.call(ctx),
      (e) => {
        assert.match(e.message, pattern);
        assert.equal(e.description, `HTTP ${status}`);
        assert.doesNotMatch(JSON.stringify(e), /secret-key|private-prompt/);
        return true;
      },
    );
  });
test("continue on fail preserves status and item pairing without raw errors", async () => {
  const ctx = context({
    continueOnFail: () => true,
    helpers: {
      httpRequestWithAuthentication: async () => {
        throw { response: { status: 402 }, message: "secret-key" };
      },
    },
  });
  const result = await Aster.prototype.execute.call(ctx);
  assert.equal(result[0][0].json.statusCode, 402);
  assert.equal(result[0][0].pairedItem.item, 0);
  assert.doesNotMatch(JSON.stringify(result), /secret-key/);
});
test("network uncertainty produces no automatic retry and no secret disclosure", async () => {
  let attempts = 0;
  const ctx = context({
    helpers: {
      httpRequestWithAuthentication: async () => {
        attempts++;
        throw new Error("secret-key");
      },
    },
  });
  await assert.rejects(
    () => Aster.prototype.execute.call(ctx),
    /Check connectivity and usage/,
  );
  assert.equal(attempts, 1);
});
test("missing text is rejected and truncated text retains finish reason", async () => {
  const ctx = context({
    helpers: {
      httpRequestWithAuthentication: async () => ({
        choices: [{ message: { content: null } }],
      }),
    },
  });
  await assert.rejects(
    () => Aster.prototype.execute.call(ctx),
    /no text content/,
  );
  ctx.helpers.httpRequestWithAuthentication = async () => ({
    choices: [{ message: { content: "Partial" }, finish_reason: "length" }],
  });
  assert.equal(
    (await Aster.prototype.execute.call(ctx))[0][0].json.finishReason,
    "length",
  );
});
