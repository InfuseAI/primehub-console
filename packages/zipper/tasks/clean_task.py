from apscheduler.schedulers.asyncio import AsyncIOScheduler
from minio import Minio
from utils.minio_util import delete_old_objects, get_buckets_list


class CleanTask:
    def __init__(self, scheduler: AsyncIOScheduler, minio_client: Minio) -> None:
        self.minio_client = minio_client
        scheduler.add_job(self.do_work, "cron", hour=0, minute=0)

    async def do_work(self):
        print("cleaner's doing his job")
        buckets = get_buckets_list(self.minio_client)
        for bucket in buckets:
            if bucket.startswith("downloadable-"):
                delete_old_objects(self.minio_client, bucket)
