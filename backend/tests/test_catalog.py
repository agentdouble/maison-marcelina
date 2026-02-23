import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.supabase_catalog import SupabaseCatalogAuthorizationError


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_catalog_public_success(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.api.catalog.get_public_catalog",
        lambda settings: {
            "collections": [
                {
                    "id": "collection-1",
                    "slug": "marceline-heritage",
                    "title": "Marceline Heritage",
                    "description": "Collection de base",
                    "image_url": "https://cdn.example/heritage.jpg",
                    "sort_order": 0,
                    "is_active": True,
                }
            ],
            "products": [
                {
                    "id": "product-1",
                    "slug": "robe-heritage",
                    "name": "Robe Heritage",
                    "price": 149.0,
                    "description": "Desc",
                    "size_guide": ["36", "38"],
                    "stock": 8,
                    "composition_care": ["100% coton"],
                    "images": ["https://cdn.example/robe.jpg"],
                    "is_active": True,
                    "collection_id": "collection-1",
                    "collection": {
                        "id": "collection-1",
                        "slug": "marceline-heritage",
                        "title": "Marceline Heritage",
                    },
                }
            ],
            "featured": {
                "signature_product_id": "product-1",
                "best_seller_product_ids": ["product-1"],
                "updated_at": None,
            },
        },
    )

    response = client.get("/catalog/public")

    assert response.status_code == 200
    assert response.json()["collections"][0]["slug"] == "marceline-heritage"


def test_catalog_admin_requires_bearer(client: TestClient) -> None:
    response = client.get("/catalog/admin")

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing bearer token"}


def test_catalog_admin_forbidden(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get_admin_catalog(settings: object, *, access_token: str) -> dict[str, object]:
        raise SupabaseCatalogAuthorizationError("Admin access required")

    monkeypatch.setattr("app.api.catalog.get_admin_catalog", fake_get_admin_catalog)

    response = client.get(
        "/catalog/admin",
        headers={"Authorization": "Bearer access-token"},
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_catalog_collection_create_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_create_collection(
        settings: object,
        *,
        access_token: str,
        title: str,
        description: str,
        image_url: str,
        sort_order: int,
        is_active: bool,
        slug: str | None,
    ) -> dict[str, object]:
        assert access_token == "access-token"
        assert title == "Marceline Heritage"
        return {
            "id": "collection-1",
            "slug": "marceline-heritage",
            "title": title,
            "description": description,
            "image_url": image_url,
            "sort_order": sort_order,
            "is_active": is_active,
            "created_at": None,
            "updated_at": None,
        }

    monkeypatch.setattr("app.api.catalog.create_collection", fake_create_collection)

    response = client.post(
        "/catalog/admin/collections",
        headers={"Authorization": "Bearer access-token"},
        json={
            "title": "Marceline Heritage",
            "description": "Collection de base",
            "image_url": "https://cdn.example/heritage.jpg",
            "sort_order": 0,
            "is_active": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["slug"] == "marceline-heritage"


def test_catalog_product_create_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_create_product(
        settings: object,
        *,
        access_token: str,
        name: str,
        collection_id: str,
        price: float,
        description: str,
        size_guide: list[str],
        stock: int,
        composition_care: list[str],
        images: list[str],
        is_active: bool,
        slug: str | None,
    ) -> dict[str, object]:
        assert access_token == "access-token"
        assert name == "Robe Heritage"
        assert collection_id == "collection-1"
        assert size_guide == ["36", "38"]
        assert stock == 7
        assert images[0].startswith("https://")
        return {
            "id": "product-1",
            "slug": "robe-heritage",
            "name": name,
            "collection_id": collection_id,
            "collection": {
                "id": collection_id,
                "slug": "marceline-heritage",
                "title": "Marceline Heritage",
            },
            "price": price,
            "description": description,
            "size_guide": size_guide,
            "stock": stock,
            "composition_care": composition_care,
            "images": images,
            "is_active": is_active,
            "created_at": None,
            "updated_at": None,
        }

    monkeypatch.setattr("app.api.catalog.create_product", fake_create_product)

    response = client.post(
        "/catalog/admin/products",
        headers={"Authorization": "Bearer access-token"},
        json={
            "name": "Robe Heritage",
            "collection_id": "collection-1",
            "price": 149,
            "description": "Desc",
            "size_guide": ["36", "38"],
            "stock": 7,
            "composition_care": ["100% coton"],
            "images": ["https://cdn.example/robe.jpg"],
            "is_active": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Robe Heritage"


def test_catalog_featured_update_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_update_featured(
        settings: object,
        *,
        access_token: str,
        signature_product_id: str | None,
        best_seller_product_ids: list[str],
    ) -> dict[str, object]:
        assert access_token == "access-token"
        assert signature_product_id == "product-1"
        assert best_seller_product_ids == ["product-1", "product-2"]
        return {
            "signature_product_id": signature_product_id,
            "best_seller_product_ids": best_seller_product_ids,
            "updated_at": "2026-02-22T00:00:00+00:00",
        }

    monkeypatch.setattr("app.api.catalog.update_featured", fake_update_featured)

    response = client.put(
        "/catalog/admin/featured",
        headers={"Authorization": "Bearer access-token"},
        json={
            "signature_product_id": "product-1",
            "best_seller_product_ids": ["product-1", "product-2"],
        },
    )

    assert response.status_code == 200
    assert response.json()["best_seller_product_ids"][1] == "product-2"


def test_catalog_upload_image_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_upload_admin_image(
        settings: object,
        *,
        access_token: str,
        filename: str,
        content_type: str | None,
        content: bytes,
        scope: str,
    ) -> dict[str, str]:
        assert access_token == "access-token"
        assert filename == "photo.jpg"
        assert content_type == "image/jpeg"
        assert content == b"binary-image"
        assert scope == "products"
        return {
            "path": "products/2026/02/photo.jpg",
            "image_url": "https://cdn.example/photo.jpg",
        }

    monkeypatch.setattr("app.api.catalog.upload_admin_image", fake_upload_admin_image)

    response = client.post(
        "/catalog/admin/upload-image",
        headers={"Authorization": "Bearer access-token"},
        data={"scope": "products"},
        files={"file": ("photo.jpg", b"binary-image", "image/jpeg")},
    )

    assert response.status_code == 200
    assert response.json()["image_url"] == "https://cdn.example/photo.jpg"
