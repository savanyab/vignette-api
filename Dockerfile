FROM node:v10.15.3
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 10010
CMD [ "swagger", "project", "start" ]