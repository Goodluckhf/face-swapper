FROM python:3.10
WORKDIR /usr/src/app
RUN pip install --upgrade pip
RUN apt update
RUN apt install -y libgl1
RUN git clone https://huggingface.co/spaces/sczhou/CodeFormer
RUN wget -O inswapper_128.onnx https://github.com/facefusion/facefusion-assets/releases/download/models/inswapper_128.onnx
COPY ./requirements.txt .
RUN python -m pip install -r requirements.txt
COPY . .