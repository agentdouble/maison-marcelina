import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { Footer7 } from "./components/ui/footer-7.tsx";
import { Gallery4 } from "./components/ui/gallery4.tsx";
import { LuminaInteractiveList } from "./components/ui/lumina-interactive-list.tsx";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/collection", label: "Les collections" },
  { to: "/sur-mesure", label: "L'atelier du sur mesure" },
];

const collections = [
  {
    title: "Marceline Heritage",
    season: "Collection de base",
    palette: ["Vert sauge", "Beige", "Taupe", "Chocolat"],
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Marceline Riviera",
    season: "Collection permanente",
    palette: ["Vichy", "Rayures", "Multicouleur"],
    image:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Marceline Audacieuse",
    season: "Collection permanente",
    palette: ["Leopard", "Vache", "Rouge", "Noir"],
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80",
  },
];

const luminaHomeSlides = collections.map((collection) => ({
  title: collection.title,
  description: `${collection.season} | ${collection.palette.join(" / ")}`,
  media: collection.image,
}));

const products = [
  {
    id: "robe-heritage",
    name: "Robe Heritage",
    priceValue: 149,
    image:
      "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1080&q=80",
  },
  {
    id: "top-riviera",
    name: "Top Riviera",
    priceValue: 89,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1080&q=80",
  },
  {
    id: "jupe-audacieuse",
    name: "Jupe Audacieuse",
    priceValue: 119,
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1080&q=80",
  },
  {
    id: "ensemble-atelier",
    name: "Ensemble Atelier",
    priceValue: 179,
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1080&q=80",
  },
];

const boutiqueProductMedia = {
  "robe-heritage": [
    "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1465406325903-9d93ee82f613?auto=format&fit=crop&w=1080&q=80",
  ],
  "top-riviera": [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1503341338985-b35f5a53c6f2?auto=format&fit=crop&w=1080&q=80",
  ],
  "jupe-audacieuse": [
    "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1080&q=80",
  ],
  "ensemble-atelier": [
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1542295669297-4d352b042bca?auto=format&fit=crop&w=1080&q=80",
  ],
};

const collectionMarketplaceProducts = [
  {
    id: "heritage-ivoire",
    name: "Robe Ivoire",
    price: 189,
    line: "Marceline Heritage",
    image:
      "https://images.unsplash.com/photo-1467632499275-7a693a761056?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "heritage-sauge",
    name: "Veste Sauge",
    price: 164,
    line: "Marceline Heritage",
    image:
      "https://images.unsplash.com/photo-1542295669297-4d352b042bca?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "heritage-taupe",
    name: "Jupe Taupe",
    price: 132,
    line: "Marceline Heritage",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "heritage-sable",
    name: "Chemise Sable",
    price: 118,
    line: "Marceline Heritage",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "riviera-azur",
    name: "Robe Azur",
    price: 176,
    line: "Marceline Riviera",
    image:
      "https://images.unsplash.com/photo-1503341338985-b35f5a53c6f2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "riviera-ecume",
    name: "Top Ecume",
    price: 96,
    line: "Marceline Riviera",
    image:
      "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "riviera-vichy",
    name: "Jupe Vichy",
    price: 128,
    line: "Marceline Riviera",
    image:
      "https://images.unsplash.com/photo-1465406325903-9d93ee82f613?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "riviera-ligne",
    name: "Pantalon Ligne",
    price: 142,
    line: "Marceline Riviera",
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "audacieuse-noir",
    name: "Robe Noir Atelier",
    price: 212,
    line: "Marceline Audacieuse",
    image:
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "audacieuse-rouge",
    name: "Top Rouge",
    price: 102,
    line: "Marceline Audacieuse",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "audacieuse-leopard",
    name: "Jupe Leopard",
    price: 158,
    line: "Marceline Audacieuse",
    image:
      "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "audacieuse-corset",
    name: "Corset Nuit",
    price: 184,
    line: "Marceline Audacieuse",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
  },
];

