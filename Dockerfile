FROM node:15.5.0 AS build-env

ADD . /dockerdev
WORKDIR /dockerdev

EXPOSE 8000

CMD ["echo 'hello'"]
