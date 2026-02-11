import { useMemo, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Divider,
} from "@mui/material";
import { submitRemoteRegistration } from "../../api/publicRegistration";

const inputSx = {
  "& .MuiOutlinedInput-root": { borderRadius: 2.5, background: "#fff" },
};

export default function RemoteRegistration() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    medical_history_summary: "",
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(() => {
    return form.first_name.trim() && form.last_name.trim() && form.phone.trim();
  }, [form]);

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);
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
      const res = await submitRemoteRegistration(payload);
      setResult(res);
      if (res.already_in_queue) {
        setNotice("You are already registered in today's queue.");
      } else if (res.already_registered) {
        setNotice("Welcome back. You are added to today's queue.");
      } else {
        setNotice("Registration completed. You are added to today's queue.");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to submit registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 10% 10%, #e0f2fe 0%, #f8fafc 55%, #eef2ff 100%)",
        "--ink": "#0f172a",
        "--muted": "#64748b",
      }}
    >
      <Container sx={{ py: 6 }}>
        <Stack spacing={3} alignItems="center">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--ink)" }}>
              Remote Patient Registration
            </Typography>
            <Typography variant="body1" sx={{ color: "var(--muted)", mt: 1 }}>
              Register yourself remotely and join the clinic queue without visiting the reception desk.
            </Typography>
          </Box>

          <Paper
            sx={{
              width: "100%",
              maxWidth: 820,
              p: 3,
              borderRadius: 4,
              background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 18px 34px rgba(15,23,42,0.12)",
            }}
          >
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="First name"
                  value={form.first_name}
                  onChange={setField("first_name")}
                  fullWidth
                  required
                  sx={inputSx}
                />
                <TextField
                  label="Last name"
                  value={form.last_name}
                  onChange={setField("last_name")}
                  fullWidth
                  required
                  sx={inputSx}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Phone"
                  value={form.phone}
                  onChange={setField("phone")}
                  fullWidth
                  required
                  sx={inputSx}
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  value={form.dob}
                  onChange={setField("dob")}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={inputSx}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Gender</InputLabel>
                  <Select label="Gender" value={form.gender} onChange={setField("gender")}>
                    <MenuItem value="">Prefer not to say</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Address"
                  value={form.address}
                  onChange={setField("address")}
                  fullWidth
                  sx={inputSx}
                />
              </Stack>
              <TextField
                label="Medical history summary (optional)"
                value={form.medical_history_summary}
                onChange={setField("medical_history_summary")}
                fullWidth
                multiline
                minRows={3}
                sx={inputSx}
              />

              <Divider />

              {error && <Alert severity="error">{error}</Alert>}
              {notice && <Alert severity="success">{notice}</Alert>}

              {result?.queue_entry && (
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)",
                    border: "1px solid rgba(37,99,235,0.2)",
                  }}
                >
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "#1e3a8a" }}>
                        Queue number
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: "#1e40af" }}>
                        {result.queue_entry.number}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "#1e3a8a" }}>Patient code</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {result.patient?.patient_code || "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "#1e3a8a" }}>Status</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {result.queue_entry.status}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              )}

              <Button
                variant="contained"
                disabled={!canSubmit || loading}
                onClick={submit}
                sx={{
                  textTransform: "none",
                  borderRadius: 3,
                  py: 1.2,
                  fontWeight: 700,
                  fontSize: "1rem",
                  boxShadow: "0 14px 24px rgba(37,99,235,0.25)",
                  background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                  "&:hover": { background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" },
                }}
              >
                {loading ? "Submitting..." : "Register and join queue"}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
