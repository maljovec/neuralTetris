import attr
from flask_login import UserMixin

@attr.s(kw_only=True)
class User(UserMixin):
    name = attr.ib()
    password = attr.ib()

    def get_id(self):
        return self.name