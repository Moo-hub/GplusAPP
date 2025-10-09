import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.company import Company

def test_get_companies_no_auth(client: TestClient):
    """Test getting companies without authentication"""
    response = client.get("/api/v1/companies/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_company_no_auth(client: TestClient, db: Session):
    """Test getting a specific company without authentication"""
    # Create a test company
    company = Company(
        name="Test Company",
        description="Test Description",
        materials=["plastic", "paper"],
    )
    db.add(company)
    db.commit()
    
    response = client.get(f"/api/v1/companies/{company.id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Company"
    assert response.json()["description"] == "Test Description"
    assert "plastic" in response.json()["materials"]

def test_create_company_as_admin(client: TestClient, admin_token, db: Session):
    """Test creating a company as admin"""
    company_data = {
        "name": "New Company",
        "description": "New Description",
        "materials": ["glass", "metal"],
        "logo_url": "https://example.com/logo.png",
        "impact_metrics": {"co2_saved": 1000},
        "contact_info": {"email": "contact@example.com"}
    }
    
    response = client.post(
        "/api/v1/companies/",
        json=company_data,
        headers=admin_token,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Company"
    assert response.json()["description"] == "New Description"
    
    # Verify company was created in database
    company = db.query(Company).filter(Company.name == "New Company").first()
    assert company is not None
    assert company.description == "New Description"

def test_create_company_as_user(client: TestClient, test_user_token):
    """Test creating a company as regular user (should fail)"""
    company_data = {
        "name": "Unauthorized Company",
        "description": "Should Not Be Created",
        "materials": ["plastic"]
    }
    
    response = client.post(
        "/api/v1/companies/",
        json=company_data,
        headers=test_user_token,
    )
    assert response.status_code == 403
    
def test_update_company_as_admin(client: TestClient, admin_token, db: Session):
    """Test updating a company as admin"""
    # Create a test company
    company = Company(
        name="Company To Update",
        description="Original Description",
        materials=["plastic"],
    )
    db.add(company)
    db.commit()
    
    # Update the company
    update_data = {
        "name": "Updated Company",
        "description": "Updated Description"
    }
    
    response = client.put(
        f"/api/v1/companies/{company.id}",
        json=update_data,
        headers=admin_token,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Company"
    assert response.json()["description"] == "Updated Description"
    
    # Verify company was updated in database
    db.refresh(company)
    assert company.name == "Updated Company"
    assert company.description == "Updated Description"

def test_delete_company_as_admin(client: TestClient, admin_token, db: Session):
    """Test deleting a company as admin"""
    # Create a test company
    company = Company(
        name="Company To Delete",
        description="Will Be Deleted",
    )
    db.add(company)
    db.commit()
    company_id = company.id
    
    response = client.delete(
        f"/api/v1/companies/{company_id}",
        headers=admin_token,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Company successfully deleted"
    
    # Verify company was deleted from database
    company = db.query(Company).filter(Company.id == company_id).first()
    assert company is None