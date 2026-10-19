import os
import shutil
from PIL import Image

# Mapping from source file to (canonical_named_file, alias_name)
MAPPING = {
    "0001-0ab3103e.jpg": ("mahindra-xuv-3xo-red-compact-suv-360x536.jpg", "xuv3xo.jpg"),
    "0002-e6e733db.jpg": ("mahindra-xuv700-blue-suv-360x536.jpg", "xuv700.jpg"),
    "0004-85c77d88.png": ("wuling-binguo-ev-black-hatchback-1000x650.png", "binguo-ev.png"),
    "0005-0ac10fad.png": ("volvo-em90-luxury-electric-mpv-1000x650.png", "volvo-em90.png"),
    "0006-10252c51.png": ("honda-wrv-rs-red-crossover-1000x650.png", "honda-wrv.png"),
    "0008-45fabae4.png": ("volkswagen-id4-blue-electric-suv-1000x650.png", "vw-id4.png"),
    "0011-96aad83b.jpg": ("honda-elevate-black-suv-front-930x620.jpg", "honda-elevate.jpg"),
    "0012-e3931daa.jpg": ("hyundai-creta-facelift-action-921x519.jpg", "creta-action.jpg"),
    "0013-240edcd6.jpg": ("hyundai-creta-white-suv-921x519.jpg", "creta.jpg"),
    "0014-59ce9559.jpg": ("toyota-camry-hybrid-executive-luxury-360x536.jpg", "camry.jpg"),
    "0016-2fdcae1e.jpg": ("maruti-swift-red-hatchback-portrait-360x536.jpg", "swift-portrait.jpg"),
    "0017-91d05640.png": ("audi-s5-sportback-luxury-sedan-1000x650.png", "audi-s5.png"),
    "0018-300a5bdd.png": ("maruti-brezza-red-compact-suv-1260x564.png", "brezza.png"),
    "0019-a15a75a3.png": ("tata-punch-blue-suv-1260x564.png", "punch.png"),
    "0021-022f1c40.png": ("mahindra-be6e-electric-suv-coupe-1000x650.png", "mahindra-be6e.png"),
    "0022-61881e0a.jpg": ("toyota-vellfire-ultra-luxury-mpv-360x536.jpg", "vellfire.jpg"),
    "0025-ab8b0165.jpg": ("toyota-glanza-mirror-blue-921x519.jpg", "glanza-mirror.jpg"),
    "0028-8a785204.jpg": ("maruti-swift-red-hatchback-angle-360x536.jpg", "swift.jpg"),
    "0029-69cf7cab.jpg": ("honda-elevate-heritage-fort-tour-840x545.jpg", "elevate-fort.jpg"),
    "0031-9f01f200.png": ("toyota-bz4x-white-electric-suv-1000x650.png", "toyota-bz4x.png"),
    "0034-241eb857.jpg": ("skoda-slavia-montecarlo-jodhpur-palace-921x519.jpg", "slavia-montecarlo.jpg"),
    "0036-549335c0.png": ("tata-punch-side-profile-blue-919x519.png", "punch-side.png"),
    "0038-ac2fa9e2.webp": ("nissan-gravite-compact-suv-828x621.webp", "nissan-gravite.webp"),
    "0040-fadc5045.png": ("tata-nexon-rear-quarter-921x519.png", "nexon-rear.png"),
    "0042-59c247bf.png": ("toyota-glanza-front-grille-blue-921x519.png", "glanza-grille.png"),
    "0043-4fa515a5.jpg": ("hyundai-creta-rear-angle-921x519.jpg", "creta-rear.jpg"),
    "0046-a60a5d2a.png": ("nissan-patrol-fullsize-luxury-suv-1000x650.png", "nissan-patrol.png"),
    "0048-83ae6f26.jpg": ("toyota-fortuner-black-suv-360x536.jpg", "fortuner.jpg"),
    "0050-116e6942.jpg": ("hyundai-creta-highway-tour-360x536.jpg", "creta-tour.jpg"),
    "0051-3342aa2b.jpg": ("tata-aeris-blue-electric-sedan-921x519.jpg", "tata-aeris.jpg"),
    "0054-78fc66d5.png": ("hyundai-santafe-bronze-luxury-suv-1000x650.png", "hyundai-santafe.png"),
    "0056-f360fe64.png": ("toyota-belta-white-sedan-1000x650.png", "toyota-belta.png"),
    "0058-497aa155.jpg": ("honda-elevate-rear-three-quarter-930x620.jpg", "elevate-rear.jpg"),
    "0059-8a997b4f.png": ("toyota-glanza-red-hatchback-studio-1537x1023.png", "glanza.png"),
    "0062-88c69806.png": ("tata-nexon-fearless-green-suv-1260x564.png", "nexon.png"),
    "0063-869334ef.png": ("toyota-landcruiser-prado-white-suv-1000x650.png", "landcruiser-prado.png"),
    "0066-0ab3103e.jpg": ("mahindra-xuv-3xo-red-compact-suv-360x536-alt.jpg", "xuv3xo-alt.jpg"),
    "0067-96a367da.jpg": ("toyota-glanza-city-night-840x376.jpg", "glanza-night.jpg"),
    "0068-e3687fd8.jpg": ("maruti-wagonr-red-hatchback-360x536.jpg", "wagonr.jpg"),
    "0069-098aee62.jpg": ("skoda-slavia-sedan-front-angle-921x519.jpg", "slavia.jpg"),
    "0070-6f2df23a.png": ("hyundai-venue-blue-compact-suv-400x154.png", "venue.png"),
    "0071-5ffd6ab3.png": ("nissan-juke-blue-crossover-1000x650.png", "nissan-juke.png"),
    "0072-00c96f08.png": ("ford-everest-titanium-grey-suv-1000x650.png", "ford-everest.png"),
    "0074-24911c11.png": ("kia-sportage-black-suv-1000x650.png", "kia-sportage.png"),
    "0075-4abe8d11.png": ("volvo-ex90-grey-electric-suv-1555x1011.png", "volvo-ex90.png"),
    "0076-b0fc1afa.webp": ("mg-hector-plus-black-suv-480x360.webp", "hector-plus.webp"),
}

