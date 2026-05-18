import { useEffect, useRef, useState } from 'react';
import { productImageSrc } from '../utils/imageUrl';
import './ProductForm.css';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  is_active: true,
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_MB = 5;

export default function ProductForm({ initial, onSubmit, onCancel, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        description: initial.description || '',
        price: String(initial.price ?? ''),
        stock: String(initial.stock ?? ''),
        is_active: Boolean(Number(initial.is_active)),
      });
      setPreview(productImageSrc(initial.image_url));
      setImageFile(null);
      setRemoveImage(false);
    } else {
      setForm(emptyForm);
      setPreview(null);
      setImageFile(null);
      setRemoveImage(false);
    }
    setError('');
  }, [initial]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function pickFile(file) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please use JPG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be ${MAX_MB} MB or smaller.`);
      return;
    }
    setError('');
    setImageFile(file);
    setRemoveImage(false);
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(URL.createObjectURL(file));
  }

  function handleFileInput(e) {
    pickFile(e.target.files?.[0]);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  function clearImage() {
    setImageFile(null);
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setRemoveImage(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const fields = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10) || 0,
        is_active: form.is_active ? 1 : 0,
      };
      await onSubmit(fields, imageFile, removeImage);
      if (!initial) {
        setForm(emptyForm);
        clearImage();
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="product-form-grid">
        <div className="product-form-media">
          <p className="field-label">Product image</p>
          <div
            className={`image-dropzone ${dragOver ? 'drag-over' : ''} ${preview ? 'has-image' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Attach product image"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="image-input-hidden"
              onChange={handleFileInput}
            />
            {preview ? (
              <img src={preview} alt="" className="image-preview" />
            ) : (
              <div className="image-dropzone-empty">
                <span className="upload-icon" aria-hidden>
                  ↑
                </span>
                <span className="upload-title">Attach an image</span>
                <span className="upload-hint">Drag & drop or click to browse</span>
                <span className="upload-meta">JPG, PNG, WebP, GIF · max {MAX_MB} MB</span>
              </div>
            )}
          </div>
          {preview && (
            <div className="image-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Replace
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="product-form-fields">
          {error && <p className="form-error">{error}</p>}

          <label>
            Product name *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Wireless Headphones"
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe your product for customers…"
            />
          </label>

          <div className="form-row">
            <label>
              Price ($) *
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </label>
            <label>
              Stock *
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
                required
              />
            </label>
          </div>

          <label className="toggle-card">
            <input
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange}
            />
            <span>
              <strong>Visible on storefront</strong>
              <small>Uncheck to hide while keeping in inventory</small>
            </span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add to inventory'}
        </button>
        {initial && onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
