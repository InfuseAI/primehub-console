import sys

import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from config import Config
from fastapi import FastAPI
from minio import Minio
from routers.zipping import register_zipping_api
from tasks.clean_task import CleanTask


def main(config_file):
    config = Config(config_file)

    minio_client = Minio(
        config.minio_config.end_point,
        access_key=config.minio_config.access_key,
        secret_key=config.minio_config.secret_key,
        secure=False,
    )

    app = FastAPI()

    scheduler = AsyncIOScheduler()
    CleanTask(scheduler, minio_client)

    @app.on_event("startup")
    async def startup_event():
        scheduler.start()

    @app.on_event("shutdown")
    async def shutdown_event():
        scheduler.shutdown()

    register_zipping_api(app, minio_client, config.minio_config.bucket)
    uvicorn.run(app=app, host="0.0.0.0", port=4000)


if __name__ == "__main__":
    main(sys.argv[1])
