import { useEffect, useMemo, useState } from "react";
import {
  Container, Typography, Stack, Button, Paper,
  Drawer, TextField, Divider,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Alert, Pagination,
  FormControl, InputLabel, Select, MenuItem,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { fetchPatients, createPatient, updatePatient, deletePatient } from "../../api/patients";

function formatDateOnly(value) {
  if (!value) return "-";
  if (typeof value === "string" && value.includes("T")) return value.split("T")[0];
  if (typeof value === "string" && value.length >= 10) return value.slice(0, 10);
  return "-";
}

function normalizeMeta(res, fallbackPage = 1, perPage = 10) {
  if (res?.meta?.current_page) return res.meta;
  if (res?.current_page) {
    return {
      current_page: res.current_page,
      last_page: res.last_page,
      total: res.total,
      per_page: res.per_page,
    };
  }
  return { current_page: fallbackPage, last_page: 1, total: (res?.data || []).length, per_page: perPage };
}

export default function ReceptionistPatients() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Drawer
  const [open, setOpen] = useState(false);

  // Draft filters (basic)
  const [draft, setDraft] = useState({
    search: "",
    first_name: "",
    last_name: "",
    gender: "",
    created_from: "",
    created_to: "",
  });
  const [filters, setFilters] = useState({ ...draft });

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Data
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: perPage });

  // UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // View (placeholder)
  const onView = (id) => alert(`View patient #${id} (نجهز صفحة التفاصيل لاحقًا)`);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create/Edit Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create|edit
  const [formId, setFormId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    medical_history_summary: "",
  });

  useEffect(() => {
    if (!token) window.location.href = "/login";
    if (role !== "receptionist" && role !== "admin") window.location.href = "/login";
  }, [token, role]);

  const load = async (controller) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetchPatients({
        ...filters,
        page,
        per_page: perPage,
        signal: controller.signal,
      });

      setRows(res?.data || []);
      setMeta(normalizeMeta(res, page, perPage));
    } catch (e) {
      if (e.code !== "ERR_CANCELED") {
        setError(e?.response?.data?.message || "Failed to load patients");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const applyFilters = () => {
    setPage(1);
    setFilters({
      ...draft,
      search: draft.search.trim(),
      first_name: draft.first_name.trim(),
      last_name: draft.last_name.trim(),
    });
    setOpen(false);
  };

  const resetFilters = () => {
    const empty = { search: "", first_name: "", last_name: "", gender: "", created_from: "", created_to: "" };
    setDraft(empty);
    setFilters(empty);
    setPage(1);
  };

  const hasFilters = useMemo(() => Object.values(filters).some((v) => String(v || "").trim() !== ""), [filters]);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // -------------------------
  // CRUD: Create/Edit Dialog
  // -------------------------
  const openCreate = () => {
    setFormMode("create");
    setFormId(null);
    setFormErrors({});
    setForm({
      first_name: "",
      last_name: "",
      phone: "",
      dob: "",
      gender: "",
      address: "",
      medical_history_summary: "",
    });
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setFormMode("edit");
    setFormId(p.id);
    setFormErrors({});
    setForm({
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      phone: p.phone || "",
      dob: formatDateOnly(p.dob) === "-" ? "" : formatDateOnly(p.dob),
      gender: p.gender || "",
      address: p.address || "",
      medical_history_summary: p.medical_history_summary || "",
    });
    setFormOpen(true);
  };

  const setField = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submitForm = async () => {
    setFormLoading(true);
    setFormErrors({});
    setError("");

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        dob: form.dob || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
        medical_history_summary: form.medical_history_summary.trim() || null,
      };

      if (formMode === "create") {
        await createPatient(payload);
      } else {
        await updatePatient(formId, payload);
      }

      setFormOpen(false);

      // reload (stay in same page)
      const controller = new AbortController();
      await load(controller);
    } catch (e) {
      const ve = e?.response?.data?.errors;
      if (ve) setFormErrors(ve);
      else setError(e?.response?.data?.message || "Failed to save patient");
    } finally {
      setFormLoading(false);
    }
  };

  // -------------------------
  // CRUD: Delete
  // -------------------------
  const doDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setError("");

    try {
      await deletePatient(deleteId);
      setDeleteId(null);

      // if last row in page and page > 1, go back one page
      const nextPage = page > 1 && rows.length === 1 ? page - 1 : page;
      setPage(nextPage);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete patient");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" color="primary">Patients</Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New Patient
          </Button>
          <Button variant="outlined" onClick={() => setOpen(true)}>Filters</Button>
          <Button variant="outlined" onClick={logout}>Logout</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ overflowX: "auto" }}>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "rgba(47,128,237,0.06)" }}>
                <TableCell>ID</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>First name</TableCell>
                <TableCell>Last name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>DOB</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Created at</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography sx={{ py: 2 }} align="center">No patients found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.patient_code}</TableCell>
                    <TableCell>{p.first_name}</TableCell>
                    <TableCell>{p.last_name}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell>{formatDateOnly(p.dob)}</TableCell>
                    <TableCell>{p.gender || "-"}</TableCell>
                    <TableCell>{formatDateOnly(p.created_at)}</TableCell>

                    <TableCell align="right">
                      <IconButton size="small" onClick={() => onView(p.id)} title="View">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => openEdit(p)} title="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteId(p.id)} title="Delete">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      {meta?.last_page > 1 && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination
            count={meta.last_page}
            page={meta.current_page}
            color="primary"
            onChange={(_, newPage) => setPage(newPage)}
          />
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
            Page {meta.current_page}/{meta.last_page} — Total: {meta.total}
          </Typography>
        </Stack>
      )}

      {/* Drawer Filters */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Stack sx={{ width: 380, p: 2 }} spacing={2}>
          <Typography variant="h6">Filters</Typography>
          <Divider />

          <TextField label="Search (code/phone/name)" value={draft.search} onChange={(e)=>setDraft(s=>({...s, search:e.target.value}))} size="small" fullWidth />
          <TextField label="First name" value={draft.first_name} onChange={(e)=>setDraft(s=>({...s, first_name:e.target.value}))} size="small" fullWidth />
          <TextField label="Last name" value={draft.last_name} onChange={(e)=>setDraft(s=>({...s, last_name:e.target.value}))} size="small" fullWidth />

          <FormControl size="small" fullWidth>
            <InputLabel>Gender</InputLabel>
            <Select label="Gender" value={draft.gender} onChange={(e)=>setDraft(s=>({...s, gender:e.target.value}))}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle2">Created at</Typography>
          <Stack direction="row" spacing={1}>
            <TextField label="From" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
              value={draft.created_from} onChange={(e)=>setDraft(s=>({...s, created_from:e.target.value}))}
            />
            <TextField label="To" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
              value={draft.created_to} onChange={(e)=>setDraft(s=>({...s, created_to:e.target.value}))}
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" fullWidth onClick={applyFilters}>Apply</Button>
            <Button variant="outlined" fullWidth onClick={resetFilters}>Reset</Button>
          </Stack>

          {hasFilters && <Alert severity="info">Filters applied.</Alert>}
        </Stack>
      </Drawer>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formMode === "create" ? "Create patient" : `Edit patient #${formId}`}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="First name"
              value={form.first_name}
              onChange={setField("first_name")}
              error={!!formErrors.first_name}
              helperText={formErrors.first_name?.[0]}
              fullWidth
            />
            <TextField
              label="Last name"
              value={form.last_name}
              onChange={setField("last_name")}
              error={!!formErrors.last_name}
              helperText={formErrors.last_name?.[0]}
              fullWidth
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={setField("phone")}
              error={!!formErrors.phone}
              helperText={formErrors.phone?.[0]}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="DOB"
                type="date"
                value={form.dob}
                onChange={setField("dob")}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select label="Gender" value={form.gender} onChange={setField("gender")}>
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Typography variant="subtitle2">DOB (Date of birth)</Typography>
<Stack direction="row" spacing={1}>
  <TextField
    label="DOB exact"
    type="date"
    size="small"
    fullWidth
    InputLabelProps={{ shrink: true }}
    value={draft.dob_exact}
    onChange={(e) => setDraft((s) => ({ ...s, dob_exact: e.target.value }))}
  />
