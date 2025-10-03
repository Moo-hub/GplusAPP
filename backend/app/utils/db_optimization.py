"""
Performance optimization utilities for database operations
"""
from typing import Any, Dict, List, Optional, TypeVar, Generic, Type, Union, Callable
from fastapi import Query, Request
from sqlalchemy import func, select, desc, asc
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.base_class import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)
FilterParams = Dict[str, Any]

class Paginator:
    """
    Paginator class for SQL queries
    
    Usage:
    ```
    paginator = Paginator(total_count=100, page=2, page_size=20)
    
    # In response
    return {
        "data": items,
        "pagination": paginator.get_pagination_info()
    }
    ```
    """
    def __init__(
        self, 
        total_count: int, 
        page: int = 1, 
        page_size: int = 20, 
        max_page_size: int = 100
    ):
        """Initialize paginator"""
        self.total_count = total_count
        self.page = max(1, page)  # Ensure page is at least 1
        self.page_size = min(max_page_size, max(1, page_size))  # Ensure valid page size
        self.max_page_size = max_page_size
        
    def get_pagination_info(self) -> Dict[str, Any]:
        """Get pagination metadata"""
        total_pages = (self.total_count + self.page_size - 1) // self.page_size if self.total_count > 0 else 0
        
        return {
            "page": self.page,
            "page_size": self.page_size,
            "total_count": self.total_count,
            "total_pages": total_pages,
            "has_next": self.page < total_pages,
            "has_prev": self.page > 1,
        }
    
    def get_skip(self) -> int:
        """Get number of records to skip"""
        return (self.page - 1) * self.page_size
    
    def get_limit(self) -> int:
        """Get limit"""
        return self.page_size
    
    @classmethod
    def from_request(
        cls, 
        db: Session,
        model: Type[ModelType],
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page"),
        filter_params: Optional[FilterParams] = None,
    ) -> "Paginator":
        """
        Create a Paginator from request query parameters
        
        Args:
            db: Database session
            model: SQLAlchemy model
            page: Page number
            page_size: Items per page
            filter_params: Dictionary of filter parameters
            
        Returns:
            Paginator instance
        """
        query = db.query(model)
        
        # Apply filters if provided
        if filter_params:
            for key, value in filter_params.items():
                if hasattr(model, key) and value is not None:
                    query = query.filter(getattr(model, key) == value)
        
        # Get total count
        total_count = query.count()
        
        return cls(
            total_count=total_count,
            page=page,
            page_size=page_size
        )

def paginated_response(
    db: Session, 
    query,
    page: int = 1, 
    page_size: int = 20,
    max_page_size: int = 100
) -> Dict[str, Any]:
    """
    Apply pagination to a SQLAlchemy query and return paginated response
    
    Args:
        db: Database session
        query: SQLAlchemy query object
        page: Page number (1-indexed)
        page_size: Number of items per page
        max_page_size: Maximum allowed page size
        
    Returns:
        Dict with data and pagination info
    """
    # Clone the query to count total
    count_query = query.with_entities(func.count())
    total_count = count_query.scalar()
    
    # Create paginator
    paginator = Paginator(
        total_count=total_count,
        page=page,
        page_size=page_size,
        max_page_size=max_page_size
    )
    
    # Get paginated results
    items = query.offset(paginator.get_skip()).limit(paginator.get_limit()).all()
    
    return {
        "data": items,
        "pagination": paginator.get_pagination_info()
    }

def optimized_query(
    query,
    select_columns: Optional[List[Any]] = None,
    join_models: Optional[List[Any]] = None,
    eager_load: bool = False
) -> Any:
    """
    Optimize a query by selecting only needed columns and/or joining efficiently
    
    Args:
        query: Base SQLAlchemy query
        select_columns: List of columns to select (optimization)
        join_models: List of models to join
        eager_load: Whether to use joinedload for related objects
        
    Returns:
        Optimized query
    """
    # Select specific columns if provided
    if select_columns:
        query = query.with_entities(*select_columns)
    
    # Apply joins if needed
    if join_models:
        for model in join_models:
            query = query.join(model)
    
    # Apply eager loading if requested
    if eager_load and not select_columns:  # Can't use both specific columns and eager loading
        from sqlalchemy.orm import joinedload
        # Assuming the first model in the chain has relationship attributes
        if hasattr(query.column_descriptions[0]['entity'], '_sa_class_manager'):
            model = query.column_descriptions[0]['entity']
            for relationship in model._sa_class_manager.relationships:
                query = query.options(joinedload(relationship.key))
    
    return query

def apply_sorting(
    query,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None
) -> Any:
    """
    Apply sorting to a query
    
    Args:
        query: SQLAlchemy query
        sort_by: Column name to sort by
        sort_direction: 'asc' or 'desc'
        
    Returns:
        Sorted query
    """
    if not sort_by:
        return query
        
    # Get the model from the query
    model = query.column_descriptions[0]["entity"]
    
    # Check if sort column exists in model
    if not hasattr(model, sort_by):
        return query
        
    column = getattr(model, sort_by)
    
    # Apply sorting
    if sort_direction and sort_direction.lower() == "desc":
        return query.order_by(desc(column))
    else:
        return query.order_by(asc(column))

def get_or_create(
    db: Session, 
    model: Type[ModelType], 
    defaults: Optional[Dict[str, Any]] = None, 
    **kwargs
) -> tuple[ModelType, bool]:
    """
    Get an instance or create it if it doesn't exist
    
    Args:
        db: Database session
        model: Model class
        defaults: Default values for new instance
        **kwargs: Filters to find existing instance
        
    Returns:
        Tuple of (instance, created) where created is a boolean
    """
    instance = db.query(model).filter_by(**kwargs).first()
    if instance:
        return instance, False
    else:
        params = dict(kwargs)
        if defaults:
            params.update(defaults)
        instance = model(**params)
        db.add(instance)
        db.commit()
        db.refresh(instance)
        return instance, True