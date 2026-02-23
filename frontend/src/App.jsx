import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { Footer7 } from "./components/ui/footer-7.tsx";
import { Gallery4 } from "./components/ui/gallery4.tsx";
import { Login1 } from "./components/ui/login-1.tsx";
import { LuminaInteractiveList } from "./components/ui/lumina-interactive-list.tsx";
import {
  ApiRequestError,
  getAccountProfile,
  listAccountOrders,
  updateAccountProfile,
} from "./lib/auth.ts";
import {
  createAdminCollection,
  createAdminProduct,
  getAdminCatalog,
  getPublicCatalog,
  updateAdminCollection,
  updateAdminFeatured,
  updateAdminProduct,
  uploadAdminImage,
} from "./lib/catalog.ts";

const AUTH_SESSION_STORAGE_KEY = "mm_auth_session";

function readJsonStorage(storageKey) {
  if (typeof window === "undefined") {
    return null;
  }
  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function readStoredAuthSession() {
  const parsed = readJsonStorage(AUTH_SESSION_STORAGE_KEY);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  if (typeof parsed.access_token !== "string" || parsed.access_token.length === 0) {
    return null;
  }
  return parsed;
}

function formatAccountDate(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(parsed);
}

function formatClientId(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "-";
  }
  return value.length <= 14 ? value : `${value.slice(0, 14)}...`;
}

function formatOrderTotal(totalAmount, currency) {
  const parsed = Number(totalAmount);
  if (!Number.isFinite(parsed)) {
    return "-";
  }
  const orderCurrency =
    typeof currency === "string" && /^[a-z]{3}$/i.test(currency.trim())
      ? currency.trim().toUpperCase()
      : "EUR";

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: orderCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsed);
  } catch {
    return `${parsed.toFixed(2)} ${orderCurrency}`;
  }
}

function formatOrderItems(itemsCount) {
  if (typeof itemsCount !== "number" || !Number.isInteger(itemsCount)) {
    return "-";
  }
  return `${itemsCount} article${itemsCount > 1 ? "s" : ""}`;
}

function getOrderStatusTone(status) {
  if (typeof status !== "string") {
    return "neutral";
  }
  const normalized = status.trim().toLowerCase();
  if (!normalized) {
    return "neutral";
  }
  if (normalized.includes("livr")) {
    return "success";
  }
  if (
    normalized.includes("annul") ||
    normalized.includes("retour") ||
    normalized.includes("refus")
  ) {
    return "danger";
  }
  if (
    normalized.includes("exped") ||
    normalized.includes("transit") ||
    normalized.includes("prepar")
  ) {
    return "progress";
  }
  if (normalized.includes("cours") || normalized.includes("attente")) {
    return "pending";
  }
  return "neutral";
}

const BASE_NAV_ITEMS = [
  { to: "/", label: "Accueil" },
  { to: "/notre-histoire", label: "Notre Histoire" },
  { to: "/collection", label: "Les collections" },
  { to: "/sur-mesure", label: "Sur mesure" },
];

const defaultProductSizeGuide = [
  "34: poitrine 80-84 cm",
  "36: poitrine 84-88 cm",
  "38: poitrine 88-92 cm",
  "40: poitrine 92-96 cm",
  "42: poitrine 96-100 cm",
];

const defaultShippingAndReturns = [
  "Preparation sous 24/48h",
  "Livraison 2 a 4 jours ouvres",
  "Echange sous 14 jours",
  "Retour via page Contact",
];

const trustHighlights = [
  { title: "Livraison offerte", value: "Des 120 EUR" },
  { title: "Retours", value: "14 jours" },
  { title: "Paiement", value: "Securise" },
  { title: "Support", value: "7j/7" },
];

const storyParagraphs = [
  "Maison Marcelina, c'est avant tout une histoire de transmission, de memoire et d'elegance intemporelle.",
  "Le nom trouve son origine dans celui de Marceline, la soeur de ma grand-mere, une femme dont le souvenir evoque l'allure et le charisme discret.",
  "Au-dela de l'apparence, Marceline incarnait une posture: une elegance qui sait se mettre en valeur, se faire ecouter et admirer.",
  "Chaque detail apporte de la classe: un ourlet net, un tissu soigneusement choisi, une finition delicate, un motif assume.",
  "Maison Marcelina n'est pas une femme figee dans une photo en noir et blanc. C'est une elegance qui vit avec son temps.",
  "Choisir le nom Maison Marcelina, c'est rendre hommage aux femmes qui nous inspirent.",
];

const storySignature =
  "Toujours chic. Toujours appretee. Un brushing impeccable. Un rouge a levres precis. Une signature assumee.";

const storyPillars = [
  "Des creations cousues main avec soin",
  "Des pieces pensees pour durer",
  "Une touche de chic dans le quotidien",
  "Une douceur qui n'efface jamais le caractere",
];

const storyImage =
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80";

const legalPages = [
  {
    path: "/mentions-legales",
    label: "Mentions legales",
    title: "Mentions legales",
    lines: [
      "Maison Marcelina.",
      "Editeur du site.",
      "Hebergement technique.",
      "Contact: page Contact.",
    ],
  },
  {
    path: "/cgv",
    label: "CGV",
    title: "Conditions generales de vente",
    lines: [
      "Vente en ligne d'articles couture.",
      "Paiement securise.",
      "Delais variables selon collection.",
      "Retours selon conditions commande.",
    ],
  },
  {
    path: "/politique-remboursement",
    label: "Remboursement",
    title: "Politique de remboursement",
    lines: [
      "Demande de retour via page Contact.",
      "Verification de l'etat de la piece.",
      "Remboursement selon mode de paiement initial.",
      "Delai de traitement apres validation.",
    ],
  },
  {
    path: "/politique-cookies",
    label: "Cookies",
    title: "Politique cookies",
    lines: [
      "Cookies techniques pour fonctionnement.",
      "Mesure d'audience selon consentement.",
      "Gestion des preferences utilisateur.",
      "Suppression possible via navigateur.",
    ],
  },
  {
    path: "/accessibilite",
    label: "Accessibilite",
    title: "Accessibilite",
    lines: [
      "Navigation clavier prioritaire.",
      "Contrastes lisibles et focus visibles.",
      "Support mobile et ecrans standards.",
      "Signalement des blocages via Contact.",
    ],
  },
];

const emptyPublicCatalog = {
  collections: [],
  products: [],
  featured: {
    signature_product_id: null,
    best_seller_product_ids: [],
  },
};

const mockCatalogCollections = [
  {
    id: "mock-collection-heritage",
    slug: "marceline-heritage",
    title: "Marceline Heritage",
    description: "Collection de base | Vert sauge / Beige / Taupe / Chocolat",
    image_url:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
    sort_order: 0,
    is_active: true,
  },
  {
    id: "mock-collection-riviera",
    slug: "marceline-riviera",
    title: "Marceline Riviera",
    description: "Collection permanente | Vichy / Rayures / Multicouleur",
    image_url:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1600&q=80",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "mock-collection-audacieuse",
    slug: "marceline-audacieuse",
    title: "Marceline Audacieuse",
    description: "Collection permanente | Leopard / Vache / Rouge / Noir",
    image_url:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80",
    sort_order: 2,
    is_active: true,
  },
];

const mockCatalogProducts = [
  {
    id: "mock-product-robe-signature",
    slug: "robe-signature-atelier",
    name: "Robe Signature Atelier",
    collection_id: "mock-collection-heritage",
    collection: {
      id: "mock-collection-heritage",
      slug: "marceline-heritage",
      title: "Marceline Heritage",
    },
    price: 189,
    description: "Robe taillee main, coupe fluide et maintien net.",
    size_guide: defaultProductSizeGuide,
    stock: 8,
    composition_care: ["80% coton", "20% viscose", "Lavage delicat 30C"],
    images: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1467632499275-7a693a761056?auto=format&fit=crop&w=1200&q=80",
    ],
    is_active: true,
  },
  {
    id: "mock-product-top-riviera",
    slug: "top-riviera",
    name: "Top Riviera",
    collection_id: "mock-collection-riviera",
    collection: {
      id: "mock-collection-riviera",
      slug: "marceline-riviera",
      title: "Marceline Riviera",
    },
    price: 96,
    description: "Top structure pour silhouette nette au quotidien.",
    size_guide: defaultProductSizeGuide,
    stock: 14,
    composition_care: ["100% coton", "Lavage 30C", "Repassage doux"],
    images: [
      "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    ],
    is_active: true,
  },
  {
    id: "mock-product-jupe-audacieuse",
    slug: "jupe-audacieuse",
    name: "Jupe Audacieuse",
    collection_id: "mock-collection-audacieuse",
    collection: {
      id: "mock-collection-audacieuse",
      slug: "marceline-audacieuse",
      title: "Marceline Audacieuse",
    },
    price: 158,
    description: "Jupe taille haute, ligne marquee et tombant precis.",
    size_guide: defaultProductSizeGuide,
    stock: 10,
    composition_care: ["65% polyester", "35% coton", "Nettoyage delicat"],
    images: [
      "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1200&q=80",
    ],
    is_active: true,
  },
  {
    id: "mock-product-ensemble-atelier",
    slug: "ensemble-atelier",
    name: "Ensemble Atelier",
    collection_id: "mock-collection-heritage",
    collection: {
      id: "mock-collection-heritage",
      slug: "marceline-heritage",
      title: "Marceline Heritage",
    },
    price: 179,
    description: "Ensemble couture avec structure souple et finitions propres.",
    size_guide: defaultProductSizeGuide,
    stock: 6,
    composition_care: ["70% lin", "30% coton", "Lavage main recommande"],
    images: [
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542295669297-4d352b042bca?auto=format&fit=crop&w=1200&q=80",
    ],
    is_active: true,
  },
];

