import { useEffect, useMemo, useRef, useState } from "react";
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

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/collection", label: "Les collections" },
  { to: "/sur-mesure", label: "Sur mesure" },
  { to: "/notre-histoire", label: "Notre Histoire" },
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
    palette: ["Léopard", "Vache", "Rouge", "Noir"],
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
    name: "Top Écume",
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
    name: "Jupe Léopard",
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

const marketplaceProductSizes = ["34", "36", "38", "40", "42"];

const defaultProductSizeGuide = [
  "34: poitrine 80-84 cm",
  "36: poitrine 84-88 cm",
  "38: poitrine 88-92 cm",
  "40: poitrine 92-96 cm",
  "42: poitrine 96-100 cm",
];

const marketplaceProductDetailByLine = {
  "Marceline Heritage": {
    description: "Coupe structurée, ligne nette, port quotidien atelier.",
    compositionCare: [
      "100% coton",
      "Doublure viscose",
      "Lavage main à froid",
      "Séchage à plat",
    ],
  },
  "Marceline Riviera": {
    description: "Coupe fluide, mouvement léger, esprit été couture.",
    compositionCare: [
      "72% viscose, 28% lin",
      "Lavage doux à 30 degrés",
      "Repassage température basse",
      "Pas de sèche-linge",
    ],
  },
  "Marceline Audacieuse": {
    description: "Volume affirmé, coupe modelée, silhouette forte.",
    compositionCare: [
      "68% coton, 30% polyester, 2% élasthanne",
      "Lavage à l'envers à 30 degrés",
      "Repassage sur envers",
      "Nettoyage à sec possible",
    ],
  },
};

const defaultShippingAndReturns = [
  "Préparation sous 24/48h",
  "Livraison 2 à 4 jours ouvrés",
  "Échange sous 14 jours",
  "Retour via page Contact",
];

const signaturePiece = {
  name: "Robe Signature Atelier",
  capsule: "Édition Maison",
  price: "189 EUR",
  image:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80",
};

const bestSellerGalleryItems = products.slice(0, 4).map((product) => ({
  id: product.name.toLowerCase().replace(/\s+/g, "-"),
  title: product.name,
  description: formatMarketplacePrice(product.priceValue),
  href: "/collection",
  image: boutiqueProductMedia[product.id]?.[0] ?? product.image,
}));

const trustHighlights = [
  { title: "Livraison offerte", value: "Dès 120 EUR" },
  { title: "Retours", value: "14 jours" },
  { title: "Paiement", value: "Sécurisé" },
  { title: "Support", value: "7j/7" },
];

const storyParagraphs = [
  "Maison Marcelina, c'est avant tout une histoire de transmission, de mémoire et d'élégance intemporelle.",
  "Le nom trouve son origine dans celui de Marceline, la sœur de ma grand-mère, une femme dont le souvenir évoque l'allure et le charisme discret.",
  "Au-delà de l'apparence, Marceline incarnait une posture: une élégance qui sait se mettre en valeur, se faire écouter et admirer.",
  "Chaque détail apporte de la classe: un ourlet net, un tissu soigneusement choisi, une finition délicate, un motif assumé.",
  "Maison Marcelina n'est pas une femme figée dans une photo en noir et blanc. C'est une élégance qui vit avec son temps.",
  "Choisir le nom Maison Marcelina, c'est rendre hommage aux femmes qui nous inspirent.",
];

const storySignature =
  "Toujours chic. Toujours apprêtée. Un brushing impeccable. Un rouge à lèvres précis. Une signature assumée.";

const storyPillars = [
  "Des créations cousues main avec soin",
  "Des pièces pensées pour durer",
  "Une touche de chic dans le quotidien",
  "Une douceur qui n'efface jamais le caractère",
];

const storyImage =
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80";

