import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  patchProduct,
  updateProduct,
} from '../api/products';
import DashboardNav from '../components/dashboard/DashboardNav';
import InventoryTable from '../components/dashboard/InventoryTable';
import OrdersPanel from '../components/dashboard/OrdersPanel';
import StatCard from '../components/dashboard/StatCard';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { business } = useAuth();
  const [tab, setTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const loadProducts = useCallback(async () => {
    setError('');
    try {
      const data = await fetchProducts(false);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const stats = useMemo(() => {
    const total = products.length;
    const live = products.filter((p) => Number(p.is_active)).length;
    const lowStock = products.filter(
      (p) => Number(p.stock) > 0 && Number(p.stock) <= 5,
    ).length;
    const outOfStock = products.filter((p) => Number(p.stock) === 0).length;
    return { total, live, lowStock, outOfStock };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [products, search]);

  const recentProducts = useMemo(
    () => [...products].slice(0, 5),
    [products],
  );

  function showSuccess(message) {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 4000);
  }

  async function handleCreate(fields, imageFile) {
    const created = await createProduct(fields, imageFile);
    await loadProducts();
    showSuccess(`"${created.name}" added to inventory.`);
    setTab('inventory');
  }

  async function handleUpdate(fields, imageFile, removeImage) {
    await updateProduct(editing.id, fields, imageFile, removeImage);
    setEditing(null);
    await loadProducts();
    showSuccess('Product updated.');
    setTab('inventory');
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product permanently?')) return;
    await deleteProduct(id);
    if (editing?.id === id) setEditing(null);
    await loadProducts();
    showSuccess('Product removed.');
  }

  async function handleToggleActive(product) {
    await patchProduct(product.id, { is_active: product.is_active ? 0 : 1 });
    await loadProducts();
  }

  function handleEdit(product) {
    setEditing(product);
    setTab('add');
  }

  function handleAddSuccess() {
    if (!editing) return;
    setEditing(null);
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-top">
        <div>
          <p className="dashboard-eyebrow">Business portal</p>
          <h1>{business?.business_name || 'Dashboard'}</h1>
          <p className="dashboard-sub">
            Manage inventory, add products, and track your storefront.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setTab('add');
          }}
        >
          + New product
        </button>
      </header>

      {success && <p className="dashboard-toast">{success}</p>}
      {error && <p className="dashboard-alert">{error}</p>}

      <div className="dashboard-shell">
        <DashboardNav active={tab} onChange={setTab} />

        <div className="dashboard-main">
          {loading && tab !== 'add' && (
            <p className="status">Loading dashboard…</p>
          )}

          {tab === 'overview' && !loading && (
            <section className="dashboard-section">
              <div className="stats-grid">
                <StatCard label="Total products" value={stats.total} />
                <StatCard
                  label="Live on store"
                  value={stats.live}
                  variant="success"
                  hint="Visible to customers"
                />
                <StatCard
                  label="Low stock"
                  value={stats.lowStock}
                  variant="warn"
                  hint="5 or fewer units"
                />
                <StatCard
                  label="Out of stock"
                  value={stats.outOfStock}
                  variant={stats.outOfStock > 0 ? 'warn' : 'default'}
                />
              </div>

              <div className="overview-panels">
                <div className="panel-card">
                  <div className="panel-card-header">
                    <h2>Recent products</h2>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setTab('inventory')}
                    >
                      View all
                    </button>
                  </div>
                  {recentProducts.length === 0 ? (
                    <p className="panel-empty">No products yet. Add your first one.</p>
                  ) : (
                    <ul className="recent-list">
                      {recentProducts.map((p) => (
                        <li key={p.id}>
                          <span className="recent-name">{p.name}</span>
                          <span className="recent-meta">
                            ${Number(p.price).toFixed(2)} · {p.stock} in stock
                            {!Number(p.is_active) && ' · Hidden'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="panel-card panel-card--actions">
                  <h2>Quick actions</h2>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      setEditing(null);
                      setTab('add');
                    }}
                  >
                    Add product
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={() => setTab('inventory')}
                  >
                    Manage inventory
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={() => setTab('orders')}
                  >
                    View orders
                  </button>
                </div>
              </div>
            </section>
          )}

          {tab === 'inventory' && !loading && (
            <section className="dashboard-section">
              <div className="section-toolbar">
                <h2>Inventory</h2>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search products…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <InventoryTable
                products={filteredProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            </section>
          )}

          {tab === 'add' && (
            <section className="dashboard-section dashboard-section--form">
              <div className="form-panel-header">
                <h2>{editing ? 'Edit product' : 'Add product'}</h2>
                {editing && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditing(null);
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
              <ProductForm
                key={editing ? `edit-${editing.id}` : 'new'}
                initial={editing}
                onSubmit={editing ? handleUpdate : handleCreate}
                onCancel={editing ? () => setEditing(null) : undefined}
                onSuccess={handleAddSuccess}
              />
            </section>
          )}

          {tab === 'orders' && <OrdersPanel />}
        </div>
      </div>
    </div>
  );
}
