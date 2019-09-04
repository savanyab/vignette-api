FROM node:10.15.3
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 10010
CMD [ "node app.js" ]