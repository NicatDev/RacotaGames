"""Static deployment checks. Docker's own config/nginx checks run on the server."""

from pathlib import Path
import yaml

root = Path(__file__).resolve().parent.parent
compose = yaml.safe_load((root / "compose.yaml").read_text())
assert compose["name"] == "racotagames"
services = compose["services"]
for name, service in services.items():
    assert not service.get("ports"), f"{name} must not bind shared host ports"
    assert "healthcheck" in service, f"{name} must have a healthcheck"
    assert "private" in service["networks"], f"{name} must join private network"
    if name != "racota-gateway":
        assert (
            "edge" not in service["networks"]
        ), f"{name} must not join another project's network"
assert compose["networks"]["private"]["internal"] is True
assert compose["networks"]["edge"]["external"] is True
assert compose["networks"]["edge"]["name"] == "racota_edge"
assert "racota-backend" in services["backend"]["networks"]["private"]["aliases"]
assert "racota-frontend" in services["frontend"]["networks"]["private"]["aliases"]
gateway = (root / "deploy/nginx/gateway.conf").read_text()
assert "http://racota-backend:8000" in gateway
assert "http://racota-frontend:3000" in gateway
assert "http://backend:8000" not in gateway
assert "http://frontend:3000" not in gateway
assert compose["volumes"].keys() == {"postgres_data", "media", "staticfiles"}
assert services["backend"]["environment"]["DJANGO_DEBUG"] == "false"
assert (
    services["frontend"]["build"]["args"]["NEXT_PUBLIC_SITE_URL"]
    == "https://racotagames.com"
)
for name in ("backend", "frontend"):
    dockerignore = (root / name / ".dockerignore").read_text()
    assert ".env*" in dockerignore
assert ".local-admin.txt" in (root / "backend/.dockerignore").read_text()
certificate = yaml.safe_load((root / "compose.certificates.yaml").read_text())
assert certificate["volumes"]["shared_certificates"]["external"] is True
override = yaml.safe_load(
    (root / "deploy/edge/artexperts.racota.override.yaml").read_text()
)
assert set(override["services"]) == {"nginx"}
assert set(override["services"]["nginx"]) == {"volumes", "networks"}
assert set(override["services"]["nginx"]["networks"]) == {"default", "racota_edge"}
assert override["networks"]["racota_edge"]["external"] is True
assert override["networks"]["racota_edge"]["name"] == "racota_edge"
for mount in override["services"]["nginx"]["volumes"]:
    assert mount["read_only"] is True
    assert mount["source"].startswith("/opt/RacotaGames/")
for path in root.rglob("*.sh"):
    if any(part in {"node_modules", ".venv", ".next"} for part in path.parts):
        continue
    assert b"\r\n" not in path.read_bytes(), f"{path} must use LF for Linux"
print(
    "Deployment isolation, ports, volumes, domains, secret exclusions and Linux line endings verified."
)
