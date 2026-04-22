import pandas as pd
import re
import os
import subprocess

# 1. Parse des.csv correctly
des_data = {}
if os.path.exists('database/des/des.csv'):
    try:
        with open('database/des/des.csv', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines[1:]: # skip header
                line = line.strip()
                if not line: continue
                # Handle entire row wrapped in double quotes
                if line.startswith('"') and line.endswith('"'):
                    line = line[1:-1]
                    line = line.replace('""', '"')
                
                parts = line.split(',', 3)
                if len(parts) >= 4:
                    prod = parts[1].strip()
                    desc = parts[3].strip()
                    if desc.startswith('"') and desc.endswith('"'):
                        desc = desc[1:-1]
                    
                    if desc and desc != "nan" and desc != "-" and len(desc) > 5:
                        des_data[prod.lower()] = desc
    except Exception as e:
        print(f"Error loading des.csv: {e}")

print(f"Loaded {len(des_data)} descriptions from des.csv")

# 2. Read Excel
excel_path = 'database/CMS_Produk_MitraAbadi_Update.xlsx'
df = pd.read_excel(excel_path)

# Logic to identify categories based on keywords
def get_kat_info(row):
    nama_low = str(row['Nama Produk']).lower()
    kat_low = str(row['Kategori']).lower()
    
    # Defaults
    tekstur = "renyah"
    jenis = "camilan"
    material = "bahan-bahan pilihan"
    flavor = "cita rasa autentik"
    
    # Texture Logic
    if any(x in nama_low or x in kat_low for x in ['cake', 'roll', 'soft', 'swiss', 'pie']):
        tekstur = "lembut"
        jenis = "kue"
    elif any(x in nama_low or x in kat_low for x in ['noodle', 'mee', 'tofu', 'jelly', 'kenyal']):
        tekstur = "kenyal"
        if 'noodle' in kat_low or 'mee' in nama_low: jenis = "mie instan"
    elif any(x in nama_low or x in kat_low for x in ['biscuit', 'cracker', 'stick', 'crisp', 'chip', 'wafer']):
        tekstur = "crispy renyah"
        if 'wafer' in kat_low: jenis = "wafer"
        elif 'biscuit' in kat_low or 'biskuit' in kat_low: jenis = "biskuit"
        elif 'cracker' in kat_low: jenis = "kraker"
    
    # Material Logic
    mats = {
        'potato': 'kentang berkualitas', 'kentang': 'kentang berkualitas',
        'oat': 'gandum oat tinggi serat', 'grain': 'biji-bijian bernutrisi',
        'tofu': 'kedelai pilihan', 'tahu': 'kedelai pilihan',
        'cheese': 'keju gurih', 'keju': 'keju gurih',
        'milk': 'susu murni', 'susu': 'susu murni',
        'egg': 'telur segar', 'telur': 'telur segar'
    }
    for k, v in mats.items():
        if k in nama_low:
            material = v
            break
            
    # Flavor Logic
    flavs = {
        'chocolate': 'cokelat premium yang manis', 'cokelat': 'cokelat premium yang manis',
        'cheese': 'keju creamy yang gurih', 'keju': 'keju creamy yang gurih',
        'spicy': 'pedas menggoda', 'pedas': 'pedas menggoda',
        'hot': 'pedas intens', 'balado': 'balado pedas manis',
        'bbq': 'barbecue smoky', 'barbecue': 'barbecue smoky',
        'seaweed': 'rumput laut umami', 'tomat': 'tomat segar',
        'tomato': 'tomat segar', 'original': 'original klasik',
        'vanilla': 'vanila lembut', 'tiramisu': 'tiramisu elegan'
    }
    for k, v in flavs.items():
        if k in nama_low:
            flavor = v
            break
            
    return jenis, material, flavor, tekstur

def generate_premium_desc(row):
    nama_produk = str(row['Nama Produk']).strip()
    brand = str(row['Brand']).strip()
    nama_low = nama_produk.lower()
    
    # 1. Try to find in des.csv
    # Check exact, partial, or reversed match
    if nama_low in des_data:
        return des_data[nama_low].strip('"').replace('""', '"')
    
    for key, val in des_data.items():
        if key in nama_low or (len(key) > 5 and key in nama_low):
            return val.strip('"').replace('""', '"')

    # 2. Generate Fallback
    jenis, material, flavor, tekstur = get_kat_info(row)
    
    desc = (f"{brand} {nama_produk} adalah {jenis} {material} dengan {flavor} yang khas. "
            f"Dibuat dari bahan-bahan bermutu dengan tekstur {tekstur}, setiap gigitannya menghadirkan "
            f"pengalaman rasa yang kaya dan memuaskan. Pilihan praktis dan nikmat bagi Anda yang "
            f"menginginkan camilan lezat berkualitas untuk menemani setiap momen.")
            
    # Remove redundant brand names at start if present
    if desc.lower().startswith(f"{brand.lower()} {brand.lower()}"):
        desc = desc[len(brand)+1:]
        
    return desc

# Apply to ALL rows, overwriting anything that isn't already a "good" description
df['Deskripsi'] = df.apply(generate_premium_desc, axis=1)

# Ensure no empty or "-" descriptions remain
df['Deskripsi'] = df['Deskripsi'].fillna('').apply(lambda x: x if len(str(x)) > 5 else "Produk berkualitas terbaik untuk menemani waktu santai Anda.")

# Save Excel
df.to_excel(excel_path, index=False)
print(f"Finalized {len(df)} descriptions in Excel.")

# 3. RUN SYNC IMMEDIATELY
print("Running sync_cms.js...")
subprocess.run(["node", "sync_cms.js"], check=True)
print("Synchronization complete!")
