"""
Patch Strix docker_client.py to convert Windows drive paths (e.g. F:\\... or F:/...)
to WSL /mnt/<drive>/... paths when mounting host directories into the Docker container.
"""

import re
from pathlib import Path

target_file = Path(r"F:\AI\Strix\Source\strix\runtime\docker_client.py")
content = target_file.read_text(encoding="utf-8")

old_code = """        # Strix injection: local source trees, sorted shallowest-first so a
        # nested spec lands on top of the tree it covers.
        bind_mounts = self.strix_bind_mounts or ()
        if bind_mounts:
            mounts = create_kwargs.setdefault("mounts", [])
            for spec in sorted(bind_mounts, key=lambda s: str(s["target"]).count("/")):
                mounts.append(
                    DockerSDKMount(
                        target=spec["target"],
                        source=spec["source"],
                        type="bind",
                        read_only=spec.get("read_only", False),
                    )
                )"""

new_code = """        # Strix injection: local source trees, sorted shallowest-first so a
        # nested spec lands on top of the tree it covers.
        bind_mounts = self.strix_bind_mounts or ()
        if bind_mounts:
            mounts = create_kwargs.setdefault("mounts", [])
            for spec in sorted(bind_mounts, key=lambda s: str(s["target"]).count("/")):
                src = str(spec["source"])
                # Translate Windows drive paths to WSL2 /mnt/<drive>/... if daemon is Linux
                import re as _re
                _m = _re.match(r"^([a-zA-Z]):[\\\\/](.*)$", src)
                if _m:
                    _drive = _m.group(1).lower()
                    _rest = _m.group(2).replace("\\\\", "/")
                    src = f"/mnt/{_drive}/{_rest}"
                mounts.append(
                    DockerSDKMount(
                        target=spec["target"],
                        source=src,
                        type="bind",
                        read_only=spec.get("read_only", False),
                    )
                )"""

if old_code in content:
    content = content.replace(old_code, new_code)
    target_file.write_text(content, encoding="utf-8")
    print("SUCCESS: Successfully patched docker_client.py with Windows-to-WSL mount path translation.")
elif "Translate Windows drive paths to WSL2" in content:
    print("ALREADY_PATCHED: docker_client.py already contains Windows-to-WSL mount path translation.")
else:
    print("ERROR: Target code block not found in docker_client.py.")
