import sys

import uvicorn

from fastapi import FastAPI
from config import Config

from routers.zipping import register_zipping_api


def main(config_file):
    config = Config(config_file)

    app = FastAPI()

    register_zipping_api(app, config.minio_config)
    uvicorn.run(app=app, host="0.0.0.0", port=4000)


if __name__ == "__main__":
    main(sys.argv[1])
