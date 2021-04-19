FROM ubuntu:18.04 as frontend

RUN apt update && \
    apt install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
ADD ./tetris /app
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r requirements/main_3.8.txt --index-url=https://pypi.python.org/simple
EXPOSE 5000
ENTRYPOINT [ "/app/bin/run.sh" ]

FROM ubuntu:18.04 as backend
RUN apt update && \
    apt install -y wget python3 python3-pip lsb-release && \
    echo "deb https://download.rethinkdb.com/repository/ubuntu-`lsb_release -cs` `lsb_release -cs` main" > /etc/apt/sources.list.d/rethinkdb.list && \
    wget -qO- https://download.rethinkdb.com/repository/raw/pubkey.gpg | apt-key add - && \
    apt update && \
    apt install -y rethinkdb && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /server
ADD ./server /server
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r requirements/main_3.8.txt --index-url=https://pypi.python.org/simple
EXPOSE 8080
EXPOSE 28015
EXPOSE 5987
ENTRYPOINT [ "/server/bin/run.sh"  ]

FROM ubuntu:18.04 as tetris
RUN apt update && \
    apt install -y wget python3 python3-pip lsb-release && \
    echo "deb https://download.rethinkdb.com/repository/ubuntu-`lsb_release -cs` `lsb_release -cs` main" > /etc/apt/sources.list.d/rethinkdb.list && \
    wget -qO- https://download.rethinkdb.com/repository/raw/pubkey.gpg | apt-key add - && \
    apt update && \
    apt install -y rethinkdb && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /tetris
ADD . /tetris
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r requirements/main_3.8.txt --index-url=https://pypi.python.org/simple
EXPOSE 8080
EXPOSE 28015
EXPOSE 5987
ENTRYPOINT [ "/tetris/bin/run.sh"  ]