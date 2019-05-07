FROM node:10	

COPY . /usr/src/app	
WORKDIR /usr/src/app	
ENV NODE_ENV dev	
RUN npm ci

CMD npm run dev