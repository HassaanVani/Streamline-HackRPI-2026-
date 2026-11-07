# Vultr deployment

Streamline targets one small Vultr Cloud Compute instance. Docker builds the React frontend and Python backend together; Caddy serves the public endpoint. The backend port is private to the Compose network, and weather computations run as bounded subprocesses. No secrets are needed for the free weather API.

## Account and credits

Create an account through [Vultr's MLH program](https://discover.vultr.com/mlh), apply the event promo, and confirm the available credit and expiration in billing before creating a resource. Account creation, payment verification and agreement acceptance belong to the account owner. The promo amount and eligibility must be confirmed in the account; this repository does not assume a credit amount or make paid provisioning automatic.

## Instance

Use Ubuntu 24.04 LTS, at least 1 vCPU and preferably 2 GB RAM, in a nearby available region. Choose the instance only after confirming its displayed price is covered by the credits and acceptable to the owner. A GPU is unnecessary. Add an existing SSH public key during creation; never upload a private key.

In the Vultr firewall allow TCP 80 and 443 publicly, UDP 443 optionally for HTTP/3, and TCP 22 only from the operator's IP. Leave other inbound ports closed. See [Vultr firewall instructions](https://docs.vultr.com/firewall-quickstart-for-vultr-cloud-servers). Docker's published ports interact with host firewall rules, so keep the public exposure in `compose.yaml` limited to Caddy.

## Install and deploy

Install Docker Engine and the Compose plugin using [Docker's official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/), or use Vultr's supported Docker marketplace image. Then on the instance:

```sh
sudo mkdir -p /opt/streamline
sudo chown "$USER":"$USER" /opt/streamline
git clone https://github.com/HassaanVani/Streamline-HackRPI-2026-.git /opt/streamline
cd /opt/streamline
cp .env.example .env
sudo docker compose up -d --build
sudo docker compose ps
curl --fail http://127.0.0.1/api/v1/health
curl --fail http://127.0.0.1/examples.json
```

The default `SITE_ADDRESS=:80` serves an initial demo at `http://INSTANCE_IP`. For a domain, create an A record pointing to the instance, change `.env` to `SITE_ADDRESS=your.domain`, and restart Caddy:

```sh
sudo docker compose up -d --force-recreate web
```

Caddy obtains and renews HTTPS certificates once DNS resolves and ports 80/443 are reachable. Do not use an invented domain or bypass browser certificate warnings. Frontend and API share an origin, so neither a public API URL setting nor CORS setup is required.

## Verify and update

Open the public address from another device. Verify default saved JFK–LHR, reveal the comparison, reverse the journey, toggle model winds, inspect assumptions, and calculate an uncached worldwide pair. Stop the app container temporarily and confirm the expected service outage; restart it and confirm saved data returns and health is ready. Do not claim high availability from this one-instance deployment.

For updates, review and deploy a known commit:

```sh
cd /opt/streamline
git pull --ff-only
sudo docker compose up -d --build
sudo docker compose logs --tail=100
```

Keep the preceding commit hash for rollback: check out that commit and rebuild. Volumes hold Caddy certificates and disposable weather cache only. Scenario jobs are in memory and disappear on restart. Do not run multiple API workers because queue and quota limits are per process.

## Handoff and costs

Record the public URL, Vultr region, instance size, deployed commit, HTTPS state and health response in the validation report after deployment. Keep credentials and private SSH material out of Git and the submission. Check credits and expiration during the event. Stopping a cloud server may continue incurring charges; when it is no longer needed, review Vultr's billing and destroy the resource through the account owner after backing up anything needed.
