import os

# Folders to completely ignore so they don't flood the output
IGNORE_DIRS = {"venv", "node_modules", "__pycache__", ".git", "ui", ".pytest_cache"}

# Only show these file types
VALID_EXTS = (".py", ".txt", ".json", ".env", ".md", ".csv")


def generate_sync_tree(start_path="."):
    print("--- PROJECT SYNC SNAPSHOT ---")
    for root, dirs, files in os.walk(start_path):
        # Mutate the list in-place to skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        level = root.replace(start_path, "").count(os.sep)
        indent = " " * 4 * level

        folder_name = (
            os.path.basename(root) if os.path.basename(root) else "ShadowSCAN_Root"
        )
        print(f"{indent}📁 {folder_name}/")

        subindent = " " * 4 * (level + 1)
        for f in sorted(files):
            if f.endswith(VALID_EXTS):
                print(f"{subindent}📄 {f}")


if __name__ == "__main__":
    generate_sync_tree()
