# Local HTTPS with Nginx (`localhost`)

This setup gives you:
- `https://localhost` -> Next.js frontend (`127.0.0.1:3000`)
- `https://localhost/api/*` -> FastAPI backend (`127.0.0.1:8000`)

## 1) Install mkcert and create local certs

Ubuntu:

```bash
sudo apt update
sudo apt install -y libnss3-tools mkcert
mkcert -install
```

Create certs for localhost:

```bash
cd /home/mahammad/Desktop/app/connectk
mkdir -p nginx/certs
mkcert -key-file nginx/certs/localhost-key.pem -cert-file nginx/certs/localhost.pem localhost 127.0.0.1 ::1
```

## 2) Install Nginx config

```bash
sudo cp /home/mahammad/Desktop/app/connectk/nginx/local-https.conf /etc/nginx/sites-available/connectk-local
sudo mkdir -p /etc/nginx/certs
sudo cp /home/mahammad/Desktop/app/connectk/nginx/certs/localhost.pem /etc/nginx/certs/
sudo cp /home/mahammad/Desktop/app/connectk/nginx/certs/localhost-key.pem /etc/nginx/certs/
sudo ln -sf /etc/nginx/sites-available/connectk-local /etc/nginx/sites-enabled/connectk-local
sudo nginx -t
sudo systemctl reload nginx
```

If the default site conflicts:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 3) App config alignment

Set in `/home/mahammad/Desktop/app/connectk/.env`:

```env
FRONTEND_URL=https://localhost
ALLOWED_ORIGINS=https://localhost,http://localhost:3000,https://localhost:3000,http://localhost:8000
```

Keep backend callback for Entra as:

```env
OIDC_REDIRECT_URI=http://localhost:8000/api/auth/callback
```

## 4) Run app servers

Terminal 1:

```bash
cd /home/mahammad/Desktop/app/connectk
fastapi dev backend/app/main.py
```

Terminal 2:

```bash
cd /home/mahammad/Desktop/app/connectk/frontend
npm run dev
```

Browse:

`https://localhost`

## 5) Entra URLs

- Web redirect URI: `http://localhost:8000/api/auth/callback`
- Front-channel logout URL: `https://localhost/login`

