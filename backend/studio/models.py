from django.db import models
from django.core.validators import (
    MinValueValidator,
    MaxValueValidator,
    FileExtensionValidator,
)

LANGUAGES = [("az", "Azərbaycan"), ("en", "English"), ("ru", "Русский")]


class Published(models.Model):
    slug = models.SlugField(unique=True)
    published = models.BooleanField(default=False, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-published_at", "-id"]


class Taxonomy(models.Model):
    kind = models.CharField(
        max_length=16,
        choices=[
            ("genre", "Genre"),
            ("platform", "Platform"),
            ("category", "News category"),
        ],
    )
    slug = models.SlugField()
    name_az = models.CharField(max_length=80)
    name_en = models.CharField(max_length=80, blank=True)
    name_ru = models.CharField(max_length=80, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["kind", "slug"], name="unique_taxonomy")
        ]
        ordering = ["id"]
        verbose_name_plural = "Taxonomies"

    def __str__(self):
        return f"{self.kind}: {self.name_az}"


def image_field(**kwargs):
    return models.ImageField(
        validators=[FileExtensionValidator(["jpg", "jpeg", "png", "webp"])], **kwargs
    )


class Game(Published):
    cover = image_field(upload_to="games/covers/")
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    currency = models.CharField(
        max_length=3,
        choices=[("AZN", "AZN"), ("USD", "USD"), ("EUR", "EUR")],
        default="AZN",
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ("development", "In development"),
            ("demo", "Demo available"),
            ("released", "Released"),
        ],
        default="development",
    )
    genres = models.ManyToManyField(
        Taxonomy,
        blank=True,
        related_name="genre_games",
        limit_choices_to={"kind": "genre"},
    )
    platforms = models.ManyToManyField(
        Taxonomy,
        blank=True,
        related_name="platform_games",
        limit_choices_to={"kind": "platform"},
    )
    featured = models.BooleanField(default=False)
    demo_enabled = models.BooleanField(default=True)
    release_date = models.DateField(null=True, blank=True)
    trailer_url = models.URLField(blank=True)

    def __str__(self):
        return self.slug


class Translation(models.Model):
    language = models.CharField(max_length=2, choices=LANGUAGES)
    title = models.CharField(max_length=180)
    excerpt = models.CharField(max_length=400)
    body = models.TextField()
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=170, blank=True)

    class Meta:
        abstract = True


class GameTranslation(Translation):
    game = models.ForeignKey(
        Game, on_delete=models.CASCADE, related_name="translations"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["game", "language"], name="unique_game_language"
            )
        ]


class GameImage(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="gallery")
    image = image_field(upload_to="games/gallery/")
    alt_az = models.CharField(max_length=200)
    alt_en = models.CharField(max_length=200, blank=True)
    alt_ru = models.CharField(max_length=200, blank=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]


class News(Published):
    cover = image_field(upload_to="news/")
    category = models.ForeignKey(
        Taxonomy,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        limit_choices_to={"kind": "category"},
    )
    featured = models.BooleanField(default=False)

    def __str__(self):
        return self.slug


class NewsTranslation(Translation):
    news = models.ForeignKey(
        News, on_delete=models.CASCADE, related_name="translations"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["news", "language"], name="unique_news_language"
            )
        ]


class SiteContent(models.Model):
    key = models.SlugField(help_text="home_intro, about_intro, or about_story")
    language = models.CharField(max_length=2, choices=LANGUAGES)
    title = models.CharField(max_length=180)
    body = models.TextField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["key", "language"], name="unique_site_language"
            )
        ]

    def __str__(self):
        return f"{self.key} ({self.language})"


class DemoRequest(models.Model):
    game = models.ForeignKey(Game, null=True, blank=True, on_delete=models.SET_NULL)
    user = models.ForeignKey(
        "auth.User", null=True, blank=True, on_delete=models.SET_NULL
    )
    name = models.CharField(max_length=120)
    email = models.EmailField()
    message = models.TextField(max_length=5000)
    language = models.CharField(max_length=2, choices=LANGUAGES, default="az")
    consent = models.BooleanField()
    status = models.CharField(
        max_length=20,
        choices=[
            ("new", "New"),
            ("reviewing", "Reviewing"),
            ("replied", "Replied"),
            ("closed", "Closed"),
        ],
        default="new",
        db_index=True,
    )
    internal_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.email}"
