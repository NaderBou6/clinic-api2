import { useEffect, useMemo, useRef, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  TextField,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Menu,
  Badge,
  Switch,
  Tooltip,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import { createTheme } from "@mui/material/styles";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PaymentsIcon from "@mui/icons-material/Payments";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import NumbersIcon from "@mui/icons-material/Numbers";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LogoutIcon from "@mui/icons-material/Logout";

import { fetchPatients, createPatient, updatePatient, deletePatient } from "../../api/patients";
import { fetchTodayQueue, addToQueue, cancelQueueEntry, prioritizeQueueEntry } from "../../api/queue";
import { fetchUnpaidConsultations, createConsultationPayment } from "../../api/payments";
import { fetchDoctors } from "../../api/doctors";
import { createAppointment } from "../../api/appointments";
import { fetchNurseUsers } from "../../api/users";
import { fetchNurseInstructions } from "../../api/nurse";

function formatDateOnly(value) {
  if (!value) return "-";
  if (typeof value === "string" && value.includes("T")) return value.split("T")[0];
  if (typeof value === "string" && value.length >= 10) return value.slice(0, 10);
  return "-";
}
function computeAge(dob) {
  const d = formatDateOnly(dob);
  if (d === "-") return "-";
  const [y, m, dd] = d.split("-").map(Number);
  const birth = new Date(y, m - 1, dd);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const mm = now.getMonth() - birth.getMonth();
  if (mm < 0 || (mm === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}
function getTodayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function getNowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function formatUiDate(value, locale) {
  if (!value) return "-";
  const d = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale || undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
}
function formatPatientOption(p) {
  if (!p) return "-";
  const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  return `${name || "Unknown"} (${p.patient_code || "-"})`;
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

function statusChipSx(status) {
  if (status === "waiting") return { bgcolor: "rgba(245,158,11,0.15)", color: "#92400e" };
  if (status === "in_consultation") return { bgcolor: "rgba(59,130,246,0.15)", color: "#1e3a8a" };
  if (status === "consulted") return { bgcolor: "rgba(16,185,129,0.15)", color: "#065f46" };
  if (status === "cancelled") return { bgcolor: "rgba(244,63,94,0.15)", color: "#9f1239" };
  return { bgcolor: "rgba(148,163,184,0.2)", color: "#334155" };
}

function paymentChipSx(status) {
  if (status === "paid") return { bgcolor: "rgba(16,185,129,0.15)", color: "#065f46" };
  if (status === "partial") return { bgcolor: "rgba(245,158,11,0.15)", color: "#92400e" };
  if (status === "unpaid") return { bgcolor: "rgba(244,63,94,0.15)", color: "#9f1239" };
  return { bgcolor: "rgba(148,163,184,0.2)", color: "#334155" };
}

const translations = {
  en: {
    title: "Reception Dashboard",
    newPatient: "New Patient",
    addAppointment: "Add appointment",
    patientsList: "Patients list",
    refresh: "Refresh",
    logout: "Logout",
    queueDate: "Queue date",
    todayCurrentNumber: "Today current number",
    totalWaiting: "Total waiting",
    status: "Status",
    reloadQueue: "Reload queue",
    number: "Number",
    patient: "Patient",
    code: "Code",
    price: "Price",
    payment: "Payment",
    action: "Action",
    noQueue: "No queue entries",
    emergency: "Emergency",
    cancel: "Cancel",
    payments: "Payments",
    noPrice: "No price",
    paid: "Paid",
    partial: "Partial",
    unpaid: "Unpaid",
    totalQueue: "Total queue",
    waiting: "Waiting",
    inConsultation: "In consultation",
    consulted: "Consulted",
    cancelled: "Cancelled",
    all: "All",
    nurseDashboard: "Nurse dashboard",
    openNurseDashboard: "Open nurse dashboard",
    loading: "Loading...",
    nurses: "Nurses",
    noNurses: "No nurses available",
    language: "Language",
    darkMode: "Dark mode",
  },
  fr: {
    title: "Reception Dashboard",
    newPatient: "Nouveau patient",
    addAppointment: "Ajouter rendez-vous",
    patientsList: "Liste des patients",
    refresh: "Rafraîchir",
    logout: "Déconnexion",
    queueDate: "Date de la file",
    todayCurrentNumber: "Numéro actuel",
    totalWaiting: "Total en attente",
    status: "Statut",
    reloadQueue: "Recharger la file",
    number: "Numéro",
    patient: "Patient",
    code: "Code",
    price: "Prix",
    payment: "Paiement",
    action: "Action",
    noQueue: "Aucune entrée",
    emergency: "Urgence",
    cancel: "Annuler",
    payments: "Paiements",
    noPrice: "Sans prix",
    paid: "Payé",
    partial: "Partiel",
    unpaid: "Impayé",
    totalQueue: "Total file",
    waiting: "En attente",
    inConsultation: "En consultation",
    consulted: "Consulté",
    cancelled: "Annulé",
    all: "Tous",
    nurseDashboard: "Tableau infirmier",
    openNurseDashboard: "Ouvrir tableau infirmier",
    loading: "Chargement...",
    nurses: "Infirmiers",
    noNurses: "Aucun infirmier",
    language: "Langue",
    darkMode: "Mode sombre",
  },
  ar: {
    title: "لوحة الاستقبال",
    newPatient: "مريض جديد",
    addAppointment: "إضافة موعد",
    patientsList: "قائمة المرضى",
    refresh: "تحديث",
    logout: "تسجيل الخروج",
    queueDate: "تاريخ الدور",
    todayCurrentNumber: "رقم الدور الحالي",
    totalWaiting: "عدد المنتظرين",
    status: "الحالة",
    reloadQueue: "تحديث الدور",
    number: "الرقم",
    patient: "المريض",
    code: "الرمز",
    price: "السعر",
    payment: "الدفع",
    action: "إجراء",
    noQueue: "لا توجد إدخالات",
    emergency: "طارئ",
    cancel: "إلغاء",
    payments: "المدفوعات",
    noPrice: "بدون سعر",
    paid: "مدفوع",
    partial: "جزئي",
    unpaid: "غير مدفوع",
    totalQueue: "إجمالي الدور",
    waiting: "انتظار",
    inConsultation: "قيد الاستشارة",
    consulted: "تمت الاستشارة",
    cancelled: "ملغى",
    all: "الكل",
    nurseDashboard: "لوحة الممرض",
    openNurseDashboard: "فتح لوحة الممرض",
    loading: "جار التحميل...",
    nurses: "الممرضون",
    noNurses: "لا يوجد ممرضون",
    language: "اللغة",
    darkMode: "الوضع الداكن",
  },
};

const primaryActionSx = (mode) => ({
  textTransform: "none",
  borderRadius: 999,
  px: 3,
  py: 1,
  color: "#fff",
  boxShadow: mode === "dark" ? "0 12px 24px rgba(2,6,23,0.45)" : "0 10px 20px rgba(47,128,237,0.28)",
  background:
    mode === "dark"
      ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
      : "linear-gradient(135deg, #2f80ed 0%, #5b9bff 100%)",
  "&:hover": {
    background:
      mode === "dark"
        ? "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)"
        : "linear-gradient(135deg, #2563eb 0%, #4f8bff 100%)",
  },
});

const outlineActionSx = (mode) => ({
  textTransform: "none",
  borderRadius: 999,
  px: 3,
  py: 1,
  borderColor: mode === "dark" ? "rgba(148,163,184,0.4)" : "rgba(47,128,237,0.45)",
  color: mode === "dark" ? "#e2e8f0" : "#2f80ed",
  background: mode === "dark" ? "rgba(15,23,42,0.6)" : "#ffffff",
  "&:hover": {
    borderColor: mode === "dark" ? "rgba(226,232,240,0.7)" : "#2f80ed",
    background: mode === "dark" ? "rgba(148,163,184,0.12)" : "rgba(47,128,237,0.06)",
  },
});

export default function ReceptionistDashboard() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "fr");
  const [mode, setMode] = useState(() => localStorage.getItem("ui_mode") || "light");
  const isDark = mode === "dark";
  const locale = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US";
  const t = translations[lang] || translations.en;
  const statusLabel = (s) => {
    if (s === "waiting") return t.waiting;
    if (s === "in_consultation") return t.inConsultation;
    if (s === "consulted") return t.consulted;
    if (s === "cancelled") return t.cancelled;
    return s;
  };

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("ui_mode", mode);
  }, [mode]);

  const pageTheme = useMemo(
    () =>
      createTheme({
        direction: lang === "ar" ? "rtl" : "ltr",
        palette: {
          mode,
          primary: { main: isDark ? "#6aa7ff" : "#2f80ed" },
          secondary: { main: isDark ? "#22d3ee" : "#56ccf2" },
          background: {
            default: isDark ? "#0b1220" : "#f1f4fa",
            paper: isDark ? "#0f172a" : "#ffffff",
          },
        },
        shape: { borderRadius: 14 },
        typography: {
          fontFamily: "\"Montserrat\", \"Segoe UI\", sans-serif",
        },
      }),
    [mode, isDark, lang]
  );

  const [nowText, setNowText] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const day = d.toLocaleDateString(locale, { weekday: "long" });
      const date = d.toLocaleDateString(locale, { year: "numeric", month: "2-digit", day: "2-digit" });
      const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setNowText(`${day} — ${date} — ${time}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locale]);

  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");
  const [queue, setQueue] = useState({ date: "-", current_number: 0, waiting_count: 0, rows: [] });
  const [queueMeta, setQueueMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  const [queueLastUpdated, setQueueLastUpdated] = useState("");
  const queuePerPage = 10;
  const [queuePage, setQueuePage] = useState(1);
  const [queueStatusFilter, setQueueStatusFilter] = useState("waiting");
  const waitingCount = Number.isFinite(queue.waiting_count) ? queue.waiting_count : (queue.rows || []).filter((r) => r.status === "waiting").length;

  const [showPatients, setShowPatients] = useState(false);
  const patientsSectionRef = useRef(null);

  const perPage = 10;
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    created_from: "",
    created_to: "",
    search: "",
    first_name: "",
    last_name: "",
    phone: "",
    gender: "",
    place_of_birth: "",
    address: "",
    dob_exact: "",
    dob_from: "",
    dob_to: "",
    age_exact: "",
    age_min: "",
    age_max: "",
    sort_by: "id",
    sort_dir: "desc",
  });

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: perPage });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formId, setFormId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [addToQueueOnCreate, setAddToQueueOnCreate] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    medical_history_summary: "",
  });

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [payPatient, setPayPatient] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payRows, setPayRows] = useState([]);

  const [payFormOpen, setPayFormOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    consultation: null,
    amount: "",
    method: "cash",
    reference: "",
    notes: "",
  });
  const [paySubmitLoading, setPaySubmitLoading] = useState(false);

  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentErrors, setAppointmentErrors] = useState({});
  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: "",
    doctor_id: "",
    date: "",
    time: "",
    duration: "15",
    notes: "",
  });
  const [appointmentPatientLocked, setAppointmentPatientLocked] = useState(false);
  const [appointmentPatientSearch, setAppointmentPatientSearch] = useState("");
  const [appointmentPatientDob, setAppointmentPatientDob] = useState("");
  const [appointmentPatientOptions, setAppointmentPatientOptions] = useState([]);
  const [appointmentPatientSelected, setAppointmentPatientSelected] = useState(null);
  const [appointmentPatientLoading, setAppointmentPatientLoading] = useState(false);
  const appointmentPatientAbortRef = useRef(null);
  const appointmentPatientDebounceRef = useRef(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const [nurseUsers, setNurseUsers] = useState([]);
  const [nurseUsersLoading, setNurseUsersLoading] = useState(false);
  const [nurseMenuAnchor, setNurseMenuAnchor] = useState(null);
  const [nursePendingCount, setNursePendingCount] = useState(0);

  useEffect(() => {
    if (!token) window.location.href = "/login";
    if (!["receptionist", "receptionist-nurse", "admin"].includes(role)) window.location.href = "/login";
  }, [token, role]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!queueLoading) loadQueue(queuePage, true);
      if (role === "receptionist-nurse") loadNursePendingCount();
    }, 8000);
    return () => clearInterval(id);
  }, [queueLoading, queuePage, role]);

  const loadNurseUsers = async () => {
    if (role !== "receptionist-nurse") return;
    setNurseUsersLoading(true);
    try {
      const res = await fetchNurseUsers();
      setNurseUsers(res?.data || []);
    } catch {
      setNurseUsers([]);
    } finally {
      setNurseUsersLoading(false);
    }
  };

  const loadNursePendingCount = async () => {
    if (role !== "receptionist-nurse") return;
    try {
      const res = await fetchNurseInstructions({ status: "pending", page: 1 });
      const total = Number.isFinite(res?.total)
        ? res.total
        : Number.isFinite(res?.meta?.total)
        ? res.meta.total
        : 0;
      setNursePendingCount(total);
    } catch {
      setNursePendingCount(0);
    }
  };

  useEffect(() => {
    loadNurseUsers();
    loadNursePendingCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const loadQueue = async (nextPage = queuePage, silent = false) => {
    setQueueError("");
    if (!silent) setQueueLoading(true);
    try {
      const res = await fetchTodayQueue({ status: queueStatusFilter, page: nextPage, per_page: queuePerPage });
      if (res?.last_updated && res.last_updated === queueLastUpdated) {
        return;
      }
      setQueueLastUpdated(res?.last_updated || "");
      setQueue(res);
      setQueueMeta(res?.meta || { current_page: nextPage, last_page: 1, total: (res?.rows || []).length, per_page: queuePerPage });
    } catch (e) {
      setQueueError(e?.response?.data?.message || "Failed to load queue");
    } finally {
      if (!silent) setQueueLoading(false);
    }
  };

  const loadPatients = async (nextPage = page, nextFilters = filters) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError("");
    setLoading(true);
    try {
      const res = await fetchPatients({
        ...nextFilters,
        page: nextPage,
        per_page: perPage,
        signal: controller.signal,
      });
      setRows(res?.data || []);
      setMeta(normalizeMeta(res, nextPage, perPage));
    } catch (e) {
      if (e.code !== "ERR_CANCELED") {
        setError(e?.response?.data?.message || "Failed to load patients");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue(queuePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuePage, queueStatusFilter]);

  const triggerSearch = (newFilters) => {
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(newFilters);
      loadPatients(1, newFilters);
    }, 700);
  };

  const setFilter = (key) => (e) => {
    const val = e.target.value;
    const newFilters = { ...filters, [key]: val };
    const min2Keys = ["search", "first_name", "last_name", "phone"];
    if (min2Keys.includes(key)) {
      if (val.trim() !== "" && val.trim().length < 2) {
        setFilters(newFilters);
        return;
      }
    }
    triggerSearch(newFilters);
  };

  const applySort = (sort_by, sort_dir) => {
    const newFilters = { ...filters, sort_by, sort_dir };
    triggerSearch(newFilters);
  };

  const onPageChange = (_, p) => {
    setPage(p);
    loadPatients(p, filters);
  };

  const openCreate = () => {
    setFormMode("create");
    setFormId(null);
    setFormErrors({});
    setAddToQueueOnCreate(false);
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
        const created = await createPatient(payload);
        if (addToQueueOnCreate) {
          try {
            await addToQueue(created?.data?.id || created?.id);
            await loadQueue();
          } catch (e) {
            setError(e?.response?.data?.message || "Patient saved, but failed to add to queue");
          }
        }
      } else {
        await updatePatient(formId, payload);
      }
      setFormOpen(false);
      await loadPatients(page, filters);
    } catch (e) {
      const ve = e?.response?.data?.errors;
      if (ve) setFormErrors(ve);
      else setError(e?.response?.data?.message || "Failed to save patient");
    } finally {
      setFormLoading(false);
    }
  };

  const doDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setError("");
    try {
      await deletePatient(deleteId);
      setDeleteId(null);
      const nextPage = page > 1 && rows.length === 1 ? page - 1 : page;
      setPage(nextPage);
      await loadPatients(nextPage, filters);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete patient");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openPayments = async (patient) => {
    setPayPatient(patient);
    setPayRows([]);
    setPayOpen(true);
    setPayLoading(true);
    setError("");
    try {
      const res = await fetchUnpaidConsultations(patient.id);
      setPayRows(res.rows || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load unpaid consultations");
    } finally {
      setPayLoading(false);
    }
  };

  const handleCancelEntry = async (entryId) => {
    setError("");
    try {
      await cancelQueueEntry(entryId);
      await loadQueue();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to cancel queue entry");
    }
  };

  const handlePriorityEntry = async (entryId) => {
    setError("");
    try {
      await prioritizeQueueEntry(entryId);
      await loadQueue();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to set priority");
    }
  };

  const loadDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const res = await fetchDoctors();
      setDoctors(res?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load doctors");
    } finally {
      setDoctorsLoading(false);
    }
  };

  const loadAppointmentPatients = async (search, dobExact = "") => {
    appointmentPatientAbortRef.current?.abort();
    const controller = new AbortController();
    appointmentPatientAbortRef.current = controller;

    setAppointmentPatientLoading(true);
    try {
      const res = await fetchPatients({
        search,
        dob_exact: dobExact || undefined,
        page: 1,
        per_page: 10,
        signal: controller.signal,
      });
      setAppointmentPatientOptions(res?.data || []);
    } catch (e) {
      if (e.code !== "ERR_CANCELED") {
        setError(e?.response?.data?.message || "Failed to load patients");
      }
    } finally {
      setAppointmentPatientLoading(false);
    }
  };

  const openAppointmentForm = async (patient = null) => {
    setAppointmentErrors({});
    setAppointmentForm({
      patient_id: patient?.id || "",
      doctor_id: "",
      date: getTodayDate(),
      time: getNowTime(),
      duration: "15",
      notes: "",
    });
    setAppointmentPatientLocked(!!patient?.id);
    setAppointmentPatientSearch("");
    setAppointmentPatientDob("");
    setAppointmentPatientOptions(patient ? [patient] : []);
    setAppointmentPatientSelected(patient || null);
    setAppointmentOpen(true);
    if (doctors.length === 0) {
      await loadDoctors();
    }
  };

  const submitAppointment = async () => {
    setAppointmentLoading(true);
    setAppointmentErrors({});
    setError("");
    try {
      const { patient_id, doctor_id, date, time, duration, notes } = appointmentForm;
      if (!patient_id || !doctor_id || !date || !time) {
        setAppointmentErrors({ form: ["Patient, doctor, date, and time are required."] });
        setAppointmentLoading(false);
        return;
      }
      const mins = Math.max(1, parseInt(duration, 10) || 15);
      const startStr = `${date} ${time}:00`;
      const endDate = new Date(`${date}T${time}:00`);
      endDate.setMinutes(endDate.getMinutes() + mins);
      const endH = String(endDate.getHours()).padStart(2, "0");
      const endM = String(endDate.getMinutes()).padStart(2, "0");
      const endStr = `${date} ${endH}:${endM}:00`;

      await createAppointment({
        patient_id: Number(patient_id),
        doctor_id: Number(doctor_id),
        start_time: startStr,
        end_time: endStr,
        status: "scheduled",
        notes: notes?.trim() || null,
      });
      try {
        await addToQueue(Number(patient_id));
      } catch (e) {
        setError(e?.response?.data?.message || "Appointment saved, but failed to add to queue");
      }
      await loadQueue();
      setAppointmentOpen(false);
    } catch (e) {
      const ve = e?.response?.data?.errors;
      if (ve) setAppointmentErrors(ve);
      else setError(e?.response?.data?.message || "Failed to create appointment");
    } finally {
      setAppointmentLoading(false);
    }
  };

  const openPaymentForm = (consultation) => {
    setPayForm({
      consultation,
      amount: "",
      method: "cash",
      reference: "",
      notes: "",
    });
    setPayFormOpen(true);
  };

  const submitPayment = async () => {
    if (!payForm.consultation) return;
    const amount = Math.round(Number(payForm.amount) * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid amount");
      return;
    }
    if (amount > payForm.consultation.remaining_cents) {
      alert("Payment exceeds remaining amount");
      return;
    }
    setPaySubmitLoading(true);
    try {
      await createConsultationPayment(payForm.consultation.id, {
        amount_cents: amount,
        method: payForm.method,
        reference: payForm.reference || null,
        notes: payForm.notes || null,
      });
      setPayFormOpen(false);
      const res = await fetchUnpaidConsultations(payPatient.id);
      setPayRows(res.rows || []);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add payment");
    } finally {
      setPaySubmitLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <ThemeProvider theme={pageTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          background: isDark
            ? "radial-gradient(circle at 20% 0%, rgba(59,130,246,0.12) 0%, transparent 45%)," +
              "linear-gradient(180deg, #0b1220 0%, #0f172a 100%)"
            : "radial-gradient(circle at 20% 0%, rgba(59,130,246,0.10) 0%, transparent 45%)," +
              "linear-gradient(180deg, #f6f7fb 0%, #f1f4fa 100%)",
          "--ink": isDark ? "#e2e8f0" : "#111827",
          "--muted": isDark ? "#94a3b8" : "#6b7280",
          "--card": isDark ? "#0f172a" : "#ffffff",
          "--accent": isDark ? "#6aa7ff" : "#2f80ed",
          "--accent-2": isDark ? "#f59e0b" : "#f29c38",
          "--accent-3": isDark ? "#22c55e" : "#27ae60",
          fontFamily: "\"Montserrat\", \"Segoe UI\", sans-serif",
        }}
      >
        <Box
          sx={{
            width: 250,
            flexShrink: 0,
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            gap: 2,
            px: 2,
            py: 3,
            background: "linear-gradient(180deg, #0b1220 0%, #1e1b4b 100%)",
            color: "#fff",
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.15)",
              }}
            >
              <DashboardIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>ClinicSystem</Typography>
          </Stack>

          <Stack spacing={1}>
            {[
              { label: t.patientsList, icon: <ListAltIcon fontSize="small" />, onClick: () => setShowPatients(true) },
              { label: t.addAppointment, icon: <EventNoteIcon fontSize="small" />, onClick: () => openAppointmentForm(null) },
              { label: t.nurseDashboard, icon: <PeopleAltIcon fontSize="small" />, onClick: () => (window.location.href = "/nurse") },
            ].map((item) => (
              <Button
                key={item.label}
                onClick={item.onClick}
                startIcon={item.icon}
                sx={{
                  justifyContent: "flex-start",
                  color: "#fff",
                  textTransform: "none",
                  borderRadius: 999,
                  px: 2,
                  py: 1,
                  background: "rgba(255,255,255,0.06)",
                  "&:hover": { background: "rgba(255,255,255,0.14)" },
                }}
              >
                {item.label}
              </Button>
            ))}
            <Button
              onClick={logout}
              startIcon={<LogoutIcon fontSize="small" />}
              sx={{
                justifyContent: "flex-start",
                color: "#fff",
                textTransform: "none",
                borderRadius: 999,
                px: 2,
                py: 1,
                background: "rgba(255,255,255,0.06)",
                "&:hover": { background: "rgba(255,255,255,0.14)" },
              }}
            >
              {t.logout}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, py: 3, px: { xs: 2, md: 3 } }}>
          <Container maxWidth="xl">
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack>
                <Typography variant="h5" sx={{ color: "var(--ink)", fontWeight: 700 }}>{t.title}</Typography>
                <Typography variant="body2" sx={{ color: "var(--muted)" }}>{t.todayCurrentNumber}: {queue.current_number || 0} | {t.totalWaiting}: {waitingCount}</Typography>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="center">
                <TextField size="small" placeholder="Search..." sx={{ minWidth: 220 }} />
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>{t.language}</InputLabel>
                  <Select label={t.language} value={lang} onChange={(e) => setLang(e.target.value)}>
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ar">العربية</MenuItem>
                  </Select>
                </FormControl>
                <Tooltip title={t.darkMode}>
                  <FormControlLabel
                    control={<Switch checked={isDark} onChange={(e) => setMode(e.target.checked ? "dark" : "light")} />}
                    label={t.darkMode}
                    sx={{ color: "var(--muted)" }}
                  />
                </Tooltip>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 2 }} justifyContent="flex-end">
              <Button variant="contained" sx={primaryActionSx(mode)} onClick={openCreate} startIcon={<AddIcon />}>
                {t.newPatient}
              </Button>
              <Button variant="outlined" sx={outlineActionSx(mode)} onClick={() => openAppointmentForm(null)} startIcon={<EventAvailableIcon />}>
                {t.addAppointment}
              </Button>
              {role === "receptionist-nurse" && (
                <>
                  <Badge
                    color="error"
                badgeContent={nursePendingCount}
                overlap="circular"
                invisible={nursePendingCount === 0}
                sx={{ "& .MuiBadge-badge": { boxShadow: `0 0 0 2px ${isDark ? "#0f172a" : "#fff"}` } }}
              >
                <Button variant="outlined" sx={outlineActionSx(mode)} onClick={(e) => setNurseMenuAnchor(e.currentTarget)}>
                  {t.nurseDashboard}
                </Button>
              </Badge>
              <Menu
                anchorEl={nurseMenuAnchor}
                open={Boolean(nurseMenuAnchor)}
                onClose={() => setNurseMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              >
                <MenuItem disabled>{nurseUsersLoading ? t.loading : t.nurses}</MenuItem>
                {nurseUsers.length === 0 && !nurseUsersLoading && (
                  <MenuItem disabled>{t.noNurses}</MenuItem>
                )}
                {nurseUsers.map((n) => (
                  <MenuItem key={n.id} disabled>
                    {n.name}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem
                    onClick={() => {
                      setNurseMenuAnchor(null);
                      window.location.href = "/nurse";
                    }}
                  >
                    {t.openNurseDashboard}
                  </MenuItem>
                </Menu>
              </>
              )}
              <Button
                variant={showPatients ? "contained" : "outlined"}
                sx={showPatients ? primaryActionSx(mode) : outlineActionSx(mode)}
            onClick={() => {
              if (showPatients) {
                setShowPatients(false);
                return;
              }
              setShowPatients(true);
              setPage(1);
              loadPatients(1, filters);
              setTimeout(() => {
                patientsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 0);
            }}
              >
                {t.patientsList}
              </Button>
              <Button
                variant="outlined"
                sx={outlineActionSx(mode)}
                onClick={() => {
                  loadQueue();
                  if (showPatients) loadPatients(page, filters);
                  loadNurseUsers();
                  loadNursePendingCount();
                }}
              >
                {t.refresh}
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
              {[
                {
                  label: t.queueDate,
                  value: formatUiDate(queue.date || "", locale),
                  gradient: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)",
                  icon: <CalendarMonthIcon />,
                  accent: "#2563eb",
                },
                {
                  label: t.todayCurrentNumber,
                  value: queueLoading ? "—" : (queue.current_number || 0),
                  gradient: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                  icon: <NumbersIcon />,
                  accent: "#ef4444",
                },
                {
                  label: t.totalWaiting,
                  value: queueLoading ? "—" : waitingCount,
                  gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                  icon: <PeopleAltIcon />,
                  accent: "#16a34a",
                },
                {
                  label: t.totalQueue,
                  value: queueLoading ? "—" : (queueMeta?.total || 0),
                  gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  icon: <PaymentsIcon />,
                  accent: "#f59e0b",
                },
              ].map((card) => (
                <Paper
                  key={card.label}
                  sx={{
                    flex: 1,
                    minWidth: 220,
                    p: 2.5,
                    borderRadius: 999,
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: card.gradient,
                    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "#1f2937" }}>{card.label}</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a" }}>{card.value}</Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "rgba(255,255,255,0.7)",
                        color: card.accent,
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>

      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          borderRadius: 999,
          background: isDark
            ? "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 100%)"
            : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          border: isDark ? "1px solid rgba(148,163,184,0.2)" : "1px solid rgba(17,24,39,0.08)",
          boxShadow: isDark ? "0 18px 32px rgba(2,6,23,0.5)" : "0 18px 32px rgba(17,24,39,0.08)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 4 }} alignItems="center" justifyContent="space-between">
          <Stack>
            <Typography variant="subtitle2" sx={{ color: "var(--muted)" }}>{t.queueDate}</Typography>
            <Typography variant="h6" sx={{ color: "var(--ink)", fontWeight: 700 }}>{formatUiDate(queue.date || "", locale)}</Typography>
          </Stack>
          <Stack>
            <Typography variant="subtitle2" sx={{ color: "var(--muted)" }}>{t.todayCurrentNumber}</Typography>
            <Typography variant="h3" sx={{ color: "var(--accent)", fontWeight: 700 }}>
              {queueLoading ? "..." : (queue.current_number || "—")}
            </Typography>
          </Stack>
          <Stack>
            <Typography variant="subtitle2" sx={{ color: "var(--muted)" }}>{t.totalWaiting}</Typography>
            <Typography variant="h6" sx={{ color: "var(--ink)", fontWeight: 700 }}>{queueLoading ? "..." : waitingCount}</Typography>
          </Stack>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t.status}</InputLabel>
            <Select
              label={t.status}
              value={queueStatusFilter}
              onChange={(e) => {
                setQueuePage(1);
                setQueueStatusFilter(e.target.value);
              }}
            >
              <MenuItem value="waiting">{t.waiting}</MenuItem>
              <MenuItem value="in_consultation">{t.inConsultation}</MenuItem>
              <MenuItem value="consulted">{t.consulted}</MenuItem>
              <MenuItem value="cancelled">{t.cancelled}</MenuItem>
              <MenuItem value="all">{t.all}</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" sx={outlineActionSx(mode)} onClick={loadQueue} disabled={queueLoading}>
            {t.reloadQueue}
          </Button>
        </Stack>
        {queueError && <Alert severity="error" sx={{ mt: 2 }}>{queueError}</Alert>}
      </Paper>

      <Paper
        sx={{
          overflowX: "auto",
          mb: 2,
          borderRadius: 24,
          border: isDark ? "1px solid rgba(148,163,184,0.18)" : "1px solid rgba(59,130,246,0.12)",
          boxShadow: isDark ? "0 16px 36px rgba(2,6,23,0.6)" : "0 16px 36px rgba(17,24,39,0.10)",
          background: isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.96)",
        }}
      >
        <Table sx={{ borderCollapse: "separate", borderSpacing: "0 12px", px: { xs: 1, md: 2 } }}>
          <TableHead>
            <TableRow
              sx={{
                background: isDark
                  ? "linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)"
                  : "linear-gradient(90deg, rgba(224,242,254,0.9) 0%, rgba(219,234,254,0.7) 100%)",
                "& th": { fontWeight: 700, color: isDark ? "#e2e8f0" : "#0f172a" },
                "& th:first-of-type": { pl: { xs: 2, md: 3 } },
                "& th:last-of-type": { pr: { xs: 2, md: 3 } },
              }}
            >
              <TableCell>{t.number}</TableCell>
              <TableCell>{t.patient}</TableCell>
              <TableCell>{t.code}</TableCell>
              <TableCell>{t.status}</TableCell>
              <TableCell>{t.price}</TableCell>
              <TableCell>{t.payment}</TableCell>
              <TableCell align="right">{t.action}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(queue.rows || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">{t.noQueue}</TableCell>
              </TableRow>
            ) : (
              queue.rows.map((q) => {
                const priceCents = q.consultation?.price_cents;
                const paymentStatus = q.consultation?.payment_status;
                const hasPrice = priceCents !== null && priceCents !== undefined;
                const canPay = hasPrice && priceCents > 0 && ["unpaid", "partial"].includes(paymentStatus);
                const isWaiting = q.status === "waiting";
                const isCurrent = q.number === queue.current_number;
                const rowBaseBg = isDark
                  ? (isCurrent ? "rgba(59,130,246,0.28)" : "rgba(30,41,59,0.85)")
                  : (isCurrent ? "rgba(59,130,246,0.16)" : "rgba(219,234,254,0.55)");
                const rowHoverBg = isDark
                  ? (isCurrent ? "rgba(59,130,246,0.35)" : "rgba(51,65,85,0.9)")
                  : (isCurrent ? "rgba(59,130,246,0.22)" : "rgba(219,234,254,0.8)");
                const canCancel = isWaiting && !isCurrent;
                const canPriority = isWaiting && !isCurrent;
                const hasActions = canPay || canCancel || canPriority;

                return (
                  <TableRow
                    key={q.id}
                    hover
                    sx={{
                      "& > td": {
                        backgroundColor: rowBaseBg,
                        borderBottom: "none",
                      },
                      "&:hover > td": { backgroundColor: rowHoverBg },
                      "&.Mui-selected > td": { backgroundColor: rowBaseBg },
                      "&.Mui-selected:hover > td": { backgroundColor: rowHoverBg },
                      "& > td:first-of-type": { borderTopLeftRadius: 16, borderBottomLeftRadius: 16, pl: { xs: 2, md: 3 } },
                      "& > td:last-of-type": { borderTopRightRadius: 16, borderBottomRightRadius: 16, pr: { xs: 2, md: 3 } },
                    }}
                  >
                    <TableCell>{q.number}</TableCell>
                    <TableCell>{q.patient?.first_name} {q.patient?.last_name}</TableCell>
                    <TableCell>{q.patient?.patient_code || "-"}</TableCell>
                    <TableCell>
                      <Chip label={statusLabel(q.status)} size="small" sx={statusChipSx(q.status)} />
                    </TableCell>
                    <TableCell>
                      {hasPrice ? (priceCents / 100).toFixed(2) : "—"}
                    </TableCell>
                    <TableCell>
                      {!hasPrice ? (
                        <Chip label={t.noPrice} size="small" sx={paymentChipSx("no_price")} />
                      ) : paymentStatus === "paid" ? (
                        <Chip label={t.paid} size="small" sx={paymentChipSx("paid")} />
                      ) : paymentStatus === "partial" ? (
                        <Chip label={t.partial} size="small" sx={paymentChipSx("partial")} />
                      ) : (
                        <Chip label={t.unpaid} size="small" sx={paymentChipSx("unpaid")} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {hasActions ? (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {canPriority && (
                            <Button size="small" variant="outlined" sx={outlineActionSx(mode)} onClick={() => handlePriorityEntry(q.id)}>
                              {t.emergency}
                            </Button>
                          )}
                          {canCancel && (
                            <Button size="small" color="error" variant="outlined" sx={{ borderRadius: 2, textTransform: "none" }} onClick={() => handleCancelEntry(q.id)}>
                              {t.cancel}
                            </Button>
                          )}
                          {canPay && q.patient && (
                            <Button size="small" variant="contained" sx={{ ...primaryActionSx(mode), px: 2 }} onClick={() => openPayments(q.patient)}>
                              {t.payments}
                            </Button>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ opacity: 0.6 }}>—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
      {queueMeta?.last_page > 1 && (
        <Stack alignItems="center" sx={{ mt: -1, mb: 2 }}>
          <Pagination count={queueMeta.last_page} page={queueMeta.current_page} color="primary" onChange={(_, p) => setQueuePage(p)} />
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
            Page {queueMeta.current_page}/{queueMeta.last_page} — Total: {queueMeta.total}
          </Typography>
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {showPatients && (
        <>
          <div ref={patientsSectionRef} />
        <Paper
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 12px 26px rgba(15,23,42,0.12)",
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Filters (server-side)</Typography>
          <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="From"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filters.created_from}
                  onChange={setFilter("created_from")}
                  fullWidth
                />
                <TextField
                  label="To"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filters.created_to}
                  onChange={setFilter("created_to")}
                  fullWidth
                />

                <TextField label="Search (code/phone/name)" size="small" fullWidth value={filters.search} onChange={setFilter("search")} />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="First name" size="small" fullWidth value={filters.first_name} onChange={setFilter("first_name")} />
                <TextField label="Last name" size="small" fullWidth value={filters.last_name} onChange={setFilter("last_name")} />
                <TextField label="Phone" size="small" fullWidth value={filters.phone} onChange={setFilter("phone")} />

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Gender</InputLabel>
                  <Select label="Gender" value={filters.gender} onChange={setFilter("gender")}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Place of birth" size="small" fullWidth value={filters.place_of_birth} onChange={setFilter("place_of_birth")} />
                <TextField label="Address" size="small" fullWidth value={filters.address} onChange={setFilter("address")} />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="DOB exact" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth value={filters.dob_exact} onChange={setFilter("dob_exact")} />
                <TextField label="DOB from" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth value={filters.dob_from} onChange={setFilter("dob_from")} />
                <TextField label="DOB to" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth value={filters.dob_to} onChange={setFilter("dob_to")} />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Age exact" type="number" size="small" fullWidth value={filters.age_exact} onChange={setFilter("age_exact")} />
                <TextField label="Age min" type="number" size="small" fullWidth value={filters.age_min} onChange={setFilter("age_min")} />
                <TextField label="Age max" type="number" size="small" fullWidth value={filters.age_max} onChange={setFilter("age_max")} />

                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    label="Sort by"
                    value={filters.sort_by}
                    onChange={(e) => applySort(e.target.value, filters.sort_dir)}
                  >
                    <MenuItem value="id">ID</MenuItem>
                    <MenuItem value="first_name">First name</MenuItem>
                    <MenuItem value="last_name">Last name</MenuItem>
                    <MenuItem value="created_at">Created at</MenuItem>
                    <MenuItem value="dob">DOB</MenuItem>
                    <MenuItem value="age">Age</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Direction</InputLabel>
                  <Select
                    label="Direction"
                    value={filters.sort_dir}
                    onChange={(e) => applySort(filters.sort_by, e.target.value)}
                  >
                    <MenuItem value="desc">DESC</MenuItem>
                    <MenuItem value="asc">ASC</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const reset = {
                      created_from: "",
                      created_to: "",
                      search: "",
                      first_name: "",
                      last_name: "",
                      phone: "",
                      gender: "",
                      place_of_birth: "",
                      address: "",
                      dob_exact: "",
                      dob_from: "",
                      dob_to: "",
                      age_exact: "",
                      age_min: "",
                      age_max: "",
                      sort_by: "id",
                      sort_dir: "desc",
                    };
                    setPage(1);
                    setFilters(reset);
                    loadPatients(1, reset);
                  }}
                >
                  Reset
                </Button>

              </Stack>
            </Stack>
          </Paper>

          <Paper
            sx={{
              overflowX: "auto",
              borderRadius: 3,
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 12px 26px rgba(15,23,42,0.12)",
            }}
          >
            {loading ? (
              <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ background: "linear-gradient(90deg, rgba(224,242,254,0.9) 0%, rgba(219,234,254,0.7) 100%)" }}>
                    <TableCell>ID</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>First</TableCell>
                    <TableCell>Last</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>DOB</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">No patients found</TableCell>
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
                        <TableCell>{computeAge(p.dob)}</TableCell>
                        <TableCell>{p.gender || "-"}</TableCell>
                        <TableCell>{formatDateOnly(p.created_at)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openEdit(p)} title="Edit" sx={{ color: "#2563eb" }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setDeleteId(p.id)} title="Delete" sx={{ color: "#ef4444" }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => openAppointmentForm(p)} title="Add appointment" sx={{ color: "#f97316" }}>
                            <EventAvailableIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => openPayments(p)} title="Payments" sx={{ color: "#0ea5e9" }}>
                            <PaymentsIcon fontSize="small" />
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
              <Pagination count={meta.last_page} page={meta.current_page} color="primary" onChange={onPageChange} />
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                Page {meta.current_page}/{meta.last_page} — Total: {meta.total}
              </Typography>
            </Stack>
          )}
        </>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formMode === "create" ? "Create patient" : `Edit patient #${formId}`}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="First name" value={form.first_name} onChange={setField("first_name")}
              error={!!formErrors.first_name} helperText={formErrors.first_name?.[0]} fullWidth
            />
            <TextField label="Last name" value={form.last_name} onChange={setField("last_name")}
              error={!!formErrors.last_name} helperText={formErrors.last_name?.[0]} fullWidth
            />
            <TextField label="Phone" value={form.phone} onChange={setField("phone")}
              error={!!formErrors.phone} helperText={formErrors.phone?.[0]} fullWidth
            />
            {formMode === "create" && (
              <FormControl>
                <FormLabel>Add to waiting queue</FormLabel>
                <RadioGroup
                  row
                  value={addToQueueOnCreate ? "yes" : "no"}
                  onChange={(e) => setAddToQueueOnCreate(e.target.value === "yes")}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            )}
            <Stack direction="row" spacing={2}>
              <TextField label="DOB" type="date" value={form.dob} onChange={setField("dob")} InputLabelProps={{ shrink: true }} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select label="Gender" value={form.gender} onChange={setField("gender")}>
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Address" value={form.address} onChange={setField("address")} fullWidth />
            <TextField label="Medical history summary" value={form.medical_history_summary} onChange={setField("medical_history_summary")} fullWidth multiline minRows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={formLoading}>Cancel</Button>
          <Button variant="contained" onClick={submitForm} disabled={formLoading}>
            {formLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

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

      <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Unpaid consultations — {payPatient?.first_name} {payPatient?.last_name} ({payPatient?.patient_code})
        </DialogTitle>
        <DialogContent>
          {payLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
          ) : (
            <>
              {payRows.length === 0 ? (
                <Alert severity="info">No unpaid/partial consultations.</Alert>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Number</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Paid</TableCell>
                      <TableCell>Remaining</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payRows.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell>{c.id}</TableCell>
                        <TableCell>{c.consultation_number}</TableCell>
                        <TableCell>{(c.price_cents / 100).toFixed(2)}</TableCell>
                        <TableCell>{(c.total_paid_cents / 100).toFixed(2)}</TableCell>
                        <TableCell>{(c.remaining_cents / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          {c.payment_status === "partial" ? (
                            <Chip label="partial" color="warning" size="small" />
                          ) : (
                            <Chip label="unpaid" color="error" size="small" />
                          )}
                        </TableCell>
                        <TableCell>{formatDateOnly(c.created_at)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="contained" onClick={() => openPaymentForm(c)}>
                            Add payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={payFormOpen} onClose={() => setPayFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add payment — Consultation #{payForm.consultation?.id}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Amount (DZD)"
              value={payForm.amount}
              onChange={(e) => setPayForm((s) => ({ ...s, amount: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth size="small">
              <InputLabel>Method</InputLabel>
              <Select
                label="Method"
                value={payForm.method}
                onChange={(e) => setPayForm((s) => ({ ...s, method: e.target.value }))}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="transfer">Transfer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Reference"
              value={payForm.reference}
              onChange={(e) => setPayForm((s) => ({ ...s, reference: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Notes"
              value={payForm.notes}
              onChange={(e) => setPayForm((s) => ({ ...s, notes: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayFormOpen(false)} disabled={paySubmitLoading}>Cancel</Button>
          <Button variant="contained" onClick={submitPayment} disabled={paySubmitLoading}>
            {paySubmitLoading ? "Saving..." : "Save payment"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={appointmentOpen} onClose={() => setAppointmentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add appointment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {appointmentErrors.form?.[0] && <Alert severity="error">{appointmentErrors.form[0]}</Alert>}
            {appointmentPatientLocked ? (
              <TextField
                label="Patient"
                value={appointmentPatientSelected ? formatPatientOption(appointmentPatientSelected) : appointmentForm.patient_id}
                disabled
                fullWidth
              />
            ) : (
              <>
                <TextField
                  label="Search patient (code/phone/name)"
                  value={appointmentPatientSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAppointmentPatientSearch(val);
                    if (appointmentPatientDebounceRef.current) clearTimeout(appointmentPatientDebounceRef.current);
                    if (val.trim().length >= 2 || appointmentPatientDob) {
                      appointmentPatientDebounceRef.current = setTimeout(() => {
                        loadAppointmentPatients(val.trim(), appointmentPatientDob);
                      }, 500);
                    } else {
                      setAppointmentPatientOptions([]);
                      setAppointmentPatientSelected(null);
                      setAppointmentForm((s) => ({ ...s, patient_id: "" }));
                    }
                  }}
                  helperText="Min 2 characters"
                  fullWidth
                />
                <TextField
                  label="DOB exact"
                  type="date"
                  value={appointmentPatientDob}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAppointmentPatientDob(val);
                    if (appointmentPatientDebounceRef.current) clearTimeout(appointmentPatientDebounceRef.current);
                    if (appointmentPatientSearch.trim().length >= 2 || val) {
                      appointmentPatientDebounceRef.current = setTimeout(() => {
                        loadAppointmentPatients(appointmentPatientSearch.trim(), val);
                      }, 500);
                    } else {
                      setAppointmentPatientOptions([]);
                      setAppointmentPatientSelected(null);
                      setAppointmentForm((s) => ({ ...s, patient_id: "" }));
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <FormControl fullWidth size="small" error={!!appointmentErrors.patient_id} disabled={appointmentPatientLoading}>
                  <InputLabel>Patient</InputLabel>
                  <Select
                    label="Patient"
                    value={appointmentForm.patient_id}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const selected = appointmentPatientOptions.find((p) => Number(p.id) === id) || null;
                      setAppointmentPatientSelected(selected);
                      setAppointmentForm((s) => ({ ...s, patient_id: e.target.value }));
                    }}
                  >
                    <MenuItem value="">Select</MenuItem>
                    {appointmentPatientOptions.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{formatPatientOption(p)}</MenuItem>
                    ))}
                  </Select>
                  {appointmentErrors.patient_id?.[0] && (
                    <FormHelperText>{appointmentErrors.patient_id[0]}</FormHelperText>
                  )}
                </FormControl>
              </>
            )}
            <FormControl fullWidth size="small" disabled={doctorsLoading} error={!!appointmentErrors.doctor_id}>
              <InputLabel>Doctor</InputLabel>
              <Select
                label="Doctor"
                value={appointmentForm.doctor_id}
                onChange={(e) => setAppointmentForm((s) => ({ ...s, doctor_id: e.target.value }))}
              >
                <MenuItem value="">Select</MenuItem>
                {doctors.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
              {appointmentErrors.doctor_id?.[0] && (
                <FormHelperText>{appointmentErrors.doctor_id[0]}</FormHelperText>
              )}
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Date"
                type="date"
                value={appointmentForm.date}
                onChange={(e) => setAppointmentForm((s) => ({ ...s, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                error={!!appointmentErrors.start_time}
                helperText={appointmentErrors.start_time?.[0]}
                fullWidth
              />
              <TextField
                label="Time"
                type="time"
                value={appointmentForm.time}
                onChange={(e) => setAppointmentForm((s) => ({ ...s, time: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                error={!!appointmentErrors.start_time}
                helperText={appointmentErrors.start_time?.[0]}
                fullWidth
              />
            </Stack>
              <TextField
                label="Duration (minutes)"
                type="number"
                value={appointmentForm.duration}
                onChange={(e) => setAppointmentForm((s) => ({ ...s, duration: e.target.value }))}
                error={!!appointmentErrors.end_time}
                helperText={appointmentErrors.end_time?.[0]}
                fullWidth
              />
            <TextField
              label="Notes"
              value={appointmentForm.notes}
              onChange={(e) => setAppointmentForm((s) => ({ ...s, notes: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppointmentOpen(false)} disabled={appointmentLoading}>Cancel</Button>
          <Button variant="contained" onClick={submitAppointment} disabled={appointmentLoading}>
            {appointmentLoading ? "Saving..." : "Save appointment"}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
    </Box>
    </ThemeProvider>
  );
}
