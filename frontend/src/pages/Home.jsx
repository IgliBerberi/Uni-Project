import { useEffect, useState } from 'react';
import { fetchProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import './Home.css';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProducts(true);
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="store-page">
      <section className="hero">
        <p className="hero-eyebrow">Welcome to NovaShop</p>
        <h1>Discover products curated for you</h1>
        <p className="hero-sub">
          Everything you see here is managed from the business dashboard in real time.
        </p>
      </section>

      {loading && <p className="status">Loading products…</p>}
      {error && (
        <p className="status status-error">
          {error}. Make sure the PHP backend is running and the database is connected.
        </p>
      )}
      {!loading && !error && products.length === 0 && (
        <p className="status">No products yet. Add some from the Business Dashboard.</p>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
