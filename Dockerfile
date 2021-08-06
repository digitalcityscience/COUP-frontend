FROM node:15.14.0

LABEL maintainer="Vinh Ngu"

# Build assets
WORKDIR /build
ADD . .

RUN npm install

EXPOSE 8080
CMD ["npm", "start"]
