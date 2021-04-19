#!/bin/bash
rethinkdb --bind all &
pushd server
rethinkdb restore moves.tar.gz
python3 TetrisServer.py &
popd

pushd tetris
bin/run.sh
popd