# Root source dir
src_dir = "assets/fleet/new-images"
dest_dirs = ["assets/fleet", "react/public/assets/fleet", "admin/public/assets/fleet"]

for d in dest_dirs:
    os.makedirs(d, exist_ok=True)

# Copy from new-images
copied_count = 0
for src_name, (canonical_name, alias_name) in MAPPING.items():
    src_path = os.path.join(src_dir, src_name)
    if os.path.exists(src_path):
        for d in dest_dirs:
            canon_dest = os.path.join(d, canonical_name)
            alias_dest = os.path.join(d, alias_name)
            shutil.copy2(src_path, canon_dest)
            shutil.copy2(src_path, alias_dest)
        copied_count += 1
    else:
        print(f"Warning: {src_path} not found!")

# Now handle amaze files in assets/fleet
amaze_mapping = {
    "amaze.webp": ("honda-amaze-red-sedan-921x519.webp", "amaze.webp"),
    "amaze2.webp": ("honda-amaze-silver-sedan-1280x720.webp", "amaze2.webp"),
    "amaze3.webp": ("honda-amaze-red-sedan-1280x720.webp", "amaze3.webp"),
}

for src_name, (canonical_name, alias_name) in amaze_mapping.items():
    src_path = os.path.join("assets/fleet", src_name)
    if os.path.exists(src_path):
        for d in dest_dirs:
            canon_dest = os.path.join(d, canonical_name)
            alias_dest = os.path.join(d, alias_name)
            if os.path.abspath(src_path) != os.path.abspath(canon_dest):
                shutil.copy2(src_path, canon_dest)
            if os.path.abspath(src_path) != os.path.abspath(alias_dest):
                shutil.copy2(src_path, alias_dest)
        copied_count += 1

# Also ensure base fleet webps (sedan, ertiga, innova, tempo, urbania) are copied to dest_dirs
base_webps = [
    "sedan.webp", "sedan-480.webp", "sedan-768.webp",
    "ertiga.webp", "ertiga-480.webp", "ertiga-768.webp",
    "innova.webp", "innova-480.webp", "innova-768.webp",
    "tempo.webp", "tempo-480.webp", "tempo-768.webp",
    "urbania.webp", "urbania-480.webp", "urbania-768.webp"
]
for bw in base_webps:
    src_bw = os.path.join("assets/fleet", bw)
    if os.path.exists(src_bw):
        for d in dest_dirs:
            target_bw = os.path.join(d, bw)
            if os.path.abspath(src_bw) != os.path.abspath(target_bw):
                shutil.copy2(src_bw, target_bw)

print(f"Successfully organized and deployed {copied_count} fleet images to {dest_dirs}!")
