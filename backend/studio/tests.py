from datetime import timedelta
from django.test import TestCase, Client, override_settings
from unittest.mock import patch
from django.contrib.auth.models import User
from django.core.cache import cache
from django.utils import timezone
from .models import (
    Game,
    GameTranslation,
    GameImage,
    News,
    NewsTranslation,
    Taxonomy,
    DemoRequest,
)


class StudioIntegrationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.genre = Taxonomy.objects.create(
            kind="genre", slug="adventure", name_az="Macəra", name_en="Adventure"
        )
        cls.platform = Taxonomy.objects.create(kind="platform", slug="pc", name_az="PC")
        for i in range(8):
            g = Game.objects.create(
                slug=f"game-{i}",
                cover="games/test.webp",
                price=i * 10,
                published=True,
                published_at=timezone.now() - timedelta(days=i),
                featured=i == 0,
            )
            GameTranslation.objects.create(
                game=g,
                language="az",
                title=f"Oyun {i}",
                excerpt="Azərbaycan dilində mətn",
                body="Ətraflı məzmun",
            )
            g.genres.add(cls.genre)
            g.platforms.add(cls.platform)
        cls.game = Game.objects.get(slug="game-0")
        GameTranslation.objects.create(
            game=cls.game,
            language="en",
            title="English world",
            excerpt="A new adventure",
            body="English description",
        )
        cls.draft = Game.objects.create(slug="secret-draft", cover="test.webp", price=5)
        Game.objects.create(
            slug="scheduled",
            cover="test.webp",
            price=5,
            published=True,
            published_at=timezone.now() + timedelta(days=5),
        )
        cls.article = News.objects.create(
            slug="studio-update",
            cover="news/test.webp",
            published=True,
            published_at=timezone.now(),
        )
        NewsTranslation.objects.create(
            news=cls.article,
            language="az",
            title="Studio xəbəri",
            excerpt="İlk xəbər",
            body="Xəbərin mətni",
        )
        News.objects.create(slug="secret-news", cover="test.webp")
        cls.user = User.objects.create_user(
            "testplayer", password="A-local-test-password-982"
        )

    def setUp(self):
        cache.clear()

    def test_published_only_and_pagination(self):
        r = self.client.get("/api/games/").json()
        self.assertEqual(r["count"], 8)
        self.assertEqual(len(r["results"]), 6)
        self.assertIsNotNone(r["next"])
        second = self.client.get("/api/games/?page=2").json()
        self.assertEqual(len(second["results"]), 2)
        self.assertEqual(len({g["slug"] for g in r["results"] + second["results"]}), 8)

    def test_drafts_and_scheduled_are_not_retrievable(self):
        for slug in ["secret-draft", "scheduled"]:
            self.assertEqual(self.client.get(f"/api/games/{slug}/").status_code, 404)
        self.assertEqual(self.client.get("/api/news/secret-news/").status_code, 404)

    def test_translation_and_az_fallback(self):
        self.assertEqual(
            self.client.get("/api/games/game-0/?lang=en").json()["title"],
            "English world",
        )
        self.assertEqual(
            self.client.get("/api/games/game-0/?lang=ru").json()["title"], "Oyun 0"
        )
        self.assertEqual(
            self.client.get("/api/games/game-0/?lang=invalid").json()["body"],
            "Ətraflı məzmun",
        )

    def test_filter_search_order_and_price(self):
        r = self.client.get(
            "/api/games/?genres__slug=adventure&platforms__slug=pc&ordering=-price"
        ).json()
        self.assertEqual(r["results"][0]["price"], "70.00")
        self.assertEqual(
            self.client.get("/api/games/?search=English").json()["count"], 1
        )
        self.assertEqual(
            self.client.get("/api/games/?price__gte=50").json()["count"], 3
        )
        self.assertEqual(
            self.client.get("/api/games/?genres__slug=missing").json()["count"], 0
        )

    def test_page_size_is_bounded(self):
        self.assertEqual(
            len(self.client.get("/api/games/?page_size=9999").json()["results"]), 8
        )
        self.assertEqual(self.client.get("/api/games/?page=9999").status_code, 404)

    def test_news_filter_and_localization(self):
        r = self.client.get("/api/news/?lang=ru&search=Studio").json()
        self.assertEqual(r["count"], 1)
        self.assertEqual(r["results"][0]["title"], "Studio xəbəri")

    def payload(self, **kwargs):
        return dict(
            name="Test Player",
            email="qa@example.com",
            message="I would like to try an upcoming game.",
            language="en",
            consent=True,
            game=self.game.id,
            **kwargs,
        )

    def test_demo_persists_and_does_not_expose_inbox(self):
        r = self.client.post(
            "/api/demo-requests/", self.payload(), content_type="application/json"
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(DemoRequest.objects.get().status, "new")
        self.assertEqual(self.client.get("/api/demo-requests/").status_code, 405)
        self.assertNotIn("internal_note", r.json())

    def test_demo_rejects_bad_consent_draft_short_message_and_honeypot(self):
        for changes in [
            {"consent": False},
            {"game": self.draft.id},
            {"message": "short"},
            {"website": "spam.example"},
            {"email": "invalid"},
        ]:
            payload = self.payload()
            payload.update(changes)
            self.assertEqual(
                self.client.post(
                    "/api/demo-requests/", payload, content_type="application/json"
                ).status_code,
                400,
            )
        self.assertEqual(DemoRequest.objects.count(), 0)

    def test_demo_throttle(self):
        for _ in range(5):
            self.assertEqual(
                self.client.post(
                    "/api/demo-requests/",
                    self.payload(),
                    content_type="application/json",
                ).status_code,
                201,
            )
        self.assertEqual(
            self.client.post(
                "/api/demo-requests/", self.payload(), content_type="application/json"
            ).status_code,
            429,
        )

    def test_csrf_required_for_demo(self):
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(
            client.post(
                "/api/demo-requests/", self.payload(), content_type="application/json"
            ).status_code,
            403,
        )
        token = client.get("/api/auth/session/").json()["csrfToken"]
        self.assertEqual(
            client.post(
                "/api/demo-requests/",
                self.payload(),
                content_type="application/json",
                HTTP_X_CSRFTOKEN=token,
                HTTP_ORIGIN="http://127.0.0.1:3001",
            ).status_code,
            201,
        )

    def test_session_login_logout_and_csrf(self):
        client = Client(enforce_csrf_checks=True)
        data = {"username": "testplayer", "password": "A-local-test-password-982"}
        self.assertEqual(
            client.post(
                "/api/auth/login/", data, content_type="application/json"
            ).status_code,
            403,
        )
        token = client.get("/api/auth/session/").json()["csrfToken"]
        r = client.post(
            "/api/auth/login/",
            data,
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(
            client.get("/api/auth/session/").json()["user"]["username"], "testplayer"
        )
        self.assertEqual(
            client.post(
                "/api/auth/logout/", HTTP_X_CSRFTOKEN=r.json()["csrfToken"]
            ).status_code,
            200,
        )
        self.assertIsNone(client.get("/api/auth/session/").json()["user"])

    def test_login_throttle(self):
        for _ in range(10):
            self.assertEqual(
                self.client.post(
                    "/api/auth/login/",
                    {"username": "bad", "password": "bad"},
                    content_type="application/json",
                ).status_code,
                400,
            )
        self.assertEqual(
            self.client.post(
                "/api/auth/login/",
                {"username": "bad", "password": "bad"},
                content_type="application/json",
            ).status_code,
            429,
        )

    def test_no_public_content_mutations(self):
        self.assertEqual(
            self.client.post(
                "/api/games/", {}, content_type="application/json"
            ).status_code,
            405,
        )
        self.assertEqual(self.client.delete("/api/games/game-0/").status_code, 405)
        self.assertEqual(self.client.get("/admin/studio/demorequest/").status_code, 302)

    @override_settings(PUBLIC_MEDIA_ORIGIN="https://app.racotagames.com")
    def test_production_media_never_exposes_docker_hostnames(self):
        GameImage.objects.create(
            game=self.game, image="games/gallery/test.webp", alt_az="Görüntü"
        )
        game = self.client.get("/api/games/game-0/", HTTP_HOST="testserver").json()
        self.assertEqual(
            game["cover"], "https://app.racotagames.com/media/games/test.webp"
        )
        self.assertEqual(
            game["gallery"][0]["image"],
            "https://app.racotagames.com/media/games/gallery/test.webp",
        )
        news = self.client.get("/api/news/studio-update/").json()
        self.assertEqual(
            news["cover"], "https://app.racotagames.com/media/news/test.webp"
        )

    @override_settings(
        ALLOWED_HOSTS=["racotagames.com", "app.racotagames.com"],
        CSRF_TRUSTED_ORIGINS=["https://racotagames.com", "https://app.racotagames.com"],
        SESSION_COOKIE_SECURE=True,
        CSRF_COOKIE_SECURE=True,
    )
    def test_https_proxy_login_and_host_only_cookies(self):
        client = Client(enforce_csrf_checks=True)
        token = client.get(
            "/api/auth/session/",
            HTTP_HOST="racotagames.com",
            HTTP_X_FORWARDED_PROTO="https",
        ).json()["csrfToken"]
        self.assertTrue(client.cookies["csrftoken"]["secure"])
        self.assertEqual(client.cookies["csrftoken"]["domain"], "")
        r = client.post(
            "/api/auth/login/",
            {"username": "testplayer", "password": "A-local-test-password-982"},
            content_type="application/json",
            HTTP_HOST="racotagames.com",
            HTTP_ORIGIN="https://racotagames.com",
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(client.cookies["sessionid"]["secure"])
        self.assertEqual(client.cookies["sessionid"]["domain"], "")

    def test_readiness_includes_database_and_cache(self):
        response = self.client.get("/healthz/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_readiness_failure_does_not_leak_internal_error(self):
        with patch(
            "config.health.cache.get", side_effect=RuntimeError("private-cache-host")
        ):
            with self.assertLogs("config.health", level="ERROR"):
                response = self.client.get("/healthz/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})
        self.assertNotContains(response, "private-cache-host", status_code=503)

    def test_forwarded_client_ips_have_independent_login_limits(self):
        for _ in range(10):
            self.client.post(
                "/api/auth/login/",
                {"username": "bad", "password": "bad"},
                content_type="application/json",
                HTTP_X_FORWARDED_FOR="198.51.100.1",
            )
        blocked = self.client.post(
            "/api/auth/login/",
            {"username": "bad", "password": "bad"},
            content_type="application/json",
            HTTP_X_FORWARDED_FOR="198.51.100.1",
        )
        other = self.client.post(
            "/api/auth/login/",
            {"username": "bad", "password": "bad"},
            content_type="application/json",
            HTTP_X_FORWARDED_FOR="198.51.100.2",
        )
        self.assertEqual(blocked.status_code, 429)
        self.assertEqual(other.status_code, 400)
