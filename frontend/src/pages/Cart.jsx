import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productImageSrc } from '../utils/imageUrl';
import './Cart.css';

export default function Cart() {
  const { items, totalItems, updateQuantity, removeFromCart } = useCart();

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h1>Your cart</h1>
        <p className="cart-empty">Your cart is empty.</p>
        <Link to="/" className="btn btn-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your cart</h1>
      <p className="cart-summary">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>

      <ul className="cart-list">
        {items.map((item) => {
          const imageSrc = productImageSrc(item.image_url);
          return (
            <li key={item.productId} className="cart-item">
              <Link to={`/product/${item.productId}`} className="cart-item-image">
                {imageSrc ? (
                  <img src={imageSrc} alt="" />
                ) : (
                  <span>—</span>
                )}
              </Link>
              <div className="cart-item-info">
                <Link to={`/product/${item.productId}`} className="cart-item-name">
                  {item.name}
                </Link>
                <p className="cart-item-price">${item.price.toFixed(2)} each</p>
                <div className="cart-item-qty">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="cart-item-right">
                <p className="cart-item-total">${(item.price * item.quantity).toFixed(2)}</p>
                <button
                  type="button"
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.productId)}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="cart-footer">
        <p className="cart-subtotal">
          Subtotal <strong>${subtotal.toFixed(2)}</strong>
        </p>
        <Link to="/checkout" className="btn btn-primary btn-block">
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
