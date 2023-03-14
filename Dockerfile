FROM node:16.19

COPY . /usr/local/app
WORKDIR /usr/local/app

RUN npm config set registry https://registry.npmmirror.com
RUN npm i --legacy-peer-deps
RUN npm run build

CMD ["npm", "start"]
