import json
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_GET
from django.utils import timezone
from django.utils.decorators import method_decorator
from rest_framework import viewsets, generics, permissions
from rest_framework.throttling import (
    AnonRateThrottle,
    UserRateThrottle,
    SimpleRateThrottle,
)
from .models import Game, News, Taxonomy, SiteContent
from .serializers import (
    GameSerializer,
    NewsSerializer,
    TaxonomySerializer,
    SiteContentSerializer,
    DemoRequestSerializer,
)


class GameViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = GameSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filterset_fields = {
        "status": ["exact"],
        "genres__slug": ["exact"],
        "platforms__slug": ["exact"],
        "featured": ["exact"],
        "price": ["gte", "lte"],
    }
    search_fields = ["translations__title", "translations__excerpt"]
    ordering_fields = ["price", "published_at", "release_date"]
    ordering = ["-published_at", "-id"]

    def get_queryset(self):
        return (
            Game.objects.filter(published=True, published_at__lte=timezone.now())
            .prefetch_related("translations", "genres", "platforms", "gallery")
            .distinct()
        )


class NewsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NewsSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filterset_fields = ["category__slug", "featured"]
    search_fields = ["translations__title", "translations__excerpt"]
    ordering_fields = ["published_at"]
    ordering = ["-published_at", "-id"]

    def get_queryset(self):
        return (
            News.objects.filter(published=True, published_at__lte=timezone.now())
            .prefetch_related("translations")
            .select_related("category")
            .distinct()
        )


class TaxonomyView(generics.ListAPIView):
    queryset = Taxonomy.objects.all()
    serializer_class = TaxonomySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class SiteContentView(generics.ListAPIView):
    serializer_class = SiteContentSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return SiteContent.objects.filter(
            language__in=["az", self.request.query_params.get("lang", "az")]
        )


class DemoAnonThrottle(AnonRateThrottle):
    scope = "demo"


class DemoUserThrottle(UserRateThrottle):
    scope = "demo"

    def allow_request(self, request, view):
        if not request.user.is_authenticated:
            return True
        return super().allow_request(request, view)


@method_decorator(csrf_protect, name="dispatch")
class DemoCreateView(generics.CreateAPIView):
    serializer_class = DemoRequestSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [DemoAnonThrottle, DemoUserThrottle]

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user if self.request.user.is_authenticated else None
        )


class LoginThrottle(SimpleRateThrottle):
    scope = "login"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


@require_GET
@ensure_csrf_cookie
def session_view(request):
    return JsonResponse(
        {
            "csrfToken": get_token(request),
            "user": (
                {"username": request.user.username}
                if request.user.is_authenticated
                else None
            ),
        }
    )


@require_POST
@csrf_protect
def login_view(request):
    throttle = LoginThrottle()
    if not throttle.allow_request(request, None):
        return JsonResponse({"detail": "Too many attempts."}, status=429)
    try:
        data = json.loads(request.body)
        username, password = data.get("username", ""), data.get("password", "")
        if (
            not isinstance(username, str)
            or not isinstance(password, str)
            or len(username) > 150
            or len(password) > 256
        ):
            raise ValueError()
    except (ValueError, AttributeError):
        return JsonResponse({"detail": "Invalid request."}, status=400)
    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"detail": "Invalid credentials."}, status=400)
    login(request, user)
    return JsonResponse(
        {"user": {"username": user.username}, "csrfToken": get_token(request)}
    )


@require_POST
@csrf_protect
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})
