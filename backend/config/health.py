import logging
from django.db import connection
from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.http import require_GET

logger = logging.getLogger(__name__)


@require_GET
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        cache.set("healthz", "ok", 30)
        if cache.get("healthz") != "ok":
            raise RuntimeError("Cache unavailable")
    except Exception:
        logger.exception("Readiness check failed")
        return JsonResponse(
            {"status": "unavailable"}, status=503, headers={"Cache-Control": "no-store"}
        )
    return JsonResponse({"status": "ok"}, headers={"Cache-Control": "no-store"})
