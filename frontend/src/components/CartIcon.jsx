import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartIcon.css';

export default function CartIcon() {
  const { totalItems, badgePulse, registerCartIcon } = useCart();

  return (
    <Link
      to="/cart"
      className={`cart-icon-link ${badgePulse ? 'cart-icon-link--pulse' : ''}`}
      ref={registerCartIcon}
      aria-label={`Cart, ${totalItems} items`}
    >
      <svg className="cart-icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden>
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
      {totalItems > 0 && (
        <span className="cart-badge" key={totalItems}>
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
}
