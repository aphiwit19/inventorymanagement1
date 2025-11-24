import { api } from './api';

// Map API address -> frontend shape (กลับคืนเหมือนเดิม)
function mapAddress(a) {
  if (!a) return null;
  return {
    id: a.id,
    recipientName: a.recipientName,
    phoneNumber: a.phoneNumber,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2 || '',
    subDistrict: a.subDistrict,
    district: a.district,
    province: a.province,
    postalCode: a.postalCode,
    isDefault: !!a.isDefault,
    createdAt: a.createdAt || null,
    updatedAt: a.updatedAt || null,
    raw: a,
  };
}

export async function fetchAddresses() {
  const res = await api.get('/api/addresses');
  // Backend shape: { success, data: { addresses: [...] } }
  const root = res?.data || res;
  const container = root?.data || root;
  const list = Array.isArray(container?.addresses)
    ? container.addresses
    : Array.isArray(container)
    ? container
    : [];
  return list.map(mapAddress);
}

export async function fetchDefaultAddress() {
  const res = await api.get('/api/addresses/default');
  // Backend shape: { success, data: { address: { ... } } }
  const root = res?.data || res;
  const container = root?.data || root;
  const a = container?.address || container;
  return mapAddress(a);
}

export async function createAddress(data) {
  const body = {
    recipientName: data.recipientName,
    phoneNumber: data.phoneNumber,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2 || undefined,
    subDistrict: data.subDistrict,
    district: data.district,
    province: data.province,
    postalCode: data.postalCode,
  };
  const res = await api.post('/api/addresses', body);
  const payload = res?.data || res;
  const a = payload?.data || payload;
  return mapAddress(a);
}

export async function updateAddressById(id, data) {
  const body = {
    recipientName: data.recipientName,
    phoneNumber: data.phoneNumber,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2 || undefined,
    subDistrict: data.subDistrict,
    district: data.district,
    province: data.province,
    postalCode: data.postalCode,
  };
  const res = await api.put(`/api/addresses/${id}`, body);
  const payload = res?.data || res;
  const a = payload?.data || payload;
  return mapAddress(a);
}

export async function deleteAddressById(id) {
  await api.del(`/api/addresses/${id}`);
  return true;
}

export async function setDefaultAddress(id) {
  const res = await api.patch(`/api/addresses/${id}/set-default`, {});
  const payload = res?.data || res;
  const a = payload?.data || payload;
  return mapAddress(a);
}
