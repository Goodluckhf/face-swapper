#SSL

First initialise
```bash
$ docker compose run --rm  certbot certonly --webroot --webroot-path /var/www/certbot/ --dry-run -d example.org
```

and renew
```bash 
$ docker compose run --rm certbot renew
```