const marketplaceProductMedia = {
  "heritage-ivoire": [
    "https://images.unsplash.com/photo-1467632499275-7a693a761056?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80",
  ],
  "heritage-sauge": [
    "https://images.unsplash.com/photo-1542295669297-4d352b042bca?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
  ],
  "heritage-taupe": [
    "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1465406325903-9d93ee82f613?auto=format&fit=crop&w=1200&q=80",
  ],
  "heritage-sable": [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
  ],
  "riviera-azur": [
    "https://images.unsplash.com/photo-1503341338985-b35f5a53c6f2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1200&q=80",
  ],
  "riviera-ecume": [
    "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1467632499275-7a693a761056?auto=format&fit=crop&w=1200&q=80",
  ],
  "riviera-vichy": [
    "https://images.unsplash.com/photo-1465406325903-9d93ee82f613?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
  ],
  "riviera-ligne": [
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
  ],
  "audacieuse-noir": [
    "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503341338985-b35f5a53c6f2?auto=format&fit=crop&w=1200&q=80",
  ],
  "audacieuse-rouge": [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80",
  ],
  "audacieuse-leopard": [
    "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1465406325903-9d93ee82f613?auto=format&fit=crop&w=1200&q=80",
  ],
  "audacieuse-corset": [
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542295669297-4d352b042bca?auto=format&fit=crop&w=1200&q=80",
  ],
};

const marketplacePriceFilters = [
  { value: "all", label: "Tous les prix", min: 0, max: Infinity },
  { value: "under-130", label: "Jusqu'a 130 EUR", min: 0, max: 130 },
  { value: "130-180", label: "130 a 180 EUR", min: 130, max: 180 },
  { value: "over-180", label: "180 EUR et +", min: 180, max: Infinity },
];

const marketplaceSortOptions = [
  { value: "featured", label: "Selection" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix decroissant" },
  { value: "name-asc", label: "Nom A-Z" },
];

const signaturePiece = {
  name: "Robe Signature Atelier",
  capsule: "Edition Maison",
  price: "189 EUR",
  image:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
};

const bestSellerGalleryItems = products.slice(0, 4).map((product) => ({
  id: product.name.toLowerCase().replace(/\s+/g, "-"),
  title: product.name,
  description: formatMarketplacePrice(product.priceValue),
  href: "/boutique",
  image: boutiqueProductMedia[product.id]?.[0] ?? product.image,
}));

const trustHighlights = [
  { title: "Livraison offerte", value: "Des 120 EUR" },
  { title: "Retours", value: "14 jours" },
  { title: "Paiement", value: "Securise" },
  { title: "Support", value: "7j/7" },
];

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

const footerSections = [
  {
    title: "Navigation",
    links: [
      { name: "Accueil", href: "/" },
      { name: "Les collections", href: "/collection" },
      { name: "Sur mesure", href: "/sur-mesure" },
      { name: "Boutique", href: "/boutique" },
    ],
  },
  {
    title: "Assistance",
    links: [
      { name: "Contact", href: "/contact" },
      { name: "Panier", href: "/panier" },
      { name: "Login", href: "/login" },
    ],
  },
];

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
        <path
          d="M6.4 6.4a1 1 0 0 1 1.4 0L12 10.6l4.2-4.2a1 1 0 1 1 1.4 1.4L13.4 12l4.2 4.2a1 1 0 1 1-1.4 1.4L12 13.4l-4.2 4.2a1 1 0 1 1-1.4-1.4l4.2-4.2-4.2-4.2a1 1 0 0 1 0-1.4Z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M4 7.5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm0 4.5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm1 3.5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H5Z"
          fill="currentColor"
        />
      )}
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path
        d="M4 7h16M7.5 12h9M10.5 17h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SiteHeader({ cartCount = 0, cartOpen = false, onToggleCart }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const menuClass = mobileMenuOpen ? "menu-tabs menu-tabs--open" : "menu-tabs";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="site-header">
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

          <Link className="profile-link" to="/login" aria-label="Login">
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
  return `${price} EUR`;
}

function getBoutiqueImages(product) {
  return boutiqueProductMedia[product.id] ?? [product.image];
}

