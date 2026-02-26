import logging
from typing import Any

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.services.supabase_catalog import (
    SupabaseCatalogApiError,
    SupabaseCatalogAuthError,
    SupabaseCatalogAuthorizationError,
    SupabaseCatalogConfigurationError,
    SupabaseCatalogRetryableError,
    create_collection,
    create_product,
    ensure_admin_access,
    get_admin_catalog,
    get_public_catalog,
    list_admin_orders,
    update_collection,
    update_admin_order_status,
    update_featured,
    update_product,
    upload_admin_image,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])
logger = logging.getLogger(__name__)


class CatalogCollectionCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=360)
    image_url: str = Field(min_length=1, max_length=2048)
    sort_order: int = Field(default=0, ge=0, le=100000)
    is_active: bool = True
    slug: str | None = Field(default=None, max_length=120)


class CatalogCollectionUpdateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=360)
    image_url: str | None = Field(default=None, max_length=2048)
    sort_order: int | None = Field(default=None, ge=0, le=100000)
    is_active: bool | None = None
    slug: str | None = Field(default=None, max_length=120)


class CatalogProductCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    collection_id: str = Field(min_length=1, max_length=120)
    price: float = Field(ge=0, le=100000)
    description: str = Field(default="", max_length=4000)
    size_guide: list[str] = Field(default_factory=list)
    stock: int = Field(default=0, ge=0, le=100000)
    composition_care: list[str] = Field(default_factory=list)
    images: list[str] = Field(min_length=1, max_length=20)
    is_active: bool = True
    slug: str | None = Field(default=None, max_length=120)


class CatalogProductUpdateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=160)
    collection_id: str | None = Field(default=None, max_length=120)
    price: float | None = Field(default=None, ge=0, le=100000)
    description: str | None = Field(default=None, max_length=4000)
    size_guide: list[str] | None = None
    stock: int | None = Field(default=None, ge=0, le=100000)
    composition_care: list[str] | None = None
    images: list[str] | None = Field(default=None, max_length=20)
    is_active: bool | None = None
    slug: str | None = Field(default=None, max_length=120)


class CatalogFeaturedUpdateRequest(BaseModel):
    signature_product_id: str | None = Field(default=None, max_length=120)
    best_seller_product_ids: list[str] = Field(default_factory=list, max_length=20)


class CatalogAdminOrderUpdateRequest(BaseModel):
    status: str = Field(min_length=1, max_length=80)


def _extract_access_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid bearer token")
    return token.strip()


def _raise_catalog_error(exc: Exception) -> None:
    if isinstance(exc, SupabaseCatalogConfigurationError):
        raise HTTPException(status_code=500, detail=str(exc))
    if isinstance(exc, SupabaseCatalogAuthError):
        raise HTTPException(status_code=401, detail=exc.message)
    if isinstance(exc, SupabaseCatalogAuthorizationError):
        raise HTTPException(status_code=403, detail=exc.message)
    if isinstance(exc, SupabaseCatalogRetryableError):
        raise HTTPException(status_code=503, detail=exc.message)
    if isinstance(exc, SupabaseCatalogApiError):
        status_code = exc.status if 400 <= exc.status < 600 else 502
        raise HTTPException(status_code=status_code, detail=exc.message)
    raise HTTPException(status_code=500, detail="Unexpected catalog error")


def _log_catalog_error(context: str, exc: Exception) -> None:
    if isinstance(exc, SupabaseCatalogApiError):
        logger.warning("%s failed (status=%s): %s", context, exc.status, exc.message)
        return
    if isinstance(exc, SupabaseCatalogAuthError):
        logger.warning("%s failed (auth): %s", context, exc.message)
        return
    if isinstance(exc, SupabaseCatalogAuthorizationError):
        logger.warning("%s failed (forbidden): %s", context, exc.message)
        return
    if isinstance(exc, SupabaseCatalogRetryableError):
        logger.warning("%s failed (retryable): %s", context, exc.message)
        return
    logger.warning("%s failed (unexpected): %s", context, str(exc))


