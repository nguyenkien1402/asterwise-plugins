# Publication

Target repository: https://github.com/nguyenkien1402/asterwise-plugins
Target npm package: `n8n-nodes-aster`, initially `0.1.0`.
The package source is in `n8n/` within this public integrations repository.
Its npm repository metadata identifies that directory. Run package commands from
`n8n/`; the GitHub workflows stay in the repository root `.github/workflows/`.
Publication and n8n verification approval are separate outcomes.

## Publication status

The initial `0.1.0` release was published on 4 October 2026 from commit
`97964fa58799e215e3871d650a3d6a2fdf942587` through
[GitHub Actions](https://github.com/nguyenkien1402/asterwise-plugins/actions/runs/37175443435).
npm registry signatures and provenance attestations were verified, and official
`@n8n/scan-community-package@0.38.0` passed all security checks for that release.
n8n Creator Portal submission and verification are separate steps.

The npm maintainer is `ryan_asterwise`. The approved trusted publisher uses GitHub
owner `nguyenkien1402`, repository `asterwise-plugins`, workflow `publish.yml`,
without an environment. npm permits publishing and staged publishing for that
configuration; independent dist-tag management is not granted. No npm token is
stored in GitHub. npm account 2FA is enabled.

Bootstrap used a temporary staged `0.0.0` candidate to create npm's public
`0.0.0-stage` package record. That bootstrap candidate must not be approved as an
integration release; actual versions are published by the provenance workflow.

## Subsequent releases

1. Update the package version and lockfile, then commit and push the reviewed
   source. Confirm CI passes and review the package contents.
2. Manually run **Publish with provenance** on `main`, using the exact new
   manifest version. Do not publish the integration from a local terminal.
3. Verify registry version, integrity and provenance, then run the official
   community-package scanner against the published version.
4. Sign in to https://creators.n8n.io/nodes and submit the npm package for
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
