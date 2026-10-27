# RacotaGames — Docker deployment

Bu paket **135.181.44.47** serverindəki hazırkı infrastruktur üçün hazırlanıb:

| Təyinat | Ünvan |
|---|---|
| Frontend, SEO, sitemap | `https://racotagames.com` |
| Django API | `https://app.racotagames.com/api/` |
| Admin | `https://app.racotagames.com/admin/` |
| Cover və qalereya | `https://app.racotagames.com/media/` |
| Mövcud edge konteyneri | `artexperts-nginx-1` |
| Mövcud Docker şəbəkəsi | `artexperts_default` |
| Mövcud Compose | `/opt/artexperts/compose.yaml` |
| Yeni layihə qovluğu | `/opt/racotagames` |

## Quruluş

```text
Cloudflare (Proxied, Full strict)
        ↓ HTTPS :443
artexperts-nginx-1 — əvvəlki virtual host-lar saxlanılır
        ↓ artexperts_default / racota-gateway:8080
Racota gateway — static/media read-only volumes
        ↓ yalnız racotagames_private şəbəkəsi
Next.js :3000 ←→ Django/Gunicorn :8000
                       ↓
                  PostgreSQL + Redis
```

Racota Compose heç bir host portu açmır. Yalnız `racota-gateway` mövcud şəbəkəyə qoşulur. PostgreSQL, Redis və tətbiqlər ayrıca internal şəbəkədədir; Artexperts DB/media volume-larını istifadə etmirlər. Paylaşılan yeganə volume sertifikat axını üçündür: `artexperts_certificates` external volume kimi saxlanılır. Yeni sertifikatın adı `racotagames.com`-dur.

Frontend brauzeri `/api/backend/` ilə öz origin-inə müraciət edir. SSR isə `http://backend:8000` istifadə edir. Media API-də ictimai HTTPS ünvanı kimi qaytarılır, Next Image üçün daxili media proxy-yə çevrilir. CORS və `.racotagames.com` üzrə paylaşılan cookie tələb edilmir. Hər hostun cookie-si özünə aiddir; admin və sayt ayrı session-lar saxlayır.

## 1. Mənbəni serverə köçür

Hazır arxiv: `artifacts/racotagames-deploy.tar.gz`. Arxivdə `.env`, lokal admin şifrəsi, SQLite, test media və `node_modules` yoxdur. Sonradan yenidən hazırlamaq üçün `python scripts/package_deploy.py`.

Windows PowerShell-də:

```powershell
scp ./artifacts/racotagames-deploy.tar.gz root@135.181.44.47:/tmp/racotagames-deploy.tar.gz
```

Serverdə aşağıdakı əmrləri ayrı-ayrı icra et. Mövcud `/opt/artexperts` qovluğuna extract etmirik:

```sh
mkdir -p /opt/racotagames
tar -xzf /tmp/racotagames-deploy.tar.gz -C /opt/racotagames
cd /opt/racotagames
python3 scripts/configure_deploy.py --email YOUR_REAL_EMAIL
```

`YOUR_REAL_EMAIL` yerinə öz ünvanını yaz. Generator şifrələri təsadüfi yaradır, ekrana çıxarmır və `.env.production` varsa dəyişmir. Bütün idarəetmə əmrləri `sh deploy/racota.sh ...` wrapper-i ilə düzgün project/env fayllarını seçir. Docker Compose v2 tələb olunur. `docker compose version`, `free -h` və `df -h /` ilə versiya və resursları əvvəl yoxla. Build ardıcıl gedir, runtime limitlərinin cəmi təxminən 1.3 GB-dır; Next build əlavə yaddaş tələb edir.

## 2. Tətbiq konteynerlərini hazırla

```sh
sh deploy/build-and-start.sh
sh deploy/check-stack.sh
sh deploy/racota.sh exec backend python manage.py createsuperuser
```

