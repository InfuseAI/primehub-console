from typing import List
from uuid import UUID

from pydantic import BaseModel


class ZipModel(BaseModel):
    user_id: UUID
    files: List[str]
    groupName: str
    phfsPrefix: str

    def get_full_path(self, suffix: str):
        if self.phfsPrefix:
            return "/".join(["groups", self.groupName, self.phfsPrefix, suffix])
        return "/".join(["groups", self.groupName, suffix])
