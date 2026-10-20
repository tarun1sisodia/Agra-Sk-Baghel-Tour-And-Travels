import os

p = r"F:\AI\Strix\Source\strix\interface\utils.py"
with open(p, "r", encoding="utf-8") as f:
    text = f.read()

target = """    exact = {str(Path(root)).casefold() for root in _FORBIDDEN_MOUNT_ROOTS}
    exact |= {str(Path(root).resolve()).casefold() for root in _FORBIDDEN_MOUNT_ROOTS}
    exact.add(str(Path.home().resolve()).casefold())
    tree_roots = set(_FORBIDDEN_MOUNT_TREES)
    if os.name == "nt":
        drive = Path(resolved.anchor)
        tree_roots |= {str(drive / name) for name in _FORBIDDEN_WINDOWS_TREE_NAMES}
        exact.add(str(drive / "Users").casefold())
    trees = [Path(root) for root in tree_roots] + [Path(root).resolve() for root in tree_roots]"""

replacement = """    if os.name == "nt":
        drive = Path(resolved.anchor)
        tree_roots = {str(drive / name) for name in _FORBIDDEN_WINDOWS_TREE_NAMES}
        exact = {str(Path.home().resolve()).casefold(), str(drive / "Users").casefold()}
        trees = [Path(root) for root in tree_roots]
    else:
        exact = {str(Path(root)).casefold() for root in _FORBIDDEN_MOUNT_ROOTS}
        exact |= {str(Path(root).resolve()).casefold() for root in _FORBIDDEN_MOUNT_ROOTS}
        exact.add(str(Path.home().resolve()).casefold())
        tree_roots = set(_FORBIDDEN_MOUNT_TREES)
        trees = [Path(root) for root in tree_roots] + [Path(root).resolve() for root in tree_roots]"""

if target in text:
    text = text.replace(target, replacement)
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)
    print("Successfully patched utils.py check_mountable_dir for Windows!")
else:
    print("Target block not found in utils.py")
