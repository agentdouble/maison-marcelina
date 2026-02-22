import { useRef } from "react";
import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/collection", label: "Collection" },
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

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="brand-row">
        <Link className="brand-link" to="/" aria-label="Accueil Maison Marcelina">
          <img src="/logo-marcelina.png" alt="Logo Maison Marcelina" />
        </Link>

        <Link className="profile-link" to="/login" aria-label="Login">
          <ProfileIcon />
        </Link>
      </div>

      <nav className="menu-tabs" aria-label="Navigation principale">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              isActive ? "menu-tab menu-tab--active" : "menu-tab"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

function HomePage() {
  const trackRef = useRef(null);

  const scrollBySlide = (direction) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    track.scrollBy({
      left: track.clientWidth * direction,
      behavior: "smooth",
    });
  };

  const scrollToIndex = (index) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    track.scrollTo({
      left: track.clientWidth * index,
      behavior: "smooth",
    });
  };

  return (
    <section className="page-view home-view">
      <div className="carousel-shell">
        <div className="carousel-controls" aria-hidden="true">
          <button type="button" onClick={() => scrollBySlide(-1)}>
            {"<"}
          </button>
          <button type="button" onClick={() => scrollBySlide(1)}>
            {">"}
          </button>
        </div>

        <div className="hero-track" ref={trackRef}>
          {collections.map((collection) => (
            <article className="hero-slide" key={collection.title}>
              <Link className="hero-collection" to="/collection">
                <img src={collection.image} alt={collection.title} loading="lazy" />
                <div className="hero-overlay">
                  <p>{collection.season}</p>
                  <h1>{collection.title}</h1>
                  <span>{collection.palette.join(" / ")}</span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="carousel-dots">
          {collections.map((collection, index) => (
            <button
              key={collection.title}
              type="button"
              aria-label={`Aller a ${collection.title}`}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
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

      <div className="collection-grid">
        {collections.map((collection) => (
          <article className="collection-card" key={collection.title}>
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
          </article>
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

      <form className="form-panel" onSubmit={(event) => event.preventDefault()}>
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
      </form>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="page-view form-view">
      <header className="section-head">
        <h1>Contact commande</h1>
      </header>

      <form className="form-panel" onSubmit={(event) => event.preventDefault()}>
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
      </form>
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
        {products.map((product) => (
          <article className="product-card" key={product.name}>
            <img src={product.image} alt={product.name} loading="lazy" />
            <div>
              <h2>{product.name}</h2>
              <p>{product.price}</p>
            </div>
            <button type="button">Ajouter</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function LoginPage() {
  return (
    <section className="page-view login-view">
      <form className="form-panel form-panel--small" onSubmit={(event) => event.preventDefault()}>
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
      </form>
    </section>
  );
}

function CgvPage() {
  return (
    <section className="page-view form-view">
      <header className="section-head">
        <h1>Conditions generales</h1>
      </header>

      <div className="cgv-panel">
        <p>Vente en ligne d'articles couture.</p>
        <p>Paiement securise.</p>
        <p>Retours selon conditions de commande.</p>
        <p>Contact commande: page Contact.</p>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link to="/cgv">Conditions generales</Link>
      <div className="social-links">
        <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
          Instagram
        </a>
        <a href="https://www.tiktok.com" target="_blank" rel="noreferrer">
          TikTok
        </a>
        <a href="https://www.pinterest.com" target="_blank" rel="noreferrer">
          Pinterest
        </a>
      </div>
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cgv" element={<CgvPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <SiteFooter />
    </main>
  );
}
