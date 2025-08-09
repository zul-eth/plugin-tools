import zipfile
import os

# Nama folder ekstensi dan nama file zip yang akan dibuat
folder_name = 'buster-v1'
zip_file_name = 'buster-v1.zip'

# Fungsi untuk membuat zip
def zip_folder(folder, zip_name):
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, folder)
                zipf.write(file_path, arcname)

    print(f'✅ ZIP berhasil dibuat: {zip_file_name}')

# Jalankan
zip_folder(folder_name, zip_file_name)
