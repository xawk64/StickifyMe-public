FROM node:16.17.0
WORKDIR /usr/src/server
COPY package.json /usr/src/server
RUN yarn install
COPY . /usr/src/server
CMD node server.js
EXPOSE 4000