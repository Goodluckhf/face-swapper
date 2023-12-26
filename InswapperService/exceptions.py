from fastapi import HTTPException, status

class InvalidSourceException(HTTPException):
    def __init__(self):
        self.status_code = status.HTTP_400_BAD_REQUEST
        self.detail = 'Invalid source metatype'

class TargetException(Exception):
    pass

class FaceNotFoundException(Exception):
    pass
