FROM python:3.10
WORKDIR /usr/src/app
RUN pip install --upgrade pip
RUN apt update
RUN apt install -y libgl1
COPY poetry.lock pyproject.toml ./
RUN python -m pip install --no-cache-dir poetry==1.4.2 \
    && poetry config virtualenvs.create false \
    && poetry install --without dev,test --no-interaction --no-ansi \
    && rm -rf $(poetry config cache-dir)/{cache,artifacts}