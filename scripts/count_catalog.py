import json
import re

print("=== CATALOG BREAKDOWN ===")

# 1. generated-catalog.json
with open("react/src/data/generated-catalog.json", encoding="utf-8") as f:
    cat = json.load(f)
routes = cat.get("routes", [])
vehicles = cat.get("vehicles", [])
print(f"1. Outstation Routes in generated-catalog.json: {len(routes)}")
print(f"   Vehicles in generated-catalog.json: {len(vehicles)}")

# Sample routes corridors
corridors = set(r.get("corridor") for r in routes if r.get("corridor"))
print(f"   Unique Corridors: {len(corridors)}")

# 2. Static Packages & Airport Transfers in data.ts
with open("react/src/data.ts", encoding="utf-8") as f:
    content = f.read()

# packages
pkg_match = re.search(r"export const packages: readonly TourPackage\[\] = \[(.*?)\];\s*export const", content, re.DOTALL)
if pkg_match:
    pkg_ids = re.findall(r'id:\s*["\']([^"\']+)["\']', pkg_match.group(1))
    print(f"\n2. Tour Packages in react/src/data.ts: {len(pkg_ids)}")
    for pid in pkg_ids:
        print(f"   - {pid}")

# airportTransfers
trans_match = re.search(r"export const airportTransfers: readonly AirportTransfer\[\] = \[(.*?)\];\s*export const", content, re.DOTALL)
if trans_match:
    trans_ids = re.findall(r'id:\s*["\']([^"\']+)["\']', trans_match.group(1))
    print(f"\n3. Airport / Station Transfer Routes in react/src/data.ts: {len(trans_ids)}")
    for tid in trans_ids:
        print(f"   - {tid}")

# 3. Dynamic / Published Catalog Files (CMS snapshot)
published_files = [
    ("generated-published-routes.json", "Published Outstation Routes"),
    ("generated-published-tour-packages.json", "Published Tour Packages"),
    ("generated-published-local-packages.json", "Published Local Packages"),
    ("generated-published-transfer-routes.json", "Published Transfer Routes"),
]

print("\n4. Published Dynamic Catalog Snapshots (CMS):")
for fn, label in published_files:
    try:
        with open(f"react/src/data/{fn}", encoding="utf-8") as f:
            data = json.load(f)
        count = len(data) if isinstance(data, list) else len(data)
        print(f"   - {label} ({fn}): {count}")
        if isinstance(data, list):
            for item in data:
                slug_or_id = item.get("slug") or item.get("id") or item.get("title") or item.get("name")
                print(f"     * {slug_or_id}")
    except Exception as e:
        print(f"   - {fn}: {e}")

# 4. Total summary
print("\n=== TOTALS SUMMARY ===")
print(f"• Total Outstation Routes in Catalog: {len(routes)} routes")
print(f"• Tour Packages: {len(pkg_ids)} static core packages + dynamic published tour packages")
print(f"• Local Packages & Transfers: {len(trans_ids)} static transfers + 5 published local packages + 5 published transfer routes")
