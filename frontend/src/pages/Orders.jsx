import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../api/orders';
import { productImageSrc } from '../utils/imageUrl';
import './Orders.css';

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

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchOrders();
        if (!cancelled) setOrders(data);
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
    return <p className="status">Loading your orders…</p>;
  }

  if (error) {
    return (
      <section className="account-page orders-page">
        <h1>Orders</h1>
        <p className="orders-error">{error}</p>
      </section>
    );
  }

  return (
    <section className="account-page orders-page">
      <h1>Orders</h1>
      <p className="account-lead">Your purchase history on NovaShop.</p>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <p>You have not placed any orders yet.</p>
          <Link to="/" className="btn btn-primary">
            Browse store
          </Link>
        </div>
      ) : (
        <ul className="orders-list">
          {orders.map((order) => (
            <li key={order.id} className="order-card">
              <header className="order-card-header">
                <div>
                  <p className="order-number">{order.order_number}</p>
                  <p className="order-meta">
                    {formatDate(order.created_at)}
                    {order.shipping_city ? ` · ${order.shipping_city}` : ''}
                  </p>
                </div>
                <div className="order-card-summary">
                  <span className={`order-status order-status--${order.status}`}>
                    {order.status}
                  </span>
                  <p className="order-total">${order.total.toFixed(2)}</p>
                </div>
              </header>

              <ul className="order-items">
                {order.items.map((item) => {
                  const imageSrc = productImageSrc(item.image_url);
                  return (
                    <li key={item.id} className="order-item">
                      <Link to={`/product/${item.product_id}`} className="order-item-image">
                        {imageSrc ? (
                          <img src={imageSrc} alt={item.product_name} />
                        ) : (
                          <span className="order-item-no-img">No image</span>
                        )}
                      </Link>
                      <div className="order-item-body">
                        <Link to={`/product/${item.product_id}`} className="order-item-name">
                          {item.product_name}
                        </Link>
                        <p className="order-item-meta">
                          Qty {item.quantity} · ${item.unit_price.toFixed(2)} each
                        </p>
                      </div>
                      <p className="order-item-line">${item.line_total.toFixed(2)}</p>
                    </li>
                  );
                })}
              </ul>

              <footer className="order-card-footer">
                <span>{paymentLabel(order.payment_method)}</span>
                <span>Ship to {order.shipping_full_name}</span>
              </footer>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