İlk start migration və collectstatic edir. Bütün konteynerlər healthy olmalıdır. Bu mərhələdə mövcud public Nginx dəyişmir. `check-stack.sh` internal routing, prod cookie, domain, API, sitemap, robots və Django deploy check yoxlayır. `security.W008` TLS redirect-in xarici Nginx-də idarə edildiyinə görə gözlənilir; tətbiq daxili HTTP istifadə edir. `W005` və `W021` də bilərəkdən açıq saxlanılır: HSTS naməlum gələcək subdomenlərə yayılmır və domain brauzerlərin preload siyahısına daxil edilməyib. Bunlar gizlədilmir. Digər xəbərdarlıqları araşdır.

Yeni production DB boşdur. Lokal QA admin və məktubları daşınmır. Real content-i admin-dən daxil et; sayt özü tərcüməli statik mətn və boş content hallarını göstərir.

## 3. Cloudflare və HTTPS sertifikatı

Verilən DNS qeydləri qalır:

```text
A  @    135.181.44.47  Proxied
A  app  135.181.44.47  Proxied
```

`www` üçün DNS verilmədiyindən onu avtomatik əlavə etmirik. Cloudflare SSL/TLS **Full (strict)** və ya mövcud daha sərt rejimdə işləməlidir. Başqa sayta təsir edən zone/global TLS parametrlərini azaltma. Origin-də etibarlı sertifikat aşağıdakı addımla alınır. Bu axın DNS-01 istifadə etdiyindən port 80-i və başqa saytın ACME marşrutlarını dəyişmir.

Cloudflare-də yalnız `racotagames.com` zone-u üçün **Zone → DNS → Edit** icazəli API token yarat. Global API Key istifadə edilmir. Tokeni çata göndərmə; yalnız serverdə bu fayla daxil et:

```sh
install -m 600 deploy/secrets/cloudflare.ini.example deploy/secrets/cloudflare.ini
nano deploy/secrets/cloudflare.ini
```

Faylda:

```ini
dns_cloudflare_api_token = YOUR_TOKEN_ON_SERVER
```

Sonra:

```sh
sh deploy/issue-certificate.sh YOUR_REAL_EMAIL
```

Certbot mövcud certificate volume-unda ayrıca `live/racotagames.com/` yaradır və hər iki adı əhatə edir. Artexperts sertifikat adlarına müraciət etmir. DNS TXT qeydlərini təsdiq üçün yaradıb təmizləyir. Bu əmrin Let's Encrypt şərtləri ilə sertifikat sifariş etdiyini nəzərə al.

## 4. Mövcud Nginx-ə əlavə et

Yeni virtual host faylı `deploy/edge/racotagames.conf`-dur. `artexperts.racota.override.yaml` yalnız **iki read-only fayl mount-u** əlavə edir; əvvəlki image, port, network və volume-lar base Compose-dan qalır. Əvvəl yoxla:

```sh
sh deploy/edge/preflight.sh
```

Bu, mövcud edge image-i ilə host portu açmayan müvəqqəti konteynerdə tam birləşdirilmiş Nginx konfiqurasiyasını yoxlayır. Sertifikatın oxunması, include faylları və base Compose uyğunluğu burada təsdiqlənir. `nginx -t` keçmədən növbəti addımı etmə.

**İlk dəfə yeni mount əlavə etmək üçün yalnız paylaşılan Nginx konteyneri yenidən yaradılmalıdır.** Artexperts frontend/backend/DB toxunulmur, amma bu qısa proxy keçidi mövcud HTTP bağlantılarına təsir edə bilər. Bu işi uyğun anda et. Yeni fayllar konteyner restartından sonra da qalacaq:

```sh
docker compose -p artexperts --project-directory /opt/artexperts -f /opt/artexperts/compose.yaml -f /opt/racotagames/deploy/edge/artexperts.racota.override.yaml up -d --no-deps --no-build --pull never nginx
docker exec artexperts-nginx-1 nginx -t
```

Artexperts Nginx üçün gələcək `up` əmrlərində də hər iki `-f` faylını istifadə et. Əks halda yeni mount-lar itər. Mövcud layihədə başqa override/workflow varsa, bu iki mount-u onun mənbə konfiqurasiyasına birləşdir; base faylını bütöv əvəz etmə.