function getFooterSections(isAuthenticated) {
  return [
    {
      title: "Navigation",
      links: [
        { name: "Accueil", href: "/" },
        { name: "Notre Histoire", href: "/notre-histoire" },
        { name: "Boutique", href: "/collection" },
        { name: "Sur mesure", href: "/sur-mesure" },
      ],
    },
    {
      title: "Assistance",
      links: [
        { name: "Contact", href: "/contact" },
        { name: "Panier", href: "/panier" },
        { name: isAuthenticated ? "Compte" : "Login", href: isAuthenticated ? "/compte" : "/login" },
      ],
    },
  ];
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path
        d="M12 12.2A4.1 4.1 0 1 0 12 4a4.1 4.1 0 0 0 0 8.2Zm0 2.2c-4.6 0-8 2.5-8 5.6v.8h16V20c0-3.1-3.4-5.6-8-5.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path
        d="M8 9h8.2l-.8 8.1a2 2 0 0 1-2 1.8H10.6a2 2 0 0 1-2-1.8L8 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.7 9V7.8a2.3 2.3 0 1 1 4.6 0V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HamburgerIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      {open ? (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7.25 7.25 16.75 16.75" />
          <path d="M16.75 7.25 7.25 16.75" />
        </g>
      ) : (
        <path
          d="M4 7.5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm0 4.5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm1 3.5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H5Z"
          fill="currentColor"
        />
      )}
    </svg>
  );
}

function HeartOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path
        d="M12.1 19.2 5.8 13a4.2 4.2 0 0 1 6-6l.3.3.3-.3a4.2 4.2 0 0 1 6 6l-6.3 6.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ open = false }) {
  return (
    <svg
      className={open ? "product-detail-chevron product-detail-chevron--open" : "product-detail-chevron"}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
    >
      <path
        d="m9 5 6 7-6 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SiteHeader({ cartCount = 0, cartOpen = false, onToggleCart }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const headerRef = useRef(null);
  const menuClass = mobileMenuOpen ? "menu-tabs menu-tabs--open" : "menu-tabs";
  const isAuthenticated = Boolean(readStoredAuthSession());
  const authRoute = isAuthenticated ? "/compte" : "/login";
  const authLabel = isAuthenticated ? "Compte" : "Login";
  const navItems = useMemo(
    () => buildHeaderNavItems(isAuthenticated),
    [isAuthenticated],
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handlePointerDown = (event) => {
      const headerNode = headerRef.current;
      if (!headerNode) {
        return;
      }

      if (!headerNode.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="brand-row">
        <Link className="brand-link" to="/" aria-label="Accueil Maison Marcelina">
          <img src="/logo-marcelina.svg" alt="Logo Maison Marcelina" />
        </Link>

        <nav className={menuClass} id="main-menu" aria-label="Navigation principale">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                isActive ? "menu-tab menu-tab--active" : "menu-tab"
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to={authRoute}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              isActive
                ? "menu-tab menu-tab--mobile-only menu-tab--active"
                : "menu-tab menu-tab--mobile-only"
            }
          >
            {authLabel}
          </NavLink>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className={cartOpen ? "cart-link cart-link--active" : "cart-link"}
            onClick={onToggleCart}
            aria-label={cartOpen ? "Fermer le panier" : "Ouvrir le panier"}
            aria-expanded={cartOpen}
          >
            <CartIcon />
            {cartCount > 0 ? <span className="cart-count">{cartCount}</span> : null}
          </button>

          <button
            type="button"
            className={mobileMenuOpen ? "menu-toggle menu-toggle--open" : "menu-toggle"}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="main-menu"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            <HamburgerIcon open={mobileMenuOpen} />
          </button>

          <Link className="profile-link" to={authRoute} aria-label={authLabel}>
            <ProfileIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Reveal({ as: Tag = "div", className = "", delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const revealClass = visible ? "scroll-reveal is-visible" : "scroll-reveal";

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -12% 0px",
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`${revealClass} ${className}`.trim()}
      style={{ "--reveal-delay": `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function formatMarketplacePrice(price) {
  const parsed = Number(price);
  if (!Number.isFinite(parsed)) {
    return "-";
  }
  return `${parsed % 1 === 0 ? parsed.toFixed(0) : parsed.toFixed(2)} EUR`;
}

function getCartItemId(item) {
  return item.cartItemId ?? item.id;
}

function buildHeaderNavItems(isAuthenticated) {
  return isAuthenticated
    ? [...BASE_NAV_ITEMS, { to: "/admin", label: "Admin" }]
    : BASE_NAV_ITEMS;
}

function getProductCollectionName(product) {
  if (
    product &&
    product.collection &&
    typeof product.collection === "object" &&
    typeof product.collection.title === "string" &&
    product.collection.title.trim().length > 0
  ) {
    return product.collection.title.trim();
  }
  return "Collection";
}

function normalizeSizeGuideLine(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const separatorIndex = trimmed.indexOf(":");
  if (separatorIndex < 0) {
    return trimmed;
  }

  const sizeLabel = trimmed.slice(0, separatorIndex).trim();
  const rightPart = trimmed.slice(separatorIndex + 1).trim();
  if (!sizeLabel) {
    return trimmed;
  }

  return /^\d+$/.test(rightPart) ? sizeLabel : trimmed;
}

function getProductDetailSections(product) {
  const description =
    typeof product.description === "string" && product.description.trim().length > 0
      ? product.description.trim()
      : "Description a venir";
  const sizeGuide =
    Array.isArray(product.size_guide) && product.size_guide.length > 0
      ? product.size_guide.map(normalizeSizeGuideLine).filter((line) => line.length > 0)
      : defaultProductSizeGuide;
  const resolvedSizeGuide = sizeGuide.length > 0 ? sizeGuide : defaultProductSizeGuide;
  const compositionCare =
    Array.isArray(product.composition_care) && product.composition_care.length > 0
      ? product.composition_care
      : ["Composition et entretien a venir"];

  return [
    {
      id: "description",
      title: "Description",
      lines: [description],
    },
    {
      id: "size-guide",
      title: "Guide des tailles",
      lines: resolvedSizeGuide,
    },
    {
      id: "composition-care",
      title: "Composition et entretien",
      lines: compositionCare,
    },
    {
      id: "shipping-returns",
      title: "Livraison, echanges et retours",
      lines: defaultShippingAndReturns,
    },
  ];
}

function getMarketplaceImages(product) {
  if (!product || !Array.isArray(product.images)) {
    return ["/logo-marcelina.svg"];
  }
  const images = product.images.filter(
    (image) => typeof image === "string" && image.trim().length > 0,
  );
  return images.length > 0 ? images : ["/logo-marcelina.svg"];
}

function getSignatureProduct(products, featured) {
  const signatureId =
    featured &&
    typeof featured === "object" &&
    typeof featured.signature_product_id === "string"
      ? featured.signature_product_id
      : null;
  if (!signatureId) {
    return null;
  }
  return products.find((product) => product.id === signatureId) ?? null;
}

function getBestSellerProducts(products, featured) {
  const bestSellerIds =
    featured &&
    typeof featured === "object" &&
    Array.isArray(featured.best_seller_product_ids)
      ? featured.best_seller_product_ids
      : [];
  if (bestSellerIds.length === 0) {
    return [];
  }
  const byId = new Map(products.map((product) => [product.id, product]));
  return bestSellerIds
    .map((productId) => byId.get(productId))
    .filter((product) => product && product.is_active);
}

function buildBestSellerGalleryItems(products, featured) {
  return getBestSellerProducts(products, featured).map((product) => ({
    id: `${product.id}`,
    title: product.name,
    description: formatMarketplacePrice(product.price),
    href: `/collection/${product.slug}`,
    image: getMarketplaceImages(product)[0] ?? "",
  }));
}

function buildLuminaSlides(collections) {
  return collections
    .filter((collection) => collection.is_active && collection.image_url)
    .map((collection) => ({
      title: collection.title,
      description: collection.description,
      media: collection.image_url,
    }));
}

function getProductSizeOptions(product) {
  const sizeGuide =
    Array.isArray(product.size_guide) && product.size_guide.length > 0
      ? product.size_guide
      : [];
  const options = sizeGuide
    .map((value) => {
      if (typeof value !== "string") {
        return "";
      }
      const raw = value.split(":")[0] ?? value;
      return raw.trim();
    })
    .filter((value) => value.length > 0);

  return options.length > 0 ? Array.from(new Set(options)) : ["34", "36", "38", "40", "42"];
}

function splitMultilineValue(value) {
  if (typeof value !== "string") {
    return [];
  }
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseSizeStockEntries(value) {
  const lines = splitMultilineValue(value);
  const bySize = new Map();

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      continue;
    }

    const size = line.slice(0, separatorIndex).trim();
    const rawStock = line.slice(separatorIndex + 1).trim();
    const parsedStock = Number.parseInt(rawStock, 10);
    if (!size || Number.isNaN(parsedStock) || parsedStock < 0) {
      continue;
    }

    bySize.set(size, parsedStock);
  }

  return Array.from(bySize.entries()).map(([size, stock]) => ({ size, stock }));
}

function serializeSizeStockEntries(entries) {
  return entries.map((entry) => `${entry.size}: ${entry.stock}`);
}

function extractSizeStockTextFromGuide(sizeGuide) {
  if (!Array.isArray(sizeGuide) || sizeGuide.length === 0) {
    return "";
  }
  const entries = parseSizeStockEntries(sizeGuide.join("\n"));
  return serializeSizeStockEntries(entries).join("\n");
}

function buildProductSizingPayload(sizeGuideValue, stockValue, stockBySizeValue) {
  const stockEntries = parseSizeStockEntries(stockBySizeValue);
  if (stockEntries.length > 0) {
    return {
      sizeGuide: serializeSizeStockEntries(stockEntries),
      stock: stockEntries.reduce((total, entry) => total + entry.stock, 0),
    };
  }

  return {
    sizeGuide: splitMultilineValue(sizeGuideValue),
    stock: Math.max(Number.parseInt(stockValue, 10) || 0, 0),
  };
}

function parseSizeStockRowsForEditor(value) {
  const lines = splitMultilineValue(value);
  if (lines.length === 0) {
    return [{ size: "", stock: "" }];
  }

  return lines.map((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      return {
        size: line.trim(),
        stock: "",
      };
    }

    return {
      size: line.slice(0, separatorIndex).trim(),
      stock: line.slice(separatorIndex + 1).trim(),
    };
  });
}

function serializeSizeStockRowsForEditor(rows) {
  return rows
    .map((row) => {
      const size = typeof row.size === "string" ? row.size.trim() : "";
      const stock = typeof row.stock === "string" ? row.stock.trim() : "";
      if (!size && !stock) {
        return ":";
      }
      return `${size}: ${stock}`;
    })
    .join("\n");
}

function buildProductImages(primaryImage, galleryValue) {
  const images = splitMultilineValue(galleryValue);
  const normalizedPrimary =
    typeof primaryImage === "string" && primaryImage.trim().length > 0
      ? primaryImage.trim()
      : "";

  const merged = normalizedPrimary ? [normalizedPrimary, ...images] : images;
  return Array.from(new Set(merged));
}

function hasActiveCollectionImage(collections) {
  return collections.some(
    (collection) =>
      collection &&
      collection.is_active &&
      typeof collection.image_url === "string" &&
      collection.image_url.trim().length > 0,
  );
}

function hasActiveProducts(products) {
  return products.some((product) => product && product.is_active);
}

function buildFeaturedFromProducts(products) {
  const activeProducts = products.filter((product) => product && product.is_active);
  return {
    signature_product_id: activeProducts[0]?.id ?? null,
    best_seller_product_ids: activeProducts.slice(0, 4).map((product) => product.id),
  };
}

function buildCatalogWithFallback(payload) {
  const collections = Array.isArray(payload?.collections) ? payload.collections : [];
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const featured = payload?.featured && typeof payload.featured === "object" ? payload.featured : {};

  const resolvedCollections = hasActiveCollectionImage(collections)
    ? collections
    : mockCatalogCollections;
  const resolvedProducts = hasActiveProducts(products) ? products : mockCatalogProducts;

  const activeProductIds = new Set(
    resolvedProducts
      .filter((product) => product && product.is_active && typeof product.id === "string")
      .map((product) => product.id),
  );

  const signatureId =
    typeof featured.signature_product_id === "string" &&
    activeProductIds.has(featured.signature_product_id)
      ? featured.signature_product_id
      : null;

  const bestSellerIds = Array.isArray(featured.best_seller_product_ids)
    ? Array.from(
        new Set(
          featured.best_seller_product_ids.filter(
            (productId) =>
              typeof productId === "string" && activeProductIds.has(productId),
          ),
        ),
      )
    : [];

  if (signatureId || bestSellerIds.length > 0) {
    return {
      collections: resolvedCollections,
      products: resolvedProducts,
      featured: {
        signature_product_id: signatureId ?? bestSellerIds[0] ?? null,
        best_seller_product_ids:
          bestSellerIds.length > 0 ? bestSellerIds : signatureId ? [signatureId] : [],
      },
    };
  }

  return {
    collections: resolvedCollections,
    products: resolvedProducts,
    featured: buildFeaturedFromProducts(resolvedProducts),
  };
}

function ProductImageSwiper({ images, alt }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dragStartRef = useRef(0);
  const draggingRef = useRef(false);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  const goNext = () => {
    setActiveIndex((current) => (current + 1) % images.length);
  };

  const goPrevious = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  const handlePointerDown = (event) => {
    if (!hasMultipleImages) {
      return;
    }

    draggingRef.current = true;
    dragStartRef.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerUp = (event) => {
    if (!hasMultipleImages || !draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    const delta = event.clientX - dragStartRef.current;

    if (Math.abs(delta) < 32) {
      return;
    }

    if (delta < 0) {
      goNext();
      return;
    }

    goPrevious();
  };

  return (
    <div className={hasMultipleImages ? "media-swiper media-swiper--interactive" : "media-swiper"}>
      <div
        className="media-swiper-track"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
      >
        {images.map((source, index) => (
          <div className="media-swiper-slide" key={`${source}-${index}`}>
            <img
              src={source}
              alt={`${alt} ${index + 1}`}
              loading="lazy"
              draggable="false"
            />
          </div>
        ))}
      </div>

      {hasMultipleImages ? (
        <div className="media-swiper-dots" aria-hidden="true">
          {images.map((_, index) => (
            <button
              type="button"
              key={`${alt}-${index}`}
              className={index === activeIndex ? "media-swiper-dot media-swiper-dot--active" : "media-swiper-dot"}
              onClick={() => setActiveIndex(index)}
              tabIndex={-1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CartItemsList({ items, onQuantityChange, onRemoveItem }) {
  if (items.length === 0) {
    return <p className="cart-empty">Panier vide</p>;
  }

  return (
    <div className="cart-items-list">
      {items.map((item) => {
        const cartItemId = getCartItemId(item);

        return (
          <article className="cart-item-row" key={cartItemId}>
            <img src={item.image} alt={item.name} loading="lazy" />

            <div className="cart-item-meta">
              <h2>{item.name}</h2>
              {item.size ? <p className="cart-item-size">Taille {item.size}</p> : null}
              <p>{formatMarketplacePrice(item.price)}</p>
            </div>

            <div className="cart-item-actions">
              <div className="cart-qty">
                <button
                  type="button"
                  aria-label={`Retirer une unite de ${item.name}`}
                  onClick={() => onQuantityChange(cartItemId, -1)}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Ajouter une unite de ${item.name}`}
                  onClick={() => onQuantityChange(cartItemId, 1)}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="cart-remove"
                onClick={() => onRemoveItem(cartItemId)}
              >
                Supprimer
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CartPanel({ open, items, total, onClose, onQuantityChange, onRemoveItem }) {
  if (!open) {
    return null;
  }

  return (
    <div className="cart-panel-root">
      <button
        type="button"
        className="cart-panel-overlay"
        onClick={onClose}
        aria-label="Fermer le panneau panier"
      />

      <aside className="cart-panel" role="dialog" aria-modal="true" aria-label="Panier">
        <header className="cart-panel-head">
          <h2>Panier</h2>
          <button type="button" onClick={onClose} aria-label="Fermer">
            Fermer
          </button>
        </header>

        <div className="cart-panel-body">
          <CartItemsList
            items={items}
            onQuantityChange={onQuantityChange}
            onRemoveItem={onRemoveItem}
          />
        </div>

        <footer className="cart-panel-foot">
          <p>Total</p>
          <strong>{formatMarketplacePrice(total)}</strong>
        </footer>
      </aside>
    </div>
  );
}

function HomePage({ collections, products, featured, isCatalogLoading }) {
  const slides = useMemo(() => buildLuminaSlides(collections), [collections]);
  const signatureProduct = useMemo(
    () => getSignatureProduct(products, featured),
    [products, featured],
  );
  const bestSellerGalleryItems = useMemo(
    () => buildBestSellerGalleryItems(products, featured),
    [products, featured],
  );
  const signatureImage = signatureProduct ? getMarketplaceImages(signatureProduct)[0] : "";
  const signatureCollection = signatureProduct ? getProductCollectionName(signatureProduct) : "";

  return (
    <section className="page-view home-view">
      <LuminaInteractiveList slides={slides} />

      <div className="home-sections">
        {signatureProduct ? (
          <Reveal as="article" className="signature-piece">
            <div className="signature-visual">
              <img src={signatureImage} alt={signatureProduct.name} loading="lazy" />
            </div>
            <div className="signature-content">
              <p className="signature-eyebrow">Piece signature</p>
              <h2>{signatureProduct.name}</h2>
              <p className="signature-meta">{signatureCollection}</p>
              <p className="signature-price">{formatMarketplacePrice(signatureProduct.price)}</p>
              <Link className="home-cta signature-cta" to={`/collection/${signatureProduct.slug}`}>
                Decouvrir
              </Link>
            </div>
          </Reveal>
        ) : null}

        {bestSellerGalleryItems.length > 0 ? (
          <Reveal as="section" className="best-sellers-block" delay={70}>
            <Gallery4 title="Best-sellers" items={bestSellerGalleryItems} />
          </Reveal>
        ) : null}

        <Reveal
          as="section"
          className="trust-band"
          aria-label="Services boutique"
          delay={90}
        >
          {trustHighlights.map((item) => (
            <article className="trust-item" key={item.title}>
              <p>{item.title}</p>
              <span>{item.value}</span>
            </article>
          ))}
        </Reveal>

        {isCatalogLoading ? <p className="account-loading">Chargement...</p> : null}
      </div>
    </section>
  );
}

function NotreHistoirePage() {
  return (
    <section className="page-view story-view">
      <Reveal className="story-main">
        <figure className="story-image">
          <img
            src={storyImage}
            alt="Portrait inspiration Maison Marcelina"
            loading="lazy"
          />
        </figure>

        <article className="story-panel">
          <p className="story-lead">{storyParagraphs[0]}</p>
          <div className="story-body">
            {storyParagraphs.slice(1).map((paragraph) => (
              <p className="story-body-line" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>

          <p className="story-signature" aria-label="Signature Marceline">
            {storySignature}
          </p>

          <p className="story-claim">
            Maison Marcelina n'est pas seulement une marque, c'est une elegance
            cousue a la main.
          </p>

          <h2 className="story-subtitle">Aujourd'hui, Maison Marcelina</h2>
          <ul className="story-pillar-list">
            {storyPillars.map((pillar) => (
              <li key={pillar}>{pillar}</li>
            ))}
          </ul>
        </article>
      </Reveal>
    </section>
  );
}

function CollectionPage({ products, isCatalogLoading }) {
  const [activeCollection, setActiveCollection] = useState("Toutes");
  const navigate = useNavigate();
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const activeProducts = useMemo(
    () => products.filter((product) => product.is_active),
    [products],
  );

  const collectionFilters = useMemo(
    () => ["Toutes", ...new Set(activeProducts.map((product) => getProductCollectionName(product)))],
    [activeProducts],
  );

  const visibleProducts = useMemo(() => {
    if (activeCollection === "Toutes") {
      return activeProducts;
    }

    return activeProducts.filter(
      (product) => getProductCollectionName(product) === activeCollection,
    );
  }, [activeCollection, activeProducts]);

  const handleCardPointerDown = (event) => {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleCardPointerUp = (event, productId) => {
    if (event.target instanceof Element && event.target.closest("button, a")) {
      return;
    }

    const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);

    if (deltaX + deltaY > 12) {
      return;
    }

    navigate(`/collection/${productId}`);
  };

  const handleCardKeyDown = (event, productId) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    navigate(`/collection/${productId}`);
  };

  return (
    <section className="page-view collection-marketplace-view">
      <div className="collection-marketplace-layout">
        <aside className="collection-marketplace-sidebar" aria-label="Filtres collections">
          <section className="collection-sidebar-block" aria-label="Collections">
            <div className="collection-sidebar-list">
              {collectionFilters.map((collectionName) => (
                <button
                  type="button"
                  key={collectionName}
                  onClick={() => setActiveCollection(collectionName)}
                  className={
                    activeCollection === collectionName
                      ? "collection-sidebar-button collection-sidebar-button--active"
                      : "collection-sidebar-button"
                  }
                >
                  {collectionName}
                </button>
              ))}
            </div>
          </section>

          <p className="collection-result-count">{visibleProducts.length} pieces</p>
        </aside>

        <div className="collection-marketplace-grid">
          {visibleProducts.map((product) => (
            <article
              className="collection-marketplace-card"
              key={product.id}
              role="link"
              tabIndex={0}
              onPointerDown={handleCardPointerDown}
              onPointerUp={(event) => handleCardPointerUp(event, product.slug)}
              onKeyDown={(event) => handleCardKeyDown(event, product.slug)}
            >
              <div className="collection-marketplace-media">
                <span className="collection-card-eyebrow" aria-hidden="true">
                  Essentiels
                </span>
                <ProductImageSwiper
                  images={getMarketplaceImages(product)}
                  alt={product.name}
                />
                <span className="collection-card-favorite" aria-hidden="true">
                  <HeartOutlineIcon />
                </span>
              </div>
              <div className="collection-marketplace-card-body">
                <div className="collection-card-meta">
                  <h2>{product.name}</h2>
                  <p className="collection-marketplace-price">
                    {formatMarketplacePrice(product.price)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      {isCatalogLoading ? <p className="account-loading">Chargement...</p> : null}
      {!isCatalogLoading && visibleProducts.length === 0 ? (
        <p className="account-empty">Aucun produit</p>
      ) : null}
    </section>
  );
}

function ProductDetailPage({ products, onAddToCart }) {
  const { productId } = useParams();
  const [selectedSize, setSelectedSize] = useState("");
  const [openSectionId, setOpenSectionId] = useState(null);

  const product = useMemo(
    () => products.find((item) => item.slug === productId && item.is_active) ?? null,
    [productId, products],
  );

  useEffect(() => {
    setSelectedSize("");
    setOpenSectionId(null);
  }, [productId]);

  if (!product) {
    return <Navigate to="/collection" replace />;
  }

  const detailSections = getProductDetailSections(product);
  const sizeOptions = getProductSizeOptions(product);
  const canAddToCart = selectedSize !== "";

  return (
    <section className="page-view product-detail-view">
      <div className="product-detail-layout">
        <div className="product-detail-media">
          <ProductImageSwiper
            images={getMarketplaceImages(product)}
            alt={product.name}
          />
        </div>

        <Reveal className="product-detail-content">
          <p className="product-detail-line">{getProductCollectionName(product)}</p>
          <h1>{product.name}</h1>
          <p className="product-detail-price">{formatMarketplacePrice(product.price)}</p>
          <label className="product-detail-size-label" htmlFor="product-size">
            Taille
          </label>
          <select
            id="product-size"
            className="product-detail-size-select"
            value={selectedSize}
            onChange={(event) => setSelectedSize(event.target.value)}
            required
          >
            <option value="">Choisir une taille</option>
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="product-detail-add-button"
            disabled={!canAddToCart}
            onClick={() => {
              if (!canAddToCart) {
                return;
              }

              onAddToCart({
                id: product.id,
                cartItemId: `${product.id}-${selectedSize}`,
                name: product.name,
                size: selectedSize,
                price: product.price,
                image: getMarketplaceImages(product)[0],
              });
            }}
          >
            Ajouter au panier
          </button>

          <div className="product-detail-accordion" aria-label="Informations produit">
            {detailSections.map((section) => {
              const isOpen = openSectionId === section.id;

              return (
                <section
                  key={section.id}
                  className={isOpen ? "product-detail-accordion-item is-open" : "product-detail-accordion-item"}
                >
                  <button
                    type="button"
                    className="product-detail-accordion-trigger"
                    onClick={() =>
                      setOpenSectionId((current) =>
                        current === section.id ? null : section.id
                      )
                    }
                    aria-expanded={isOpen}
                    aria-controls={`product-detail-panel-${section.id}`}
                  >
                    <span>{section.title}</span>
                    <ChevronRightIcon open={isOpen} />
                  </button>

                  {isOpen ? (
                    <div
                      id={`product-detail-panel-${section.id}`}
                      className="product-detail-accordion-panel"
                    >
                      {section.lines.map((line) => (
                        <p key={`${section.id}-${line}`}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          <Link className="product-detail-back" to="/collection">
            Retour boutique
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function SurMesurePage() {
  return (
    <section className="page-view form-view">
      <header className="section-head">
        <h1>Sur mesure</h1>
      </header>

      <Reveal as="form" className="form-panel" onSubmit={(event) => event.preventDefault()}>
        <div className="field-row">
          <label>
            <span>Projet souhaite</span>
            <select name="projectType" defaultValue="robe" required>
              <option value="robe">Robe</option>
              <option value="ensemble">Ensemble</option>
              <option value="jupe">Jupe</option>
              <option value="autre">Autre</option>
            </select>
          </label>
        </div>

        <div className="field-row">
          <label>
            <span>Nom</span>
            <input type="text" name="name" placeholder="Nom" required />
          </label>

          <label>
            <span>Email</span>
            <input type="email" name="email" placeholder="email@exemple.com" required />
          </label>
        </div>

        <label>
          <span>Ecriture libre</span>
          <textarea
            name="projectMessage"
            placeholder="Silhouette, matiere, delai..."
            required
          />
        </label>

        <button type="submit">Envoyer</button>
      </Reveal>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="page-view form-view">
      <header className="section-head">
        <h1>Contact commande</h1>
      </header>

      <Reveal as="form" className="form-panel" onSubmit={(event) => event.preventDefault()}>
        <div className="field-row">
          <label>
            <span>Numero de commande</span>
            <input type="text" name="orderNumber" placeholder="MM-0000" required />
          </label>

          <label>
            <span>Email</span>
            <input type="email" name="email" placeholder="email@exemple.com" required />
          </label>
        </div>

        <label>
          <span>Sujet</span>
          <select name="issueType" defaultValue="livraison" required>
            <option value="livraison">Livraison</option>
            <option value="taille">Taille</option>
            <option value="retour">Retour</option>
            <option value="paiement">Paiement</option>
          </select>
        </label>

        <label>
          <span>Message</span>
          <textarea name="issueMessage" placeholder="Details du souci..." required />
        </label>

        <button type="submit">Envoyer</button>
      </Reveal>
    </section>
  );
}

function LoginPage() {
  const navigate = useNavigate();

  return (
    <section className="page-view login-view">
      <Login1
        logo={{
          url: "/",
          src: "/logo-marcelina.svg",
          alt: "Logo Maison Marcelina",
          title: "Maison Marcelina",
        }}
        googleText="Continuer avec Google"
        signupText="Mot de passe oublié ?"
        signupUrl="/contact"
        onLoginSuccess={() => navigate("/", { replace: true })}
      />
    </section>
  );
}

function AccountPage() {
  const navigate = useNavigate();
  const session = readStoredAuthSession();
  const accessToken =
    session && typeof session.access_token === "string" ? session.access_token : "";
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    address: "",
  });
  const [profileUpdatedAt, setProfileUpdatedAt] = useState("");
  const [orders, setOrders] = useState([]);
  const loadRequestRef = useRef(null);
  const profileRequestRef = useRef(null);

  const user = session && session.user && typeof session.user === "object" ? session.user : null;

  const email =
    user && typeof user.email === "string" && user.email.trim().length > 0
      ? user.email.trim()
      : "Non renseigne";
  const clientId = user && typeof user.id === "string" ? user.id : "";
  const createdAt = user && typeof user.created_at === "string" ? user.created_at : "";
  const lastSignInAt =
    user && typeof user.last_sign_in_at === "string" ? user.last_sign_in_at : "";
  const emailConfirmedAt =
    user && typeof user.email_confirmed_at === "string" ? user.email_confirmed_at : "";

  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "orders", label: "Commandes" },
    { id: "details", label: "Coordonnees" },
    { id: "security", label: "Securite" },
  ];

  const profileFieldCount = [profileForm.full_name, profileForm.phone, profileForm.address].filter(
    (value) => typeof value === "string" && value.trim().length > 0,
  ).length;
  const profileCompletion = Math.round((profileFieldCount / 3) * 100);

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => {
    const amount = Number(order.total_amount);
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);
  const inProgressOrders = orders.filter((order) => {
    const status = typeof order.status === "string" ? order.status.toLowerCase() : "";
    return (
      status.includes("cours") ||
      status.includes("attente") ||
      status.includes("exped") ||
      status.includes("prepar") ||
      status.includes("transit")
    );
  }).length;
  const latestOrderDate = totalOrders > 0 ? formatAccountDate(orders[0]?.ordered_at) : "-";

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
    navigate("/login", { replace: true });
  };

  const handleSessionRejected = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
    navigate("/login", { replace: true });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  useEffect(() => {
    return () => {
      loadRequestRef.current?.abort();
      profileRequestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    loadRequestRef.current?.abort();
    loadRequestRef.current = controller;
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([
      getAccountProfile({
        accessToken,
        signal: controller.signal,
      }),
      listAccountOrders({
        accessToken,
        signal: controller.signal,
      }),
    ])
      .then(([profilePayload, ordersPayload]) => {
        if (loadRequestRef.current !== controller) {
          return;
        }
        setProfileForm({
          full_name: typeof profilePayload.full_name === "string" ? profilePayload.full_name : "",
          phone: typeof profilePayload.phone === "string" ? profilePayload.phone : "",
          address: typeof profilePayload.address === "string" ? profilePayload.address : "",
        });
        setProfileUpdatedAt(
          typeof profilePayload.updated_at === "string" ? profilePayload.updated_at : "",
        );
        setOrders(Array.isArray(ordersPayload) ? ordersPayload : []);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (loadRequestRef.current !== controller) {
          return;
        }
        if (
          error instanceof ApiRequestError &&
          (error.status === 401 || error.status === 403)
        ) {
          handleSessionRejected();
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Chargement compte impossible");
      })
      .finally(() => {
        if (loadRequestRef.current !== controller) {
          return;
        }
        loadRequestRef.current = null;
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [accessToken]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (isSavingProfile) {
      return;
    }

    const controller = new AbortController();
    profileRequestRef.current?.abort();
    profileRequestRef.current = controller;

    setIsSavingProfile(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = await updateAccountProfile({
        accessToken,
        full_name: profileForm.full_name.trim() || null,
        phone: profileForm.phone.trim() || null,
        address: profileForm.address.trim() || null,
        signal: controller.signal,
      });

      if (profileRequestRef.current !== controller) {
        return;
      }

      setProfileForm({
        full_name: typeof payload.full_name === "string" ? payload.full_name : "",
        phone: typeof payload.phone === "string" ? payload.phone : "",
        address: typeof payload.address === "string" ? payload.address : "",
      });
      setProfileUpdatedAt(typeof payload.updated_at === "string" ? payload.updated_at : "");
      setSuccessMessage("Coordonnees enregistrees");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (profileRequestRef.current !== controller) {
        return;
      }
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        handleSessionRejected();
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      if (profileRequestRef.current !== controller) {
        return;
      }
      profileRequestRef.current = null;
      setIsSavingProfile(false);
    }
  };

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="page-view account-view">
      <div className="account-shell">
        <div className="account-tabs" role="tablist" aria-label="Navigation compte">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`account-panel-${tab.id}`}
              className={activeTab === tab.id ? "account-tab account-tab--active" : "account-tab"}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Reveal
          as="article"
          className="account-panel"
          delay={20}
          role="tabpanel"
          id={`account-panel-${activeTab}`}
        >
          {isLoading ? <p className="account-loading">Chargement...</p> : null}

          {activeTab === "overview" ? (
            <>
              <div className="account-headline">
                <span
                  className={
                    profileCompletion === 100 ? "account-pill account-pill--ready" : "account-pill"
                  }
                >
                  {profileCompletion}% profil
                </span>
              </div>

              <div className="account-metrics">
                <div className="account-metric">
                  <span>Commandes</span>
                  <strong>{totalOrders}</strong>
                </div>
                <div className="account-metric">
                  <span>Total achats</span>
                  <strong>{formatOrderTotal(totalSpent, "EUR")}</strong>
                </div>
                <div className="account-metric">
                  <span>En preparation</span>
                  <strong>{inProgressOrders}</strong>
                </div>
                <div className="account-metric">
                  <span>Derniere commande</span>
                  <strong>{latestOrderDate}</strong>
                </div>
              </div>

              <div className="account-grid">
                <section className="account-card">
                  <h3>Identite client</h3>
                  <div className="account-kv-grid">
                    <div className="account-kv">
                      <span>Nom</span>
                      <strong>{profileForm.full_name.trim() || "-"}</strong>
                    </div>
                    <div className="account-kv">
                      <span>Email</span>
                      <strong>{email}</strong>
                    </div>
                    <div className="account-kv">
                      <span>Telephone</span>
                      <strong>{profileForm.phone.trim() || "-"}</strong>
                    </div>
                    <div className="account-kv">
                      <span>Adresse</span>
                      <strong>{profileForm.address.trim() || "-"}</strong>
                    </div>
                  </div>
                </section>

                <section className="account-card">
                  <h3>Actions</h3>
                  <div className="account-kv-grid">
                    <div className="account-kv">
                      <span>Client ID</span>
                      <strong>{formatClientId(clientId)}</strong>
                    </div>
                    <div className="account-kv">
                      <span>Mise a jour profil</span>
                      <strong>{formatAccountDate(profileUpdatedAt)}</strong>
                    </div>
                  </div>
                  <div className="account-actions">
                    <button
                      type="button"
                      className="account-secondary-btn"
                      onClick={() => handleTabChange("orders")}
                    >
                      Voir commandes
                    </button>
                    <button
                      type="button"
                      className="account-secondary-btn"
                      onClick={() => handleTabChange("details")}
                    >
                      Modifier profil
                    </button>
                    <Link className="account-secondary-link" to="/contact">
                      Support
                    </Link>
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {activeTab === "orders" ? (
            <>
              <div className="account-headline">
                <Link className="account-secondary-link" to="/contact">
                  Support commande
                </Link>
              </div>

              {orders.length === 0 ? (
                <p className="account-empty">Aucune commande</p>
              ) : (
                <ul className="account-orders">
                  {orders.map((order, index) => {
                    const orderNumber =
                      typeof order.order_number === "string" && order.order_number.trim()
                        ? order.order_number.trim()
                        : "Commande";
                    const statusLabel =
                      typeof order.status === "string" && order.status.trim()
                        ? order.status.trim()
                        : "Inconnu";

                    return (
                      <li
                        className="account-order-item"
                        key={order.id ?? `${orderNumber}-${statusLabel}-${index}`}
                      >
                        <div className="account-order-top">
                          <strong>{orderNumber}</strong>
                          <span
                            className={`account-status account-status--${getOrderStatusTone(statusLabel)}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="account-order-grid">
                          <div className="account-order-cell">
                            <span>Date</span>
                            <strong>{formatAccountDate(order.ordered_at)}</strong>
                          </div>
                          <div className="account-order-cell">
                            <span>Total</span>
                            <strong>{formatOrderTotal(order.total_amount, order.currency)}</strong>
                          </div>
                          <div className="account-order-cell">
                            <span>Articles</span>
                            <strong>{formatOrderItems(order.items_count)}</strong>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : null}

          {activeTab === "details" ? (
            <>
              <form className="account-form-grid" onSubmit={handleProfileSubmit}>
                <label className="account-field">
                  <span>Nom complet</span>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        full_name: event.target.value,
                      }))
                    }
                    placeholder="Nom et prenom"
                    autoComplete="name"
                  />
                </label>
                <label className="account-field">
                  <span>Email</span>
                  <input type="email" value={email} autoComplete="email" disabled />
                </label>
                <label className="account-field">
                  <span>Telephone</span>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+33..."
                    autoComplete="tel"
                  />
                </label>
                <label className="account-field account-field--wide">
                  <span>Adresse</span>
                  <textarea
                    value={profileForm.address}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder="Adresse"
                    autoComplete="street-address"
                  />
                </label>
                <div className="account-form-actions">
                  <button type="submit" className="account-submit-btn" disabled={isSavingProfile}>
                    {isSavingProfile ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            </>
          ) : null}

          {activeTab === "security" ? (
            <>
              <div className="account-grid">
                <section className="account-card">
                  <h3>Session</h3>
                  <div className="account-kv-grid">
                    <div className="account-kv">
                      <span>Email</span>
                      <strong>{email}</strong>
                    </div>
                    <div className="account-kv">
                      <span>Email verifie</span>
                      <strong>{emailConfirmedAt ? "Oui" : "Non"}</strong>
                    </div>
                    <div className="account-kv">
                      <span>Derniere connexion</span>
                      <strong>{formatAccountDate(lastSignInAt)}</strong>
                    </div>
                    <div className="account-kv">
                      <span>Inscription</span>
                      <strong>{formatAccountDate(createdAt)}</strong>
                    </div>
                  </div>
                </section>
                <section className="account-card">
                  <h3>Acces</h3>
                  <div className="account-actions">
                    <button type="button" className="account-logout-btn" onClick={handleLogout}>
                      Se deconnecter
                    </button>
                    <Link className="account-secondary-link" to="/contact">
                      Assistance
                    </Link>
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {errorMessage ? <p className="account-feedback account-feedback--error">{errorMessage}</p> : null}
          {successMessage ? <p className="account-feedback account-feedback--success">{successMessage}</p> : null}
        </Reveal>
      </div>
    </section>
  );
}

function UploadFileButton({ label, disabled, onPickFile }) {
  return (
    <label
      className={disabled ? "dashboard-upload dashboard-upload--modern is-disabled" : "dashboard-upload dashboard-upload--modern"}
    >
      <input
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onPickFile(file);
          }
          event.target.value = "";
        }}
      />
      <span>{label}</span>
    </label>
  );
}

function SizeStockEditor({ value, onChange, disabled }) {
  const rows = useMemo(() => parseSizeStockRowsForEditor(value), [value]);
  const validEntries = useMemo(() => parseSizeStockEntries(value), [value]);
  const total = useMemo(
    () => validEntries.reduce((accumulator, entry) => accumulator + entry.stock, 0),
    [validEntries],
  );

  const setRowAt = (index, updater) => {
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...updater } : row,
    );
    onChange(serializeSizeStockRowsForEditor(nextRows));
  };

  const addRow = () => {
    const nextRows = [...rows, { size: "", stock: "" }];
    onChange(serializeSizeStockRowsForEditor(nextRows));
  };

  const removeRow = (index) => {
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
    if (nextRows.length === 0) {
      onChange("");
      return;
    }
    onChange(serializeSizeStockRowsForEditor(nextRows));
  };

  return (
    <div className="size-stock-editor">
      <div className="size-stock-head">
        <span>Stock par taille</span>
        <strong>{total}</strong>
      </div>
      <div className="size-stock-grid">
        {rows.map((row, index) => (
          <div className="size-stock-row" key={`${row.size}-${row.stock}-${index}`}>
            <input
              type="text"
              className="size-stock-input"
              value={row.size}
              placeholder="Taille"
              disabled={disabled}
              onChange={(event) =>
                setRowAt(index, {
                  size: event.target.value,
                })
              }
            />
            <input
              type="number"
              className="size-stock-input"
              min={0}
              step="1"
              value={row.stock}
              placeholder="Stock"
              disabled={disabled}
              onChange={(event) =>
                setRowAt(index, {
                  stock: event.target.value,
                })
              }
            />
            <button
              type="button"
              className="size-stock-remove"
              disabled={disabled || rows.length <= 1}
              aria-label={`Supprimer la taille ${index + 1}`}
              onClick={() => removeRow(index)}
            >
              Retirer
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="size-stock-add"
        disabled={disabled}
        onClick={addRow}
      >
        Ajouter une taille
      </button>
    </div>
  );
}

function AdminPage({ onCatalogRefresh }) {
  const navigate = useNavigate();
  const session = readStoredAuthSession();
  const accessToken =
    session && typeof session.access_token === "string" ? session.access_token : "";

  const [activeTab, setActiveTab] = useState("collections-add");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);

  const [collectionDrafts, setCollectionDrafts] = useState({});
  const [newCollectionDraft, setNewCollectionDraft] = useState({
    title: "",
    description: "",
    image_url: "",
    sort_order: "",
    is_active: true,
  });
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productDraft, setProductDraft] = useState({
    name: "",
    collection_id: "",
    price: "0",
    description: "",
    size_guide: "",
    stock_by_size: "",
    stock: "0",
    composition_care: "",
    image_url: "",
    gallery_urls: "",
    is_active: true,
  });
  const [newProductDraft, setNewProductDraft] = useState({
    name: "",
    collection_id: "",
    price: "",
    description: "",
    size_guide: "",
    stock_by_size: "",
    stock: "0",
    composition_care: "",
    image_url: "",
    gallery_urls: "",
    is_active: true,
  });
  const [featuredDraft, setFeaturedDraft] = useState({
    signature_product_id: "",
    best_seller_product_ids: [],
  });

  const loadRequestRef = useRef(null);
  const actionRequestRef = useRef(null);
  const uploadRequestRef = useRef(null);

  const toCollectionDraft = (collection) => ({
    title: collection.title ?? "",
    description: collection.description ?? "",
    image_url: collection.image_url ?? "",
    sort_order: `${collection.sort_order ?? 0}`,
    is_active: Boolean(collection.is_active),
  });

  const toProductDraft = (product) => {
    const rawSizeGuide = Array.isArray(product.size_guide) ? product.size_guide : [];
    const stockBySizeText = extractSizeStockTextFromGuide(rawSizeGuide);
    const sizeGuideText =
      stockBySizeText.length > 0
        ? rawSizeGuide
            .map((line) => {
              if (typeof line !== "string") {
                return "";
              }
              const separatorIndex = line.indexOf(":");
              if (separatorIndex < 0) {
                return line.trim();
              }
              return line.slice(0, separatorIndex).trim();
            })
            .filter((line) => line.length > 0)
            .join("\n")
        : rawSizeGuide.join("\n");

    return {
      name: product.name ?? "",
      collection_id: product.collection_id ?? "",
      price: `${product.price ?? 0}`,
      description: product.description ?? "",
      size_guide: sizeGuideText,
      stock_by_size: stockBySizeText,
      stock: `${product.stock ?? 0}`,
      composition_care: Array.isArray(product.composition_care)
        ? product.composition_care.join("\n")
        : "",
      image_url: getMarketplaceImages(product)[0] ?? "",
      gallery_urls: Array.isArray(product.images) ? product.images.join("\n") : "",
      is_active: Boolean(product.is_active),
    };
  };

  const syncDashboardState = (payload) => {
    const nextCollections = Array.isArray(payload.collections) ? payload.collections : [];
    const nextProducts = Array.isArray(payload.products) ? payload.products : [];
    const nextFeatured =
      payload.featured && typeof payload.featured === "object"
        ? payload.featured
        : { signature_product_id: null, best_seller_product_ids: [] };

    setCollections(nextCollections);
    setProducts(nextProducts);
    setCollectionDrafts(
      nextCollections.reduce((accumulator, collection) => {
        accumulator[collection.id] = toCollectionDraft(collection);
        return accumulator;
      }, {}),
    );
    setNewCollectionDraft((current) => ({
      ...current,
      sort_order:
        typeof current.sort_order === "string" && current.sort_order.trim().length > 0
          ? current.sort_order
          : `${nextCollections.length}`,
    }));
    setFeaturedDraft({
      signature_product_id:
        typeof nextFeatured.signature_product_id === "string"
          ? nextFeatured.signature_product_id
          : "",
      best_seller_product_ids: Array.isArray(nextFeatured.best_seller_product_ids)
        ? nextFeatured.best_seller_product_ids
        : [],
    });

    setSelectedProductId((current) => {
      if (current && nextProducts.some((product) => product.id === current)) {
        return current;
      }
      return nextProducts[0]?.id ?? "";
    });
    setNewProductDraft((current) => ({
      ...current,
      collection_id: current.collection_id || nextCollections[0]?.id || "",
    }));
  };

  useEffect(() => {
    return () => {
      loadRequestRef.current?.abort();
      actionRequestRef.current?.abort();
      uploadRequestRef.current?.abort();
    };
  }, []);

  const refreshDashboard = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    loadRequestRef.current?.abort();
    loadRequestRef.current = controller;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await getAdminCatalog({
        accessToken,
        signal: controller.signal,
      });
      if (loadRequestRef.current !== controller) {
        return;
      }
      syncDashboardState(payload);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (loadRequestRef.current !== controller) {
        return;
      }
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        setErrorMessage("Acces admin requis");
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Chargement admin impossible");
      }
    } finally {
      if (loadRequestRef.current === controller) {
        loadRequestRef.current = null;
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }
    refreshDashboard();
  }, [accessToken]);

  useEffect(() => {
    if (!selectedProductId) {
      return;
    }
    const selectedProduct = products.find((product) => product.id === selectedProductId);
    if (!selectedProduct) {
      return;
    }
    setProductDraft(toProductDraft(selectedProduct));
  }, [selectedProductId, products]);

  const runAdminMutation = async (task, successLabel, onSuccess) => {
    if (isSubmitting) {
      return;
    }

    const controller = new AbortController();
    actionRequestRef.current?.abort();
    actionRequestRef.current = controller;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await task(controller.signal);
      if (actionRequestRef.current !== controller) {
        return;
      }

      await refreshDashboard();
      await onCatalogRefresh().catch(() => undefined);
      if (typeof onSuccess === "function") {
        onSuccess();
      }
      setSuccessMessage(successLabel);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (actionRequestRef.current !== controller) {
        return;
      }
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        setErrorMessage("Acces admin requis");
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Operation impossible");
      }
    } finally {
      if (actionRequestRef.current === controller) {
        actionRequestRef.current = null;
        setIsSubmitting(false);
      }
    }
  };

  const uploadImageAndApply = async (scope, file, onApply) => {
    if (!file || isSubmitting) {
      return;
    }

    const controller = new AbortController();
    uploadRequestRef.current?.abort();
    uploadRequestRef.current = controller;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = await uploadAdminImage({
        accessToken,
        scope,
        file,
        signal: controller.signal,
      });
      if (uploadRequestRef.current !== controller) {
        return;
      }
      onApply(payload.image_url);
      setSuccessMessage("Image importee");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (uploadRequestRef.current !== controller) {
        return;
      }
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        setErrorMessage("Acces admin requis");
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Upload image impossible");
      }
    } finally {
      if (uploadRequestRef.current === controller) {
        uploadRequestRef.current = null;
        setIsSubmitting(false);
      }
    }
  };

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const activeProducts = products.filter((product) => product.is_active);
  const canCreateCollection =
    newCollectionDraft.title.trim().length > 0 &&
    newCollectionDraft.description.trim().length > 0 &&
    newCollectionDraft.image_url.trim().length > 0;
  const newProductSizeStockEntries = parseSizeStockEntries(newProductDraft.stock_by_size);
  const isNewProductStockAuto = newProductSizeStockEntries.length > 0;
  const newProductStockTotal = newProductSizeStockEntries.reduce(
    (accumulator, entry) => accumulator + entry.stock,
    0,
  );
  const productSizeStockEntries = parseSizeStockEntries(productDraft.stock_by_size);
  const isProductStockAuto = productSizeStockEntries.length > 0;
  const productStockTotal = productSizeStockEntries.reduce(
    (accumulator, entry) => accumulator + entry.stock,
    0,
  );
  const adminTabs = [
    { id: "collections-add", label: "Ajouter une collection" },
    { id: "collections-edit", label: "Modifier une collection" },
    { id: "products-add", label: "Ajouter un produit" },
    { id: "products-edit", label: "Modifier un produit" },
  ];

  return (
    <section className="page-view account-view dashboard-view">
      <div className="dashboard-shell">
        <div className="account-tabs dashboard-tabs" role="tablist" aria-label="Admin">
          {adminTabs.map((tab) => (
            <button
              type="button"
              role="tab"
              id={`admin-tab-${tab.id}`}
              key={tab.id}
              aria-selected={activeTab === tab.id}
              aria-controls={`admin-panel-${tab.id}`}
              className={
                activeTab === tab.id
                  ? "account-tab dashboard-tab account-tab--active"
                  : "account-tab dashboard-tab"
              }
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? <p className="account-loading">Chargement...</p> : null}

        {activeTab === "collections-add" ? (
          <div
            className="dashboard-grid"
            role="tabpanel"
            id="admin-panel-collections-add"
            aria-labelledby="admin-tab-collections-add"
          >
            <section className="dashboard-block">
              <h2>Ajouter une collection</h2>
              <div className="dashboard-card">
                <label>
                  <span>Titre</span>
                  <input
                    type="text"
                    value={newCollectionDraft.title}
                    onChange={(event) =>
                      setNewCollectionDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    value={newCollectionDraft.description}
                    onChange={(event) =>
                      setNewCollectionDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Image</span>
                  <input
                    type="text"
                    value={newCollectionDraft.image_url}
                    onChange={(event) =>
                      setNewCollectionDraft((current) => ({
                        ...current,
                        image_url: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="dashboard-inline-actions">
                  <UploadFileButton
                    label="Ajouter un fichier"
                    disabled={isSubmitting}
                    onPickFile={(file) => {
                      uploadImageAndApply("collections", file, (imageUrl) => {
                        setNewCollectionDraft((current) => ({
                          ...current,
                          image_url: imageUrl,
                        }));
                      });
                    }}
                  />
                  {newCollectionDraft.image_url ? (
                    <img src={newCollectionDraft.image_url} alt={newCollectionDraft.title} loading="lazy" />
                  ) : null}
                </div>
                <div className="dashboard-inline-actions">
                  <label>
                    <span>Ordre</span>
                    <input
                      type="number"
                      min={0}
                      value={newCollectionDraft.sort_order}
                      onChange={(event) =>
                        setNewCollectionDraft((current) => ({
                          ...current,
                          sort_order: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="dashboard-toggle">
                    <input
                      type="checkbox"
                      checked={newCollectionDraft.is_active}
                      onChange={(event) =>
                        setNewCollectionDraft((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                    />
                    <span>Visible</span>
                  </label>
                </div>
                <button
                  type="button"
                  className="account-submit-btn"
                  disabled={isSubmitting || !canCreateCollection}
                  onClick={() =>
                    runAdminMutation(
                      (signal) =>
                        createAdminCollection({
                          accessToken,
                          signal,
                          title: newCollectionDraft.title,
                          description: newCollectionDraft.description,
                          image_url: newCollectionDraft.image_url,
                          sort_order: Number.parseInt(newCollectionDraft.sort_order, 10) || 0,
                          is_active: newCollectionDraft.is_active,
                        }),
                      "Collection ajoutee",
                      () =>
                        setNewCollectionDraft({
                          title: "",
                          description: "",
                          image_url: "",
                          sort_order: "",
                          is_active: true,
                        }),
                    )
                  }
                >
                  Ajouter
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "collections-edit" ? (
          <div
            className="dashboard-grid"
            role="tabpanel"
            id="admin-panel-collections-edit"
            aria-labelledby="admin-tab-collections-edit"
          >
            <section className="dashboard-block">
              <h2>Collections accueil</h2>
              <div className="dashboard-collection-grid">
                {collections.map((collection) => {
                  const draft = collectionDrafts[collection.id];
                  if (!draft) {
                    return null;
                  }

                  return (
                    <article className="dashboard-card" key={collection.id}>
                      <label>
                        <span>Titre</span>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(event) =>
                            setCollectionDrafts((current) => ({
                              ...current,
                              [collection.id]: {
                                ...current[collection.id],
                                title: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>Description</span>
                        <textarea
                          value={draft.description}
                          onChange={(event) =>
                            setCollectionDrafts((current) => ({
                              ...current,
                              [collection.id]: {
                                ...current[collection.id],
                                description: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>Image</span>
                        <input
                          type="text"
                          value={draft.image_url}
                          onChange={(event) =>
                            setCollectionDrafts((current) => ({
                              ...current,
                              [collection.id]: {
                                ...current[collection.id],
                                image_url: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <div className="dashboard-inline-actions">
                        <UploadFileButton
                          label="Ajouter un fichier"
                          disabled={isSubmitting}
                          onPickFile={(file) => {
                            uploadImageAndApply("collections", file, (imageUrl) => {
                              setCollectionDrafts((current) => ({
                                ...current,
                                [collection.id]: {
                                  ...current[collection.id],
                                  image_url: imageUrl,
                                },
                              }));
                            });
                          }}
                        />
                        <img src={draft.image_url} alt={draft.title} loading="lazy" />
                      </div>
                      <div className="dashboard-inline-actions">
                        <label>
                          <span>Ordre</span>
                          <input
                            type="number"
                            min={0}
                            value={draft.sort_order}
                            onChange={(event) =>
                              setCollectionDrafts((current) => ({
                                ...current,
                                [collection.id]: {
                                  ...current[collection.id],
                                  sort_order: event.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                        <label className="dashboard-toggle">
                          <input
                            type="checkbox"
                            checked={draft.is_active}
                            onChange={(event) =>
                              setCollectionDrafts((current) => ({
                                ...current,
                                [collection.id]: {
                                  ...current[collection.id],
                                  is_active: event.target.checked,
                                },
                              }))
                            }
                          />
                          <span>Visible</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        className="account-submit-btn"
                        disabled={isSubmitting}
                        onClick={() =>
                          runAdminMutation(
                            (signal) =>
                              updateAdminCollection(collection.id, {
                                accessToken,
                                signal,
                                title: draft.title,
                                description: draft.description,
                                image_url: draft.image_url,
                                sort_order: Number.parseInt(draft.sort_order, 10) || 0,
                                is_active: draft.is_active,
                              }),
                            "Collection enregistree",
                          )
                        }
                      >
                        Enregistrer
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="dashboard-block">
              <h2>Piece signature et best-sellers</h2>
              <div className="dashboard-card">
                <label>
                  <span>Piece signature</span>
                  <select
                    value={featuredDraft.signature_product_id}
                    onChange={(event) =>
                      setFeaturedDraft((current) => ({
                        ...current,
                        signature_product_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">Aucune</option>
                    {activeProducts.map((product) => (
                      <option value={product.id} key={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                {activeProducts.length === 0 ? (
                  <p className="account-empty">Aucun produit actif</p>
                ) : null}

                <div className="dashboard-best-sellers-list">
                  {activeProducts.map((product) => {
                      const isChecked = featuredDraft.best_seller_product_ids.includes(product.id);

                      return (
                        <label className="dashboard-toggle" key={product.id}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(event) =>
                              setFeaturedDraft((current) => {
                                if (event.target.checked) {
                                  return {
                                    ...current,
                                    best_seller_product_ids: [
                                      ...current.best_seller_product_ids,
                                      product.id,
                                    ],
                                  };
                                }
                                return {
                                  ...current,
                                  best_seller_product_ids:
                                    current.best_seller_product_ids.filter(
                                      (item) => item !== product.id,
                                    ),
                                };
                              })
                            }
                          />
                          <span>{product.name}</span>
                        </label>
                      );
                    })}
                </div>

                <button
                  type="button"
                  className="account-submit-btn"
                  disabled={isSubmitting || activeProducts.length === 0}
                  onClick={() =>
                    runAdminMutation(
                      (signal) =>
                        updateAdminFeatured({
                          accessToken,
                          signal,
                          signature_product_id: featuredDraft.signature_product_id || null,
                          best_seller_product_ids: featuredDraft.best_seller_product_ids,
                        }),
                      "Selection best-sellers enregistree",
                    )
                  }
                >
                  Enregistrer best-sellers
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "products-add" ? (
          <div
            className="dashboard-grid"
            role="tabpanel"
            id="admin-panel-products-add"
            aria-labelledby="admin-tab-products-add"
          >
            <section className="dashboard-block">
              <h2>Ajouter un produit</h2>
              <div className="dashboard-card">
                <label>
                  <span>Nom</span>
                  <input
                    type="text"
                    value={newProductDraft.name}
                    onChange={(event) =>
                      setNewProductDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Collection</span>
                  <select
                    value={newProductDraft.collection_id}
                    onChange={(event) =>
                      setNewProductDraft((current) => ({
                        ...current,
                        collection_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choisir</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="dashboard-inline-actions">
                  <label>
                    <span>Prix</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newProductDraft.price}
                      onChange={(event) =>
                        setNewProductDraft((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>{isNewProductStockAuto ? "Stock total (auto)" : "Stock total"}</span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={isNewProductStockAuto ? `${newProductStockTotal}` : newProductDraft.stock}
                      disabled={isSubmitting || isNewProductStockAuto}
                      onChange={(event) =>
                        setNewProductDraft((current) => ({
                          ...current,
                          stock: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <label>
                  <span>Description</span>
                  <textarea
                    value={newProductDraft.description}
                    onChange={(event) =>
                      setNewProductDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Tailles (une ligne par taille)</span>
                  <textarea
                    value={newProductDraft.size_guide}
                    onChange={(event) =>
                      setNewProductDraft((current) => ({
                        ...current,
                        size_guide: event.target.value,
                      }))
                    }
                  />
                </label>
                <SizeStockEditor
                  value={newProductDraft.stock_by_size}
                  disabled={isSubmitting}
                  onChange={(nextValue) =>
                    setNewProductDraft((current) => ({
                      ...current,
                      stock_by_size: nextValue,
                    }))
                  }
                />
                <label>
                  <span>Composition et entretien (une ligne par element)</span>
                  <textarea
                    value={newProductDraft.composition_care}
                    onChange={(event) =>
                      setNewProductDraft((current) => ({
                        ...current,
                        composition_care: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Image principale</span>
                  <input
                    type="text"
                    value={newProductDraft.image_url}
                    onChange={(event) =>
                      setNewProductDraft((current) => ({
                        ...current,
                        image_url: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Galerie (une URL par ligne)</span>
                  <textarea
                    value={newProductDraft.gallery_urls}
                    onChange={(event) =>
                      setNewProductDraft((current) => ({
                        ...current,
                        gallery_urls: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="dashboard-inline-actions">
                  <UploadFileButton
                    label="Ajouter un fichier"
                    disabled={isSubmitting}
                    onPickFile={(file) => {
                      uploadImageAndApply("products", file, (imageUrl) => {
                        setNewProductDraft((current) => ({
                          ...current,
                          image_url: imageUrl,
                          gallery_urls: [imageUrl, current.gallery_urls]
                            .filter((value) => value && value.trim().length > 0)
                            .join("\n"),
                        }));
                      });
                    }}
                  />
                  {newProductDraft.image_url ? (
                    <img src={newProductDraft.image_url} alt="Nouveau produit" loading="lazy" />
                  ) : null}
                </div>
                <label className="dashboard-toggle">
                  <input
                    type="checkbox"
                    checked={newProductDraft.is_active}
                    onChange={(event) =>
                      setNewProductDraft((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  <span>Visible</span>
                </label>
                <button
                  type="button"
                  className="account-submit-btn"
                  disabled={isSubmitting}
                  onClick={() => {
                    const sizingPayload = buildProductSizingPayload(
                      newProductDraft.size_guide,
                      newProductDraft.stock,
                      newProductDraft.stock_by_size,
                    );

                    runAdminMutation(
                      (signal) =>
                        createAdminProduct({
                          accessToken,
                          signal,
                          name: newProductDraft.name,
                          collection_id: newProductDraft.collection_id,
                          price: Number.parseFloat(newProductDraft.price) || 0,
                          description: newProductDraft.description,
                          size_guide: sizingPayload.sizeGuide,
                          stock: sizingPayload.stock,
                          composition_care: splitMultilineValue(newProductDraft.composition_care),
                          images: buildProductImages(
                            newProductDraft.image_url,
                            newProductDraft.gallery_urls,
                          ),
                          is_active: newProductDraft.is_active,
                        }),
                      "Produit ajoute",
                    );
                  }}
                >
                  Ajouter
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "products-edit" ? (
          <div
            className="dashboard-grid"
            role="tabpanel"
            id="admin-panel-products-edit"
            aria-labelledby="admin-tab-products-edit"
          >
            <section className="dashboard-block">
              <h2>Modifier un produit</h2>
              <div className="dashboard-card">
                <label>
                  <span>Produit</span>
                  <select
                    value={selectedProductId}
                    onChange={(event) => setSelectedProductId(event.target.value)}
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Nom</span>
                  <input
                    type="text"
                    value={productDraft.name}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Collection</span>
                  <select
                    value={productDraft.collection_id}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        collection_id: event.target.value,
                      }))
                    }
                  >
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="dashboard-inline-actions">
                  <label>
                    <span>Prix</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={productDraft.price}
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>{isProductStockAuto ? "Stock total (auto)" : "Stock total"}</span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={isProductStockAuto ? `${productStockTotal}` : productDraft.stock}
                      disabled={isSubmitting || isProductStockAuto}
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          stock: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <label>
                  <span>Description</span>
                  <textarea
                    value={productDraft.description}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Tailles (une ligne par taille)</span>
                  <textarea
                    value={productDraft.size_guide}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        size_guide: event.target.value,
                      }))
                    }
                  />
                </label>
                <SizeStockEditor
                  value={productDraft.stock_by_size}
                  disabled={isSubmitting}
                  onChange={(nextValue) =>
                    setProductDraft((current) => ({
                      ...current,
                      stock_by_size: nextValue,
                    }))
                  }
                />
                <label>
                  <span>Composition et entretien (une ligne par element)</span>
                  <textarea
                    value={productDraft.composition_care}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        composition_care: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Image principale</span>
                  <input
                    type="text"
                    value={productDraft.image_url}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        image_url: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Galerie (une URL par ligne)</span>
                  <textarea
                    value={productDraft.gallery_urls}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        gallery_urls: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="dashboard-inline-actions">
                  <UploadFileButton
                    label="Ajouter un fichier"
                    disabled={isSubmitting}
                    onPickFile={(file) => {
                      uploadImageAndApply("products", file, (imageUrl) => {
                        setProductDraft((current) => ({
                          ...current,
                          image_url: imageUrl,
                          gallery_urls: [imageUrl, current.gallery_urls]
                            .filter((value) => value && value.trim().length > 0)
                            .join("\n"),
                        }));
                      });
                    }}
                  />
                  {productDraft.image_url ? (
                    <img src={productDraft.image_url} alt={productDraft.name} loading="lazy" />
                  ) : null}
                </div>
                <label className="dashboard-toggle">
                  <input
                    type="checkbox"
                    checked={productDraft.is_active}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  <span>Visible</span>
                </label>
                <button
                  type="button"
                  className="account-submit-btn"
                  disabled={isSubmitting || !selectedProductId}
                  onClick={() => {
                    const sizingPayload = buildProductSizingPayload(
                      productDraft.size_guide,
                      productDraft.stock,
                      productDraft.stock_by_size,
                    );

                    runAdminMutation(
                      (signal) =>
                        updateAdminProduct(selectedProductId, {
                          accessToken,
                          signal,
                          name: productDraft.name,
                          collection_id: productDraft.collection_id,
                          price: Number.parseFloat(productDraft.price) || 0,
                          description: productDraft.description,
                          size_guide: sizingPayload.sizeGuide,
                          stock: sizingPayload.stock,
                          composition_care: splitMultilineValue(productDraft.composition_care),
                          images: buildProductImages(
                            productDraft.image_url,
                            productDraft.gallery_urls,
                          ),
                          is_active: productDraft.is_active,
                        }),
                      "Produit enregistre",
                    );
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {errorMessage ? <p className="account-feedback account-feedback--error">{errorMessage}</p> : null}
        {successMessage ? <p className="account-feedback account-feedback--success">{successMessage}</p> : null}
      </div>
    </section>
  );
}

function PanierPage({ cartItems, cartTotal, onQuantityChange, onRemoveItem }) {
  return (
    <section className="page-view form-view">
      <header className="section-head">
        <h1>Panier</h1>
      </header>

      <Reveal className="cgv-panel cart-page-panel">
        <CartItemsList
          items={cartItems}
          onQuantityChange={onQuantityChange}
          onRemoveItem={onRemoveItem}
        />
        <div className="cart-page-total">
          <p>Total</p>
          <strong>{formatMarketplacePrice(cartTotal)}</strong>
        </div>
      </Reveal>
    </section>
  );
}

function LegalPage({ title, lines }) {
  return (
    <section className="page-view form-view">
      <header className="section-head">
        <h1>{title}</h1>
      </header>

      <Reveal className="cgv-panel">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Reveal>
    </section>
  );
}

function SiteFooter() {
  const isAuthenticated = Boolean(readStoredAuthSession());

  return (
    <footer className="site-footer">
      <Footer7
        logo={{
          url: "/",
          src: "/logo-marcelina.svg",
          alt: "Logo Maison Marcelina",
          title: "Maison Marcelina",
        }}
        sections={getFooterSections(isAuthenticated)}
        description="Maison Marcelina"
        legalLinks={legalPages.map((page) => ({
          name: page.label,
          href: page.path,
        }))}
        copyright="© 2026 Maison Marcelina."
      />
    </footer>
  );
}

export function App() {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [catalogData, setCatalogData] = useState(() =>
    buildCatalogWithFallback(emptyPublicCatalog),
  );
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const catalogRequestRef = useRef(null);
  const location = useLocation();
  const hideFooter = location.pathname === "/login";

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

  const refreshPublicCatalog = useCallback(async () => {
    const controller = new AbortController();
    catalogRequestRef.current?.abort();
    catalogRequestRef.current = controller;
    setIsCatalogLoading(true);
    setCatalogError(null);

    try {
      const payload = await getPublicCatalog({
        signal: controller.signal,
      });
      if (catalogRequestRef.current !== controller) {
        return;
      }
      setCatalogData(buildCatalogWithFallback(payload));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (catalogRequestRef.current !== controller) {
        return;
      }
      setCatalogError(error instanceof Error ? error.message : "Lecture catalogue impossible");
      setCatalogData(buildCatalogWithFallback(emptyPublicCatalog));
    } finally {
      if (catalogRequestRef.current === controller) {
        catalogRequestRef.current = null;
        setIsCatalogLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setCartOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    refreshPublicCatalog();

    return () => {
      catalogRequestRef.current?.abort();
    };
  }, [refreshPublicCatalog]);

  useEffect(() => {
    if (!cartOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [cartOpen]);

  useEffect(() => {
    setCartOpen(false);
  }, [location.pathname]);

  const handleAddToCart = (product) => {
    setCartItems((current) => {
      const incomingCartItemId = getCartItemId(product);
      const existingItem = current.find(
        (item) => getCartItemId(item) === incomingCartItemId
      );

      if (!existingItem) {
        return [...current, { ...product, quantity: 1 }];
      }

      return current.map((item) =>
        getCartItemId(item) === incomingCartItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    });

    setCartOpen(true);
  };

  const handleQuantityChange = (cartItemId, change) => {
    setCartItems((current) =>
      current.flatMap((item) => {
        if (getCartItemId(item) !== cartItemId) {
          return [item];
        }

        const nextQuantity = item.quantity + change;

        if (nextQuantity <= 0) {
          return [];
        }

        return [{ ...item, quantity: nextQuantity }];
      })
    );
  };

  const handleRemoveItem = (cartItemId) => {
    setCartItems((current) =>
      current.filter((item) => getCartItemId(item) !== cartItemId)
    );
  };

  return (
    <main className="app-shell">
      <SiteHeader
        cartCount={cartCount}
        cartOpen={cartOpen}
        onToggleCart={() => setCartOpen((current) => !current)}
      />

      <div className="app-content">
        {catalogError ? <p className="account-feedback account-feedback--error">{catalogError}</p> : null}
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                collections={catalogData.collections}
                products={catalogData.products}
                featured={catalogData.featured}
                isCatalogLoading={isCatalogLoading}
              />
            }
          />
          <Route path="/notre-histoire" element={<NotreHistoirePage />} />
          <Route path="/histoire" element={<Navigate to="/notre-histoire" replace />} />
          <Route
            path="/collection"
            element={
              <CollectionPage
                products={catalogData.products}
                isCatalogLoading={isCatalogLoading}
              />
            }
          />
          <Route
            path="/collection/:productId"
            element={
              <ProductDetailPage
                products={catalogData.products}
                onAddToCart={handleAddToCart}
              />
            }
          />
          <Route path="/collections" element={<Navigate to="/collection" replace />} />
          <Route path="/marketplace" element={<Navigate to="/collection" replace />} />
          <Route path="/sur-mesure" element={<SurMesurePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/boutique" element={<Navigate to="/collection" replace />} />
          <Route
            path="/panier"
            element={
              <PanierPage
                cartItems={cartItems}
                cartTotal={cartTotal}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
              />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/compte" element={<AccountPage />} />
          <Route
            path="/admin"
            element={<AdminPage onCatalogRefresh={refreshPublicCatalog} />}
          />
          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
          {legalPages.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={<LegalPage title={page.title} lines={page.lines} />}
            />
          ))}
          <Route path="/cg" element={<Navigate to="/cgv" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <CartPanel
        open={cartOpen}
        items={cartItems}
        total={cartTotal}
        onClose={() => setCartOpen(false)}
        onQuantityChange={handleQuantityChange}
        onRemoveItem={handleRemoveItem}
      />

      {!hideFooter ? <SiteFooter /> : null}
    </main>
  );
}
