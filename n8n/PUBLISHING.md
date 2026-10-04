# Publication

Target repository: https://github.com/nguyenkien1402/asterwise-plugins
Target npm package: `n8n-nodes-aster`, initially `0.1.0`.
The package source is in `n8n/` within this public integrations repository.
Its npm repository metadata identifies that directory. Run package commands from
`n8n/`; the GitHub workflows stay in the repository root `.github/workflows/`.
Publication and n8n verification approval are separate outcomes.

Before first publication:

1. Sign in to the intended npm maintainer account and confirm package ownership.
   A new package cannot yet have a trusted-publisher setting; resolve npm's
   first-publication/bootstrap flow with the maintainer. If it requires a granular
   token, approve its exact package-only permissions and lifetime separately;
   never send tokens in chat. Do not publish from a local terminal, because n8n
   requires GitHub Actions provenance.
2. Configure the npm trusted publisher for owner `nguyenkien1402`, repository
   `asterwise-plugins`, workflow filename `publish.yml` (no environment), permitting
   direct `npm publish`. This is a security-sensitive grant requiring owner approval.
3. Confirm CI passes, review the exact tree and package contents, then manually run
   **Publish with provenance** on `main` with version `0.1.0`.
4. Verify the public registry version, tarball integrity and provenance attestation.
   Run `npx @n8n/scan-community-package n8n-nodes-aster` against the published version.
5. Sign in to https://creators.n8n.io/nodes and submit the npm package for
   verification. Accept any new legal agreement only with explicit owner approval.
   Report submission separately from approval; no review date is promised.

The package's Node.js >=24 requirement applies to consumers, including the
self-hosted n8n process, as well as development. Retain `engines.node: >=24`;
lower minimums require separate testing. Recorded qualification covers development
on Node 24.21.0 and mocked n8n 2.41.6 execution on image Node 26.7.0, not every
allowed runtime combination. The n8n 2.41.6 package itself declares Node.js >=24.

CI and publication use Node 24, strict upstream lint and no runtime dependencies.
The publish workflow grants OIDC only and stores no npm token. It is manually
triggered to avoid accidental releases on ordinary source pushes.

Official requirements:
- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/generating-provenance-statements/
- https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes
