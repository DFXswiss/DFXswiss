from fastapi import APIRouter
from fastapi.staticfiles import StaticFiles

from lnbits.db import Database
from lnbits.helpers import template_renderer

db = Database("ext_dfxswiss")

dfxswiss_static_files = [
    {
        "path": "/dfxswiss/static",
        "app": StaticFiles(packages=[("lnbits", "extensions/dfxswiss/static")]),
        "name": "dfxswiss_static",
    }
]


dfxswiss_ext: APIRouter = APIRouter(prefix="/dfxswiss", tags=["dfxswiss"])


def dfxswiss_renderer():
    return template_renderer(["lnbits/extensions/dfxswiss/templates"])


from .views import *  # noqa
from .views_api import *  # noqa
