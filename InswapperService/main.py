import io, os, uuid
from exceptions import TargetException, FaceNotFoundException, InvalidSourceException
from fastapi import Body, FastAPI, Form, Request, HTTPException, UploadFile, File, status, Response
from storage.local_storage import LocalStorage
from fastapi.responses import JSONResponse
from worker import process_image, celery
from celery.result import AsyncResult, TimeoutError
from PIL import Image
from asyncio import run, get_running_loop
app = FastAPI()

@app.post('/', status_code=201)
async def start_processing(source: UploadFile = File(), target: str = Form()):
    if source.content_type not in ['image/jpeg', 'image/webp', 'image/png']:
        raise InvalidSourceException()
    path = LocalStorage.save_file(source.filename, await source.read())
    task = process_image.delay(path, target)
    return { "id": task.id }

@app.get('/{id}')
async def get_image(id: str, response: Response):
    task = AsyncResult(id=id, app=celery)
    loop = get_running_loop()
    data = await loop.run_in_executor(None, task._get_task_meta)
    result = {"id": id, "status": data['status']}

    if data['status'] == 'FAILURE':
        try:
            task.get()
        except TargetException as ex:
            response.status_code = status.HTTP_400_BAD_REQUEST
            result['error'] = "Target does not exist"
        except FaceNotFoundException as ex:
            response.status_code = status.HTTP_404_NOT_FOUND
            result['error'] = 'Face not found'
        except Exception as ex:
            response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            result['error'] = 'Error during image processing'
    elif data['status'] == 'SUCCESS':
        result['image'] = task.get()

    return result