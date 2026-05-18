import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productImageSrc } from '../utils/imageUrl';
import './ProductCard.css';

export default function ProductCard({ product, showActions, onEdit, onDelete, onToggleActive }) {
  const { addToCart } = useCart();
  const imageSrc = productImageSrc(product.image_url);
  const price = Number(product.price).toFixed(2);
  const outOfStock = Number(product.stock) === 0;
  const isStore = !showActions;

  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    try {
      addToCart(product, 1, e.currentTarget);
    } catch (err) {
      alert(err.message);
    }
  }

  const cardContent = (
    <>
      <div className="product-image-wrap">
        {imageSrc ? (
          <img src={imageSrc} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-placeholder">No image</div>
        )}
        {outOfStock && <span className="badge badge-warn">Out of stock</span>}
        {!product.is_active && <span className="badge badge-muted">Hidden</span>}
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="product-desc">{product.description || 'No description.'}</p>
        <div className="product-footer">
          <span className="price">${price}</span>
          {isStore ? (
            <div className="product-footer-right">
              <span className="stock-label">{outOfStock ? 'Unavailable' : `${product.stock} in stock`}</span>
              <button
                type="button"
                className="cart-add-btn"
                onClick={handleAddToCart}
                disabled={outOfStock}
                aria-label={`Add ${product.name} to cart`}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6h15l-1.5 9H8L6 6zm0 0L5 3H2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9.5" cy="19" r="1.5" fill="currentColor" />
                  <circle cx="17.5" cy="19" r="1.5" fill="currentColor" />
                </svg>
              </button>
            </div>
          ) : (
            <span className="stock-label">{outOfStock ? 'Unavailable' : `${product.stock} in stock`}</span>
          )}
        </div>
        {showActions && (
          <div className="product-actions">
            <button type="button" className="btn btn-ghost" onClick={() => onEdit(product)}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onToggleActive(product)}
            >
              {product.is_active ? 'Hide' : 'Show'}
            </button>
            <button type="button" className="btn btn-danger" onClick={() => onDelete(product.id)}>
              Delete
            </button>
          </div>
        )}
      </div>
    </>
  );

  if (isStore) {
    return (
      <Link to={`/product/${product.id}`} className={`product-card product-card--link ${!product.is_active ? 'inactive' : ''}`}>
        {cardContent}
      </Link>
    );
  }

  return (
    <article className={`product-card ${!product.is_active ? 'inactive' : ''}`}>
      {cardContent}
    </article>
  );
}
