FROM fluent/fluentd:v1.16-debian-1
COPY ./conf /fluentd/etc
USER root
RUN gem install elasticsearch -v 7.17
RUN gem install fluent-plugin-elasticsearch
RUN gem install fluent-plugin-rewrite-tag-filter
RUN gem install fluent-plugin-multi-format-parser

USER fluent