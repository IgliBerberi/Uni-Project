import { useCart } from '../context/CartContext';
import './CartFlyAnimation.css';

export default function CartFlyAnimation() {
  const { fly } = useCart();

  if (!fly) return null;

  const dx = fly.to.x - fly.from.x;
  const dy = fly.to.y - fly.from.y;

  return (
    <div
      className="cart-fly"
      style={{
        left: fly.from.x,
        top: fly.from.y,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
      }}
      aria-hidden
    />
  );
}
