import { useState } from "react";
import { api } from "../../api/axios";
import { Card, CardContent, Typography, TextField, Button, Stack } from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState("admin@clinic.com");
  const [password, setPassword] = useState("secret123");
  const [error, setError] = useState("");

  const redirectByRole = (role) => {
    if (role === "admin") window.location.href = "/admin";
    else if (role === "doctor" || role === "doctor-manager") window.location.href = "/doctor";
    else if (role === "receptionist" || role === "receptionist-nurse") window.location.href = "/receptionist";
    else if (role === "nurse") window.location.href = "/nurse";
    else window.location.href = "/login";
  };

  const handleLogin = async () => {
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      // expected: { token, user: { role, ... } }
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("user_name", res.data.user.name || "");
      localStorage.setItem("user_id", String(res.data.user.id || ""));

      redirectByRole(res.data.user.role);
    } catch (e) {
      setError(e?.response?.data?.message || "Login failed");
    }
  };

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "100vh", p: 2 }}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Clinic Login</Typography>

          <TextField
            fullWidth label="Email" margin="normal"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth label="Password" type="password" margin="normal"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />

          {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}

          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleLogin}>
            Sign in
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
