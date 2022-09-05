FROM node:14-alpine

WORKDIR /app

# COPY package.json /app
# RUN yarn global add pm2 typescript && yarn install 

# NODE_ENV is defined in pm2.config.js (keep in non production mode for proper yarn intsall dev dependeny)
#ENV NODE_ENV production

COPY . /app
RUN yarn global add pm2 typescript && yarn install && yarn build

EXPOSE 4000

CMD ["pm2-runtime", "pm2.config.js"]
