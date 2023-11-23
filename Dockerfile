FROM node:20.9.0-alpine3.18

RUN mkdir -p /opt/app
COPY ./api-user-auth/ /opt/app
WORKDIR /opt/app
RUN npm install

CMD [ "npm", "run", "dev"]
