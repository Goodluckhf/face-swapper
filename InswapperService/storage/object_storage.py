import os
import io
import asyncio
from minio import Minio
from minio.error import S3Error
from datetime import timedelta
from exceptions import TargetException

class ObjectStorage:


    __bucket = 'data'
    __client = Minio(
        endpoint='localhost:9000',
        access_key='5pz1poMMQE8KAHUQqqP2',
        secret_key='Z4y5NloxPHvwpofL4AD5H5lGNei8SgZHckZzQvLH',
        secure=False
    )

    @staticmethod
    def save_file(name: str, bytes: io.BytesIO):
        current_bucket = ObjectStorage.__client.bucket_exists(ObjectStorage.__bucket)
        if not current_bucket:
            ObjectStorage.__client.make_bucket(ObjectStorage.__bucket)

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

            