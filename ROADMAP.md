# RacotaGames — məhsul və icra planı

## Məqsəd
Gənclər üçün yaradıcı oyunlar hazırlayan studiyanın çoxdilli vitrini. Ziyarətçi studiyanı tanıyır, oyunları və qiymətləri araşdırır, xəbərləri oxuyur və demo müraciəti göndərir. Redaktor Django admin-dən idarə edir.

## Mərhələlər
1. **Brend və məzmun:** təqdim edilən loqo, qara/gümüş/qırmızı vizual dil, orijinal hero konsept-artı, AZ/EN/RU statik mətnlər.
2. **Məlumat modeli:** oyunlar, janr/platforma, şəkil qalereyası, tərcümələr, xəbərlər, sayt bölmələri, demo müraciətləri; draft/published və tarixə əsaslanan nəşr.
3. **Backend:** DRF read-only ictimai kataloq, filtr/axtarış/sıralama/pagination, CSRF qorunan session login, demo qeydiyyatı, Django admin.
4. **Frontend:** SSR home, oyunlar/detail, xəbərlər/detail, haqqında, login və demo formu. URL-də dil və filtrlər. Responsiv layout və reduced-motion.
5. **SEO və keyfiyyət:** canonical/hreflang, Open Graph, JSON-LD, sitemap, robots, real 404/boş/xəta halları, build və API inteqrasiya testləri.
6. **Buraxılış:** real domen və HTTPS, production secret, PostgreSQL, media storage və backup, admin hesabı, real oyun/xəbər məzmunu. Next.js və Django ayrı servislər; eyni domen reverse proxy.

## Qəbul meyarları
- Ana səhifə giriş tələb etmədən açılır; hesab ilə giriş/çıxış işləyir.
- Oyun qiyməti/pul vahidi, cover, qalereya və 3 dildə təsvir admin-dən idarə olunur.
- Demo məktubu DB-yə yazılır, admin status və qeyd əlavə edir. Saxta uğur mesajı yoxdur.
- Xəbərlər köhnə qəzet estetikasında, oyun kartları yüngül CSS animasiyalıdır.
- Bütün siyahılar boş, filtr və pagination hallarını dəstəkləyir; drafts ictimai görünmür.
- Tərcümə olmayan DB məzmunu AZ əsas dilinə fallback edir.
- Konsept görüntülər nümunə kimi qeyd edilir; uydurma satış, tarix və testimonial yoxdur.

## İcra vəziyyəti
- [x] Mərhələ 1–5: dizayn, AZ/EN/RU məzmun, DRF, Next.js və SEO həyata keçirilib.
- [x] Production build, TypeScript və Django system check keçirilib.
- [x] 18 backend inteqrasiya testi keçirilib; production media, HTTPS proxy/cookie, healthcheck və client IP limitləri də yoxlanılıb.
- [x] Brauzerdə demo məktubu DB-yə yazılıb; real session login/logout və şəkil proxy-si yoxlanılıb.
- [x] Mobil 320/390px, tablet 768px və masaüstü görünüşləri yoxlanılıb; reduced-motion qaydaları əlavə edilib.
- [x] Docker və domain konfiqurasiyası: `racotagames.com`, `app.racotagames.com`, ayrıca PostgreSQL/Redis və mövcud Artexperts Nginx-ə əlavə konfiqurasiya.
- [ ] Serverdə Docker build/start, sertifikat, shared proxy preflight və ictimai yoxlama. Ardıcıllıq: `DEPLOYMENT.md`.
