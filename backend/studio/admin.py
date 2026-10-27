from django.contrib import admin
from django.utils import timezone
from django.forms.models import BaseInlineFormSet
from django.core.exceptions import ValidationError
from .models import (
    Game,
    GameTranslation,
    GameImage,
    News,
    NewsTranslation,
    Taxonomy,
    SiteContent,
    DemoRequest,
)

admin.site.site_header = "RacotaGames Studio"
admin.site.site_title = "RacotaGames Admin"
admin.site.index_title = "Studio content & demo inbox"


class RequiredAzTranslationFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()
        if any(self.errors):
            return
        languages = [
            form.cleaned_data.get("language")
            for form in self.forms
            if form.cleaned_data and not form.cleaned_data.get("DELETE")
        ]
        if "az" not in languages:
            raise ValidationError(
                "At least the Azerbaijani (az) translation is required as the fallback language."
            )


class GameTranslationInline(admin.StackedInline):
    model = GameTranslation
    extra = 1
    formset = RequiredAzTranslationFormSet


class GameImageInline(admin.TabularInline):
    model = GameImage
    extra = 0


class NewsTranslationInline(admin.StackedInline):
    model = NewsTranslation
    extra = 1
    formset = RequiredAzTranslationFormSet


@admin.action(description="Publish selected now")
def publish_now(modeladmin, request, queryset):
    queryset.update(
        published=True, published_at=timezone.now(), updated_at=timezone.now()
    )


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = [
        "slug",
        "price",
        "currency",
        "status",
        "published",
        "featured",
        "published_at",
    ]
    list_filter = ["published", "status", "featured", "platforms", "genres"]
    search_fields = ["slug", "translations__title"]
    inlines = [GameTranslationInline, GameImageInline]
    filter_horizontal = ["genres", "platforms"]
    actions = [publish_now]


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ["slug", "category", "published", "published_at"]
    list_filter = ["published", "category"]
    search_fields = ["slug", "translations__title"]
    inlines = [NewsTranslationInline]
    actions = [publish_now]


@admin.register(Taxonomy)
class TaxonomyAdmin(admin.ModelAdmin):
    list_display = ["slug", "kind", "name_az", "name_en", "name_ru"]
    list_filter = ["kind"]


@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    list_display = ["key", "language", "title"]
    list_filter = ["language"]


@admin.register(DemoRequest)
class DemoRequestAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "game", "status", "language", "created_at"]
    list_filter = ["status", "language", "created_at"]
    search_fields = ["name", "email", "message"]
    readonly_fields = [
        "name",
        "email",
        "game",
        "user",
        "message",
        "language",
        "consent",
        "created_at",
    ]

    def has_add_permission(self, request):
        return False