function getMarketplaceImages(product) {
  return marketplaceProductMedia[product.id] ?? [product.image];
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
      {items.map((item) => (
        <article className="cart-item-row" key={item.id}>
          <img src={item.image} alt={item.name} loading="lazy" />

          <div className="cart-item-meta">
            <h2>{item.name}</h2>
            <p>{formatMarketplacePrice(item.price)}</p>
          </div>

          <div className="cart-item-actions">
            <div className="cart-qty">
              <button
                type="button"
                aria-label={`Retirer une unite de ${item.name}`}
                onClick={() => onQuantityChange(item.id, -1)}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                type="button"
                aria-label={`Ajouter une unite de ${item.name}`}
                onClick={() => onQuantityChange(item.id, 1)}
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="cart-remove"
              onClick={() => onRemoveItem(item.id)}
            >
              Supprimer
            </button>
          </div>
        </article>
      ))}
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

function HomePage() {
  return (
    <section className="page-view home-view">
      <LuminaInteractiveList slides={luminaHomeSlides} />

      <div className="home-sections">
        <Reveal as="article" className="signature-piece">
          <div className="signature-visual">
            <img
              src={signaturePiece.image}
              alt={signaturePiece.name}
              loading="lazy"
            />
          </div>
          <div className="signature-content">
            <p className="signature-eyebrow">Piece signature</p>
            <h2>{signaturePiece.name}</h2>
            <p className="signature-meta">{signaturePiece.capsule}</p>
            <p className="signature-price">{signaturePiece.price}</p>
            <Link className="home-cta signature-cta" to="/boutique">
              Decouvrir
            </Link>
          </div>
        </Reveal>

        <Reveal as="section" className="best-sellers-block" delay={70}>
          <Gallery4 title="Best-sellers" items={bestSellerGalleryItems} />
        </Reveal>

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
      </div>
    </section>
  );
}

function CollectionPage({ onAddToCart }) {
  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("Toutes");
  const [activePriceFilter, setActivePriceFilter] = useState("all");
  const [activeSort, setActiveSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const collectionChips = useMemo(
    () => ["Toutes", ...new Set(collectionMarketplaceProducts.map((product) => product.line))],
    []
  );

  const visibleProducts = useMemo(() => {
    const selectedPrice =
      marketplacePriceFilters.find((filter) => filter.value === activePriceFilter) ??
      marketplacePriceFilters[0];
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = collectionMarketplaceProducts.filter((product) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.line.toLowerCase().includes(normalizedQuery);
      const matchesCollection =
        activeCollection === "Toutes" || product.line === activeCollection;
      const matchesPrice =
        product.price >= selectedPrice.min &&
        (selectedPrice.max === Infinity || product.price <= selectedPrice.max);

      return matchesQuery && matchesCollection && matchesPrice;
    });

    if (activeSort === "price-asc") {
      return [...filtered].sort((first, second) => first.price - second.price);
    }

    if (activeSort === "price-desc") {
      return [...filtered].sort((first, second) => second.price - first.price);
    }

    if (activeSort === "name-asc") {
      return [...filtered].sort((first, second) => first.name.localeCompare(second.name));
    }

    return filtered;
  }, [activeCollection, activePriceFilter, activeSort, query]);

  return (
    <section className="page-view collection-marketplace-view">
      <Reveal as="header" className="collection-marketplace-hero">
        <p className="collection-marketplace-kicker">Les collections</p>
        <h1>Boutique marketplace</h1>

        <button
          type="button"
          className={filtersOpen ? "collection-filter-toggle collection-filter-toggle--open" : "collection-filter-toggle"}
          aria-expanded={filtersOpen}
          aria-controls="collection-filters-panel"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-label={filtersOpen ? "Fermer les filtres" : "Ouvrir les filtres"}
        >
          <FilterIcon />
        </button>
      </Reveal>

      <div className="collection-chip-scroller" role="tablist" aria-label="Collections">
        {collectionChips.map((collectionName) => (
          <button
            key={collectionName}
            type="button"
            role="tab"
            aria-selected={activeCollection === collectionName}
            className={
              activeCollection === collectionName
                ? "collection-chip collection-chip--active"
                : "collection-chip"
            }
            onClick={() => setActiveCollection(collectionName)}
          >
            {collectionName}
          </button>
        ))}
      </div>

      {filtersOpen ? (
        <div className="collection-marketplace-toolbar" id="collection-filters-panel">
          <input
            id="collection-search"
            type="search"
            name="collection-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Recherche"
            autoComplete="off"
            aria-label="Recherche"
          />

          <select
            id="collection-price"
            name="collection-price"
            value={activePriceFilter}
            onChange={(event) => setActivePriceFilter(event.target.value)}
            aria-label="Prix"
          >
            {marketplacePriceFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          <select
            id="collection-sort"
            name="collection-sort"
            value={activeSort}
            onChange={(event) => setActiveSort(event.target.value)}
            aria-label="Tri"
          >
            {marketplaceSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <p className="collection-result-count">{visibleProducts.length} pieces</p>

      <div className="collection-marketplace-grid">
        {visibleProducts.map((product, index) => (
          <Reveal
            as="article"
            className="collection-marketplace-card"
            key={product.id}
            delay={index * 50}
          >
            <ProductImageSwiper
              images={getMarketplaceImages(product)}
              alt={product.name}
            />
            <div className="collection-marketplace-card-body">
              <h2>{product.name}</h2>
              <p>{formatMarketplacePrice(product.price)}</p>
              <button
                type="button"
                className="collection-add-button"
                onClick={() =>
                  onAddToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: getMarketplaceImages(product)[0] ?? product.image,
                  })
                }
              >
                Ajouter
              </button>
            </div>
          </Reveal>
        ))}
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
            <span>Point de contact</span>
            <select name="contactPoint" defaultValue="email" required>
              <option value="email">Email</option>
              <option value="telephone">Telephone</option>
              <option value="instagram">Instagram</option>
            </select>
          </label>

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

function BoutiquePage({ onAddToCart }) {
  return (
    <section className="page-view">
      <header className="section-head">
        <h1>Boutique</h1>
      </header>

      <div className="product-grid">
        {products.map((product, index) => (
          <Reveal
            as="article"
            className="product-card"
            key={product.id}
            delay={index * 80}
          >
            <ProductImageSwiper
              images={getBoutiqueImages(product)}
              alt={product.name}
            />
            <div className="product-card-body">
              <h2>{product.name}</h2>
              <p>{formatMarketplacePrice(product.priceValue)}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                onAddToCart({
                  id: product.id,
                  name: product.name,
                  price: product.priceValue,
                  image: getBoutiqueImages(product)[0] ?? product.image,
                })
              }
            >
              Ajouter
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LoginPage() {
  return (
    <section className="page-view login-view">
      <Reveal
        as="form"
        className="form-panel form-panel--small"
        onSubmit={(event) => event.preventDefault()}
      >
        <header className="section-head section-head--compact">
          <h1>Login</h1>
        </header>

        <label>
          <span>Email</span>
          <input type="email" name="email" placeholder="email@exemple.com" required />
        </label>

        <label>
          <span>Mot de passe</span>
          <input type="password" name="password" placeholder="Mot de passe" required />
        </label>

        <button type="submit">Connexion</button>
      </Reveal>
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
  return (
    <footer className="site-footer">
      <Footer7
        logo={{
          url: "/",
          src: "/logo-marcelina.svg",
          alt: "Logo Maison Marcelina",
          title: "Maison Marcelina",
        }}
        sections={footerSections}
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
  const location = useLocation();

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

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
      const existingItem = current.find((item) => item.id === product.id);

      if (!existingItem) {
        return [...current, { ...product, quantity: 1 }];
      }

      return current.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    });

    setCartOpen(true);
  };

  const handleQuantityChange = (productId, change) => {
    setCartItems((current) =>
      current.flatMap((item) => {
        if (item.id !== productId) {
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

  const handleRemoveItem = (productId) => {
    setCartItems((current) => current.filter((item) => item.id !== productId));
  };

  return (
    <main className="app-shell">
      <SiteHeader
        cartCount={cartCount}
        cartOpen={cartOpen}
        onToggleCart={() => setCartOpen((current) => !current)}
      />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/collection"
            element={<CollectionPage onAddToCart={handleAddToCart} />}
          />
          <Route path="/collections" element={<Navigate to="/collection" replace />} />
          <Route path="/marketplace" element={<Navigate to="/collection" replace />} />
          <Route path="/sur-mesure" element={<SurMesurePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/boutique"
            element={<BoutiquePage onAddToCart={handleAddToCart} />}
          />
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

      <SiteFooter />
    </main>
  );
}
