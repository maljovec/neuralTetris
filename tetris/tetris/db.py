import rethinkdb as r

import os

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", 28015)

RDB = r.RethinkDB()