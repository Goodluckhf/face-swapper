ARG CUDA_VERSION=11.8.0

FROM nvidia/cuda:${CUDA_VERSION}-cudnn8-devel-ubuntu20.04
LABEL maintainer="NVIDIA CORPORATION"

ENV TRT_VERSION 8.6.1.6
SHELL ["/bin/bash", "-c"]

# Setup user account
ARG uid=1000
ARG gid=1000
RUN groupadd -r -f -g ${gid} trtuser && useradd -o -r -l -u ${uid} -g ${gid} -ms /bin/bash trtuser
RUN usermod -aG sudo trtuser
RUN echo 'trtuser:nvidia' | chpasswd
RUN mkdir -p /workspace && chown trtuser /workspace

# Required to build Ubuntu 20.04 without user prompts with DLFW container
ENV DEBIAN_FRONTEND=noninteractive

# Update CUDA signing key
RUN apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/3bf863cc.pub

# Install requried libraries
RUN apt-get update && apt-get install -y software-properties-common
RUN add-apt-repository ppa:ubuntu-toolchain-r/test
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    libgl1 libglib2.0-0 \
    wget \
    git \
    pkg-config \
    sudo \
    ssh \
    libssl-dev \
    pbzip2 \
    pv \
    bzip2 \
    unzip \
    devscripts \
    lintian \
    dh-make \
    build-essential

# Install python3
# compile python from source - avoid unsupported library problems
RUN apt-get install -y checkinstall  libreadline-gplv2-dev  libncursesw5-dev   libsqlite3-dev tk-dev libgdbm-dev libc6-dev libbz2-dev libffi-dev zlib1g-dev && \
    cd /usr/src && \
    sudo wget https://www.python.org/ftp/python/3.10.0/Python-3.10.0.tgz && \
    sudo tar xzf Python-3.10.0.tgz && \
    cd Python-3.10.0 && \
    sudo ./configure --enable-optimizations && \
    sudo make install

RUN apt-get install -y --no-install-recommends \
      python3-pip \
      python3-dev \
      python3-wheel && \
    cd /usr/local/bin && \
    ln -s /usr/bin/python3 python && \
    ln -s /usr/bin/pip3 pip;

# Install TensorRT
RUN ver="${CUDA_VERSION%.*}" &&\
    v="${TRT_VERSION}-1+cuda${ver}" &&\
    apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/3bf863cc.pub &&\
    apt-get update &&\
    sudo apt-get -y install libnvinfer8=${v} libnvonnxparsers8=${v} libnvparsers8=${v} libnvinfer-plugin8=${v} \
        libnvinfer-dev=${v} libnvonnxparsers-dev=${v} libnvparsers-dev=${v} libnvinfer-plugin-dev=${v} \
        python3-libnvinfer=${v} libnvinfer-dispatch8=${v} libnvinfer-dispatch-dev=${v} libnvinfer-lean8=${v} \
        libnvinfer-lean-dev=${v} libnvinfer-vc-plugin8=${v} libnvinfer-vc-plugin-dev=${v} \
        libnvinfer-headers-dev=${v} libnvinfer-headers-plugin-dev=${v}

# Install PyPI packages
RUN pip3 install --upgrade pip && \
    pip3 install setuptools>=41.0.0

# Install Cmake
RUN cd /tmp && \
    wget https://github.com/Kitware/CMake/releases/download/v3.14.4/cmake-3.14.4-Linux-x86_64.sh && \
    chmod +x cmake-3.14.4-Linux-x86_64.sh && \
    ./cmake-3.14.4-Linux-x86_64.sh --prefix=/usr/local --exclude-subdir --skip-license && \
    rm ./cmake-3.14.4-Linux-x86_64.sh

# Download NGC client
RUN cd /usr/local/bin && wget https://ngc.nvidia.com/downloads/ngccli_cat_linux.zip && unzip ngccli_cat_linux.zip && chmod u+x ngc-cli/ngc && rm ngccli_cat_linux.zip ngc-cli.md5 && echo "no-apikey\nascii\n" | ngc-cli/ngc config set

# Set environment and working directory
ENV TRT_LIBPATH /usr/lib/x86_64-linux-gnu
ENV TRT_OSSPATH /workspace/TensorRT
ENV PATH="${PATH}:/usr/local/bin/ngc-cli"
ENV LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:${TRT_OSSPATH}/build/out:${TRT_LIBPATH}"
WORKDIR /usr/src/app

COPY poetry.lock pyproject.toml ./
RUN python3 -m pip install --no-cache-dir poetry==1.4.2 \
    && poetry config virtualenvs.create false \
    && poetry install --without dev,test --no-interaction --no-ansi \
    && rm -rf $(poetry config cache-dir)/{cache,artifacts}
COPY . .