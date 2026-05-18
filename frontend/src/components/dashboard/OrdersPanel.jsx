import { useEffect, useState } from 'react';
import { fetchBusinessOrders } from '../../api/businessOrders';
import { productImageSrc } from '../../utils/imageUrl';
import './OrdersPanel.css';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function paymentLabel(method) {
  return method === 'cash' ? 'Cash on delivery' : 'Credit card';
}

function cardSummary(payment) {
  if (payment.method !== 'card') return null;
  const brand = payment.card_brand ? payment.card_brand.charAt(0).toUpperCase() + payment.card_brand.slice(1) : 'Card';
  if (payment.card_last_four) {
    return `${brand} •••• ${payment.card_last_four}`;
  }
  return brand;
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBusinessOrders();
        if (!cancelled) {
          setOrders(data);
          if (data.length > 0) setExpandedId(data[0].id);
        }
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

  if (loading) {
    return <p className="status">Loading orders…</p>;
  }

  if (error) {
    return (
      <section className="orders-panel">
        <p className="orders-panel-error">{error}</p>
      </section>
    );
  }

  return (
    <section className="orders-panel">
      <div className="orders-panel-header">
        <h2>Customer orders</h2>
        <p className="orders-panel-lead">
          Orders that include your products, with customer and fulfilment details.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="orders-panel-empty">
          <p>No orders yet.</p>
          <p className="orders-panel-empty-hint">
            When customers buy your products, their orders will appear here.
          </p>
        </div>
      ) : (
        <ul className="biz-orders-list">
          {orders.map((order) => {
            const isOpen = expandedId === order.id;
            const { customer, payment } = order;
            const cardLine = cardSummary(payment);

            return (
              <li key={order.id} className={`biz-order-card ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="biz-order-card-toggle"
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                  aria-expanded={isOpen}
                >
                  <div className="biz-order-card-summary">
                    <p className="biz-order-number">{order.order_number}</p>
                    <p className="biz-order-from">
                      From <strong>{customer.full_name}</strong>
                      {customer.is_registered && (
                        <span className="biz-order-badge">Registered</span>
                      )}
                    </p>
                    <p className="biz-order-meta">
                      {formatDate(order.created_at)} · {order.items.length} item
                      {order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="biz-order-card-right">
                    <span className={`biz-order-status biz-order-status--${order.status}`}>
                      {order.status}
                    </span>
                    <p className="biz-order-total">${order.business_subtotal.toFixed(2)}</p>
                    <span className="biz-order-chevron" aria-hidden>
                      {isOpen ? '▴' : '▾'}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="biz-order-details">
                    <div className="biz-order-detail-grid">
                      <div className="biz-order-block">
                        <h3>Customer</h3>
                        <dl className="biz-order-dl">
                          <div>
                            <dt>Name</dt>
                            <dd>{customer.full_name}</dd>
                          </div>
                          <div>
                            <dt>Email</dt>
                            <dd>
                              <a href={`mailto:${customer.email}`}>{customer.email}</a>
                            </dd>
                          </div>
                          <div>
                            <dt>Phone</dt>
                            <dd>
                              <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                            </dd>
                          </div>
                          <div>
                            <dt>Ship to</dt>
                            <dd>
                              {customer.address}
                              <br />
                              {customer.city}, {customer.postal_code}
                            </dd>
                          </div>
                          {customer.is_registered && (
                            <div>
                              <dt>Account</dt>
                              <dd>
                                {customer.account_name || customer.full_name}
                                {customer.account_email && customer.account_email !== customer.email && (
                                  <>
                                    <br />
                                    <span className="biz-order-account-email">{customer.account_email}</span>
                                  </>
                                )}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      <div className="biz-order-block">
                        <h3>Payment</h3>
                        <dl className="biz-order-dl">
                          <div>
                            <dt>Method</dt>
                            <dd>{paymentLabel(payment.method)}</dd>
                          </div>
                          {cardLine && (
                            <div>
                              <dt>Card</dt>
                              <dd>{cardLine}</dd>
                            </div>
                          )}
                          {payment.cardholder_name && (
                            <div>
                              <dt>Cardholder</dt>
                              <dd>{payment.cardholder_name}</dd>
                            </div>
                          )}
                          <div>
                            <dt>Your total</dt>
                            <dd className="biz-order-highlight">
                              ${order.business_subtotal.toFixed(2)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <h3 className="biz-order-items-title">Your products in this order</h3>
                    <ul className="biz-order-items">
                      {order.items.map((item) => {
                        const imageSrc = productImageSrc(item.image_url);
                        return (
                          <li key={item.id} className="biz-order-item">
                            <div className="biz-order-item-image">
                              {imageSrc ? (
                                <img src={imageSrc} alt={item.product_name} />
                              ) : (
                                <span>No image</span>
                              )}
                            </div>
                            <div className="biz-order-item-body">
                              <p className="biz-order-item-name">{item.product_name}</p>
                              {item.product_description && (
                                <p className="biz-order-item-desc">{item.product_description}</p>
                              )}
                              <p className="biz-order-item-meta">
                                Product #{item.product_id} · Qty {item.quantity} · $
                                {item.unit_price.toFixed(2)} each
                              </p>
                            </div>
                            <p className="biz-order-item-line">${item.line_total.toFixed(2)}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
