#!/bin/bash

export FLASK_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')