"""
Test script for database optimization utilities
"""
import unittest
from unittest.mock import Mock, MagicMock, patch
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

from app.utils.db_optimization import (
    Paginator,
    paginated_response,
    optimized_query,
    apply_sorting,
    get_or_create
)

# Mock setup
Base = declarative_base()

class MockModel(Base):
    __tablename__ = "mock_model"
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    status = Column(String)


class TestDbOptimization(unittest.TestCase):
    
    def setUp(self):
        self.mock_db = MagicMock()
        self.mock_query = MagicMock()
        
    def test_paginator_init(self):
        # Test with normal values
        paginator = Paginator(total_count=100, page=2, page_size=20)
        self.assertEqual(paginator.total_count, 100)
        self.assertEqual(paginator.page, 2)
        self.assertEqual(paginator.page_size, 20)
        
        # Test with negative page (should default to 1)
        paginator = Paginator(total_count=100, page=-1, page_size=20)
        self.assertEqual(paginator.page, 1)
        
        # Test with oversized page_size (should cap at max_page_size)
        paginator = Paginator(total_count=100, page=1, page_size=200, max_page_size=50)
        self.assertEqual(paginator.page_size, 50)
        
    def test_get_pagination_info(self):
        paginator = Paginator(total_count=100, page=2, page_size=20)
        info = paginator.get_pagination_info()
        
        self.assertEqual(info["page"], 2)
        self.assertEqual(info["page_size"], 20)
        self.assertEqual(info["total_count"], 100)
        self.assertEqual(info["total_pages"], 5)
        self.assertTrue(info["has_next"])
        self.assertTrue(info["has_prev"])
        
        # Test last page
        paginator = Paginator(total_count=100, page=5, page_size=20)
        info = paginator.get_pagination_info()
        self.assertFalse(info["has_next"])
        self.assertTrue(info["has_prev"])
        
        # Test first page
        paginator = Paginator(total_count=100, page=1, page_size=20)
        info = paginator.get_pagination_info()
        self.assertTrue(info["has_next"])
        self.assertFalse(info["has_prev"])
        
    def test_get_skip(self):
        paginator = Paginator(total_count=100, page=3, page_size=20)
        self.assertEqual(paginator.get_skip(), 40)
        
    def test_get_limit(self):
        paginator = Paginator(total_count=100, page=3, page_size=20)
        self.assertEqual(paginator.get_limit(), 20)
        
    @patch('app.utils.db_optimization.Paginator')
    def test_paginated_response(self, mock_paginator_class):
        # Setup mock paginator
        mock_paginator = MagicMock()
        mock_paginator.get_skip.return_value = 40
        mock_paginator.get_limit.return_value = 20
        mock_paginator.get_pagination_info.return_value = {
            "page": 3,
            "page_size": 20,
            "total_count": 100,
            "total_pages": 5,
            "has_next": True,
            "has_prev": True
        }
        mock_paginator_class.return_value = mock_paginator
        
        # Setup mock query
        mock_query = MagicMock()
        mock_count_query = MagicMock()
        mock_query.with_entities.return_value = mock_count_query
        mock_count_query.scalar.return_value = 100
        mock_query.offset.return_value.limit.return_value.all.return_value = [
            "item1", "item2", "item3"
        ]
        
        # Test function
        result = paginated_response(self.mock_db, mock_query, page=3, page_size=20)
        
        # Assertions
        mock_query.with_entities.assert_called_once()
        mock_count_query.scalar.assert_called_once()
        mock_query.offset.assert_called_once_with(40)
        mock_query.offset().limit.assert_called_once_with(20)
        mock_query.offset().limit().all.assert_called_once()
        
        self.assertEqual(result["data"], ["item1", "item2", "item3"])
        self.assertEqual(result["pagination"], mock_paginator.get_pagination_info())
        
    def test_apply_sorting_asc(self):
        # Setup
        mock_model = MagicMock()
        mock_model.name = "name_column"
        
        mock_query = MagicMock()
        mock_query.column_descriptions = [{"entity": mock_model}]
        
        # Test ascending sort
        apply_sorting(mock_query, sort_by="name", sort_direction="asc")
        
        # Can't easily test the actual SQLAlchemy ordering in unit tests
        # but we can verify the model attribute was accessed
        mock_model.__getattribute__.assert_called_with("name")
        
    def test_apply_sorting_desc(self):
        # Setup
        mock_model = MagicMock()
        mock_model.name = "name_column"
        
        mock_query = MagicMock()
        mock_query.column_descriptions = [{"entity": mock_model}]
        
        # Test descending sort
        apply_sorting(mock_query, sort_by="name", sort_direction="desc")
        
        # Can't easily test the actual SQLAlchemy ordering in unit tests
        # but we can verify the model attribute was accessed
        mock_model.__getattribute__.assert_called_with("name")
        
    def test_get_or_create_existing(self):
        # Setup for existing item
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter_by.return_value = mock_query
        
        existing_item = MockModel(id=1, name="Existing")
        mock_query.first.return_value = existing_item
        
        # Test existing item
        result, created = get_or_create(mock_db, MockModel, name="Existing")
        
        self.assertEqual(result, existing_item)
        self.assertFalse(created)
        mock_db.commit.assert_not_called()
        
    def test_get_or_create_new(self):
        # Setup for new item
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter_by.return_value = mock_query
        
        # No existing item
        mock_query.first.return_value = None
        
        # Test new item creation
        result, created = get_or_create(
            mock_db, 
            MockModel, 
            defaults={"status": "active"}, 
            name="New Item"
        )
        
        self.assertTrue(created)
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
        
if __name__ == "__main__":
    unittest.main()