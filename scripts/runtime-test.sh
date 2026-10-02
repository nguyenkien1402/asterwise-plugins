#!/usr/bin/env bash
set -euo pipefail
# Requires Docker and test-only nock installed outside the shipped package.
: "${ASTER_MOCK_TOOLS:?Set ASTER_MOCK_TOOLS to a directory with node_modules/nock}"
package_root="$(cd "$(dirname "$0")/.." && pwd)"
fixture_root="$(mktemp -d "${TMPDIR:-/tmp}/aster-n8n-runtime.XXXXXX")"
trap 'rm -rf "$fixture_root"' EXIT
mkdir -p "$fixture_root/.n8n/nodes/node_modules/n8n-nodes-aster/node_modules"
cp -R "$package_root/dist" "$fixture_root/.n8n/nodes/node_modules/n8n-nodes-aster/dist"
cp "$package_root/package.json" "$fixture_root/.n8n/nodes/node_modules/n8n-nodes-aster/package.json"
ln -s /usr/local/lib/node_modules/n8n/node_modules/n8n-workflow "$fixture_root/.n8n/nodes/node_modules/n8n-nodes-aster/node_modules/n8n-workflow"
printf '%s\n' '{"dependencies":{"n8n-nodes-aster":"0.1.0"}}' > "$fixture_root/.n8n/nodes/package.json"
node - "$package_root" "$fixture_root" <<'NODE'
const fs = require('node:fs');
const [pkg, root] = process.argv.slice(2);
const workflow = JSON.parse(fs.readFileSync(`${pkg}/examples/generate-text.json`));
workflow.id = 'aster-runtime-fixture';
workflow.nodes.find(n => n.name === 'Aster').credentials = { asterApi: { id: 'aster-mock-credential', name: 'Synthetic fixture' } };
fs.writeFileSync(`${root}/workflow.json`, JSON.stringify(workflow));
// Deliberately synthetic: this is not an API key and cannot authenticate to Aster.
fs.writeFileSync(`${root}/credentials.json`, JSON.stringify([{ id: 'aster-mock-credential', name: 'Synthetic fixture', type: 'asterApi', data: { apiKey: 'synthetic-runtime-fixture-not-a-real-key' } }]));
NODE
# Both Docker network isolation and nock block real network effects.
docker run --rm --network none --user root --entrypoint sh \
  -v "$fixture_root:/home/node" \
  -v "$package_root/scripts:/qualification:ro" \
  -v "$ASTER_MOCK_TOOLS:/mock-tools:ro" \
  -e N8N_USER_FOLDER=/home/node -e N8N_DIAGNOSTICS_ENABLED=false \
  -e N8N_VERSION_NOTIFICATIONS_ENABLED=false -e N8N_TEMPLATES_ENABLED=false \
  -e N8N_COMMUNITY_PACKAGES_ENABLED=true -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
  docker.n8n.io/n8nio/n8n@sha256:87e0bab2c93192e8dd885ff7b0697c22a1bd97489568a8c67cc140fd7dbb342d \
  -c 'n8n import:credentials --input=/home/node/credentials.json && n8n import:workflow --input=/home/node/workflow.json && NODE_PATH=/mock-tools/node_modules NODE_OPTIONS="--require=/qualification/runtime-mock.cjs" n8n execute --id=aster-runtime-fixture --rawOutput' \
  > "$fixture_root/output.log" 2>&1 || { tail -80 "$fixture_root/output.log"; exit 1; }
node - "$fixture_root/output.log" <<'NODE'
const fs = require('node:fs');
const assert = require('node:assert/strict');
const output = fs.readFileSync(process.argv[2], 'utf8');
assert.match(output, /ASTER_RUNTIME_MOCK_REQUEST_VERIFIED/);
assert.match(output, /Welcome to the team\./);
assert.match(output, /mock-chat-runtime/);
assert.match(output, /"finishReason"\s*:\s*"stop"/);
assert.doesNotMatch(output, /Problem running workflow|Workflow execution failed/);
console.log('PASS: n8n 2.41.6 imported synthetic credential/workflow and executed Aster using its real HTTP helper with intercepted requests; Docker networking disabled. No live Aster request.');
NODE
