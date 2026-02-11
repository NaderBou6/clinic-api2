import { api } from "./axios";

/**
 * Server-side patients list with filters + pagination
 */
export async function fetchPatients({
  search = "",

  first_name = "",
  last_name = "",
  gender = "",
  place_of_birth = "",
  address = "",

  // DOB
  dob_exact = "",
  dob_from = "",
  dob_to = "",

  // AGE
  age_exact = "",
  age_min = "",
  age_max = "",

  // Created
  created_from = "",
  created_to = "",

  sort_by = "",
  sort_dir = "",

  page = 1,
  per_page = 10,

  signal,
} = {}) {
  const res = await api.get("/patients", {
    params: {
      search: search || undefined,

      first_name: first_name || undefined,
      last_name: last_name || undefined,
      gender: gender || undefined,
      place_of_birth: place_of_birth || undefined,
      address: address || undefined,

      dob_exact: dob_exact || undefined,
      dob_from: dob_from || undefined,
      dob_to: dob_to || undefined,

      age_exact: age_exact !== "" ? age_exact : undefined,
      age_min: age_min !== "" ? age_min : undefined,
      age_max: age_max !== "" ? age_max : undefined,

      created_from: created_from || undefined,
      created_to: created_to || undefined,

      sort_by: sort_by || undefined,
      sort_dir: sort_dir || undefined,

      page,
      per_page,
    },
    signal,
  });

  return res.data;
}

/**
 * Create patient
 */
export async function createPatient(payload) {
  const res = await api.post("/patients", payload);
  return res.data;
}

/**
 * Update patient
 */
export async function updatePatient(id, payload) {
  const res = await api.put(`/patients/${id}`, payload);
  return res.data;
}

/**
 * Delete patient
 */
export async function deletePatient(id) {
  const res = await api.delete(`/patients/${id}`);
  return res.data;
}
