import zipfile
import os

# Path ke file ZIP
zip_path = 'buster.zip'

# Folder tujuan ekstraksi
extract_to = 'buster-v1'

# Pastikan folder tujuan ada
os.makedirs(extract_to, exist_ok=True)

# Ekstrak ZIP
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_to)

print(f'✅ Berhasil diekstrak ke: {extract_to}')
