# RacotaGames

Next.js App Router + TypeScript frontend, Django 5.2 LTS + DRF backend. Azərbaycan, English və Русский. İstifadəçinin təqdim etdiyi loqo və Imagegen ilə hazırlanmış orijinal konsept-art.

## Lokal işə salmaq (Windows / PowerShell)

Node.js 20.9+ və Python 3.12+ tələb olunur.

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
npm.cmd install --prefix frontend
.venv/Scripts/python.exe backend/manage.py migrate
.venv/Scripts/python.exe backend/manage.py createsuperuser
./start.ps1
```

Frontend adətən [http://127.0.0.1:3000/az](http://127.0.0.1:3000/az), Django admin [http://127.0.0.1:8010/admin/](http://127.0.0.1:8010/admin/). 3000 doludursa Next 3001 seçir. Hazırkı sessiyada önizləmə 3001 portundadır. `start.ps1` dayandırıldıqda onun açdığı backend prosesi də bağlanır. Servisləri ayrıca iki terminaldan da açmaq olar:

```powershell
.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8010
npm.cmd --prefix frontend run dev
```

`.env.example` faylları nümunədir. Next üçün `frontend/.env.local` yarat; Django environment dəyişənlərini PowerShell `$env:KEY='value'` və ya deployment platforması ilə təyin et. Django `.env` fayllarını avtomatik oxumur.

## Məzmun idarəsi

- **Taxonomies:** janr, platforma, xəbər kateqoriyası; AZ/EN/RU adları.
- **Games:** unikal slug, cover (JPG/PNG/WebP), qiymət (0 = pulsuz), AZN/USD/EUR, status, janr/platforma, buraxılış, treyler URL, featured və demo enabled. Game translations inline-da AZ məcburidir; EN/RU əlavə olunur. Game images qalereyasının hər şəkli üçün çoxdilli alt mətni və sıra nömrəsi var.
- **News:** cover, kateqoriya, tarix və 3 dildə başlıq/xülasə/body/SEO. Şəkillər interfeysdə köhnə qəzet estetikasına çevrilir; hover zamanı rəng və hərəkət gəlir.
- **Nəşr:** `published=true` və keçmiş/indiki `published_at` hər ikisi tələb olunur. “Publish selected now” action hər ikisini təyin edir. Draft və gələcək tarixli yazılar ictimai API, sitemap və detail səhifəsində görünmür.
- **Site content:** `home_intro` hero mətnini, `home_studio` studiya təqdimatını, `about_intro` haqqında girişini, `about_story` hekayəni əvəz edir. Hər açar üçün AZ/EN/RU qeydi əlavə et. DB-də qarşılığı yoxdursa kodda olan tərcüməli mətnlər işləyir.
- **Demo requests:** formdan gələn məktublar, oyun, istifadəçi (giriş edibsə), dil və razılıq. Admin `new → reviewing → replied → closed` statusunu və daxili qeydi idarə edir. Cavab göndərilməsi avtomatlaşdırılmayıb; e-poçt ünvanı admin-də görünür.
- **Users:** hesabları admin yaradır; ictimai qeydiyyat yoxdur. Məzmunu görmək və müraciət üçün giriş vacib deyil.

Markdown/HTML injection qarşısını almaq üçün body plain text abzasları kimi göstərilir. Tərcümə tapılmadıqda AZ versiyası istifadə edilir. Qiymət dəyişdirilmədən öz pul vahidində göstərilir.

## Dizayn nümunələri

Əsas DB-yə uydurma oyun/xəbər əlavə edilmir. Hero və “Visual concept” blokları studiyanın estetik istiqamətidir. Dolu kartları, detal səhifələrini və pagination-ı yoxlamaq üçün yalnız lokal rejimdə:

```powershell
.venv/Scripts/python.exe backend/manage.py preview_content
.venv/Scripts/python.exe backend/manage.py preview_content --clear
```

Bu nümunələr açıq şəkildə “Nümunə/Preview/Пример” kimi işarələnir. Clear yalnız `design-preview-` prefiksli nümunə oyun/xəbər qeydlərini silir. Media fayllarını və taxonomy qeydlərini saxlayır.

## API müqaviləsi

| Endpoint | Funksiya |
|---|---|
| `GET /api/games/` | `lang`, `search`, `genres__slug`, `platforms__slug`, `status`, `featured`, `price__gte`, `price__lte`, `ordering`, `page`, `page_size` |
| `GET /api/games/{slug}/` | Cover, qalereya, tərcümələr, qiymət və demo statusu |
| `GET /api/news/` | `lang`, `search`, `category__slug`, `featured`, `ordering`, `page`, `page_size` |
| `GET /api/news/{slug}/` | Tərcüməli xəbər və SEO sahələri |
| `GET /api/taxonomies/?lang=az` | Tərcüməli filtr seçimləri |
| `GET /api/content/?lang=az` | Sayt məzmununun AZ və seçilmiş dil variantları |
| `GET /api/auth/session/` | İstifadəçi və CSRF token/cookie |
| `POST /api/auth/login/` | `username`, `password`; CSRF token tələb olunur |
| `POST /api/auth/logout/` | CSRF token tələb olunur |
| `POST /api/demo-requests/` | `name`, `email`, `message` (20–5000 simvol), `game` (nullable ID), `language`, `consent=true`, honeypot `website=''`; CSRF token tələb olunur |

Frontend `/api/backend/*` və `/media-proxy/*` vasitəsilə eyni origin-dən Django-ya proxy edir. Token localStorage-da saxlanılmır; httpOnly session cookie istifadə olunur. List cavabı `{count,next,previous,results}`; səhifə ölçüsü default 6, maksimum 24. Oyun sıralaması: `price`, `-price`, `published_at`, `-published_at`. Bütün ictimai content endpoint-ləri read-only-dır. Müraciət inbox-u API vasitəsilə açılmır.

## SEO və performans

SSR, dilə uyğun `<html lang>`, metadata, canonical, hreflang/x-default, Open Graph, Twitter kartları, Organization/VideoGame/NewsArticle JSON-LD. Dinamik sitemap nəşr edilmiş qeydləri bütün səhifələri keçərək toplayır. Login/demo və filtr URL-ləri noindex; API/admin robots ilə məhdudlaşdırılıb. Robots access control deyil; admin və şəxsi məlumatlar authentication ilə qorunur.

Şəkillər WebP-dir, Next Image ölçü/lazy loading verir. Hero prioritet yüklənir. WebGL, böyük animasiya kitabxanası və autoplay video yoxdur. `prefers-reduced-motion` dəstəklənir. Filterlər GET formudur: paylaşılabilən URL, server render və klaviatura uyğunluğu.

## Yoxlama

```powershell
.venv/Scripts/python.exe backend/manage.py check
.venv/Scripts/python.exe backend/manage.py test studio
npm.cmd --prefix frontend run typecheck
npm.cmd --prefix frontend run build
```

18 inteqrasiya testi (production media, HTTPS proxy/cookie, healthcheck və client IP limitləri daxil): draft/scheduled gizlətmə, locale fallback, filtr/search/order, pagination, demo saxlanması/validation/rate limit, inbox privacy, CSRF, login/logout və public mutation qadağası.

## Production / Docker

Bu layihə `racotagames.com` (Next.js) və `app.racotagames.com` (API/admin/media) üçün Docker-lə hazırlanıb. Server: `135.181.44.47`. Mövcud `artexperts-nginx-1` konteynerinə ayrıca `racota_edge` şəbəkəsi ilə qoşulur; yeni Compose host portu açmır.

Bütün ardıcıllıq, sertifikat, hazırkı Nginx-ə əlavə mount, backup və yoxlama əmrləri **[DEPLOYMENT.md](DEPLOYMENT.md)** faylındadır. Server üçün mənbə arxivini `python scripts/package_deploy.py` ilə yarat. Production PostgreSQL və Redis istifadə edir; lokal SQLite/admin şifrələri arxivə daxil edilmir.

Ətraflı məhsul mərhələləri: [ROADMAP.md](ROADMAP.md). Vizual asset brief-ləri: [ASSETS.md](ASSETS.md).
