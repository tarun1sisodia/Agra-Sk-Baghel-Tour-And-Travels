content = """@echo off
wsl -d Ubuntu-F sh -c "service docker start && sleep infinity"
"""
with open(r"F:\AI\run_docker.bat", "w", encoding="utf-8") as f:
    f.write(content)
print("Created F:\\AI\\run_docker.bat successfully")
