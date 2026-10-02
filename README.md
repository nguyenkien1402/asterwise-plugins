# Aster for n8n

Generate text with [Aster Work](https://asterwise.dev) through one **Generate Text**
action. This community package has no runtime dependencies and uses n8n's
credential system. It is not yet published or verified by n8n.

## Install

This package requires **Node.js 24 or later for consumers and development**
(`engines.node: >=24`). For self-hosted n8n, the Node.js process running n8n must
meet that requirement; when using Docker, check the runtime inside the image.
The qualified host is n8n 2.41.6, which also declares Node.js >=24. Development
checks ran on Node 24.21.0; the mocked workflow import/execution passed in the
official n8n 2.41.6 image on Node 26.7.0. These checks do not qualify every n8n
or Node.js version allowed by the minimum requirement.

After publication, self-hosted n8n users can install `n8n-nodes-aster` in
**Settings → Community Nodes**. n8n Cloud discovery requires n8n verification.
For local evaluation, build and pack this repository, then install the tarball in
your disposable n8n custom-node directory:

```sh
npm ci --ignore-scripts
npm test
npm run lint
npm run typecheck
npm pack
```

See [n8n private-node installation guidance](https://docs.n8n.io/connect/create-nodes/deploy-your-node/install-private-nodes/).

## Configure

Create an **Aster API** credential using your existing Aster API key and select
it on the Aster node. Credential testing uses authenticated `GET /v1/models`
discovery; it does not generate billable text. Keys stay in n8n credentials.
The API host is fixed to `https://api.asterwise.dev`.

Import [the minimal workflow](examples/generate-text.json), choose your credential
and execute only when you intend to use Aster credit. The example contains no
credential identifiers or keys.

## Generate Text

Each incoming item sends one non-streaming text request using `aster-work` at
`POST /v1/chat/completions`. Prompt supports expressions. An optional system
instruction precedes the prompt. Each text field allows at most 100,000 characters.
Maximum Output Tokens defaults to 1024 and accepts integers from 1–4096;
reasoning tokens can consume part of that allowance. This bounds output, not price
or input context. No tools, attachments, saved chat or automatic retries are included.

Output contains `text`, `model`, `finishReason`, `usage` and `id`, with n8n item
pairing. `length` indicates potentially incomplete output and does not trigger a
retry. Usage metadata is not a billing receipt. The timeout is five minutes;
inspect Aster Usage before retrying an uncertain request. Prompts and generated
text may be retained in your n8n execution history.

Safe errors preserve these distinctions:

| HTTP | Meaning |
| --- | --- |
| 400 | Request rejected |
| 401 | Invalid or revoked API key |
| 402 | Insufficient funds |
| 403 | Access denied or billing review |
| 429 | Daily or concurrency limit |
| 503 | Temporary service failure |

Continue On Fail emits a safe error and status code when available. Raw transport
errors, authorization headers and request text are not forwarded by this node.

## Development and qualification

`npm test` builds and runs mocked unit tests. `npm run lint` uses n8n's strict
upstream rules. `npm run typecheck` checks TypeScript. Runtime qualification passed with n8n 2.41.6 in
a disposable instance with HTTP requests intercepted and synthetic credentials;
it is not live provider acceptance. See [release preparation](PUBLISHING.md).

The development lockfile still includes upstream advisory findings in n8n tooling;
see [dependency review](DEPENDENCY-REVIEW.md). No runtime dependencies are bundled.

API references: [Chat Completions](https://docs.asterwise.dev/api/chat-completions)
and [parameters](https://docs.asterwise.dev/api/parameters).

## License

[MIT](LICENSE), Copyright 2026 VectorQ Lab. Maintainer:
[ryan.nguyen@asterwise.dev](mailto:ryan.nguyen@asterwise.dev).
