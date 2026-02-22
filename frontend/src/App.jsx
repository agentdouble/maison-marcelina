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

function SiteHeader() {
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
        heading="Connexion"
        logo={{
          url: "/",
          src: "/logo-marcelina.svg",
          alt: "Logo Maison Marcelina",
          title: "Maison Marcelina",
        }}
        buttonText="Connexion"
        googleText="Continuer avec Google"
        signupText="Creation sur mesure ?"
        signupUrl="/sur-mesure"
        onLoginSuccess={() => navigate("/", { replace: true })}
      />
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

      <SiteFooter />
    </main>
  );
}
