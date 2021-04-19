#!/bin/bash
rethinkdb &
rethinkdb restore moves.tar.gz
python3 TetrisServer.py