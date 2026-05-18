import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const STORAGE_KEY = 'novashop_cart';

const CartContext = createContext(null);

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function toCartItem(product, quantity = 1) {
  return {
    productId: product.id,
    quantity,
    name: product.name,
    description: product.description || '',
    price: Number(product.price),
    image_url: product.image_url,
    stock: Number(product.stock),
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [fly, setFly] = useState(null);
  const [badgePulse, setBadgePulse] = useState(false);
  const cartIconRef = useRef(null);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const registerCartIcon = useCallback((node) => {
    cartIconRef.current = node;
  }, []);

  const runFlyAnimation = useCallback((sourceEl) => {
    if (!sourceEl || !cartIconRef.current) return;
    const from = sourceEl.getBoundingClientRect();
    const to = cartIconRef.current.getBoundingClientRect();
    setFly({
      from: { x: from.left + from.width / 2, y: from.top + from.height / 2 },
      to: { x: to.left + to.width / 2, y: to.top + to.height / 2 },
    });
    setBadgePulse(true);
    setTimeout(() => setFly(null), 650);
    setTimeout(() => setBadgePulse(false), 700);
  }, []);

  const addToCart = useCallback(
    (product, quantity = 1, sourceEl = null) => {
      if (Number(product.stock) === 0) {
        throw new Error('This product is out of stock.');
      }

      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, Number(product.stock));
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: nextQty, stock: Number(product.stock) } : i,
          );
        }
        return [...prev, toCartItem(product, Math.min(quantity, Number(product.stock)))];
      });

      runFlyAnimation(sourceEl);
    },
    [runFlyAnimation],
  );

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.productId !== productId);
      }
      return prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i,
      );
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      totalItems,
      fly,
      badgePulse,
      cartIconRef,
      registerCartIcon,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      items,
      totalItems,
      fly,
      badgePulse,
      registerCartIcon,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
