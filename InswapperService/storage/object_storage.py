import os
import io
import asyncio
from minio import Minio
from minio.error import S3Error
from datetime import timedelta
from exceptions import TargetException

class ObjectStorage:


    __bucket = os.environ.get('BUCKET')
    __client = Minio(
        endpoint=os.environ.get('ENDPOINT'),
        access_key=os.environ.get('ACCESS_KEY'),
        secret_key=os.environ.get('SECRET_KEY'),
        secure=False
    )

    @staticmethod
    def save_file(name: str, bytes: io.BytesIO):
        return ObjectStorage.__client.put_object(ObjectStorage.__bucket, name, bytes, len(bytes.getvalue()))

    @staticmethod
    def get_file_url(name: str):
        return ObjectStorage.__client.presigned_get_object(
            ObjectStorage.__bucket,
            name,
            expires=timedelta(hours=2)
        )

    @staticmethod
    def get_file(name: str):
        return ObjectStorage.__client.get_object(
            ObjectStorage.__bucket,
            name
        )

            