# base docker-file for faster/smaller re-build as for some reason we:
# * do not actually use all the build files from webpack but rebuild some from sources anyway and thus need all
#   node_modules present.
FROM node:lts-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /code
RUN mkdir /code/logs
# Install yarn dependencies
COPY yarn.lock package.json ./
COPY common/package.json common/
COPY server/package.json server/
COPY web/package.json web/
COPY locales locales/
RUN yarn install && yarn cache clean
# build image (changes on each build)
COPY . .
RUN yarn build
# command to start the server
EXPOSE 80
CMD yarn start:prod 2>&1 | tee /code/logs/voice-server.log
