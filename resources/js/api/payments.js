import { api } from "./axios";

export async function fetchUnpaidConsultations(patientId, { signal } = {}) {
  const res = await api.get(`/patients/${patientId}/unpaid-consultations`, { signal });
  return res.data;
}

export async function createConsultationPayment(consultationId, payload) {
  const res = await api.post(`/consultations/${consultationId}/payments`, payload);
  return res.data;
}

export async function fetchPaymentSummary(consultationId) {
  const res = await api.get(`/consultations/${consultationId}/payment-summary`);
  return res.data;
}
