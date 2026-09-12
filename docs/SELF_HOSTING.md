# Self-Hosting Guide (Docker & VPS)

NotifyPush connects seamlessly to both the public `ntfy.sh` server and any self-hosted ntfy instance running in your private Docker environment or Kubernetes cluster.

---

## 1. Quick Docker Run (1 Minute)

```bash
docker run -d \
  --name notifypush-server \
  --restart unless-stopped \
  -p 8080:80 \
  -v /var/cache/ntfy:/var/cache/ntfy \
  -e NTFY_BASE_URL="https://push.yourdomain.com" \
  binwiederhier/ntfy serve
```

---

## 2. Production `docker-compose.yml` with SSL (Caddy Reverse Proxy)

```yaml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - ntfy

  ntfy:
    image: binwiederhier/ntfy
    restart: unless-stopped
    command: serve
    environment:
      - NTFY_BASE_URL=https://push.yourdomain.com
      - NTFY_CACHE_FILE=/var/cache/ntfy/cache.db
      - NTFY_AUTH_FILE=/var/lib/ntfy/user.db
      - NTFY_AUTH_DEFAULT_ACCESS=deny-all
    volumes:
      - ntfy_cache:/var/cache/ntfy
      - ntfy_data:/var/lib/ntfy

volumes:
  caddy_data:
  caddy_config:
  ntfy_cache:
  ntfy_data:
```

### `Caddyfile`:
```
push.yourdomain.com {
    reverse_proxy ntfy:80
}
```

---

## 3. Configuring User Authentication

1. Create an admin user inside the container:
   ```bash
   docker exec -it notifypush-server ntfy user add --role=admin admin
   ```
2. Grant read/write permissions to a specific topic:
   ```bash
   docker exec -it notifypush-server ntfy access admin "my-alerts" write-read
   ```
3. In the NotifyPush Android App, enter your custom URL (`https://push.yourdomain.com`) and your auth token in the Configuration card.
