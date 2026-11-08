# Vultr deployment record

Status: **Public deployment verified November 7, 2026**. Evidence: [public smoke results](public-smoke.json) and [browser screenshot](../screenshots/vultr-public-atc.png).

| Evidence | Value |
|---|---|
| Credit balance verified in account | Verified privately; sufficient for the selected plan |
| Credit expiration | December 8, 2026 |
| Billing currency / displayed instance price | USD / $10 per month; provider displays approximately $0.02/hour |
| Coverage of intended deployment period | Credit balance and selected price verified before creation; owner must monitor billing |
| Owner-confirmed teardown time / reminder | Review December 7, before credits expire December 8; owner must destroy the instance when no longer needed |
| Region / instance size (at least 1 vCPU, 2 GB RAM) | New Jersey (New York region), 1 vCPU, 2GB RAM, 55GB SSD |
| Ubuntu version | 24.04 LTS x64 |
| Deployed commit | `a1449a8e3c1095ff562325983b29543ea1fd9682` |
| Public HTTP IP URL | http://66.135.1.179 |
| Health response | ready=true, 12 fixtures, static-cruise-v1 |
| Saved, reverse, zero-wind checks | Passed public API checks; zero-wind times equal |
| Uncached calculation and valid time | KBOS–LFPG completed; frozen forecast 2026-11-07 17:00 UTC; hash and metrics in public-smoke.json |
| Separate-device verification | Public browser and API checked from client outside VM; independent physical phone check remains pending |
| Logs / restart verification | Initial cloud-init completed and both containers healthy; restart rehearsal not performed |

Credits-only policy: provision no resource until balance, eligibility, expiration and displayed price are verified. Do not add GPUs, paid backups, domains or optional services. A credit balance is not a hard spending cap; record a teardown/reminder before expiration and have the owner review billing. Stopping an instance may continue billing. Destruction belongs to the owner's approved teardown flow.

Only Caddy publishes public application ports. Backend port8000 stays private. Restrict SSH ingress to the operator's current public IP. Begin at HTTP server IP; do not claim HTTPS until a real domain and valid certificate are configured. Do not store private keys or account secrets in this record.

SSH hardening was verified on deployment: key-only operator account, root/password login disabled, port 22 restricted to the operator address, and backend port 8000 unpublished. A pre-existing unrestricted SSH rule was removed. On the later client network, a new SSH connection timed out because its public IP had changed; public HTTP health still passed. Use the Vultr console to update the allowed operator address before future maintenance. Do not reopen SSH globally. No private keys are included in Git.
