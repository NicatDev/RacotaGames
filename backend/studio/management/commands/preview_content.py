"""Explicit, disposable design fixtures. Never seed real-looking releases."""

from pathlib import Path
from datetime import timedelta
from django.core.management.base import BaseCommand, CommandError
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils import timezone
from studio.models import Game, GameTranslation, News, NewsTranslation, Taxonomy


class Command(BaseCommand):
    help = "Create 8 clearly marked preview games/news, or remove only these fixtures with --clear."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true")

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Preview fixtures are available only with DEBUG=true.")
        if options["clear"]:
            Game.objects.filter(slug__startswith="design-preview-").delete()
            News.objects.filter(slug__startswith="design-preview-").delete()
            self.stdout.write(
                "Preview records removed. Taxonomies and uploaded image files are retained."
            )
            return
        assets = Path(settings.BASE_DIR).parent / "frontend" / "public" / "images"
        if not (assets / "hero.webp").exists():
            raise CommandError("Project art assets are missing.")
        genre, _ = Taxonomy.objects.get_or_create(
            kind="genre",
            slug="adventure",
            defaults={
                "name_az": "Macəra",
                "name_en": "Adventure",
                "name_ru": "Приключение",
            },
        )
        platform, _ = Taxonomy.objects.get_or_create(
            kind="platform",
            slug="pc",
            defaults={"name_az": "PC", "name_en": "PC", "name_ru": "PC"},
        )
        category, _ = Taxonomy.objects.get_or_create(
            kind="category",
            slug="studio",
            defaults={
                "name_az": "Studio gündəliyi",
                "name_en": "Studio journal",
                "name_ru": "Дневник студии",
            },
        )
        for i in range(8):
            slug = f"design-preview-{i+1}"
            for model, translation, fk in [
                (Game, GameTranslation, "game"),
                (News, NewsTranslation, "news"),
            ]:
                fields = {
                    "published": True,
                    "published_at": timezone.now() - timedelta(days=i),
                    "featured": i < 3,
                }
                fields.update(
                    {
                        "price": str(i * 9.99),
                        "status": ["development", "demo", "released"][i % 3],
                    }
                    if model is Game
                    else {"category": category}
                )
                obj, created = model.objects.get_or_create(slug=slug, defaults=fields)
                if created:
                    filename = "hero.webp" if i % 2 == 0 else "island.webp"
                    obj.cover.save(
                        f"preview-{i+1}.webp",
                        ContentFile((assets / filename).read_bytes()),
                        save=True,
                    )
                    if model is Game:
                        obj.genres.add(genre)
                        obj.platforms.add(platform)
                for lang, title, excerpt, body in [
                    (
                        "az",
                        (
                            f"Nümunə konsept {i+1}"
                            if model is Game
                            else f"Nümunə xəbər {i+1}: ideyadan dünyaya"
                        ),
                        "Yalnız dizaynı yoxlamaq üçün nümunə məzmun. Real oyun və ya xəbər elanı deyil.",
                        "Bu mətn yalnız interfeysi və məzmun axınını yoxlamaq üçün yaradılıb.\n\nAdmin panelindən cover, qiymət, platforma və tərcümələri idarə edə bilərsən.",
                    ),
                    (
                        "en",
                        (
                            f"Preview concept {i+1}"
                            if model is Game
                            else f"Preview journal {i+1}: from idea to world"
                        ),
                        "Sample content for design review. Not a real game or announcement.",
                        "This sample exists only to review the interface and content flow.\n\nManage covers, prices, platforms and translations in the admin panel.",
                    ),
                    (
                        "ru",
                        (
                            f"Пример концепта {i+1}"
                            if model is Game
                            else f"Пример новости {i+1}: от идеи к миру"
                        ),
                        "Пример для проверки дизайна. Это не реальная игра или новость.",
                        "Пример создан только для проверки интерфейса и контента.\n\nОбложки, цены, платформы и переводы доступны в панели администратора.",
                    ),
                ]:
                    translation.objects.get_or_create(
                        **{fk: obj, "language": lang},
                        defaults={"title": title, "excerpt": excerpt, "body": body},
                    )
        self.stdout.write(
            "Created explicit preview records. Remove with preview_content --clear."
        )
