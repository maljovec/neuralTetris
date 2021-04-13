FROM ubuntu:18.04 as frontend

WORKDIR /app
ADD ./tetris /app
RUN apt update && \
    apt install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*
RUN pip3 install -r requirements/main_3.8.txt --index-url=https://pypi.python.org/simple
ENTRYPOINT [ "/app/bin/run.sh" ]

FROM ubuntu:18.04 as backend
WORKDIR /server
ADD ./server /server
RUN apt update && \
    apt install -y wget python3 python3-pip lsb-release && \
    echo "deb https://download.rethinkdb.com/repository/ubuntu-`lsb_release -cs` `lsb_release -cs` main" > /etc/apt/sources.list.d/rethinkdb.list && \
    wget -qO- https://download.rethinkdb.com/repository/raw/pubkey.gpg | apt-key add - && \
    apt update && \
    apt install -y rethinkdb && \
    rm -rf /var/lib/apt/lists/*
RUN pip3 install --upgrade pip && pip3 install -r requirements/main_3.8.txt --index-url=https://pypi.python.org/simple
ENTRYPOINT [ "/server/bin/run.sh"  ]