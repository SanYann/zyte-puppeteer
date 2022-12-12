#syntax=docker/dockerfile:1.3

FROM public.ecr.aws/lambda/nodejs:16 AS base
WORKDIR /var/task
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY zyte-smartproxy-ca.crt /etc/pki/ca-trust/source/anchors/zyte-smartproxy-ca.crt
RUN update-ca-trust

FROM base AS dependencies
RUN npm install --silent --production

FROM dependencies AS build_depedencies
RUN npm install --silent
COPY . .
RUN npm run build

FROM base AS production
COPY --from=dependencies /var/task/node_modules ./node_modules
COPY --from=build_depedencies /var/task/.build .build
RUN cp -R /var/task/.build/* . && rm -rf /var/task/.build

CMD ["get.postHandler"]
