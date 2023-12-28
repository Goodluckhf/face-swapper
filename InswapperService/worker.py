from celery import Celery, Task, signals
from storage.object_storage import ObjectStorage
from exceptions import TargetException
from swapper import process
from swapper.restoration import *
from swapper.models import Models
from PIL import Image
import uuid
import os
import io
import cv2
import numpy as np
import time

celery = Celery(__name__)
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://127.0.0.1:6379")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379")

@celery.task(bind=True, base=Models)
def process_image(self, source_file, target: str):
    source_img = Image.open(source_file)
    os.remove(source_file)

    try:
        target_response = ObjectStorage.get_file(target)
    except:
        raise TargetException()
    
    target_img = Image.open(target_response)
    target_response.close()
    target_response.release_conn()

    result_image = process([source_img], target_img, '0', '-1', self.models)
    upsampler = set_realesrgan()
    codeformer_net = ARCH_REGISTRY.get("CodeFormer")(dim_embd=512, codebook_size=1024, n_head=8, n_layers=9, connect_list=["32", "64", "128", "256"]).to(self.device)
    codeformer_net.load_state_dict(self.checkpoint)
    codeformer_net.eval()
    result_image = cv2.cvtColor(np.array(result_image), cv2.COLOR_RGB2BGR)
    result_image = face_restoration(result_image, True, True, True, 0.5, upsampler, codeformer_net, self.device)
    result_image = Image.fromarray(result_image)
    img_bytes = io.BytesIO()
    result_image.save(img_bytes, format='PNG')
    img_bytes.seek(0)

    name = f"result_{uuid.uuid4()}.png"
    ObjectStorage.save_file(name, img_bytes)
    link = ObjectStorage.get_file_url(name)
    return link