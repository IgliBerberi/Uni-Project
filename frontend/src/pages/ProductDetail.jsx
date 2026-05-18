import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchProduct } from '../api/products';
import { useCart } from '../context/CartContext';
import { productImageSrc } from '../utils/imageUrl';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');

  const inCart = items.find((i) => i.productId === Number(id));
  const outOfStock = product && Number(product.stock) === 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProduct(id);
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleAddToCart(e) {
    if (!product || outOfStock) return;
    try {
      addToCart(product, qty, e.currentTarget);
      setAddedMsg('Added to cart!');
      setTimeout(() => setAddedMsg(''), 2000);
    } catch (err) {
      setAddedMsg(err.message);
    }
  }

  function handleCheckout() {
    if (!product || outOfStock) return;
    try {
      if (!inCart) {
        addToCart(product, qty, null);
      }
      navigate('/checkout');
    } catch (err) {
      setAddedMsg(err.message);
    }
  }

  if (loading) return <p className="status">Loading product…</p>;
  if (error || !product) {
    return (
      <div className="product-detail-page">
        <p className="status status-error">{error || 'Product not found.'}</p>
        <Link to="/" className="btn btn-ghost">
          ← Back to store
        </Link>
      </div>
    );
  }

  const imageSrc = productImageSrc(product.image_url);
  const price = Number(product.price).toFixed(2);

  return (
    <div className="product-detail-page">
      <Link to="/" className="back-link">
        ← Back to store
      </Link>

      <div className="product-detail-grid">
        <div className="product-detail-image">
          {imageSrc ? (
            <img src={imageSrc} alt={product.name} />
          ) : (
            <div className="product-detail-placeholder">No image</div>
          )}
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-detail-price">${price}</p>
          <p className="product-detail-stock">
            {outOfStock ? 'Out of stock' : `${product.stock} available`}
            {inCart && !outOfStock && (
              <span className="in-cart-hint"> · {inCart.quantity} in your cart</span>
            )}
          </p>
          <p className="product-detail-desc">{product.description || 'No description provided.'}</p>

          {!outOfStock && (
            <label className="qty-label">
              Quantity
              <input
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value), product.stock)))}
              />
            </label>
          )}

          {addedMsg && <p className="product-detail-toast">{addedMsg}</p>}

          <div className="product-detail-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              Add to cart
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCheckout}
              disabled={outOfStock}
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
