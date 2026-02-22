import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
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
    name: "Robe Heritage",
    price: "149 EUR",
    image:
      "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1080&q=80",
  },
  {
    name: "Top Riviera",
    price: "89 EUR",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1080&q=80",
  },
  {
    name: "Jupe Audacieuse",
    price: "119 EUR",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1080&q=80",
  },
  {
    name: "Ensemble Atelier",
    price: "179 EUR",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1080&q=80",
  },
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
  description: product.price,
  href: "/boutique",
  image: product.image,
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

function getFooterSections(isAuthenticated) {
  return [
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

function SiteHeader() {
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
          <Link className="cart-link" to="/panier" aria-label="Panier">
            <CartIcon />
          </Link>

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

function CollectionsGrid() {
  return (
    <div className="collection-grid">
      {collections.map((collection, index) => (
        <Reveal
          as="article"
          className="collection-card"
          key={collection.title}
          delay={index * 80}
        >
          <img src={collection.image} alt={collection.title} loading="lazy" />
          <div className="collection-content">
            <p>{collection.season}</p>
            <h2>{collection.title}</h2>
            <div className="tag-list">
              {collection.palette.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <Link to="/boutique">Voir en boutique</Link>
          </div>
        </Reveal>
      ))}
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

function CollectionPage() {
  return (
    <section className="page-view">
      <header className="section-head">
        <h1>Les collections</h1>
      </header>

      <CollectionsGrid />
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

function BoutiquePage() {
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
            key={product.name}
            delay={index * 80}
          >
            <img src={product.image} alt={product.name} loading="lazy" />
            <div>
              <h2>{product.name}</h2>
              <p>{product.price}</p>
            </div>
            <button type="button">Ajouter</button>
          </Reveal>
        ))}
      </div>
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

function PanierPage() {
  return (
    <section className="page-view form-view">
      <header className="section-head">
        <h1>Panier</h1>
      </header>

      <Reveal className="cgv-panel">
        <p>0 article</p>
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
  const location = useLocation();
  const hideFooter = location.pathname === "/login";

  return (
    <main className="app-shell">
      <SiteHeader />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/collections" element={<Navigate to="/collection" replace />} />
          <Route path="/marketplace" element={<Navigate to="/collection" replace />} />
          <Route path="/sur-mesure" element={<SurMesurePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/boutique" element={<BoutiquePage />} />
          <Route path="/panier" element={<PanierPage />} />
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

      {!hideFooter ? <SiteFooter /> : null}
    </main>
  );
}
