FROM node:10
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 10010
CMD [ "swagger", "project", "start" ]