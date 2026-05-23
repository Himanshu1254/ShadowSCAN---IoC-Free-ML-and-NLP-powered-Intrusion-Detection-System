import os

# Directories that moved to NIDS today
nids_modules = ["correlation", "ingestion", "ml", "preprocessing", "training"]
# Directories that moved to Core today
core_modules = [
    "api",
    "config",
    "nlp",
    "notifications",
    "response",
    "scripts",
    "shadow_logging",
    "utils",
]

files_fixed = 0

# Walk through the entire project
for root_dir, _, files in os.walk(os.getcwd()):
    # Skip hidden, environment, and frontend folders
    if any(
        skip in root_dir
        for skip in ["venv", "node_modules", ".git", "__pycache__", "ui"]
    ):
        continue

    for file in files:
        if file.endswith(".py"):
            filepath = os.path.join(root_dir, file)

            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()

            changed = False
            for i, line in enumerate(lines):
                # 1. Fix NIDS imports
                for mod in nids_modules:
                    if line.startswith(f"from {mod}"):
                        lines[i] = line.replace(f"from {mod}", f"from NIDS.{mod}", 1)
                        changed = True
                    elif line.startswith(f"import {mod}"):
                        lines[i] = line.replace(
                            f"import {mod}", f"import NIDS.{mod}", 1
                        )
                        changed = True

                # 2. Fix Core imports
                for mod in core_modules:
                    if line.startswith(f"from {mod}"):
                        lines[i] = line.replace(f"from {mod}", f"from Core.{mod}", 1)
                        changed = True
                    elif line.startswith(f"import {mod}"):
                        lines[i] = line.replace(
                            f"import {mod}", f"import Core.{mod}", 1
                        )
                        changed = True

            if changed:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.writelines(lines)
                print(f"✅ Fixed paths in: {filepath}")
                files_fixed += 1

print(f"\n🚀 Done! {files_fixed} files updated to match the Enterprise architecture.")
