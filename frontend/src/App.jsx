const collections = [
  {
    title: "Marcelina Heritage",
    subtitle: "Collection intemporelle",
    description: "Vert sauge, beige, taupe, chocolat.",
    tags: ["Base", "Classique", "Douce"],
    tone: "heritage",
  },
  {
    title: "Marcelina Riviera",
    subtitle: "Collection estivale",
    description: "Vichy, rayures, multicolore.",
    tags: ["Vive", "Permanente", "Simple"],
    tone: "riviera",
  },
  {
    title: "Marcelina Audacieuse",
    subtitle: "Collection caractere",
    description: "Leopard, vache, rouge, noir.",
    tags: ["Motifs", "Vive", "Statement"],
    tone: "audacieuse",
  },
];

const products = [
  {
    name: "Robe Jeanne",
    price: "149 EUR",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1080&q=80",
  },
  {
    name: "Ensemble Riviera",
    price: "119 EUR",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1080&q=80",
  },
  {
    name: "Blouse Marceline",
    price: "89 EUR",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1080&q=80",
  },
  {
    name: "Jupe Heritage",
    price: "99 EUR",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1080&q=80",
  },
];

const socialImages = [
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=900&q=80",
];

export function App() {
  return (
    <main className="site-shell">
      <div className="ambient-layer" aria-hidden="true" />

      <p className="notice">Livraison offerte des 90 EUR</p>

      <header className="topbar">
        <a className="brand" href="#">
          Maison Marcelina
        </a>

        <nav className="menu" aria-label="navigation principale">
          <a href="#histoire">Notre histoire</a>
          <a href="#collections">Les collections</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="cart-link" href="#">
          Panier <span>0</span>
        </a>
      </header>

      <section className="hero reveal reveal--1" id="collections">
        <div className="hero-copy">
          <p className="eyebrow">Atelier couture</p>
          <h1>Elegance cousue main</h1>
          <p className="hero-line">Heritage. Riviera. Audacieuse.</p>

          <div className="palette-row">
            <span>Vert sauge</span>
            <span>Beige</span>
            <span>Taupe</span>
            <span>Chocolat</span>
          </div>

          <div className="hero-actions">
            <a href="#shop">Voir les pieces</a>
            <a href="#histoire">La marque</a>
          </div>
        </div>

        <div className="hero-gallery">
          <figure className="hero-shot hero-shot--a">
            <img
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80"
              alt="Silhouette couture Maison Marcelina"
            />
          </figure>
          <figure className="hero-shot hero-shot--b">
            <img
              src="https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=80"
              alt="Detail de texture textile"
            />
          </figure>
          <figure className="hero-shot hero-shot--c">
            <img
              src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1000&q=80"
              alt="Piece Maison Marcelina en atelier"
            />
          </figure>
        </div>
      </section>

      <section className="collections reveal reveal--2">
        <div className="section-head">
          <p>Les collections</p>
          <h2>Trois univers couture</h2>
        </div>

        <div className="collection-grid">
          {collections.map((collection) => (
            <article
              key={collection.title}
              className={`collection-card collection-card--${collection.tone}`}
            >
              <p>{collection.subtitle}</p>
              <h3>{collection.title}</h3>
              <p>{collection.description}</p>
              <div className="tag-row">
                {collection.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="products reveal reveal--3" id="shop">
        <div className="section-head section-head--split">
          <div>
            <p>Shop the look</p>
            <h2>Selection du moment</h2>
          </div>
          <a href="#">Voir tout</a>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <article key={product.name} className="product-card">
              <img src={product.image} alt={product.name} loading="lazy" />
              <div className="product-meta">
                <h3>{product.name}</h3>
                <p>{product.price}</p>
              </div>
              <button type="button">Ajouter</button>
            </article>
          ))}
        </div>
      </section>

      <section className="story reveal reveal--4" id="histoire">
        <div className="story-copy">
          <p>Notre histoire</p>
          <h2>Transmission, memoire, elegance</h2>
          <p>
            Le nom Maison Marcelina rend hommage a Marceline, silhouette chic
            et assuree. Des pieces cousues main, pensees pour durer.
          </p>
        </div>
        <ul className="story-list">
          <li>Creations cousues main</li>
          <li>Pieces pensees pour durer</li>
          <li>Chic quotidien</li>
          <li>Caractere assume</li>
        </ul>
      </section>

      <section className="social reveal reveal--5" id="contact">
        <div className="section-head section-head--split">
          <div>
            <p>Instagram</p>
            <h2>@maisonmarcelina</h2>
          </div>
          <a href="#">Suivre</a>
        </div>

        <div className="social-grid">
          {socialImages.map((image, index) => (
            <a className="social-card" href="#" key={image}>
              <img src={image} alt={`Post Instagram ${index + 1}`} />
            </a>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>Maison Marcelina</p>
        <div>
          <a href="#">Instagram</a>
          <a href="#">Contact</a>
          <a href="#">CGV</a>
          <a href="#">Confidentialite</a>
        </div>
      </footer>
    </main>
  );
}
