import os

p = r"F:\AI\Strix\Source\strix\tools\mcp\client.py"
with open(p, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if 'if config.transport == "stdio":' in line:
        new_lines.append(line)
        new_lines.append("        env = dict(os.environ)\n")
        new_lines.append("        if config.env:\n")
        new_lines.append("            env.update(config.env)\n")
    elif '"env": config.env,' in line:
        new_lines.append('            "env": env,\n')
    else:
        new_lines.append(line)

with open(p, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Updated client.py successfully!")
