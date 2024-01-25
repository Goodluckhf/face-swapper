FROM prom/prometheus:v2.48.0

COPY ./config.yml /etc/prometheus/prometheus.yml
CMD [ "--config.file=/etc/prometheus/prometheus.yml", \
        "--storage.tsdb.path=/prometheus", \
        "--storage.tsdb.retention=60d", \
        "--web.console.libraries=/etc/prometheus/console_libraries", \
        "--web.console.templates=/etc/prometheus/consoles", \
        "--web.enable-lifecycle" ]
