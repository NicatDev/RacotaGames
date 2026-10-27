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
assert set(override["services"]["nginx"]) == {"volumes"}
for mount in override["services"]["nginx"]["volumes"]:
    assert mount["read_only"] is True
    assert mount["source"].startswith("/opt/racotagames/")
for path in root.rglob("*.sh"):
    if any(part in {"node_modules", ".venv", ".next"} for part in path.parts):
        continue
    assert b"\r\n" not in path.read_bytes(), f"{path} must use LF for Linux"
print(
    "Deployment isolation, ports, volumes, domains, secret exclusions and Linux line endings verified."
)