Gələcəkdə yalnız konfiqurasiya məzmunu dəyişirsə mount artıq var: `nginx -t` sonra `nginx -s reload` kifayətdir. Shared edge üçün `restart`, bütün project üçün `down` və ya ümumi Docker prune əmrləri lazım deyil.

Cloudflare real IP siyahısı yalnız Racota server block-u daxilində tətbiq olunur. Edge caller-in XFF başlığını etibarlı client IP ilə əvəz edir; daxili gateway həmin bir IP-ni Django-ya ötürür. Rate-limit bütün Cloudflare istifadəçilərini eyni IP saymır. Rəsmi aralıqları yeniləmək üçün `python3 scripts/update_cloudflare_ips.py`, sonra preflight və reload.

## 5. İctimai yoxlama

```sh
curl -I https://racotagames.com/az
curl -fsS https://racotagames.com/robots.txt
curl -fsS https://racotagames.com/sitemap.xml
curl -fsS https://app.racotagames.com/api/games/
curl -I https://app.racotagames.com/admin/
sh deploy/check-stack.sh
```

Brauzerdə login → logout, demo müraciəti → admin inbox, cover/galereya upload-u və AZ/EN/RU keçidini də yoxla. Cloudflare-də bu hostlar üçün `/api/*` və `/admin*` yollarına “Cache Everything” tətbiq etmə; əlavə cache rule varsa həmin yolları bypass et. Dinamik HTML və Set-Cookie cavabları cache edilməməlidir. Origin IP-ni birbaşa açaraq host yoxlamasını dəyişmə; DNS adları istifadə olunur.

## Sertifikat yenilənməsi

```sh
install -m 644 deploy/systemd/racota-certificate-renew.service /etc/systemd/system/
install -m 644 deploy/systemd/racota-certificate-renew.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now racota-certificate-renew.timer
systemctl list-timers racota-certificate-renew.timer
```

Timer yalnız `racotagames.com` sertifikatını yoxlayır. Uğurlu renewal əmri və `nginx -t` yoxlamasından sonra shared edge-ə graceful reload verir. Token serverdə saxlanmalı və qüvvədə qalmalıdır. Heç bir başqa sertifikat üçün `renew` sifariş etmir.

## Sonrakı buraxılış, backup və geri qayıtma

```sh
cd /opt/racotagames
sh deploy/backup.sh
# Mənbəni yenilə. .env.production şifrələrini dəyişmə.
# IMAGE_TAG-i .env.production-da yeni buraxılış adına dəyişərək əvvəlki image-i saxla.
sh deploy/build-and-start.sh
sh deploy/check-stack.sh
```

Backup lokal `backups/TIMESTAMP/` daxilində DB dump və media arxividir. Onları və production secret-ləri qorunan serverdənkənar storage-ə köçür. Redis yalnız transient cache/rate-limit üçündür. PostgreSQL və media named volume-larda qalır. `down -v` məlumat silə bilər və deployment addımı deyil.

Racota tətbiqini geri almaq üçün əvvəlki mənbə/config və `IMAGE_TAG`-ə qayıdıb yalnız Racota servislərini qaldır. Migration uyğunluğunu yoxlamadan DB-ni və ya image-i geri çevirmə. Shared proxy rollback üçün base `/opt/artexperts/compose.yaml` ilə yalnız `nginx` servisini yenidən yaratmaq yeni mount-ları çıxarır; əvvəlki vhost-lar image-də qalır. Bu da qısa proxy keçididir.

## Yoxlama vəziyyəti və istinadlar

Windows workspace-də Docker runtime yoxdur; Linux Docker build/start və real shared Nginx `nginx -t` burada icra edilməyib. Lokal Next production/standalone build, TypeScript, Django testləri və deployment fayllarının statik yoxlaması icra olunur. Server preflight mərhələləri bu limitə görə ayrıca verilib.

Rəsmi mənbələr: [Docker Compose şəbəkələri](https://docs.docker.com/compose/how-tos/networking/), [Cloudflare Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/), [Certbot DNS token konfiqurasiyası](https://certbot-dns-cloudflare.readthedocs.io/en/stable/), [Nginx proxy başlıqları](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header).
