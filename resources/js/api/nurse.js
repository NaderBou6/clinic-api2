import { api } from "./axios";

export async function fetchNurseInstructions({ status = "pending", page = 1, patient_code = "", treatment_date = "", signal } = {}) {
  const res = await api.get(`/nurse/instructions`, {
    params: {
      status,
      page,
      patient_code: patient_code || undefined,
      treatment_date: treatment_date || undefined,
    },
    signal, // ✅ for abort
  });
  return res.data;
}

export async function completeInstruction(id) {
  const res = await api.patch(`/nurse/instructions/${id}/complete`);
  return res.data;
}
