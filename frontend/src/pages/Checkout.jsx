import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { placeOrder } from '../api/checkout';
import { deleteSavedCard, fetchSavedCards } from '../api/savedCards';
import SavedCardSelector from '../components/SavedCardSelector';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productImageSrc } from '../utils/imageUrl';
import {
  formatCardNumber,
  formatExpiry,
  validateCardNumber,
  validateCardholder,
  validateCvv,
  validateExpiry,
} from '../utils/cardValidation';
import './Checkout.css';

const SHIPPING_FEE = 0;

export default function Checkout() {
  const { user, isUserLoggedIn } = useAuth();
  const { items, totalItems, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('new');
  const [saveCard, setSaveCard] = useState(false);
  const [shipping, setShipping] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
  });
  const [card, setCard] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + SHIPPING_FEE;
  const usingSavedCard = paymentMethod === 'card' && selectedCardId !== 'new';

  useEffect(() => {
    if (!isUserLoggedIn) {
      setSavedCards([]);
      setSelectedCardId('new');
      return;
    }
    (async () => {
      try {
        const cards = await fetchSavedCards();
        setSavedCards(cards);
        if (cards.length > 0) {
          setSelectedCardId(cards[0].id);
        }
      } catch {
        setSavedCards([]);
      }
    })();
  }, [isUserLoggedIn]);

  async function handleRemoveSavedCard(id) {
    if (!window.confirm('Remove this saved card?')) return;
    await deleteSavedCard(id);
    const cards = await fetchSavedCards();
    setSavedCards(cards);
    setSelectedCardId(cards.length > 0 ? cards[0].id : 'new');
  }

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="checkout-page">
        <div className="checkout-brand">
          <span className="checkout-logo-mark">◆</span>
          <span>NovaShop</span>
        </div>
        <h1>Checkout</h1>
        <p className="checkout-empty">Your cart is empty. Add products before checkout.</p>
        <Link to="/" className="btn btn-primary">
          Go to store
        </Link>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="checkout-page checkout-success">
        <div className="checkout-brand">
          <span className="checkout-logo-mark">◆</span>
          <span>NovaShop</span>
        </div>
        <div className="success-card">
          <span className="success-icon" aria-hidden>✓</span>
          <h1>Order placed!</h1>
          <p className="success-lead">
            Thank you{orderComplete.name ? `, ${orderComplete.name.split(' ')[0]}` : ''}. Your order has been
            received.
          </p>
          <dl className="success-details">
            <div>
              <dt>Order number</dt>
              <dd>{orderComplete.orderId}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{orderComplete.paymentLabel}</dd>
            </div>
            <div>
              <dt>Total paid</dt>
              <dd>${orderComplete.total.toFixed(2)}</dd>
            </div>
          </dl>
          {orderComplete.paymentMethod === 'cash' && (
            <p className="success-note">Please have cash ready on delivery.</p>
          )}
          {orderComplete.cardSaved && (
            <p className="success-note">Your card was saved for your next purchase.</p>
          )}
          <div className="success-actions">
            {isUserLoggedIn && (
              <Link to="/orders" className="btn btn-ghost">
                View orders
              </Link>
            )}
            <Link to="/" className="btn btn-primary">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function handleShippingChange(e) {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleCardChange(e) {
    const { name, value } = e.target;
    let next = value;
    if (name === 'number') next = formatCardNumber(value);
    if (name === 'expiry') next = formatExpiry(value);
    if (name === 'cvv') next = value.replace(/\D/g, '').slice(0, 4);
    setCard((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validateShipping() {
    const next = {};
    if (!shipping.full_name.trim()) next.full_name = 'Full name is required.';
    if (!shipping.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      next.email = 'Valid email is required.';
    }
    if (!shipping.phone.trim()) next.phone = 'Phone number is required.';
    if (!shipping.address.trim()) next.address = 'Address is required.';
    if (!shipping.city.trim()) next.city = 'City is required.';
    if (!shipping.postal_code.trim()) next.postal_code = 'Postal code is required.';
    return next;
  }

  function validateCardFields() {
    const next = {};
    if (usingSavedCard) {
      const cvvErr = validateCvv(card.cvv);
      if (cvvErr) next.cvv = cvvErr;
      return next;
    }
    const numErr = validateCardNumber(card.number);
    const expErr = validateExpiry(card.expiry);
    const cvvErr = validateCvv(card.cvv);
    const nameErr = validateCardholder(card.name);
    if (numErr) next.number = numErr;
    if (expErr) next.expiry = expErr;
    if (cvvErr) next.cvv = cvvErr;
    if (nameErr) next.cardName = nameErr;
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const shippingErrors = validateShipping();
    const cardErrors = paymentMethod === 'card' ? validateCardFields() : {};
    const allErrors = { ...shippingErrors, ...cardErrors };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const payload = {
        shipping,
        payment_method: paymentMethod,
        items: items.map((i) => ({
          product_id: i.productId,
          name: i.name,
          description: i.description || '',
          price: i.price,
          quantity: i.quantity,
          image_url: i.image_url,
        })),
        shipping_fee: SHIPPING_FEE,
        save_card: saveCard && isUserLoggedIn && !usingSavedCard,
        saved_card_id: usingSavedCard ? selectedCardId : null,
        card:
          paymentMethod === 'card'
            ? {
                number: card.number,
                expiry: card.expiry,
                cvv: card.cvv,
                name: card.name,
              }
            : null,
      };

      const result = await placeOrder(payload);

      setOrderComplete({
        orderId: result.order_number,
        name: shipping.full_name,
        total: result.total,
        paymentMethod,
        paymentLabel: paymentMethod === 'cash' ? 'Cash on delivery' : 'Credit card',
        cardSaved: result.card_saved,
      });
      clearCart();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-top">
        <div className="checkout-brand">
          <span className="checkout-logo-mark">◆</span>
          <span>NovaShop</span>
        </div>
        <Link to="/cart" className="back-link">
          ← Back to cart
        </Link>
      </div>

      <header className="checkout-header">
        <h1>Checkout</h1>
        <p className="checkout-lead">
          Review your order and complete payment — {totalItems} item{totalItems !== 1 ? 's' : ''}
        </p>
      </header>

      <form className="checkout-layout" onSubmit={handleSubmit}>
        <div className="checkout-main">
          <section className="checkout-section">
            <h2>Order details</h2>
            <ul className="checkout-items">
              {items.map((item) => {
                const imageSrc = productImageSrc(item.image_url);
                return (
                  <li key={item.productId} className="checkout-item">
                    <Link to={`/product/${item.productId}`} className="checkout-item-image">
                      {imageSrc ? (
                        <img src={imageSrc} alt={item.name} />
                      ) : (
                        <span className="checkout-item-no-img">No image</span>
                      )}
                    </Link>
                    <div className="checkout-item-body">
                      <Link to={`/product/${item.productId}`} className="checkout-item-name">
                        {item.name}
                      </Link>
                      <p className="checkout-item-desc">
                        {item.description || 'No description available.'}
                      </p>
                      <p className="checkout-item-meta">
                        <span>${item.price.toFixed(2)} each</span>
                        <span>Qty: {item.quantity}</span>
                      </p>
                    </div>
                    <p className="checkout-item-line">${(item.price * item.quantity).toFixed(2)}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="checkout-section">
            <h2>Shipping information</h2>
            <div className="form-grid">
              <label className="span-2">
                Full name *
                <input name="full_name" value={shipping.full_name} onChange={handleShippingChange} />
                {errors.full_name && <span className="field-error">{errors.full_name}</span>}
              </label>
              <label>
                Email *
                <input name="email" type="email" value={shipping.email} onChange={handleShippingChange} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>
              <label>
                Phone *
                <input name="phone" type="tel" value={shipping.phone} onChange={handleShippingChange} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </label>
              <label className="span-2">
                Street address *
                <input name="address" value={shipping.address} onChange={handleShippingChange} />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </label>
              <label>
                City *
                <input name="city" value={shipping.city} onChange={handleShippingChange} />
                {errors.city && <span className="field-error">{errors.city}</span>}
              </label>
              <label>
                Postal code *
                <input name="postal_code" value={shipping.postal_code} onChange={handleShippingChange} />
                {errors.postal_code && <span className="field-error">{errors.postal_code}</span>}
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <h2>Payment method</h2>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                />
                <span className="payment-option-content">
                  <strong>Credit card</strong>
                  <small>Any valid-format card accepted (demo)</small>
                </span>
              </label>
              <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                <span className="payment-option-content">
                  <strong>Cash on delivery</strong>
                  <small>Pay when your order arrives</small>
                </span>
              </label>
            </div>

            {paymentMethod === 'card' && (
              <div className="card-form">
                <p className="card-form-note">
                  Demo checkout — use any numbers that match the format below (no real charge).
                  CVV is never stored.
                </p>

                {isUserLoggedIn && savedCards.length > 0 && (
                  <SavedCardSelector
                    cards={savedCards}
                    selectedId={selectedCardId}
                    onSelect={setSelectedCardId}
                    onDelete={handleRemoveSavedCard}
                  />
                )}

                {usingSavedCard ? (
                  <label>
                    CVV *
                    <input
                      name="cvv"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={card.cvv}
                      onChange={handleCardChange}
                    />
                    {errors.cvv && <span className="field-error">{errors.cvv}</span>}
                  </label>
                ) : (
                  <>
                <label>
                  Card number *
                  <input
                    name="number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={handleCardChange}
                  />
                  {errors.number && <span className="field-error">{errors.number}</span>}
                </label>
                <div className="form-grid">
                  <label>
                    Expiry (MM/YY) *
                    <input
                      name="expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="12/28"
                      value={card.expiry}
                      onChange={handleCardChange}
                    />
                    {errors.expiry && <span className="field-error">{errors.expiry}</span>}
                  </label>
                  <label>
                    CVV *
                    <input
                      name="cvv"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={card.cvv}
                      onChange={handleCardChange}
                    />
                    {errors.cvv && <span className="field-error">{errors.cvv}</span>}
                  </label>
                </div>
                <label>
                  Name on card *
                  <input
                    name="name"
                    autoComplete="cc-name"
                    placeholder="Jane Doe"
                    value={card.name}
                    onChange={handleCardChange}
                  />
                  {errors.cardName && <span className="field-error">{errors.cardName}</span>}
                </label>

                    <label
                      className={`save-card-toggle ${!isUserLoggedIn ? 'save-card-toggle--disabled' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={saveCard}
                        disabled={!isUserLoggedIn}
                        onChange={(e) => setSaveCard(e.target.checked)}
                      />
                      <span>
                        <strong>Save card for next purchase</strong>
                        {isUserLoggedIn
                          ? 'Securely store this card on your account (demo encryption).'
                          : 'Log in to save your card for faster checkout next time.'}
                      </span>
                    </label>
                  </>
                )}
              </div>
            )}

            {errors.form && <p className="form-error form-error-block">{errors.form}</p>}

            {paymentMethod === 'cash' && (
              <p className="cash-note">
                You will pay <strong>${total.toFixed(2)}</strong> in cash when your order is delivered.
              </p>
            )}
          </section>
        </div>

        <aside className="checkout-sidebar">
          <div className="summary-card">
            <div className="summary-brand">
              <span className="checkout-logo-mark">◆</span>
              <span>NovaShop</span>
            </div>
            <p className="summary-tagline">University E-commerce Project</p>
            <hr className="summary-divider" />
            <h3>Order summary</h3>
            <dl className="summary-lines">
              <div>
                <dt>Subtotal ({totalItems} items)</dt>
                <dd>${subtotal.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{SHIPPING_FEE === 0 ? 'Free' : `$${SHIPPING_FEE.toFixed(2)}`}</dd>
              </div>
            </dl>
            <hr className="summary-divider" />
            <dl className="summary-total">
              <dt>Total</dt>
              <dd>${total.toFixed(2)}</dd>
            </dl>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Processing…' : 'Place order'}
            </button>
            <p className="summary-secure">🔒 Secure demo checkout — no real payments processed</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
