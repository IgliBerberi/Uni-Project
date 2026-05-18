import { productImageSrc } from '../../utils/imageUrl';
import './InventoryTable.css';

export default function InventoryTable({
  products,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  if (products.length === 0) {
    return (
      <div className="inventory-empty">
        <p>No products in inventory yet.</p>
        <p className="inventory-empty-hint">Use <strong>Add product</strong> to create your first listing.</p>
      </div>
    );
  }

  return (
    <div className="inventory-table-wrap">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const price = Number(product.price).toFixed(2);
            const outOfStock = Number(product.stock) === 0;
            const lowStock = !outOfStock && Number(product.stock) <= 5;
            const isActive = Boolean(Number(product.is_active));
            const imageSrc = productImageSrc(product.image_url);

            return (
              <tr key={product.id} className={!isActive ? 'row-hidden' : ''}>
                <td>
                  <div className="inv-product-cell">
                    {imageSrc ? (
                      <img src={imageSrc} alt="" className="inv-thumb" />
                    ) : (
                      <span className="inv-thumb inv-thumb--empty">—</span>
                    )}
                    <div>
                      <span className="inv-name">{product.name}</span>
                      <span className="inv-desc">{product.description || 'No description'}</span>
                    </div>
                  </div>
                </td>
                <td className="inv-price">${price}</td>
                <td>
                  <span
                    className={`inv-stock ${outOfStock ? 'inv-stock--out' : ''} ${lowStock ? 'inv-stock--low' : ''}`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td>
                  <span className={`inv-status ${isActive ? 'inv-status--live' : 'inv-status--hidden'}`}>
                    {isActive ? 'Live' : 'Hidden'}
                  </span>
                </td>
                <td>
                  <div className="inv-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(product)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onToggleActive(product)}
                    >
                      {isActive ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
