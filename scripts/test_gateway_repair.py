"""Exercise repair orchestration against a fake Docker CLI, never a real daemon."""

import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
FAKE_DOCKER = r"""#!/bin/sh
set -eu
printf '%s\n' "$*" >> "$RACOTA_COMMAND_LOG"
case "$*" in
  "network inspect racota_edge") test -f "$RACOTA_FAKE_STATE/network" ;;
  "network create --driver bridge racota_edge") touch "$RACOTA_FAKE_STATE/network" ;;
  "network connect racota_edge artexperts-nginx-1") touch "$RACOTA_FAKE_STATE/connected" ;;
  "inspect artexperts-nginx-1 --format "*)
    echo artexperts_default
    if test -f "$RACOTA_FAKE_STATE/connected"; then echo racota_edge; fi ;;
esac
"""


class GatewayRepairTests(unittest.TestCase):
    def test_migration_is_idempotent_and_only_recreates_racota_apps(self):
        shell = shutil.which("bash")
        if os.name == "nt":
            shell = "C:/Program Files/Git/bin/bash.exe"
        if not shell or not Path(shell).exists():
            self.skipTest("Bash is needed for shell orchestration checks")
        with tempfile.TemporaryDirectory(prefix="racota-repair-") as directory:
            directory = Path(directory)
            docker = directory / "docker"
            docker.write_text(FAKE_DOCKER, encoding="utf-8", newline="\n")
            docker.chmod(0o755)
            env = os.environ.copy()
            env.update(
                RACOTA_FAKE_DIR=directory.as_posix(), RACOTA_SOURCE=ROOT.as_posix()
            )
            command = """
if command -v cygpath >/dev/null 2>&1; then
  RACOTA_FAKE_DIR=$(cygpath -u "$RACOTA_FAKE_DIR")
  RACOTA_SOURCE=$(cygpath -u "$RACOTA_SOURCE")
fi
export PATH="$RACOTA_FAKE_DIR:$PATH"
export RACOTA_FAKE_STATE="$RACOTA_FAKE_DIR"
export RACOTA_COMMAND_LOG="$RACOTA_FAKE_DIR/commands.log"
sh "$RACOTA_SOURCE/deploy/repair-gateway.sh"
"""
            for _ in range(2):
                result = subprocess.run(
                    [shell, "-c", command], env=env, text=True, capture_output=True
                )
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            log = (directory / "commands.log").read_text()
            self.assertEqual(
                log.count("network create --driver bridge racota_edge\n"), 1
            )
            self.assertEqual(
                log.count("network connect racota_edge artexperts-nginx-1\n"), 1
            )
            up = [line for line in log.splitlines() if " up " in line]
            self.assertEqual(len(up), 2)
            for line in up:
                self.assertIn("--no-deps --no-build --pull never", line)
                self.assertTrue(line.endswith("backend frontend racota-gateway"))
                self.assertNotIn("artexperts", line)
            for forbidden in [
                "network disconnect",
                "down -v",
                "system prune",
                " restart ",
                " stop ",
                "volume rm",
            ]:
                self.assertNotIn(forbidden, log)


if __name__ == "__main__":
    unittest.main()
