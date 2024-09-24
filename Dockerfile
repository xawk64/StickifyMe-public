FROM node:16.17.0
WORKDIR /usr/src/app
# COPY package.json /usr/src/app
# RUN yarn install
VOLUME ["D:\\projects\\wb-barcodes"]
# COPY ./src /usr/src/app/src
# COPY .eslintrc /usr/src/app
# COPY next-env.d.ts /usr/src/app
# COPY next.config.js /usr/src/app
# COPY postcss.config.js /usr/src/app
# COPY tailwind.config.js /usr/src/app
# COPY tsconfig.json /usr/src/app
CMD yarn dev
EXPOSE 3000
