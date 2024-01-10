from celery import Celery
from storage.object_storage import ObjectStorage
from exceptions import TargetException
from swapper import process
from swapper.restoration import *
from swapper.models import Models
from facelib.utils.face_restoration_helper import FaceRestoreHelper
from PIL import Image
import uuid
import os
import io
import cv2
import numpy as np
from timeit import default_timer as timer

celery = Celery(__name__)
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://127.0.0.1:6379")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379")
celery.conf.worker_send_task_events = True
celery.conf.task_send_sent_event = True

@celery.task(bind=True, base=Models)
def process_image(self, source_file, target: str):
    startFaceswap = timer()

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
    endFaceswap = timer()
    print("face swap end: ",  endFaceswap - startFaceswap)
    startScale = timer()

    result_image = cv2.cvtColor(np.array(result_image), cv2.COLOR_RGB2BGR)
    face_helper = FaceRestoreHelper(
        2,
        self.face_det,
        self.face_parse,
        face_size=512,
        crop_ratio=(1, 1),
        save_ext="png",
        use_parse=True,
    )

    print("end FaceRestoreHelper: ", timer() - startScale)
    result_image = face_restoration(result_image, True, True, 3, 0.5, face_helper, self.upsampler, self.codeformer_net, self.device)
    result_image = Image.fromarray(result_image)
    img_bytes = io.BytesIO()
    result_image.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    endScale = timer()
    print("end scale: ",  endScale - startScale)
    name = f"face-swap/results/result_{uuid.uuid4()}.png"
    ObjectStorage.save_file(name, img_bytes)
    return name