@router.get("/public")
def catalog_public_get(
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return get_public_catalog(settings)
    except Exception as exc:
        _log_catalog_error("Catalog public read", exc)
        _raise_catalog_error(exc)


@router.get("/admin")
def catalog_admin_get(
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return get_admin_catalog(settings, access_token=access_token)
    except Exception as exc:
        _log_catalog_error("Catalog admin read", exc)
        _raise_catalog_error(exc)


@router.get("/admin/access")
def catalog_admin_access_get(
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, bool]:
    try:
        ensure_admin_access(settings, access_token=access_token)
    except Exception as exc:
        _log_catalog_error("Catalog admin access read", exc)
        _raise_catalog_error(exc)

    return {"is_admin": True}


@router.get("/admin/orders")
def catalog_admin_orders_get(
    pending_only: bool = Query(default=True),
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, list[dict[str, Any]]]:
    try:
        orders = list_admin_orders(
            settings,
            access_token=access_token,
            pending_only=pending_only,
        )
    except Exception as exc:
        _log_catalog_error("Catalog admin orders read", exc)
        _raise_catalog_error(exc)

    return {"orders": orders}


@router.put("/admin/orders/{order_id}")
def catalog_admin_order_update(
    order_id: int,
    payload: CatalogAdminOrderUpdateRequest,
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return update_admin_order_status(
            settings,
            access_token=access_token,
            order_id=order_id,
            status=payload.status,
        )
    except Exception as exc:
        _log_catalog_error("Catalog admin order update", exc)
        _raise_catalog_error(exc)


@router.post("/admin/collections")
def catalog_collection_create(
    payload: CatalogCollectionCreateRequest,
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return create_collection(
            settings,
            access_token=access_token,
            title=payload.title,
            description=payload.description,
            image_url=payload.image_url,
            sort_order=payload.sort_order,
            is_active=payload.is_active,
            slug=payload.slug,
        )
    except Exception as exc:
        _log_catalog_error("Catalog collection create", exc)
        _raise_catalog_error(exc)


@router.put("/admin/collections/{collection_id}")
def catalog_collection_update(
    collection_id: str,
    payload: CatalogCollectionUpdateRequest,
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return update_collection(
            settings,
            access_token=access_token,
            collection_id=collection_id,
            title=payload.title,
            description=payload.description,
            image_url=payload.image_url,
            sort_order=payload.sort_order,
            is_active=payload.is_active,
            slug=payload.slug,
        )
    except Exception as exc:
        _log_catalog_error("Catalog collection update", exc)
        _raise_catalog_error(exc)


@router.post("/admin/products")
def catalog_product_create(
    payload: CatalogProductCreateRequest,
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return create_product(
            settings,
            access_token=access_token,
            name=payload.name,
            collection_id=payload.collection_id,
            price=payload.price,
            description=payload.description,
            size_guide=payload.size_guide,
            stock=payload.stock,
            composition_care=payload.composition_care,
            images=payload.images,
            is_active=payload.is_active,
            slug=payload.slug,
        )
    except Exception as exc:
        _log_catalog_error("Catalog product create", exc)
        _raise_catalog_error(exc)


@router.put("/admin/products/{product_id}")
def catalog_product_update(
    product_id: str,
    payload: CatalogProductUpdateRequest,
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return update_product(
            settings,
            access_token=access_token,
            product_id=product_id,
            name=payload.name,
            collection_id=payload.collection_id,
            price=payload.price,
            description=payload.description,
            size_guide=payload.size_guide,
            stock=payload.stock,
            composition_care=payload.composition_care,
            images=payload.images,
            is_active=payload.is_active,
            slug=payload.slug,
        )
    except Exception as exc:
        _log_catalog_error("Catalog product update", exc)
        _raise_catalog_error(exc)


@router.put("/admin/featured")
def catalog_featured_update(
    payload: CatalogFeaturedUpdateRequest,
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return update_featured(
            settings,
            access_token=access_token,
            signature_product_id=payload.signature_product_id,
            best_seller_product_ids=payload.best_seller_product_ids,
        )
    except Exception as exc:
        _log_catalog_error("Catalog featured update", exc)
        _raise_catalog_error(exc)


@router.post("/admin/upload-image")
def catalog_upload_image(
    scope: str = Form(default="products"),
    file: UploadFile = File(...),
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    file_name = file.filename or "image"
    content_type = file.content_type

    try:
        content = file.file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Lecture fichier impossible") from exc
    finally:
        file.file.close()

    try:
        return upload_admin_image(
            settings,
            access_token=access_token,
            filename=file_name,
            content_type=content_type,
            content=content,
            scope=scope,
        )
    except Exception as exc:
        _log_catalog_error("Catalog image upload", exc)
        _raise_catalog_error(exc)
