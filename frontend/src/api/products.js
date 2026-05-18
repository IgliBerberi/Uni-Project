import { apiFormRequest, apiRequest } from './client';

export function fetchProducts(activeOnly = true) {
  const query = activeOnly ? '' : '?all=1';
  return apiRequest(`/products.php${query}`);
}

export function fetchProduct(id) {
  return apiRequest(`/products.php?id=${id}`);
}

function buildProductFormData(fields, imageFile, { isUpdate = false, removeImage = false } = {}) {
  const formData = new FormData();
  formData.append('name', fields.name);
  formData.append('description', fields.description ?? '');
  formData.append('price', String(fields.price));
  formData.append('stock', String(fields.stock));
  formData.append('is_active', String(fields.is_active ? 1 : 0));

  if (imageFile) {
    formData.append('image', imageFile);
  }
  if (removeImage) {
    formData.append('remove_image', '1');
  }
  if (isUpdate) {
    formData.append('_method', 'PUT');
  }
  return formData;
}

export function createProduct(fields, imageFile) {
  const body = buildProductFormData(fields, imageFile);
  return apiFormRequest('/products.php', { method: 'POST', body });
}

export function updateProduct(id, fields, imageFile, removeImage = false) {
  const body = buildProductFormData(fields, imageFile, { isUpdate: true, removeImage });
  return apiFormRequest(`/products.php?id=${id}`, { method: 'POST', body });
}

/** JSON-only partial update (e.g. toggle visibility) */
export function patchProduct(id, fields) {
  return apiRequest(`/products.php?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export function deleteProduct(id) {
  return apiRequest(`/products.php?id=${id}`, { method: 'DELETE' });
}
