#SSL

First initialise
```bash
$ docker compose run --rm  certbot certonly --webroot --webroot-path /var/www/certbot/ --dry-run -d example.org
```

and renew
```bash 
$ docker compose run --rm certbot renew
```

#ENV
copy `.env.example` -> `.env` and set `VK_SECRET_KEY` and `VK_MINI_APP_ID` from VK miniApp settings