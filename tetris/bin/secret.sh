#!/bin/bash

export FLASK_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')