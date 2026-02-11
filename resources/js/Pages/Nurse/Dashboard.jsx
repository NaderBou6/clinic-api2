import { useEffect, useRef, useState } from "react";
import {
  Container,
  Typography,
  Stack,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Pagination,
  TextField,
} from "@mui/material";

import { fetchNurseInstructions, completeInstruction } from "../../api/nurse";

export default function NurseDashboard() {
  // guard
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [treatmentDate, setTreatmentDate] = useState("");

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);

  // 🔍 search states
  const [search, setSearch] = useState("");        // input value
  const [debounced, setDebounced] = useState("");  // value after debounce

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const silentRef = useRef(false);
  const [lastUpdated, setLastUpdated] = useState("");

  // role guard
  useEffect(() => {
    if (!token) window.location.href = "/login";
    if (!["nurse", "receptionist-nurse", "admin"].includes(role)) window.location.href = "/login";
  }, [token, role]);

  // debounce 500ms + minimum length = 2
  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim().length >= 2 || search.trim().length === 0) {
        setPage(1);
        setDebounced(search.trim());
      }
    }, 500);

    return () => clearTimeout(t);
  }, [search]);

  // 📡 load data (server-side search)
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setError("");
      const silent = silentRef.current;
      silentRef.current = false;
      if (!silent) setLoading(true);

      try {
        const data = await fetchNurseInstructions({
          status,
          page,
          patient_code: debounced,
          treatment_date: treatmentDate,
          signal: controller.signal,
        });

        if (data?.last_updated && data.last_updated === lastUpdated) {
          return;
        }
        setLastUpdated(data?.last_updated || "");
        setRows(data.data || []);
        setMeta(data.meta || null);
      } catch (e) {
        if (e.code !== "ERR_CANCELED") {
          setError(e?.response?.data?.message || "Failed to load instructions");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [status, page, debounced, treatmentDate, refreshTick]);

  useEffect(() => {
    const id = setInterval(() => {
      silentRef.current = true;
      setRefreshTick((t) => t + 1);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const handleComplete = async (id) => {
    setError("");
    setActionLoadingId(id);
    try {
      await completeInstruction(id);
      // reload after completion
      setPage(1);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to complete instruction");
    } finally {
      setActionLoadingId(null);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Nurse Dashboard</Typography>
        <Button variant="outlined" onClick={logout}>Logout</Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Search by patient code"
            placeholder="Min 2 characters"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
          />

          <TextField
            size="small"
            type="date"
            label="Treatment date"
            value={treatmentDate}
            onChange={(e) => {
              setPage(1);
              setTreatmentDate(e.target.value);
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            Refresh
          </Button>

          {meta && (
            <Typography variant="body2" sx={{ ml: "auto" }}>
              Total: {meta.total} | Page: {meta.current_page}/{meta.last_page}
            </Typography>
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ overflowX: "auto" }}>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Instruction</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography sx={{ py: 2 }} align="center">
                      No instructions
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell>{x.id}</TableCell>

                    <TableCell>
                      <Typography variant="subtitle2">
                        {x.patient?.first_name} {x.patient?.last_name}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        {x.patient?.patient_code}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ maxWidth: 520 }}>
                      <Typography variant="body2">{x.instruction}</Typography>
                    </TableCell>

                    <TableCell>
                      {x.status === "completed" ? (
                        <Chip label="completed" color="success" size="small" />
                      ) : (
                        <Chip label="pending" color="warning" size="small" />
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {x.status === "completed" ? (
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          Done
                        </Typography>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleComplete(x.id)}
                          disabled={actionLoadingId === x.id}
                        >
                          {actionLoadingId === x.id ? "..." : "Complete"}
                        </Button>
                      )}
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
            onChange={(_, p) => setPage(p)}
          />
        </Stack>
      )}
    </Container>
  );
}
