import os
import shutil
import uuid
from collections import OrderedDict
from typing import Dict, Literal
from uuid import UUID
from zipfile import ZipFile

from fastapi import FastAPI
from minio import Minio
from models.zip_model import ZipModel
from utils.minio_util import get_objects_list


def register_zipping_api(app: FastAPI, minio_client: Minio, minio_bucket: str):

    job_queue: Dict[UUID, OrderedDict[str, Dict[Literal["completed"], bool]]] = {}

    @app.post("/disk-space-check")
    async def disk_space_check(zip_model: ZipModel):
        _, _, free = shutil.disk_usage("/")

        objects = []
        for file in zip_model.files:
            if file.endswith("/"):
                objects += get_objects_list(
                    minio_client, minio_bucket, zip_model.get_full_path(file)
                )
            else:
                objects.append(zip_model.get_full_path(file))
        total_objects_size = 0
        for obj_path in objects:
            total_objects_size += minio_client.stat_object(minio_bucket, obj_path).size  # type: ignore
        if total_objects_size > free:
            return False
        return True

    @app.post("/zipping")
    async def zipping(zip_model: ZipModel):
        user_downloadable_bucket = f"downloadable-{zip_model.user_id}"
        if not minio_client.bucket_exists(user_downloadable_bucket):
            minio_client.make_bucket(user_downloadable_bucket)

        objects = []
        for file in zip_model.files:
            if file.endswith("/"):
                objects += get_objects_list(
                    minio_client, minio_bucket, zip_model.get_full_path(file)
                )
            else:
                objects.append(zip_model.get_full_path(file))

        zip_file_name = f"{uuid.uuid4()}.zip"
        if zip_model.user_id not in job_queue:
            job_queue[zip_model.user_id] = OrderedDict()
        job_queue[zip_model.user_id][zip_file_name] = {"completed": False}

        with ZipFile(zip_file_name, "w") as zip_file:
            for obj_name in objects:
                object_data = minio_client.get_object(minio_bucket, obj_name)
                zip_file.writestr(obj_name, object_data.read())

        with open(zip_file_name, "rb") as file_data:
            file_stat = os.stat(zip_file_name)
            minio_client.put_object(
                user_downloadable_bucket,
                os.path.basename(zip_file_name),
                file_data,
                file_stat.st_size,
            )
        os.remove(zip_file_name)

        job_queue[zip_model.user_id][zip_file_name] = {"completed": True}

    @app.get("/downloadable/{user_id}")
    async def get_downloadable_list(user_id: UUID):
        objects = minio_client.list_objects(f"downloadable-{user_id}", recursive=True)
        return [obj.object_name for obj in objects]

    @app.get("/job-queue/{user_id}")
    async def get_job_queue(user_id: UUID):
        if (user_id not in job_queue) or (not job_queue.get(user_id)):
            return {}
        (f_name, first_item) = next(iter(job_queue[user_id].items()))
        if first_item.get("completed"):
            del job_queue[user_id][f_name]
        return {"file": f_name, "completed": first_item["completed"]}
