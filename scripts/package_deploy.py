"""Create an uploadable source archive, excluding local state and credentials."""

from pathlib import Path
import tarfile

root = Path(__file__).resolve().parent.parent
output = root / "artifacts" / "racotagames-deploy.tar.gz"
output.parent.mkdir(exist_ok=True)
excluded_dirs = {
    ".venv",
    "node_modules",
    ".next",
    ".git",
    "__pycache__",
    "media",
    "staticfiles",
    "backups",
    "artifacts",
    "test-results",
}
top_files = {
    "compose.yaml",
    "compose.certificates.yaml",
    ".env.production.example",
    ".gitignore",
    ".gitattributes",
    "package.json",
    "README.md",
    "DEPLOYMENT.md",
    "ROADMAP.md",
    "ASSETS.md",
}
count = 0
with tarfile.open(output, "w:gz") as archive:
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root)
        if any(part in excluded_dirs for part in relative.parts):
            continue
        if path.is_symlink() or not path.is_file():
            continue
        if len(relative.parts) == 1 and relative.name not in top_files:
            continue
        if len(relative.parts) > 1 and relative.parts[0] not in {
            "frontend",
            "backend",
            "deploy",
            "scripts",
        }:
            continue
        if path.name.startswith(".env") and not path.name.endswith(".example"):
            continue
        if path.name == ".local-admin.txt" or path.suffix in {
            ".pyc",
            ".sqlite3",
            ".tsbuildinfo",
        }:
            continue
        if relative.parts[:2] == ("deploy", "secrets") and not path.name.endswith(
            ".example"
        ):
            continue
        archive.add(path, arcname=relative.as_posix(), recursive=False)
        count += 1
with tarfile.open(output) as archive:
    names = archive.getnames()
    assert (
        "compose.yaml" in names
        and "frontend/Dockerfile" in names
        and "backend/Dockerfile" in names
    )
    assert not any(
        name.endswith(".local-admin.txt")
        or name.endswith("cloudflare.ini")
        or name.endswith(".env.production")
        for name in names
    )
print(
    f"Packaged {count} source files: {output} ({output.stat().st_size:,} bytes). No local DB/media/credentials included."
)