</Stack>

<Stack direction="row" spacing={1}>
  <TextField
    label="DOB from"
    type="date"
    size="small"
    fullWidth
    InputLabelProps={{ shrink: true }}
    value={draft.dob_from}
    onChange={(e) => setDraft((s) => ({ ...s, dob_from: e.target.value }))}
  />
  <TextField
    label="DOB to"
    type="date"
    size="small"
    fullWidth
    InputLabelProps={{ shrink: true }}
    value={draft.dob_to}
    onChange={(e) => setDraft((s) => ({ ...s, dob_to: e.target.value }))}
  />
</Stack>

<Typography variant="subtitle2">Age</Typography>
<Stack direction="row" spacing={1}>
  <TextField
    label="Age exact"
    type="number"
    size="small"
    fullWidth
    value={draft.age_exact}
    onChange={(e) => setDraft((s) => ({ ...s, age_exact: e.target.value }))}
  />
</Stack>

<Stack direction="row" spacing={1}>
  <TextField
    label="Age min"
    type="number"
    size="small"
    fullWidth
    value={draft.age_min}
    onChange={(e) => setDraft((s) => ({ ...s, age_min: e.target.value }))}
  />
  <TextField
    label="Age max"
    type="number"
    size="small"
    fullWidth
    value={draft.age_max}
    onChange={(e) => setDraft((s) => ({ ...s, age_max: e.target.value }))}
  />
    </Stack>

            <TextField label="Address" value={form.address} onChange={setField("address")} fullWidth />
            <TextField
              label="Medical history summary"
              value={form.medical_history_summary}
              onChange={setField("medical_history_summary")}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={formLoading}>Cancel</Button>
          <Button variant="contained" onClick={submitForm} disabled={formLoading}>
            {formLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete patient</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete patient #{deleteId}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete} disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
