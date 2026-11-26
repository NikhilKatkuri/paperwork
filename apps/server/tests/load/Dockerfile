FROM grafana/k6:2.4.0

WORKDIR /k6
COPY k6.js ./k6.js

ENTRYPOINT ["k6", "run", "/k6/k6.js"]