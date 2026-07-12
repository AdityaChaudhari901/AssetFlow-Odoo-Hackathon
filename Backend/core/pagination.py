"""Pagination parameters and helpers shared by all list endpoints."""

from typing import Annotated, Any, Optional

from fastapi import Query
from pydantic import BaseModel


class PageParams(BaseModel):
    page: int = 1
    limit: int = 20

    @property
    def start(self) -> int:
        """Inclusive start offset for PostgREST .range()."""
        return (self.page - 1) * self.limit

    @property
    def end(self) -> int:
        """Inclusive end offset for PostgREST .range()."""
        return self.start + self.limit - 1

    def meta(self, total: Optional[int]) -> dict[str, Any]:
        return {"page": self.page, "limit": self.limit, "total": total or 0}


def page_params(
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PageParams:
    return PageParams(page=page, limit=limit)


def paged(query: Any, params: PageParams) -> Any:
    """Apply the range window to a PostgREST query builder."""
    return query.range(params.start, params.end)


def list_response(data: list, params: PageParams, total: Optional[int]) -> dict[str, Any]:
    return {"data": data, "meta": params.meta(total)}
