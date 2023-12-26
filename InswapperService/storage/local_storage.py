import io
import os
import uuid
from PIL import Image
class LocalStorage:

    TEMP_PATH = 'tmp'

    @staticmethod
    def save_file(name: str, bytes: str):
        isExist = os.path.exists(LocalStorage.TEMP_PATH)
        if not isExist:
            os.makedirs(LocalStorage.TEMP_PATH)

        path = os.path.join(LocalStorage.TEMP_PATH, f'{uuid.uuid4()}-{name}')
        img = Image.open(io.BytesIO(bytes))
        saved = img.save(path)
        return path
