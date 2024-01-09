FROM node:20

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --no-optional

COPY . /usr/src/app

EXPOSE 3000

CMD [ "npm", "run", "start" ]


