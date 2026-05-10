from sqlalchemy.orm import DeclarativeBase, declared_attr, mapped_column
from sqlalchemy import DateTime, func


class Base(DeclarativeBase):
    pass

class TimestampMixin:
    @declared_attr
    def created_at(cls):
        return mapped_column(DateTime(timezone=True), server_default=func.now())

    @declared_attr
    def updated_at(cls):
        return mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())