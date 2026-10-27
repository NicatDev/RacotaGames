from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("games", views.GameViewSet, basename="game")
router.register("news", views.NewsViewSet, basename="news")
urlpatterns = [
    path("", include(router.urls)),
    path("taxonomies/", views.TaxonomyView.as_view()),
    path("content/", views.SiteContentView.as_view()),
    path("demo-requests/", views.DemoCreateView.as_view()),
    path("auth/session/", views.session_view),
    path("auth/login/", views.login_view),
    path("auth/logout/", views.logout_view),
]
