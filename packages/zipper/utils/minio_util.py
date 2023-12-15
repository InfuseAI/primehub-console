from datetime import datetime, timedelta, timezone
from typing import List

from minio import Minio


def get_buckets_list(minio_client: Minio) -> List[str]:
    buckets = minio_client.list_buckets()
    return [bucket.name for bucket in buckets]


def get_objects_list(
    minio_client: Minio, bucket_name: str, prefix: str | None = None
) -> List[str]:
    try:
        objects = minio_client.list_objects(bucket_name, prefix, recursive=True)
        return [obj.object_name for obj in objects]
    except Exception:
        return []


def delete_old_objects(minio_client: Minio, bucket_name: str, day_frame=2):
    objects = minio_client.list_objects(bucket_name)
    for obj in objects:
        last_modified = obj.last_modified
        age = datetime.now(timezone.utc) - last_modified  # type: ignore
        if age > timedelta(days=day_frame):
            minio_client.remove_object(bucket_name, obj.object_name)