const legalPages = [
  {
    path: "/mentions-legales",
    label: "Mentions légales",
    title: "Mentions légales",
    lines: [
      "Maison Marcelina.",
      "Éditeur du site.",
      "Hébergement technique.",
      "Contact: page Contact.",
    ],
  },
  {
    path: "/cgv",
    label: "CGV",
    title: "Conditions générales de vente",
    lines: [
      "Vente en ligne d'articles couture.",
      "Paiement sécurisé.",
      "Délais variables selon collection.",
      "Retours selon conditions commande.",
    ],
  },
  {
    path: "/politique-remboursement",
    label: "Remboursement",
    title: "Politique de remboursement",
    lines: [
      "Demande de retour via page Contact.",
      "Vérification de l'état de la pièce.",
      "Remboursement selon mode de paiement initial.",
      "Délai de traitement après validation.",
    ],
  },
  {
    path: "/politique-cookies",
    label: "Cookies",
    title: "Politique cookies",
    lines: [
      "Cookies techniques pour fonctionnement.",
      "Mesure d'audience selon consentement.",
      "Gestion des préférences utilisateur.",
      "Suppression possible via navigateur.",
    ],
  },
  {
    path: "/accessibilite",
    label: "Accessibilité",
    title: "Accessibilité",
    lines: [
      "Navigation clavier prioritaire.",
      "Contrastes lisibles et focus visibles.",
      "Support mobile et écrans standards.",
      "Signalement des blocages via Contact.",
    ],
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
  return `${price} EUR`;
}

function getCartItemId(item) {
  return item.cartItemId ?? item.id;
}

function getProductDetailSections(product) {
  const detailContent =
    marketplaceProductDetailByLine[product.line] ?? marketplaceProductDetailByLine["Marceline Heritage"];

  return [
    {
      id: "description",
      title: "Description",
      lines: [detailContent.description],
    },
    {
      id: "size-guide",
      title: "Guide des tailles",
      lines: defaultProductSizeGuide,
    },
    {
      id: "composition-care",
      title: "Composition et entretien",
      lines: detailContent.compositionCare,
    },
    {
      id: "shipping-returns",
      title: "Livraison, échanges et retours",
      lines: defaultShippingAndReturns,
    },
  ];
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
                  aria-label={`Retirer une unité de ${item.name}`}
                  onClick={() => onQuantityChange(cartItemId, -1)}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Ajouter une unité de ${item.name}`}
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
            <p className="signature-eyebrow">Pièce signature</p>
            <h2>{signaturePiece.name}</h2>
            <p className="signature-meta">{signaturePiece.capsule}</p>
            <p className="signature-price">{signaturePiece.price}</p>
            <Link className="home-cta signature-cta" to="/collection">
              Découvrir
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
            Maison Marcelina n'est pas seulement une marque, c'est une élégance
            cousue à la main.
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

function CollectionPage() {
  const [activeCollection, setActiveCollection] = useState("Toutes");
  const navigate = useNavigate();
  const pointerStartRef = useRef({ x: 0, y: 0 });

  const collectionFilters = useMemo(
    () => ["Toutes", ...new Set(collectionMarketplaceProducts.map((product) => product.line))],
    []
  );

  const visibleProducts = useMemo(() => {
    if (activeCollection === "Toutes") {
      return collectionMarketplaceProducts;
    }

    return collectionMarketplaceProducts.filter(
      (product) => product.line === activeCollection
    );
  }, [activeCollection]);

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

          <p className="collection-result-count">{visibleProducts.length} pièces</p>
        </aside>

        <div className="collection-marketplace-grid">
          {visibleProducts.map((product, index) => (
            <article
              className="collection-marketplace-card"
              key={product.id}
              role="link"
              tabIndex={0}
              onPointerDown={handleCardPointerDown}
              onPointerUp={(event) => handleCardPointerUp(event, product.id)}
              onKeyDown={(event) => handleCardKeyDown(event, product.id)}
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
    </section>
  );
}

function ProductDetailPage({ onAddToCart }) {
  const { productId } = useParams();
  const [selectedSize, setSelectedSize] = useState("");
  const [openSectionId, setOpenSectionId] = useState(null);

  const product = useMemo(
    () =>
      collectionMarketplaceProducts.find((item) => item.id === productId) ?? null,
    [productId]
  );

  useEffect(() => {
    setSelectedSize("");
    setOpenSectionId(null);
  }, [productId]);

  if (!product) {
    return <Navigate to="/collection" replace />;
  }

  const detailSections = getProductDetailSections(product);
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
          <Link className="product-detail-back" to="/collection">
            Retour boutique
          </Link>
          <p className="product-detail-line">{product.line}</p>
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
            {marketplaceProductSizes.map((size) => (
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
                image: getMarketplaceImages(product)[0] ?? product.image,
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
        </Reveal>
      </div>
    </section>
  );
}

function SurMesurePage() {
  const isAuthenticated = Boolean(readStoredAuthSession());
  const [requestSent, setRequestSent] = useState(false);
  const handleRequestSubmit = (event) => {
    event.preventDefault();
    setRequestSent(true);
  };

  const handleRequestEdit = () => {
    if (!requestSent) {
      return;
    }
    setRequestSent(false);
  };

  return (
    <section className="page-view form-view">
      <Reveal className="sur-mesure-panel">
        <p className="sur-mesure-intro">
          Le sur mesure permet de définir une pièce vraiment personnelle : coupe, longueur, encolure,
          manches, matières, couleurs et finitions. Nous adaptons chaque demande à votre silhouette,
          à votre usage et au niveau de formalité recherché, qu'il s'agisse d'une tenue du quotidien,
          d'une occasion spéciale ou d'une pièce de cérémonie.
        </p>
        <img
          className="sur-mesure-image"
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=80"
          alt="Silhouette de mode en atelier sur mesure"
          loading="lazy"
          decoding="async"
        />
        {isAuthenticated ? (
          <form className="sur-mesure-request-form" onSubmit={handleRequestSubmit} onInput={handleRequestEdit}>
            <div className="field-row">
              <label>
                <span>Projet souhaité</span>
                <select name="projectType" defaultValue="robe" required>
                  <option value="robe">Robe</option>
                  <option value="ensemble">Ensemble</option>
                  <option value="jupe">Jupe</option>
                  <option value="ceremonie">Pièce de cérémonie</option>
                  <option value="autre">Autre</option>
                </select>
              </label>

              <label>
                <span>Délai souhaité</span>
                <input type="text" name="timeline" placeholder="Ex. Juin 2026" required />
              </label>
            </div>

            <label>
              <span>Demande</span>
              <textarea name="requestMessage" placeholder="Coupe, matières, contraintes..." required />
            </label>
            {requestSent ? <p className="sur-mesure-feedback">Demande envoyée</p> : null}

            <button type="submit">Envoyer la demande</button>
          </form>
        ) : (
          <div className="sur-mesure-access">
            <p>Connexion requise</p>
            <Link className="sur-mesure-action" to="/login">
              Se connecter
            </Link>
          </div>
        )}
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
            <span>Numéro de commande</span>
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
          <textarea name="issueMessage" placeholder="Détails du souci..." required />
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
      : "Non renseigné";
  const clientId = user && typeof user.id === "string" ? user.id : "";
  const createdAt = user && typeof user.created_at === "string" ? user.created_at : "";
  const lastSignInAt =
    user && typeof user.last_sign_in_at === "string" ? user.last_sign_in_at : "";
  const emailConfirmedAt =
    user && typeof user.email_confirmed_at === "string" ? user.email_confirmed_at : "";

  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "orders", label: "Commandes" },
    { id: "details", label: "Coordonnées" },
    { id: "security", label: "Sécurité" },
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
      setSuccessMessage("Coordonnées enregistrées");
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
                  <span>En préparation</span>
                  <strong>{inProgressOrders}</strong>
                </div>
                <div className="account-metric">
                  <span>Dernière commande</span>
                  <strong>{latestOrderDate}</strong>
                </div>
              </div>

              <div className="account-grid">
                <section className="account-card">
                  <h3>Identité client</h3>
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
                      <span>Téléphone</span>
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
                      <span>Mise à jour profil</span>
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
                    placeholder="Nom et prénom"
                    autoComplete="name"
                  />
                </label>
                <label className="account-field">
                  <span>Email</span>
                  <input type="email" value={email} autoComplete="email" disabled />
                </label>
                <label className="account-field">
                  <span>Téléphone</span>
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
                      <span>Email vérifié</span>
                      <strong>{emailConfirmedAt ? "Oui" : "Non"}</strong>
                    </div>
                    <div className="account-kv">
                      <span>Dernière connexion</span>
                      <strong>{formatAccountDate(lastSignInAt)}</strong>
                    </div>
                    <div className="account-kv">
                      <span>Inscription</span>
                      <strong>{formatAccountDate(createdAt)}</strong>
                    </div>
                  </div>
                </section>
                <section className="account-card">
                  <h3>Accès</h3>
                  <div className="account-actions">
                    <button type="button" className="account-logout-btn" onClick={handleLogout}>
                      Se déconnecter
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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/notre-histoire" element={<NotreHistoirePage />} />
          <Route path="/histoire" element={<Navigate to="/notre-histoire" replace />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route
            path="/collection/:productId"
            element={<ProductDetailPage onAddToCart={handleAddToCart} />}
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
