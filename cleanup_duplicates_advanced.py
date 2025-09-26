import os
import shutil
import filecmp
import difflib
from datetime import datetime

# Configuration
DUPLICATE_FILES = [
    # Add tuples of duplicate file paths here, e.g. ("backend/README.md", "gplus_smart_builder_pro/README.md")
    ("README.md", "gplus_smart_builder_pro/README.md"),
    ("README.md", "gplus-smart-builder-pro/README.md"),
    ("requirements.txt", "gplus_smart_builder_pro/requirements.txt"),
    ("requirements.txt", "gplus-smart-builder-pro/requirements.txt"),
    ("Dockerfile", "backend/Dockerfile"),
    ("Dockerfile", "frontend/Dockerfile"),
    ("app.py", "gplus_smart_builder_pro/app.py"),
    ("app.py", "gplus-smart-builder-pro/app.py"),
    ("src/main.py", "gplus_smart_builder_pro/src/main.py"),
    ("src/main.py", "gplus-smart-builder-pro/src/main.py"),
    ("tests/test_main.py", "gplus_smart_builder_pro/tests/test_main.py"),
    ("tests/test_main.py", "gplus-smart-builder-pro/tests/test_main.py"),
    # Add more as needed
]

BACKUP_DIR = "duplicate_backups"
REPORT_FILE = "deduplication_report.md"


def ensure_backup_dir():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)


def backup_file(filepath):
    ensure_backup_dir()
    if os.path.exists(filepath):
        # Replace both / and \ with __ to handle all OSes
        safe_name = filepath.replace("/", "__").replace("\\", "__")
        backup_path = os.path.join(BACKUP_DIR, safe_name)
        backup_dir = os.path.dirname(backup_path)
        if backup_dir and not os.path.exists(backup_dir):
            os.makedirs(backup_dir, exist_ok=True)
        shutil.copy2(filepath, backup_path)
        return backup_path
    return None


def merge_files(file1, file2):
    """Return a merged string of both files, highlighting differences."""
    with open(file1, encoding="utf-8") as f1, open(file2, encoding="utf-8") as f2:
        lines1 = f1.readlines()
        lines2 = f2.readlines()
    diff = list(difflib.unified_diff(lines1, lines2, fromfile=file1, tofile=file2, lineterm=""))
    merged = []
    for line in diff:
        merged.append(line)
    return "".join(merged)


def write_report(report_lines):
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))


def main():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report = [f"# Deduplication Report\n\nGenerated: {timestamp}\n"]
    for file1, file2 in DUPLICATE_FILES:
        exists1 = os.path.exists(file1)
        exists2 = os.path.exists(file2)
        report.append(f"## {file1} <-> {file2}")
        if not exists1 or not exists2:
            report.append(f"- [ ] One or both files missing. Skipped.")
            continue
        backup1 = backup_file(file1)
        backup2 = backup_file(file2)
        if filecmp.cmp(file1, file2, shallow=False):
            report.append(f"- [x] Files are identical. Removing {file2}.")
            os.remove(file2)
        else:
            merged_content = merge_files(file1, file2)
            merged_path = file1  # Keep file1 as canonical
            with open(merged_path, "w", encoding="utf-8") as f:
                f.write(merged_content)
            os.remove(file2)
            report.append(f"- [x] Files differed. Merged into {file1}, removed {file2}.")
            report.append(f"- [ ] Manual review recommended for {file1} (see diff below):\n\n```")
            report.append(merged_content)
            report.append("```")
        report.append("")
    write_report(report)
    print(f"Deduplication complete. See {REPORT_FILE} and {BACKUP_DIR}/ for details.")


if __name__ == "__main__":
    main()
