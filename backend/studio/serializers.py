from django.utils import timezone
from django.conf import settings
from rest_framework import serializers
from .models import Game, News, Taxonomy, SiteContent, DemoRequest


def public_media_url(file, request):
    if not file:
        return None
    if settings.PUBLIC_MEDIA_ORIGIN:
        return f"{settings.PUBLIC_MEDIA_ORIGIN}{file.url}"
    return request.build_absolute_uri(file.url)


class PublicImageField(serializers.ImageField):
    def to_representation(self, value):
        return public_media_url(value, self.context["request"])


def language(context):
    value = context["request"].query_params.get("lang", "az")
    return value if value in ("az", "en", "ru") else "az"


class TaxonomySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    def get_name(self, obj):
        return getattr(obj, f"name_{language(self.context)}") or obj.name_az

    class Meta:
        model = Taxonomy
        fields = ["id", "kind", "slug", "name"]


class LocalizedSerializer(serializers.ModelSerializer):
    cover = PublicImageField(read_only=True)
    title = serializers.SerializerMethodField()
    excerpt = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()
    seo_title = serializers.SerializerMethodField()
    seo_description = serializers.SerializerMethodField()

    def translated(self, obj, field):
        translations = list(obj.translations.all())
        record = next(
            (t for t in translations if t.language == language(self.context)), None
        )
        fallback = next((t for t in translations if t.language == "az"), None)
        return (
            getattr(record, field, "")
            or getattr(fallback, field, "")
            or (obj.slug if field == "title" else "")
        )

    def get_title(self, obj):
        return self.translated(obj, "title")

    def get_excerpt(self, obj):
        return self.translated(obj, "excerpt")

    def get_body(self, obj):
        return self.translated(obj, "body")

    def get_seo_title(self, obj):
        return self.translated(obj, "seo_title")

    def get_seo_description(self, obj):
        return self.translated(obj, "seo_description")


class GameSerializer(LocalizedSerializer):
    genres = TaxonomySerializer(many=True, read_only=True)
    platforms = TaxonomySerializer(many=True, read_only=True)
    gallery = serializers.SerializerMethodField()

    def get_gallery(self, obj):
        return [
            {
                "image": public_media_url(i.image, self.context["request"]),
                "alt": getattr(i, f"alt_{language(self.context)}") or i.alt_az,
            }
            for i in obj.gallery.all()
        ]

    class Meta:
        model = Game
        fields = [
            "id",
            "slug",
            "title",
            "excerpt",
            "body",
            "seo_title",
            "seo_description",
            "cover",
            "price",
            "currency",
            "status",
            "genres",
            "platforms",
            "gallery",
            "featured",
            "demo_enabled",
            "release_date",
            "trailer_url",
            "published_at",
            "updated_at",
        ]


class NewsSerializer(LocalizedSerializer):
    category = TaxonomySerializer(read_only=True)

    class Meta:
        model = News
        fields = [
            "id",
            "slug",
            "title",
            "excerpt",
            "body",
            "seo_title",
            "seo_description",
            "cover",
            "category",
            "featured",
            "published_at",
            "updated_at",
        ]


class SiteContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteContent
        fields = ["key", "language", "title", "body"]


class DemoRequestSerializer(serializers.ModelSerializer):
    message = serializers.CharField(min_length=20, max_length=5000)
    name = serializers.CharField(min_length=2, max_length=120)
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = DemoRequest
        fields = ["game", "name", "email", "message", "language", "consent", "website"]

    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError("Consent is required.")
        return value

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError("Invalid request.")
        return value

    def validate_game(self, value):
        if value and (
            not value.published
            or not value.published_at
            or value.published_at > timezone.now()
            or not value.demo_enabled
        ):
            raise serializers.ValidationError("Demo is not available.")
        return value

    def create(self, validated_data):
        validated_data.pop("website", None)
        return super().create(validated_data)
