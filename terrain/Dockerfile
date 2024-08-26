FROM debian:bookworm

RUN apt update
RUN apt install -y python3 python3-pip python3-venv libsqlite3-dev gdal-bin git jq
RUN ln -s /usr/bin/python3 /usr/bin/python

RUN mkdir /root/src
WORKDIR /root/src

RUN git clone https://github.com/felt/tippecanoe.git
WORKDIR /root/src/tippecanoe
RUN make -j && make install

WORKDIR /root/src
RUN python -m venv .
RUN bin/pip install mercantile

COPY generate.sh .
COPY make_tile.py .
COPY mapzen-dem.wms.xml .
