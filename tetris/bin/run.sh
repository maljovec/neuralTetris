#!/bin/bash

DIR="${BASH_SOURCE%/*}"
if [[ ! -d "$DIR" ]]; then DIR="$PWD"; fi
. "$DIR/const.sh"
. "$DIR/secret.sh"

export FLASK_APP=tetris
export FLASK_DEBUG=0
flask run