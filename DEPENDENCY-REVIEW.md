# Development dependency review — 2026-10-02

No third-party runtime dependencies are declared or bundled. n8n supplies the
`n8n-workflow` peer at execution time.

Updated the development `n8n-workflow` pin from 2.16.0 to 2.28.0, an upstream
version incorporating patched lodash/form-data/uuid and expression-runtime.
Applied compatible npm lockfile fixes without force-downgrading the official
@n8n/node-cli. The audit went from 17 findings to 14 (7 moderate, 7 high), all in
the development graph. `npm audit --omit=dev` reports zero vulnerabilities.

The remaining paths are introduced by @n8n/node-cli 0.50.4's AI tooling:
axios 1.18.0 is pinned upstream; older workflow copies and LangChain uuid versions
are also brought by that toolchain. qs and stream-json paths remain constrained
by upstream packages. We tested targeted patched overrides, which produced a
clean audit, but removed them because n8n's strict community linter prohibits
package override fields. No lint rules were weakened.

The audit's force suggestion downgrades @n8n/node-cli to 0.20.0. That is below
n8n's provenance-capable 0.23.0 minimum and is not an acceptable resolution.
Remaining development findings need an upstream toolchain fix; avoid using its
AI-generation/dev-server features with untrusted input. These findings are not
hidden by the production-only CI audit and remain an explicit maintenance issue.

References:
- https://github.com/advisories/GHSA-w5hq-g745-h8pq
- https://github.com/advisories/GHSA-vh66-26gq-q6x8
- https://github.com/advisories/GHSA-528h-pc64-c93x
- https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes
