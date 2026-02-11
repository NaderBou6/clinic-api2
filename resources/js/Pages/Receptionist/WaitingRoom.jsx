import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { fetchPublicQueueSummary } from "../../api/queue";

const roleLabels = {
  admin: { en: "Admin", ar: "مدير النظام" },
  doctor: { en: "Doctor", ar: "طبيب" },
  "doctor-manager": { en: "Doctor Manager", ar: "مسؤول الأطباء" },
  receptionist: { en: "Receptionist", ar: "الاستقبال" },
  "receptionist-nurse": { en: "Reception + Nurse", ar: "الاستقبال + تمريض" },
  nurse: { en: "Nurse", ar: "ممرض" },
};

function getClinicName() {
  return localStorage.getItem("clinic_name") || "Clinic";
}

export default function WaitingRoom() {
  const [isArabic, setIsArabic] = useState(true);
  const [nowText, setNowText] = useState("");
  const [queueSummary, setQueueSummary] = useState({ waiting_count: 0, date: "" });
  const [queueLastUpdated, setQueueLastUpdated] = useState("");
  const timerRef = useRef(null);
  const fetchRef = useRef(null);


  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const ar = d.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const en = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setNowText(isArabic ? ar : en);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [isArabic]);

  useEffect(() => {
    const langTimer = setInterval(() => setIsArabic((s) => !s), 8000);
    return () => clearInterval(langTimer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchPublicQueueSummary({ signal: fetchRef.current?.signal });
        if (res?.last_updated && res.last_updated === queueLastUpdated) return;
        setQueueLastUpdated(res?.last_updated || "");
        setQueueSummary({
          waiting_count: res?.waiting_count ?? 0,
          current_number: res?.current_number ?? 0,
          date: res?.date || "",
        });
      } catch {
        setQueueSummary((prev) => ({ ...prev }));
      }
    };
    const controller = new AbortController();
    fetchRef.current = controller;
    load();
    const id = setInterval(load, 8000);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, []);

  const title = useMemo(
    () => (isArabic ? "قاعة الانتظار" : "Waiting Room"),
    [isArabic]
  );
  const subtitle = useMemo(
    () => (isArabic ? "الدور الحالي" : "Current number"),
    [isArabic]
  );
  const waitingLabel = useMemo(
    () => (isArabic ? "عدد المنتظرين" : "Total waiting"),
    [isArabic]
  );
  const dateLabel = useMemo(
    () => (isArabic ? "التاريخ" : "Date"),
    [isArabic]
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 15% 20%, rgba(37,99,235,0.15) 0%, transparent 45%)," +
          "radial-gradient(circle at 85% 15%, rgba(14,165,233,0.18) 0%, transparent 45%)," +
          "linear-gradient(160deg, #f7fbff 0%, #eef3fb 60%, #e7eef9 100%)",
        color: "#0f172a",
        fontFamily: '"Cairo", "Montserrat", sans-serif',
        px: { xs: 3, md: 8 },
        py: { xs: 4, md: 6 },
      }}
    >
      <Stack spacing={4} alignItems="center">
        <Stack spacing={1} alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 3,
                background: "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)",
                boxShadow: "0 12px 24px rgba(37, 99, 235, 0.28)",
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              {getClinicName()}
            </Typography>
          </Stack>
          <Typography variant="h5" sx={{ opacity: 0.9, fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, fontWeight: 600 }}>
            {dateLabel}: {queueSummary.date || "—"} · {nowText}
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ width: "100%", maxWidth: 1100 }}
        >
          <Box
            sx={{
              flex: 1,
              p: 4,
              borderRadius: 4,
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(148,163,184,0.25)",
              boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Typography variant="subtitle1" sx={{ opacity: 0.7 }}>
              {subtitle}
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 800, mt: 1, lineHeight: 1 }}>
              {queueSummary.current_number || 0}
            </Typography>
            <Box
              sx={{
                position: "absolute",
                right: -30,
                top: -30,
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "rgba(37,99,235,0.12)",
              }}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              p: 4,
              borderRadius: 4,
              background: "linear-gradient(140deg, #2563eb 0%, #38bdf8 100%)",
              color: "#fff",
              boxShadow: "0 24px 60px rgba(37, 99, 235, 0.35)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              {waitingLabel}
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 800, mt: 1, lineHeight: 1 }}>
              {queueSummary.waiting_count}
            </Typography>
            <Box
              sx={{
                position: "absolute",
                left: -40,
                bottom: -40,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
              }}
            />
          </Box>
        </Stack>

        <Typography variant="body1" sx={{ opacity: 0.8, fontWeight: 600 }}>
          {isArabic ? "يرجى الانتظار وسيتم النداء حسب الدور" : "Please wait. You will be called by number."}
        </Typography>
      </Stack>
    </Box>
  );
}
