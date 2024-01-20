import os
import io
from minio import Minio


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
    def get_file(name: str):
        print(name)
        return ObjectStorage.__client.get_object(
            ObjectStorage.__bucket,
            name
        )

    @staticmethod
    def remove_file(name: str):
        return ObjectStorage.__client.remove_object(ObjectStorage.__bucket, name)
