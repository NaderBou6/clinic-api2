import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Paper,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Pagination,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Drawer,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Collapse,
  Autocomplete,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import MedicationIcon from "@mui/icons-material/Medication";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ScienceIcon from "@mui/icons-material/Science";
import ImageIcon from "@mui/icons-material/Image";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";
import HistoryIcon from "@mui/icons-material/History";

import { api } from "../../api/axios";
import { fetchTodayQueue, nextQueue } from "../../api/queue";
import { fetchPatients, createPatient, updatePatient, deletePatient } from "../../api/patients";
import { fetchDoctors } from "../../api/doctors";
import { fetchDoctorStats } from "../../api/stats";
import { fetchNurseUsers } from "../../api/users";
import { fetchPatientConsultationHistory } from "../../api/consultations";
import {
  startConsultationFromQueue,
  setDoctorConsultationPrice,
  cancelDoctorConsultation,
} from "../../api/doctorFlow";

function formatDateOnly(v) {
  if (!v) return "-";
  if (typeof v === "string" && v.includes("T")) return v.split("T")[0];
  if (typeof v === "string" && v.length >= 10) return v.slice(0, 10);
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
function getClinicInfo() {
  return {
    name: localStorage.getItem("clinic_name") || "Clinic",
    address: localStorage.getItem("clinic_address") || "",
    phone: localStorage.getItem("clinic_phone") || "",
    logo: localStorage.getItem("clinic_logo") || "",
  };
}
function openPrintWindow({ title, bodyHtml }) {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 portrait; margin: 16mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Georgia", "Times New Roman", serif;
        color: #0f172a;
        background: #eef2f7;
      }
      h1, h2, h3 { margin: 0; }
      .sheet {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 18px 22px 20px;
        box-shadow: 0 18px 30px rgba(15, 23, 42, 0.12);
      }
      .brand-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 10px 14px;
        border-radius: 10px;
        background: linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%);
        color: #fff;
        margin-bottom: 16px;
      }
      .brand {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .logo {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.6);
      }
      .logo img { width: 100%; height: 100%; object-fit: contain; }
      .logo-fallback {
        font-family: "Arial", sans-serif;
        font-weight: 700;
        color: #1e3a8a;
        font-size: 20px;
      }
      .clinic-name { font-size: 20px; font-weight: 700; letter-spacing: 0.3px; }
      .clinic-meta { font-size: 12px; opacity: 0.9; }
      .doc-meta { text-align: right; font-family: "Arial", sans-serif; }
      .doc-meta .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
      .doc-meta .value { font-size: 16px; font-weight: 700; }
      .doc-meta .ref { font-size: 12px; opacity: 0.9; }
      .info-card {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 16px;
        font-family: "Arial", sans-serif;
      }
      .info-card .label { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.8px; }
      .info-card .value { font-size: 14px; font-weight: 600; color: #0f172a; }
      .info-card .muted { font-size: 12px; color: #64748b; }
      .doc-title {
        display: inline-block;
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
        padding: 6px 12px;
        border-radius: 8px;
        background: #e0f2fe;
        margin-bottom: 12px;
        border: 1px solid #bae6fd;
      }
      .section { margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-family: "Arial", sans-serif; }
      th, td { border: 1px solid #cbd5f5; padding: 8px 10px; font-size: 12px; }
      th { background: #eef2ff; text-align: left; color: #1e1b4b; }
      tbody tr:nth-child(even) { background: #f8fafc; }
      .notes {
        padding: 10px 12px;
        background: #fef3c7;
        border: 1px dashed #f59e0b;
        border-radius: 8px;
        font-family: "Arial", sans-serif;
        font-size: 12px;
      }
      .signatures {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-top: 28px;
        font-family: "Arial", sans-serif;
      }
      .signature-box {
        flex: 1;
        text-align: center;
        padding-top: 28px;
        border-top: 1px solid #94a3b8;
        font-size: 12px;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <div class="sheet">${bodyHtml}</div>
  </body>
</html>`);
  w.document.close();
  w.focus();
  w.print();
}
function Donut({ label, value, total, color }) {
  const pct = total > 0 ? value / total : 0;
  const size = 52;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${pct * c} ${c}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
      </Box>
      <Stack>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="h6">{Math.round(pct * 100)}%</Typography>
      </Stack>
    </Stack>
  );
}
function sidebarButtonSx(active) {
  return {
    justifyContent: "flex-start",
    color: active ? "#ffffff" : "#e5e7eb",
    background: active ? "rgba(99,102,241,0.28)" : "rgba(148,163,184,0.12)",
    borderRadius: 2,
    textTransform: "none",
    "&:hover": {
      background: "rgba(59,130,246,0.22)",
    },
  };
}

function statusChipSx(status) {
  if (status === "waiting") return { bgcolor: "rgba(245,158,11,0.15)", color: "#92400e" };
  if (status === "in_consultation") return { bgcolor: "rgba(59,130,246,0.15)", color: "#1e3a8a" };
  if (status === "consulted") return { bgcolor: "rgba(16,185,129,0.15)", color: "#065f46" };
  if (status === "cancelled") return { bgcolor: "rgba(244,63,94,0.15)", color: "#9f1239" };
  return { bgcolor: "rgba(148,163,184,0.2)", color: "#334155" };
}

const emptyPrescriptionItem = () => ({
  drug_name: "",
  dosage: "",
  frequency: "",
  duration: "",
  notes: "",
});

const emptyTestItem = () => ({
  test_name: "",
  notes: "",
  status: "requested",
});

function shortSeriesLabel(label, unit) {
  if (!label) return "";
  if (unit === "month") return label;
  return label.slice(5);
}

const tracePalette = [
  { accent: "#4f46e5", bg: "linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)" },
  { accent: "#0ea5e9", bg: "linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)" },
  { accent: "#f97316", bg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)" },
  { accent: "#10b981", bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" },
];
const illnessTypeOptions = [
  "Common cold",
  "Flu",
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Allergy",
  "Gastroenteritis",
  "Back pain",
  "Dermatitis",
  "Migraine",
];

export default function DoctorDashboard() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("user_name") || "Doctor";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moduleFocus, setModuleFocus] = useState("");
  const [statusFilter, setStatusFilter] = useState("waiting");

  const [queue, setQueue] = useState({ date: "-", current_number: 0, waiting_count: 0, current_entry: null, rows: [] });
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState("");
  const [queueMeta, setQueueMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  const [queueLastUpdated, setQueueLastUpdated] = useState("");
  const queuePerPage = 10;
  const [queuePage, setQueuePage] = useState(1);

  const [showPatients, setShowPatients] = useState(false);
  const patientsSectionRef = useRef(null);
  const statsSectionRef = useRef(null);
  const patientsAbortRef = useRef(null);
  const patientsDebounceRef = useRef(null);

  const patientsPerPage = 10;
  const [patientsPage, setPatientsPage] = useState(1);
  const [patientsFilters, setPatientsFilters] = useState({
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

  const [patientsRows, setPatientsRows] = useState([]);
  const [patientsMeta, setPatientsMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: patientsPerPage });
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState("");

  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [patientFormMode, setPatientFormMode] = useState("create");
  const [patientFormId, setPatientFormId] = useState(null);
  const [patientFormLoading, setPatientFormLoading] = useState(false);
  const [patientFormErrors, setPatientFormErrors] = useState({});
  const [patientForm, setPatientForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    medical_history_summary: "",
  });

  const [patientDeleteId, setPatientDeleteId] = useState(null);
  const [patientDeleteLoading, setPatientDeleteLoading] = useState(false);

  const [activeEntry, setActiveEntry] = useState(null);
  const [activeConsultation, setActiveConsultation] = useState(null);

  const [priceOpen, setPriceOpen] = useState(false);
  const [priceIsFree, setPriceIsFree] = useState(false);
  const [priceValue, setPriceValue] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);

  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState("");
  const [moduleNotice, setModuleNotice] = useState("");

  const [prescriptionItems, setPrescriptionItems] = useState([emptyPrescriptionItem()]);
  const [prescriptionMeta, setPrescriptionMeta] = useState({ illness_type: "" });
  const [hasPrescription, setHasPrescription] = useState(false);

  const [certificate, setCertificate] = useState({
    reason: "",
    start_date: "",
    end_date: "",
    notes: "",
  });
  const [hasCertificate, setHasCertificate] = useState(false);

  const [testItems, setTestItems] = useState([emptyTestItem()]);
  const [hasTestRequest, setHasTestRequest] = useState(false);

  const [radiologyFile, setRadiologyFile] = useState(null);

  const [instructionForm, setInstructionForm] = useState({
    instruction: "",
    assigned_to_nurse_id: "",
  });
  const [nurseUsers, setNurseUsers] = useState([]);
  const [nurseUsersLoading, setNurseUsersLoading] = useState(false);

  const prescriptionRef = useRef(null);
  const certificateRef = useRef(null);
  const testsRef = useRef(null);
  const radiologyRef = useRef(null);
  const instructionsRef = useRef(null);

  const [statsPeriod, setStatsPeriod] = useState("day");
  const [statsStart, setStatsStart] = useState("");
  const [statsEnd, setStatsEnd] = useState("");
  const [statsDoctorId, setStatsDoctorId] = useState("");
  const [statsDoctors, setStatsDoctors] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [statsData, setStatsData] = useState(null);
  const statsAbortRef = useRef(null);

  const [traceRows, setTraceRows] = useState([]);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState("");
  const [traceExpanded, setTraceExpanded] = useState({});
  const traceAbortRef = useRef(null);
  const traceSectionRef = useRef(null);

  const abortRef = useRef(null);

  useEffect(() => {
    if (!token) window.location.href = "/login";
    if (role !== "doctor" && role !== "doctor-manager" && role !== "admin") window.location.href = "/login";
  }, [token, role]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!queueLoading) loadQueue(queuePage, true);
    }, 8000);
    return () => clearInterval(id);
  }, [queueLoading, queuePage]);

  useEffect(() => {
    const loadNurses = async () => {
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
    loadNurses();
  }, []);

  const loadQueue = async (nextPage = queuePage, silent = false) => {
    setQueueError("");
    if (!silent) setQueueLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetchTodayQueue({ status: "all", page: nextPage, per_page: queuePerPage, signal: controller.signal });
      if (res?.last_updated && res.last_updated === queueLastUpdated) {
        return;
      }
      setQueueLastUpdated(res?.last_updated || "");
      setQueue(res);
      setQueueMeta(res?.meta || { current_page: nextPage, last_page: 1, total: (res?.rows || []).length, per_page: queuePerPage });
    } catch (e) {
      if (e.code !== "ERR_CANCELED") {
        setQueueError(e?.response?.data?.message || "Failed to load queue");
      }
    } finally {
      if (!silent) setQueueLoading(false);
    }
  };

  const loadPatients = async (nextPage = patientsPage, nextFilters = patientsFilters) => {
    patientsAbortRef.current?.abort();
    const controller = new AbortController();
    patientsAbortRef.current = controller;

    setPatientsError("");
    setPatientsLoading(true);
    try {
      const res = await fetchPatients({
        ...nextFilters,
        page: nextPage,
        per_page: patientsPerPage,
        signal: controller.signal,
      });
      setPatientsRows(res?.data || []);
      setPatientsMeta(normalizeMeta(res, nextPage, patientsPerPage));
    } catch (e) {
      if (e.code !== "ERR_CANCELED") {
        setPatientsError(e?.response?.data?.message || "Failed to load patients");
      }
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue(queuePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuePage]);

  const triggerPatientSearch = (newFilters) => {
    setPatientsPage(1);
    if (patientsDebounceRef.current) clearTimeout(patientsDebounceRef.current);
    patientsDebounceRef.current = setTimeout(() => {
      setPatientsFilters(newFilters);
      loadPatients(1, newFilters);
    }, 700);
  };

  const setPatientFilter = (key) => (e) => {
    const val = e.target.value;
    const newFilters = { ...patientsFilters, [key]: val };
    const min2Keys = ["search", "first_name", "last_name", "phone"];
    if (min2Keys.includes(key)) {
      if (val.trim() !== "" && val.trim().length < 2) {
        setPatientsFilters(newFilters);
        return;
      }
    }
    triggerPatientSearch(newFilters);
  };

  const applyPatientSort = (sort_by, sort_dir) => {
    const newFilters = { ...patientsFilters, sort_by, sort_dir };
    triggerPatientSearch(newFilters);
  };

  const onPatientsPageChange = (_, p) => {
    setPatientsPage(p);
    loadPatients(p, patientsFilters);
  };

  const openPatientCreate = () => {
    setPatientFormMode("create");
    setPatientFormId(null);
    setPatientFormErrors({});
    setPatientForm({
      first_name: "",
      last_name: "",
      phone: "",
      dob: "",
      gender: "",
      address: "",
      medical_history_summary: "",
    });
    setPatientFormOpen(true);
  };

  const openPatientEdit = (p) => {
    setPatientFormMode("edit");
    setPatientFormId(p.id);
    setPatientFormErrors({});
    setPatientForm({
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      phone: p.phone || "",
      dob: formatDateOnly(p.dob) === "-" ? "" : formatDateOnly(p.dob),
      gender: p.gender || "",
      address: p.address || "",
      medical_history_summary: p.medical_history_summary || "",
    });
    setPatientFormOpen(true);
  };

  const setPatientField = (k) => (e) => setPatientForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submitPatientForm = async () => {
    setPatientFormLoading(true);
    setPatientFormErrors({});
    setPatientsError("");
    try {
      const payload = {
        first_name: patientForm.first_name.trim(),
        last_name: patientForm.last_name.trim(),
        phone: patientForm.phone.trim(),
        dob: patientForm.dob || null,
        gender: patientForm.gender || null,
        address: patientForm.address.trim() || null,
        medical_history_summary: patientForm.medical_history_summary.trim() || null,
      };
      if (patientFormMode === "create") await createPatient(payload);
      else await updatePatient(patientFormId, payload);
      setPatientFormOpen(false);
      await loadPatients(patientsPage, patientsFilters);
    } catch (e) {
      const ve = e?.response?.data?.errors;
      if (ve) setPatientFormErrors(ve);
      else setPatientsError(e?.response?.data?.message || "Failed to save patient");
    } finally {
      setPatientFormLoading(false);
    }
  };

  const doPatientDelete = async () => {
    if (!patientDeleteId) return;
    setPatientDeleteLoading(true);
    setPatientsError("");
    try {
      await deletePatient(patientDeleteId);
      setPatientDeleteId(null);
      const nextPage = patientsPage > 1 && patientsRows.length === 1 ? patientsPage - 1 : patientsPage;
      setPatientsPage(nextPage);
      await loadPatients(nextPage, patientsFilters);
    } catch (e) {
      setPatientsError(e?.response?.data?.message || "Failed to delete patient");
    } finally {
      setPatientDeleteLoading(false);
    }
  };

  const currentEntry = useMemo(() => {
    return queue.current_entry || (queue.rows || []).find((r) => r.number === queue.current_number) || null;
  }, [queue]);

  const currentPatient = activeEntry?.patient || currentEntry?.patient || null;
  const currentPatientId = currentPatient?.id || null;

  const waitingCount = useMemo(() => {
    if (Number.isFinite(queue.waiting_count)) return queue.waiting_count;
    return (queue.rows || []).filter((r) => r.status === "waiting").length;
  }, [queue]);

  const displayRows = useMemo(() => {
    if (statusFilter === "all") return queue.rows || [];
    if (statusFilter === "consulted") {
      return (queue.rows || []).filter((r) => r.status === "consulted");
    }
    return (queue.rows || []).filter(
      (r) => r.status === "waiting" || r.number === queue.current_number
    );
  }, [queue, statusFilter]);

  const ensurePriceBeforeNext = () => {
    if (!currentEntry) return false;
    if (!activeConsultation || activeEntry?.id !== currentEntry.id) return false;
    return activeConsultation.price_cents === null;
  };

  const handleNext = async () => {
    setQueueError("");

    if (ensurePriceBeforeNext()) {
      setPriceOpen(true);
      return;
    }

    try {
      await nextQueue();
      await loadQueue();
    } catch (e) {
      setQueueError(e?.response?.data?.message || "Failed to move to next");
    }
  };

  const handleStartOrCancel = async () => {
    setQueueError("");
    if (!currentEntry) return;

    if (activeConsultation && activeEntry?.id === currentEntry.id) {
      try {
        await cancelDoctorConsultation(activeConsultation.id);
        setActiveConsultation(null);
        setActiveEntry(null);
        await loadQueue();
      } catch (e) {
        setQueueError(e?.response?.data?.message || "Failed to cancel consultation");
      }
      return;
    }

    try {
      const consult = await startConsultationFromQueue(currentEntry.id);
      setActiveConsultation(consult);
      setActiveEntry(currentEntry);
      await loadQueue();
    } catch (e) {
      setQueueError(e?.response?.data?.message || "Failed to start consultation");
    }
  };

  const submitPrice = async () => {
    if (!activeConsultation) return;
    if (!priceIsFree) {
      const n = Number(priceValue);
      if (!Number.isFinite(n) || n <= 0) {
        alert("Enter a valid positive price");
        return;
      }
    }

    setPriceLoading(true);
    try {
      const payload = priceIsFree
        ? { is_free: true, price_cents: 0 }
        : { is_free: false, price_cents: Math.round(Number(priceValue) * 100) };
      const updated = await setDoctorConsultationPrice(activeConsultation.id, payload);
      setActiveConsultation(updated);
      setPriceOpen(false);
      await nextQueue();
      await loadQueue();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to set price");
    } finally {
      setPriceLoading(false);
    }
  };

  const loadModules = async () => {
    if (!activeConsultation) return;
    setModuleLoading(true);
    setModuleError("");
    setModuleNotice("");

    try {
      const [pres, cert, tests] = await Promise.all([
        api.get(`/consultations/${activeConsultation.id}/prescription`),
        api.get(`/consultations/${activeConsultation.id}/medical-certificate`),
        api.get(`/consultations/${activeConsultation.id}/test-request`),
      ]);

      if (pres.status === 204 || !pres.data) {
        setHasPrescription(false);
        setPrescriptionItems([emptyPrescriptionItem()]);
        setPrescriptionMeta({ illness_type: "" });
      } else {
        setHasPrescription(true);
        setPrescriptionItems(pres.data.items || [emptyPrescriptionItem()]);
        setPrescriptionMeta({
          illness_type: pres.data.illness_type || pres.data.disease_type || pres.data.diagnosis || "",
        });
      }

      if (cert.status === 204 || !cert.data) {
        setHasCertificate(false);
        setCertificate({ reason: "", start_date: "", end_date: "", notes: "" });
      } else {
        setHasCertificate(true);
        setCertificate({
          reason: cert.data.reason || "",
          start_date: formatDateOnly(cert.data.start_date),
          end_date: formatDateOnly(cert.data.end_date),
          notes: cert.data.notes || "",
        });
      }

      if (tests.status === 204 || !tests.data) {
        setHasTestRequest(false);
        setTestItems([emptyTestItem()]);
      } else {
        setHasTestRequest(true);
        setTestItems(tests.data.items || [emptyTestItem()]);
      }
    } catch (e) {
      setModuleError(e?.response?.data?.message || "Failed to load modules");
    } finally {
      setModuleLoading(false);
    }
  };

  useEffect(() => {
    if (!activeConsultation) return;
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConsultation?.id]);

  const savePrescription = async () => {
    if (!activeConsultation) return;
    setModuleLoading(true);
    setModuleError("");
    setModuleNotice("");
    try {
      const payload = {
        items: prescriptionItems,
        illness_type: (prescriptionMeta.illness_type || "").trim() || null,
      };
      if (hasPrescription) {
        await api.put(`/consultations/${activeConsultation.id}/prescription`, payload);
      } else {
        await api.post(`/consultations/${activeConsultation.id}/prescription`, payload);
      }
      setHasPrescription(true);
      setModuleNotice("Prescription saved");
    } catch (e) {
      setModuleError(e?.response?.data?.message || "Failed to save prescription");
    } finally {
      setModuleLoading(false);
    }
  };

  const saveCertificate = async () => {
    if (!activeConsultation) return;
    setModuleLoading(true);
    setModuleError("");
    setModuleNotice("");
    try {
      if (hasCertificate) {
        await api.put(`/consultations/${activeConsultation.id}/medical-certificate`, certificate);
      } else {
        await api.post(`/consultations/${activeConsultation.id}/medical-certificate`, certificate);
      }
      setHasCertificate(true);
      setModuleNotice("Medical certificate saved");
    } catch (e) {
      setModuleError(e?.response?.data?.message || "Failed to save certificate");
    } finally {
      setModuleLoading(false);
    }
  };

  const saveTestRequest = async () => {
    if (!activeConsultation) return;
    setModuleLoading(true);
    setModuleError("");
    setModuleNotice("");
    try {
      const payload = { items: testItems };
      if (hasTestRequest) {
        await api.put(`/consultations/${activeConsultation.id}/test-request`, payload);
      } else {
        await api.post(`/consultations/${activeConsultation.id}/test-request`, payload);
      }
      setHasTestRequest(true);
      setModuleNotice("Test request saved");
    } catch (e) {
      setModuleError(e?.response?.data?.message || "Failed to save test request");
    } finally {
      setModuleLoading(false);
    }
  };

  const uploadRadiology = async () => {
    if (!activeConsultation || !radiologyFile) return;
    setModuleLoading(true);
    setModuleError("");
    setModuleNotice("");
    try {
      const fd = new FormData();
      fd.append("file", radiologyFile);
      await api.post(`/consultations/${activeConsultation.id}/radiology`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRadiologyFile(null);
      setModuleNotice("Radiology uploaded");
    } catch (e) {
      setModuleError(e?.response?.data?.message || "Failed to upload radiology");
    } finally {
      setModuleLoading(false);
    }
  };

  const sendInstruction = async () => {
    if (!activeEntry?.patient?.id) return;
    setModuleLoading(true);
    setModuleError("");
    setModuleNotice("");
    try {
      const payload = {
        instruction: instructionForm.instruction.trim(),
        consultation_id: activeConsultation?.id || null,
        assigned_to_nurse_id: instructionForm.assigned_to_nurse_id || null,
      };
      await api.post(`/patients/${activeEntry.patient.id}/instructions`, payload);
      setInstructionForm({ instruction: "", assigned_to_nurse_id: "" });
      setModuleNotice("Instruction sent");
    } catch (e) {
      setModuleError(e?.response?.data?.message || "Failed to send instruction");
    } finally {
      setModuleLoading(false);
    }
  };

  const loadStatsDoctors = async () => {
    try {
      const res = await fetchDoctors();
      setStatsDoctors(res?.data || []);
    } catch (e) {
      setStatsError(e?.response?.data?.message || "Failed to load doctors");
    }
  };

  const loadStats = async () => {
    const isCustom = statsPeriod === "custom";
    if (isCustom && (!statsStart || !statsEnd)) return;

    statsAbortRef.current?.abort();
    const controller = new AbortController();
    statsAbortRef.current = controller;

    setStatsLoading(true);
    setStatsError("");
    try {
      const res = await fetchDoctorStats({
        period: statsPeriod,
        start: statsStart || undefined,
        end: statsEnd || undefined,
        doctor_id: statsDoctorId || undefined,
        signal: controller.signal,
      });
      setStatsData(res);
    } catch (e) {
      if (e.code !== "ERR_CANCELED") {
        setStatsError(e?.response?.data?.message || "Failed to load statistics");
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTraceability = async (patientId, { excludeId } = {}) => {
    if (!patientId) return;
    traceAbortRef.current?.abort();
    const controller = new AbortController();
    traceAbortRef.current = controller;

    setTraceLoading(true);
    setTraceError("");
    try {
      const res = await fetchPatientConsultationHistory(patientId, {
        exclude_consultation_id: excludeId || undefined,
        signal: controller.signal,
      });
      setTraceRows(res?.data || []);
      setTraceExpanded({});
    } catch (e) {
      if (e.code !== "ERR_CANCELED") {
        setTraceError(e?.response?.data?.message || "Failed to load patient history");
      }
    } finally {
      setTraceLoading(false);
    }
  };

  useEffect(() => {
    if (role === "doctor-manager" || role === "admin") {
      loadStatsDoctors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsPeriod, statsStart, statsEnd, statsDoctorId]);

  useEffect(() => {
    if (moduleFocus !== "traceability") return;
    if (!currentPatientId) {
      setTraceRows([]);
      setTraceError("No current patient in the queue.");
      setTraceLoading(false);
      return;
    }
    const excludeId = activeConsultation?.id || currentEntry?.consultation?.id || null;
    loadTraceability(currentPatientId, { excludeId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFocus, currentPatientId, activeConsultation?.id, currentEntry?.consultation?.id]);

  useEffect(() => {
    if (!drawerOpen || !moduleFocus) return;
    const map = {
      prescription: prescriptionRef,
      certificate: certificateRef,
      tests: testsRef,
      radiology: radiologyRef,
      instructions: instructionsRef,
    };
    const ref = map[moduleFocus];
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [drawerOpen, moduleFocus]);

  const handlePrint = (type) => {
    if (!activeConsultation || !activeEntry?.patient) return;

    const clinic = getClinicInfo();
    const doctorName = localStorage.getItem("user_name") || "Doctor";
    const patient = activeEntry.patient;
    const consultNo = activeConsultation.consultation_number || activeConsultation.id;
    const logoHtml = clinic.logo
      ? `<img src="${clinic.logo}" alt="Clinic logo" />`
      : `<div class="logo-fallback">${(clinic.name || "Clinic").slice(0, 2).toUpperCase()}</div>`;

    const header = `
      <div class="brand-bar">
        <div class="brand">
          <div class="logo">${logoHtml}</div>
          <div>
            <div class="clinic-name">${clinic.name}</div>
            <div class="clinic-meta">${clinic.address || ""}</div>
            <div class="clinic-meta">${clinic.phone || ""}</div>
          </div>
        </div>
        <div class="doc-meta">
          <div class="label">Doctor</div>
          <div class="value">${doctorName}</div>
          <div class="ref">Consultation #${consultNo}</div>
        </div>
      </div>
      <div class="info-card">
        <div>
          <div class="label">Patient</div>
          <div class="value">${patient.first_name || ""} ${patient.last_name || ""}</div>
          <div class="muted">${patient.patient_code || "-"}</div>
        </div>
        <div>
          <div class="label">Date</div>
          <div class="value">${new Date().toLocaleString()}</div>
        </div>
      </div>
    `;
    const signatures = `
      <div class="signatures">
        <div class="signature-box">Doctor signature</div>
        <div class="signature-box">Patient signature</div>
      </div>
    `;

    if (type === "prescription") {
      const rows = prescriptionItems.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.drug_name || "-"}</td>
          <td>${item.dosage || "-"}</td>
          <td>${item.frequency || "-"}</td>
          <td>${item.duration || "-"}</td>
          <td>${item.notes || "-"}</td>
        </tr>
      `).join("");
      const body = `
        ${header}
        <div class="doc-title">Prescription</div>
        <div class="section"><strong>Illness type:</strong> ${prescriptionMeta.illness_type || "-"}</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Drug</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${signatures}
      `;
      openPrintWindow({ title: "Prescription", bodyHtml: body });
    }

    if (type === "certificate") {
      const body = `
        ${header}
        <div class="doc-title">Medical Certificate</div>
        <div class="section">
          <div><strong>Reason:</strong> ${certificate.reason || "-"}</div>
          <div><strong>Start:</strong> ${formatDateOnly(certificate.start_date)}</div>
          <div><strong>End:</strong> ${formatDateOnly(certificate.end_date)}</div>
          <div class="notes"><strong>Notes:</strong> ${certificate.notes || "-"}</div>
        </div>
        ${signatures}
      `;
      openPrintWindow({ title: "Medical Certificate", bodyHtml: body });
    }

    if (type === "tests") {
      const rows = testItems.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.test_name || "-"}</td>
          <td>${item.notes || "-"}</td>
          <td>${item.status || "-"}</td>
        </tr>
      `).join("");
      const body = `
        ${header}
        <h2>Test Requests</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Test</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
      openPrintWindow({ title: "Test Requests", bodyHtml: body });
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const diseaseRanking = useMemo(() => {
    const raw = statsData?.disease_ranking || statsData?.diseases || statsData?.disease_counts || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => ({
        name: item?.name || item?.disease || item?.illness || item?.label || "Unknown",
        count: Number(item?.count ?? item?.value ?? item?.total ?? 0),
      }))
      .filter((item) => item.name && Number.isFinite(item.count))
      .sort((a, b) => b.count - a.count);
  }, [statsData]);
  const maxDiseaseCount = diseaseRanking.reduce((max, item) => Math.max(max, item.count), 0) || 1;
  const diseaseBarColors = ["#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

  const statsSeries = statsData?.series || {};
  const seriesLabels = statsSeries.labels || [];
  const paymentsSeries = statsSeries.payments_cents || [];
  const patientsSeries = statsSeries.patients_count || [];
  const maxPayments = paymentsSeries.length ? Math.max(...paymentsSeries) : 1;
  const maxPatients = patientsSeries.length ? Math.max(...patientsSeries) : 1;
  const safeMaxPayments = maxPayments > 0 ? maxPayments : 1;
  const safeMaxPatients = maxPatients > 0 ? maxPatients : 1;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f6f7fb 0%, #f1f4fa 100%)",
        "--ink": "#111827",
        "--muted": "#6b7280",
        "--card": "#ffffff",
        "--accent": "#2f80ed",
        "--accent-2": "#f29c38",
        "--accent-3": "#27ae60",
        "--sidebar": "#0b1220",
        "--sidebar-2": "#1e1b4b",
        fontFamily: '\"Montserrat\", \"Segoe UI\", sans-serif',
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={0}>
        <Box
          sx={{
            width: { xs: "100%", md: 250 },
            minHeight: { md: "100vh" },
            position: { md: "sticky" },
            top: { md: 0 },
            height: { md: "100vh" },
            overflowY: { md: "auto" },
            background: "linear-gradient(180deg, var(--sidebar) 0%, var(--sidebar-2) 100%)",
            color: "#f9fafb",
            p: 3,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 3, cursor: "pointer" }}
            onClick={() => {
              setModuleFocus("");
              setShowPatients(false);
            }}
          >
            <LocalHospitalIcon sx={{ color: "#c7d2fe" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              ClinicSystem
            </Typography>
          </Stack>
          <Stack spacing={1} sx={{ color: "#d1d5db" }}>
            <Button
              fullWidth
              variant="text"
              startIcon={<PeopleAltIcon />}
              sx={sidebarButtonSx(moduleFocus === "patients")}
              onClick={() => {
                setShowPatients(true);
                setModuleFocus("patients");
                setPatientsPage(1);
                loadPatients(1, patientsFilters);
                setTimeout(() => {
                  patientsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 0);
              }}
            >
              Patient list
            </Button>
            <Button
              fullWidth
              variant="text"
              startIcon={<MedicationIcon />}
              sx={sidebarButtonSx(moduleFocus === "prescription")}
              disabled={!activeConsultation}
              onClick={() => {
                setModuleFocus("prescription");
                setShowPatients(false);
                setDrawerOpen(true);
              }}
            >
              Prescription
            </Button>
            <Button
              fullWidth
              variant="text"
              startIcon={<AssignmentTurnedInIcon />}
              sx={sidebarButtonSx(moduleFocus === "certificate")}
              disabled={!activeConsultation}
              onClick={() => {
                setModuleFocus("certificate");
                setShowPatients(false);
                setDrawerOpen(true);
              }}
            >
              Medical certificat
            </Button>
            <Button
              fullWidth
              variant="text"
              startIcon={<ScienceIcon />}
              sx={sidebarButtonSx(moduleFocus === "tests")}
              disabled={!activeConsultation}
              onClick={() => {
                setModuleFocus("tests");
                setShowPatients(false);
                setDrawerOpen(true);
              }}
            >
              Test requests
            </Button>
            <Button
              fullWidth
              variant="text"
              startIcon={<ImageIcon />}
              sx={sidebarButtonSx(moduleFocus === "radiology")}
              disabled={!activeConsultation}
              onClick={() => {
                setModuleFocus("radiology");
                setShowPatients(false);
                setDrawerOpen(true);
              }}
            >
              Radiology
            </Button>
            <Button
              fullWidth
              variant="text"
              startIcon={<LocalHospitalIcon />}
              sx={sidebarButtonSx(moduleFocus === "instructions")}
              disabled={!activeConsultation}
              onClick={() => {
                setModuleFocus("instructions");
                setShowPatients(false);
                setDrawerOpen(true);
              }}
            >
              Nurse instructions
            </Button>
            <Button
              fullWidth
              variant="text"
              startIcon={<HistoryIcon />}
              sx={sidebarButtonSx(moduleFocus === "traceability")}
              onClick={() => {
                setModuleFocus("traceability");
                setShowPatients(false);
                setDrawerOpen(false);
                setTimeout(() => {
                  traceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 0);
              }}
            >
              Patient Traceability
            </Button>
            <Button
              fullWidth
              variant="text"
              startIcon={<BarChartIcon />}
              sx={sidebarButtonSx(moduleFocus === "stats")}
              onClick={() => {
                setModuleFocus("stats");
                setShowPatients(false);
                statsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Statistiques
            </Button>
            <Button
              fullWidth
              variant="text"
              startIcon={<LogoutIcon />}
              sx={sidebarButtonSx(false)}
              onClick={logout}
            >
              Logout
            </Button>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Container sx={{ py: 3, width: "100%" }} maxWidth={false} disableGutters>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Stack sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ color: "var(--ink)", fontWeight: 700 }}>
            Doctor Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--muted)" }}>
            Current: {queue.current_number || "—"} | Waiting: {waitingCount}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search..."
            sx={{
              background: "#fff",
              borderRadius: 2,
              minWidth: 220,
            }}
          />
          <Stack alignItems="flex-end">
            <Typography variant="body2" sx={{ color: "var(--muted)" }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--muted)" }}>
              {role}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack>
          
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<SkipNextIcon />}
            onClick={handleNext}
            sx={{
              textTransform: "none",
              borderRadius: 2.5,
              px: 2.5,
              boxShadow: "0 10px 20px rgba(37,99,235,0.25)",
              background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
              "&:hover": { background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" },
            }}
          >
            Next
          </Button>
          <Button
            variant="outlined"
            onClick={() => loadQueue()}
            disabled={queueLoading}
            sx={{
              textTransform: "none",
              borderRadius: 2.5,
              px: 2.5,
              borderColor: "rgba(37,99,235,0.4)",
              color: "#1d4ed8",
              "&:hover": { borderColor: "#2563eb", background: "rgba(37,99,235,0.06)" },
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

          {!moduleFocus && (
            <Box
              sx={{
                mb: 2,
                width: "100%",
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              {[
                {
                  label: "Queue date",
                  value: queue.date || "-",
                  accent: "#2563eb",
                  gradient: "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)",
                  icon: <BarChartIcon />,
                },
                {
                  label: "Current number",
                  value: queue.current_number || "—",
                  accent: "#f43f5e",
                  gradient: "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)",
                  icon: <AssignmentTurnedInIcon />,
                },
                {
                  label: "Total waiting",
                  value: waitingCount,
                  accent: "#10b981",
                  gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                  icon: <PeopleAltIcon />,
                },
                {
                  label: "Consultations",
                  value: statsData?.metrics?.consultations_count ?? "—",
                  accent: "#f59e0b",
                  gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  icon: <LocalHospitalIcon />,
                },
              ].map((card) => (
                <Paper
                  key={card.label}
                  sx={{
                    p: 2,
                    minHeight: 96,
                    width: "100%",
                    borderRadius: 3,
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: card.gradient,
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 12px 26px rgba(15,23,42,0.12)",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 6,
                      background: card.accent,
                    },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      right: -30,
                      top: -30,
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.55)",
                    },
                  }}
                >
                  <Stack sx={{ pl: 1 }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.85, color: "#0f172a" }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "#0f172a" }}>
                      {card.value}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.85)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: card.accent,
                      boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
                      "& svg": { fontSize: 22 },
                    }}
                  >
                    {card.icon}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

      {(!moduleFocus || moduleFocus === "queue") && (
        <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>Queue date</Typography>
            <Typography variant="h6">{queue.date || "-"}</Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: { xs: "left", md: "center" } }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>Current number</Typography>
            <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
              {queue.current_number || "—"}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: { xs: "left", md: "right" } }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="waiting">Waiting only</MenuItem>
                <MenuItem value="consulted">Consulted only</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>

        {queueError && <Alert severity="error" sx={{ mt: 2 }}>{queueError}</Alert>}
      </Paper>

      <Paper
        sx={{
          overflowX: "auto",
          borderRadius: 3,
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 12px 26px rgba(15,23,42,0.12)",
        }}
      >
        {queueLoading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ background: "linear-gradient(90deg, rgba(224,242,254,0.9) 0%, rgba(219,234,254,0.7) 100%)" }}>
                <TableCell>Number</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Arrival</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No entries</TableCell>
                </TableRow>
              ) : (
                displayRows.map((row) => {
                  const isCurrent = row.number === queue.current_number;
                  const isActive = activeEntry?.id === row.id && !!activeConsultation;
                  const rowBaseBg = isCurrent ? "rgba(37,99,235,0.08)" : "inherit";
                  const rowHoverBg = isCurrent ? "rgba(37,99,235,0.12)" : "rgba(37,99,235,0.06)";
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        backgroundColor: rowBaseBg,
                        "& > td": { backgroundColor: rowBaseBg },
                        "&:hover > td": { backgroundColor: rowHoverBg },
                        "&.Mui-selected > td": { backgroundColor: rowBaseBg },
                        "&.Mui-selected:hover > td": { backgroundColor: rowHoverBg },
                      }}
                    >
                      <TableCell>{row.number}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {row.patient?.first_name} {row.patient?.last_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.patient?.patient_code || "-"}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.status} sx={statusChipSx(row.status)} />
                      </TableCell>
                      <TableCell>{formatDateOnly(row.created_at)}</TableCell>
                      <TableCell align="right">
                        {isCurrent ? (
                          <Button
                            size="small"
                            variant={isActive ? "outlined" : "contained"}
                            startIcon={isActive ? <CancelIcon /> : <AddIcon />}
                            onClick={() => {
                              setActiveEntry(row);
                              handleStartOrCancel();
                            }}
                          >
                            {isActive ? "Cancel consultation" : "New consultation"}
                          </Button>
                        ) : (
                          <Typography variant="body2" sx={{ opacity: 0.6 }}>
                            Not current
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
      {queueMeta?.last_page > 1 && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination count={queueMeta.last_page} page={queueMeta.current_page} onChange={(_, p) => setQueuePage(p)} />
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
            Page {queueMeta.current_page}/{queueMeta.last_page} — Total: {queueMeta.total}
          </Typography>
        </Stack>
      )}
        </>
      )}

      {moduleFocus === "traceability" && (
        <>
          <Paper
            ref={traceSectionRef}
            sx={{
              p: 2,
              mt: 3,
              mb: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)",
              boxShadow: "0 12px 26px rgba(15,23,42,0.08)",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Patient Traceability
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--muted)" }}>
                  {currentPatient
                    ? `${currentPatient.first_name || ""} ${currentPatient.last_name || ""} (${currentPatient.patient_code || "-"})`
                    : "No current patient selected"}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => loadTraceability(currentPatientId, { excludeId: activeConsultation?.id || currentEntry?.consultation?.id || null })}
                disabled={!currentPatientId || traceLoading}
              >
                Refresh history
              </Button>
            </Stack>
            {traceError && <Alert severity="error" sx={{ mt: 2 }}>{traceError}</Alert>}
          </Paper>

          {traceLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
          ) : traceRows.length === 0 ? (
            <Alert severity="info">No previous consultations for this patient.</Alert>
          ) : (
            <Stack spacing={2}>
              {traceRows.map((c, idx) => {
                const palette = tracePalette[idx % tracePalette.length];
                const presCount = c?.prescription?.items?.length || 0;
                const certCount = c?.medical_certificate ? 1 : 0;
                const testCount = c?.test_request?.items?.length || 0;
                const instrCount = c?.nurse_instructions?.length || 0;
                const expanded = !!traceExpanded[c.id];

                return (
                  <Paper
                    key={c.id}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: palette.bg,
                      border: "1px solid rgba(15,23,42,0.08)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: palette.accent }} />
                    <Stack spacing={1} sx={{ pl: 1 }}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {formatDateOnly(c.created_at)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "var(--muted)" }}>
                            Doctor: {c.doctor?.name || "-"} | Consultation #{c.consultation_number || c.id}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant={expanded ? "outlined" : "contained"}
                          onClick={() => setTraceExpanded((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                        >
                          {expanded ? "Hide details" : "Details"}
                        </Button>
                      </Stack>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ flexWrap: "wrap" }}>
                        <Chip size="small" label={`Prescriptions: ${presCount}`} sx={{ bgcolor: "rgba(79,70,229,0.12)", color: "#1e1b4b" }} />
                        <Chip size="small" label={`Certificates: ${certCount}`} sx={{ bgcolor: "rgba(16,185,129,0.12)", color: "#065f46" }} />
                        <Chip size="small" label={`Tests: ${testCount}`} sx={{ bgcolor: "rgba(249,115,22,0.12)", color: "#7c2d12" }} />
                        <Chip size="small" label={`Nurse instructions: ${instrCount}`} sx={{ bgcolor: "rgba(14,165,233,0.12)", color: "#0c4a6e" }} />
                      </Stack>
                      <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 2, p: 2, borderRadius: 2, background: "rgba(255,255,255,0.65)", border: "1px solid rgba(148,163,184,0.25)" }}>
                          <Stack spacing={2}>
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle2">Chief complaint</Typography>
                              <Typography variant="body2">{c.chief_complaint || "-"}</Typography>
                            </Stack>
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle2">Symptoms</Typography>
                              <Typography variant="body2">{c.symptoms || "-"}</Typography>
                            </Stack>
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle2">Diagnosis</Typography>
                              <Typography variant="body2">{c.diagnosis || "-"}</Typography>
                            </Stack>
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle2">Notes</Typography>
                              <Typography variant="body2">{c.notes || "-"}</Typography>
                            </Stack>
                            <Divider />
                            <Stack spacing={1}>
                              <Typography variant="subtitle2">Medicaments (prescription)</Typography>
                              {(c.prescription?.items?.length || 0) === 0 ? (
                                <Typography variant="body2" sx={{ color: "var(--muted)" }}>No prescription items.</Typography>
                              ) : (
                                <Stack spacing={1}>
                                  {c.prescription.items.map((item, i) => (
                                    <Box key={`${c.id}-pres-${i}`} sx={{ p: 1.5, borderRadius: 2, background: "rgba(79,70,229,0.08)" }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.drug_name || "-"}</Typography>
                                      <Typography variant="caption" sx={{ color: "var(--muted)" }}>
                                        Dosage: {item.dosage || "-"} | Frequency: {item.frequency || "-"} | Duration: {item.duration || "-"}
                                      </Typography>
                                      {item.notes && (
                                        <Typography variant="caption" sx={{ display: "block", color: "var(--muted)" }}>
                                          Notes: {item.notes}
                                        </Typography>
                                      )}
                                    </Box>
                                  ))}
                                </Stack>
                              )}
                            </Stack>
                            <Divider />
                            <Stack spacing={1}>
                              <Typography variant="subtitle2">Medical certificate</Typography>
                              {c.medical_certificate ? (
                                <Box sx={{ p: 1.5, borderRadius: 2, background: "rgba(16,185,129,0.08)" }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.medical_certificate.reason || "-"}</Typography>
                                  <Typography variant="caption" sx={{ color: "var(--muted)" }}>
                                    Start: {formatDateOnly(c.medical_certificate.start_date)} | End: {formatDateOnly(c.medical_certificate.end_date)}
                                  </Typography>
                                  {c.medical_certificate.notes && (
                                    <Typography variant="caption" sx={{ display: "block", color: "var(--muted)" }}>
                                      Notes: {c.medical_certificate.notes}
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ color: "var(--muted)" }}>No medical certificate.</Typography>
                              )}
                            </Stack>
                            <Divider />
                            <Stack spacing={1}>
                              <Typography variant="subtitle2">Test requests</Typography>
                              {(c.test_request?.items?.length || 0) === 0 ? (
                                <Typography variant="body2" sx={{ color: "var(--muted)" }}>No test requests.</Typography>
                              ) : (
                                <Stack spacing={1}>
                                  {c.test_request.items.map((item, i) => (
                                    <Box key={`${c.id}-test-${i}`} sx={{ p: 1.5, borderRadius: 2, background: "rgba(249,115,22,0.08)" }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.test_name || "-"}</Typography>
                                      <Typography variant="caption" sx={{ color: "var(--muted)" }}>Notes: {item.notes || "-"}</Typography>
                                      <Typography variant="caption" sx={{ color: "var(--muted)" }}>Status: {item.status || "-"}</Typography>
                                    </Box>
                                  ))}
                                </Stack>
                              )}
                            </Stack>
                            <Divider />
                            <Stack spacing={1}>
                              <Typography variant="subtitle2">Nurse instructions</Typography>
                              {(c.nurse_instructions?.length || 0) === 0 ? (
                                <Typography variant="body2" sx={{ color: "var(--muted)" }}>No nurse instructions.</Typography>
                              ) : (
                                <Stack spacing={1}>
                                  {c.nurse_instructions.map((inst) => (
                                    <Box key={inst.id} sx={{ p: 1.5, borderRadius: 2, background: "rgba(14,165,233,0.08)" }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{inst.instruction || "-"}</Typography>
                                      <Typography variant="caption" sx={{ color: "var(--muted)" }}>
                                        Status: {inst.status || "-"} | Nurse: {inst.assigned_to_nurse?.name || "Unassigned"}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Stack>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      </Collapse>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </>
      )}

      {(!moduleFocus || moduleFocus === "stats") && (
      <Paper
        ref={statsSectionRef}
        sx={{
          p: 2.5,
          mt: 3,
          mb: 2,
          borderRadius: 3,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 14px 28px rgba(15,23,42,0.12)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
            Statistics
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Period</InputLabel>
              <Select
                label="Period"
                value={statsPeriod}
                onChange={(e) => setStatsPeriod(e.target.value)}
              >
                <MenuItem value="day">Today</MenuItem>
                <MenuItem value="week">This week</MenuItem>
                <MenuItem value="month">This month</MenuItem>
                <MenuItem value="year">This year</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            {statsPeriod === "custom" && (
              <>
                <TextField
                  label="From"
                  type="date"
                  size="small"
                  value={statsStart}
                  onChange={(e) => setStatsStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="To"
                  type="date"
                  size="small"
                  value={statsEnd}
                  onChange={(e) => setStatsEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
            {(role === "doctor-manager" || role === "admin") && (
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Doctor</InputLabel>
                <Select
                  label="Doctor"
                  value={statsDoctorId}
                  onChange={(e) => setStatsDoctorId(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {statsDoctors.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button variant="outlined" onClick={loadStats} disabled={statsLoading}>
              Refresh
            </Button>
          </Stack>
        </Stack>

        {statsError && <Alert severity="error" sx={{ mt: 2 }}>{statsError}</Alert>}

        {statsLoading ? (
          <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
                width: "100%",
                alignItems: "stretch",
              }}
            >
              {[
                {
                  label: "Patients",
                  value: statsData?.metrics?.patients_unique ?? 0,
                  sub: "Unique in period",
                  accent: "#2563eb",
                  gradient: "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)",
                  icon: <PeopleAltIcon />,
                },
                {
                  label: "Prescriptions",
                  value: statsData?.metrics?.prescriptions_count ?? 0,
                  sub: "Total issued",
                  accent: "#8b5cf6",
                  gradient: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
                  icon: <MedicationIcon />,
                },
                {
                  label: "Certificates",
                  value: statsData?.metrics?.certificates_count ?? 0,
                  sub: "Medical notes",
                  accent: "#10b981",
                  gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                  icon: <AssignmentTurnedInIcon />,
                },
                {
                  label: "Nurse instructions",
                  value: statsData?.metrics?.nurse_instructions_count ?? 0,
                  sub: "Sent to nurses",
                  accent: "#f59e0b",
                  gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  icon: <LocalHospitalIcon />,
                },
              ].map((card) => (
                <Paper
                  key={card.label}
                  sx={{
                    p: 2.2,
                    borderRadius: 3,
                    background: card.gradient,
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 6,
                      background: card.accent,
                    },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      right: -30,
                      top: -30,
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.35)",
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pl: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "#111827", opacity: 0.8 }}>
                        {card.label}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#0f172a", mt: 0.5 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#475569" }}>
                        {card.sub}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.85)",
                        display: "grid",
                        placeItems: "center",
                        color: card.accent,
                        boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
                        "& svg": { fontSize: 26 },
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>

            <Paper
              sx={{
                mt: 2,
                p: 2.5,
                borderRadius: 3,
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid rgba(15,23,42,0.08)",
                boxShadow: "0 12px 26px rgba(15,23,42,0.12)",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Disease ranking</Typography>
                  <Typography variant="body2" sx={{ color: "var(--muted)" }}>
                    {statsData?.range?.start || "-"} to {statsData?.range?.end || "-"}
                  </Typography>
                </Box>
                <Chip size="small" label="Top conditions" sx={{ bgcolor: "rgba(15,118,110,0.12)", color: "#0f766e" }} />
              </Stack>
              {diseaseRanking.length === 0 ? (
                <Typography variant="body2" sx={{ color: "var(--muted)" }}>No disease ranking data.</Typography>
              ) : (
                <Stack spacing={1.2}>
                  {diseaseRanking.map((item, index) => {
                    const widthPct = Math.max(6, Math.round((item.count / maxDiseaseCount) * 100));
                    const barColor = diseaseBarColors[index % diseaseBarColors.length];
                    return (
                      <Box
                        key={`${item.name}-${index}`}
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid rgba(148,163,184,0.35)",
                          background: "rgba(248,250,252,0.9)",
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${widthPct}%`,
                            background: `linear-gradient(90deg, ${barColor} 0%, rgba(255,255,255,0.2) 100%)`,
                          }}
                        />
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ position: "relative", px: 1.5, py: 1 }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                            {index + 1}. {item.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                            {item.count}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2.5, height: "100%", borderRadius: 3, background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Income & Patients</Typography>
                      <Typography variant="body2" sx={{ color: "var(--muted)" }}>
                        {statsData?.range?.start || "-"} to {statsData?.range?.end || "-"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label="Income" sx={{ bgcolor: "rgba(37,99,235,0.14)", color: "#1e3a8a" }} />
                      <Chip size="small" label="Patients" sx={{ bgcolor: "rgba(16,185,129,0.14)", color: "#065f46" }} />
                    </Stack>
                  </Stack>
                  <Box sx={{ overflowX: "auto" }}>
                    {seriesLabels.length === 0 ? (
                      <Typography variant="body2" sx={{ color: "var(--muted)" }}>No chart data.</Typography>
                    ) : (
                      <Box
                        sx={{
                          minWidth: Math.max(480, seriesLabels.length * 42),
                          display: "grid",
                          gridTemplateColumns: `repeat(${seriesLabels.length}, minmax(26px, 1fr))`,
                          gap: 1.5,
                          alignItems: "end",
                          height: 220,
                          pb: 2,
                          position: "relative",
                        }}
                      >
                        {seriesLabels.map((label, idx) => {
                          const pay = paymentsSeries[idx] || 0;
                          const pat = patientsSeries[idx] || 0;
                          const payHeight = Math.max(6, Math.round((pay / safeMaxPayments) * 160));
                          const patHeight = Math.max(6, Math.round((pat / safeMaxPatients) * 160));
                          return (
                            <Box key={`${label}-${idx}`} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                              <Stack spacing={0.25} alignItems="center" sx={{ minHeight: 28 }}>
                                <Typography variant="caption" sx={{ color: "#1e3a8a", fontWeight: 600 }}>
                                  {(pay / 100).toFixed(0)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#065f46", fontWeight: 600 }}>
                                  {pat}
                                </Typography>
                              </Stack>
                              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 170 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: payHeight,
                                    borderRadius: 2,
                                    background: "linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)",
                                  }}
                                />
                                <Box
                                  sx={{
                                    width: 12,
                                    height: patHeight,
                                    borderRadius: 2,
                                    background: "linear-gradient(180deg, #34d399 0%, #10b981 100%)",
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ color: "var(--muted)" }}>
                                {shortSeriesLabel(label, statsSeries.unit)}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2.5, height: "100%", borderRadius: 3, background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Income snapshot</Typography>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                        border: "1px solid rgba(37,99,235,0.2)",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#1e3a8a" }}>Total income (DZD)</Typography>
                      <Typography variant="h4" sx={{ mt: 0.5, color: "#1e3a8a", fontWeight: 700 }}>
                        {statsData?.metrics ? (statsData.metrics.billed_total_cents / 100).toFixed(2) : "-"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      <Box
                        sx={{
                          flex: 1,
                          p: 1.5,
                          borderRadius: 2,
                          background: "rgba(16,185,129,0.12)",
                          border: "1px solid rgba(16,185,129,0.2)",
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "#0f766e" }}>Collected</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {statsData?.metrics ? (statsData.metrics.payments_total_cents / 100).toFixed(2) : "-"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          p: 1.5,
                          borderRadius: 2,
                          background: "rgba(244,63,94,0.12)",
                          border: "1px solid rgba(244,63,94,0.2)",
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "#be123c" }}>Unpaid</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {statsData?.metrics ? (statsData.metrics.unpaid_remaining_cents / 100).toFixed(2) : "-"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
      )}

      {showPatients && (!moduleFocus || moduleFocus === "patients") && (
        <>
          <div ref={patientsSectionRef} />
          {patientsError && <Alert severity="error" sx={{ mt: 2 }}>{patientsError}</Alert>}

          <Paper sx={{ p: 2, mb: 2, mt: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1">Patients list</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openPatientCreate}>
                New Patient
              </Button>
            </Stack>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="From"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={patientsFilters.created_from}
                  onChange={setPatientFilter("created_from")}
                  fullWidth
                />
                <TextField
                  label="To"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={patientsFilters.created_to}
                  onChange={setPatientFilter("created_to")}
                  fullWidth
                />
                <TextField
                  label="Search (code/phone/name)"
                  size="small"
                  fullWidth
                  value={patientsFilters.search}
                  onChange={setPatientFilter("search")}
                />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="First name" size="small" fullWidth value={patientsFilters.first_name} onChange={setPatientFilter("first_name")} />
                <TextField label="Last name" size="small" fullWidth value={patientsFilters.last_name} onChange={setPatientFilter("last_name")} />
                <TextField label="Phone" size="small" fullWidth value={patientsFilters.phone} onChange={setPatientFilter("phone")} />

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Gender</InputLabel>
                  <Select label="Gender" value={patientsFilters.gender} onChange={setPatientFilter("gender")}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Place of birth" size="small" fullWidth value={patientsFilters.place_of_birth} onChange={setPatientFilter("place_of_birth")} />
                <TextField label="Address" size="small" fullWidth value={patientsFilters.address} onChange={setPatientFilter("address")} />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="DOB exact" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth value={patientsFilters.dob_exact} onChange={setPatientFilter("dob_exact")} />
                <TextField label="DOB from" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth value={patientsFilters.dob_from} onChange={setPatientFilter("dob_from")} />
                <TextField label="DOB to" type="date" size="small" InputLabelProps={{ shrink: true }} fullWidth value={patientsFilters.dob_to} onChange={setPatientFilter("dob_to")} />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Age exact" type="number" size="small" fullWidth value={patientsFilters.age_exact} onChange={setPatientFilter("age_exact")} />
                <TextField label="Age min" type="number" size="small" fullWidth value={patientsFilters.age_min} onChange={setPatientFilter("age_min")} />
                <TextField label="Age max" type="number" size="small" fullWidth value={patientsFilters.age_max} onChange={setPatientFilter("age_max")} />

                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    label="Sort by"
                    value={patientsFilters.sort_by}
                    onChange={(e) => applyPatientSort(e.target.value, patientsFilters.sort_dir)}
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
                    value={patientsFilters.sort_dir}
                    onChange={(e) => applyPatientSort(patientsFilters.sort_by, e.target.value)}
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
                    setPatientsPage(1);
                    setPatientsFilters(reset);
                    loadPatients(1, reset);
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ overflowX: "auto" }}>
            {patientsLoading ? (
              <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(47,128,237,0.06)" }}>
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
                  {patientsRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">No patients found</TableCell>
                    </TableRow>
                  ) : (
                    patientsRows.map((p) => (
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
                          <IconButton size="small" onClick={() => alert(`View patient #${p.id}`)} title="View" sx={{ color: "#0ea5e9" }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => openPatientEdit(p)} title="Edit" sx={{ color: "#2563eb" }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setPatientDeleteId(p.id)} title="Delete" sx={{ color: "#ef4444" }}>
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

          {patientsMeta?.last_page > 1 && (
            <Stack alignItems="center" sx={{ mt: 2 }}>
              <Pagination count={patientsMeta.last_page} page={patientsMeta.current_page} onChange={onPatientsPageChange} />
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                Page {patientsMeta.current_page}/{patientsMeta.last_page} — Total: {patientsMeta.total}
              </Typography>
            </Stack>
          )}
        </>
      )}

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 420, p: 2 }}>
          <Typography variant="h6">Consultation Modules</Typography>
          <Divider sx={{ my: 2 }} />

          {!activeConsultation ? (
            <Alert severity="info">Start a consultation from the current queue entry to enable modules.</Alert>
          ) : (
            <>
              {moduleError && <Alert severity="error" sx={{ mb: 2 }}>{moduleError}</Alert>}
              {moduleNotice && <Alert severity="success" sx={{ mb: 2 }}>{moduleNotice}</Alert>}

              {(!moduleFocus || moduleFocus === "prescription") && (
                <>
                  <Typography ref={prescriptionRef} variant="subtitle2" sx={{ mb: 1 }}>Prescription</Typography>
                  <Autocomplete
                    freeSolo
                    options={illnessTypeOptions}
                    value={prescriptionMeta.illness_type || ""}
                    inputValue={prescriptionMeta.illness_type || ""}
                    onChange={(_, value) => setPrescriptionMeta((prev) => ({ ...prev, illness_type: value || "" }))}
                    onInputChange={(_, value) => setPrescriptionMeta((prev) => ({ ...prev, illness_type: value }))}
                    renderInput={(params) => (
                      <TextField {...params} label="Illness type" size="small" placeholder="Select or type..." />
                    )}
                    sx={{ mb: 2 }}
                  />
                  {prescriptionItems.map((item, idx) => (
                    <Stack key={idx} spacing={1} sx={{ mb: 2 }}>
                      <TextField
                        label="Drug name"
                        size="small"
                        value={item.drug_name}
                        onChange={(e) => {
                          const next = [...prescriptionItems];
                          next[idx] = { ...next[idx], drug_name: e.target.value };
                          setPrescriptionItems(next);
                        }}
                      />
                      <Stack direction="row" spacing={1}>
                        <TextField
                          label="Dosage"
                          size="small"
                          value={item.dosage}
                          onChange={(e) => {
                            const next = [...prescriptionItems];
                            next[idx] = { ...next[idx], dosage: e.target.value };
                            setPrescriptionItems(next);
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Frequency"
                          size="small"
                          value={item.frequency}
                          onChange={(e) => {
                            const next = [...prescriptionItems];
                            next[idx] = { ...next[idx], frequency: e.target.value };
                            setPrescriptionItems(next);
                          }}
                          fullWidth
                        />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          label="Duration"
                          size="small"
                          value={item.duration}
                          onChange={(e) => {
                            const next = [...prescriptionItems];
                            next[idx] = { ...next[idx], duration: e.target.value };
                            setPrescriptionItems(next);
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Notes"
                          size="small"
                          value={item.notes}
                          onChange={(e) => {
                            const next = [...prescriptionItems];
                            next[idx] = { ...next[idx], notes: e.target.value };
                            setPrescriptionItems(next);
                          }}
                          fullWidth
                        />
                      </Stack>
                    </Stack>
                  ))}
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button size="small" onClick={() => setPrescriptionItems((s) => [...s, emptyPrescriptionItem()])}>
                      Add item
                    </Button>
                    <Button size="small" variant="contained" onClick={savePrescription} disabled={moduleLoading}>
                      Save
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrint("prescription")}
                      disabled={!hasPrescription}
                    >
                      Print
                    </Button>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {(!moduleFocus || moduleFocus === "certificate") && (
                <>
                  <Typography ref={certificateRef} variant="subtitle2" sx={{ mb: 1 }}>Medical certificate</Typography>
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <TextField
                      label="Reason"
                      size="small"
                      value={certificate.reason}
                      onChange={(e) => setCertificate((s) => ({ ...s, reason: e.target.value }))}
                    />
                    <Stack direction="row" spacing={1}>
                      <TextField
                        label="Start"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={certificate.start_date}
                        onChange={(e) => setCertificate((s) => ({ ...s, start_date: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label="End"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={certificate.end_date}
                        onChange={(e) => setCertificate((s) => ({ ...s, end_date: e.target.value }))}
                        fullWidth
                      />
                    </Stack>
                    <TextField
                      label="Notes"
                      size="small"
                      value={certificate.notes}
                      onChange={(e) => setCertificate((s) => ({ ...s, notes: e.target.value }))}
                      multiline
                      minRows={2}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" onClick={saveCertificate} disabled={moduleLoading}>
                        Save certificate
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() => handlePrint("certificate")}
                        disabled={!hasCertificate}
                      >
                        Print
                      </Button>
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {(!moduleFocus || moduleFocus === "tests") && (
                <>
                  <Typography ref={testsRef} variant="subtitle2" sx={{ mb: 1 }}>Test requests</Typography>
                  {testItems.map((item, idx) => (
                    <Stack key={idx} spacing={1} sx={{ mb: 2 }}>
                      <TextField
                        label="Test name"
                        size="small"
                        value={item.test_name}
                        onChange={(e) => {
                          const next = [...testItems];
                          next[idx] = { ...next[idx], test_name: e.target.value };
                          setTestItems(next);
                        }}
                      />
                      <TextField
                        label="Notes"
                        size="small"
                        value={item.notes}
                        onChange={(e) => {
                          const next = [...testItems];
                          next[idx] = { ...next[idx], notes: e.target.value };
                          setTestItems(next);
                        }}
                      />
                    </Stack>
                  ))}
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button size="small" onClick={() => setTestItems((s) => [...s, emptyTestItem()])}>
                      Add item
                    </Button>
                    <Button size="small" variant="contained" onClick={saveTestRequest} disabled={moduleLoading}>
                      Save tests
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrint("tests")}
                      disabled={!hasTestRequest}
                    >
                      Print
                    </Button>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {(!moduleFocus || moduleFocus === "radiology") && (
                <>
                  <Typography ref={radiologyRef} variant="subtitle2" sx={{ mb: 1 }}>Radiology</Typography>
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <input
                      type="file"
                      onChange={(e) => setRadiologyFile(e.target.files?.[0] || null)}
                    />
                    <Button size="small" variant="contained" onClick={uploadRadiology} disabled={moduleLoading || !radiologyFile}>
                      Upload
                    </Button>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {(!moduleFocus || moduleFocus === "instructions") && (
                <>
                  <Typography ref={instructionsRef} variant="subtitle2" sx={{ mb: 1 }}>Nurse instructions</Typography>
                  <Stack spacing={1}>
                    <TextField
                      label="Instruction"
                      size="small"
                      value={instructionForm.instruction}
                      onChange={(e) => setInstructionForm((s) => ({ ...s, instruction: e.target.value }))}
                      multiline
                      minRows={2}
                    />
                    <FormControl size="small">
                      <InputLabel>Nurse</InputLabel>
                      <Select
                        label="Nurse"
                        value={instructionForm.assigned_to_nurse_id || ""}
                        onChange={(e) => setInstructionForm((s) => ({ ...s, assigned_to_nurse_id: e.target.value }))}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {nurseUsersLoading && <MenuItem disabled>Loading...</MenuItem>}
                        {nurseUsers.map((n) => (
                          <MenuItem key={n.id} value={String(n.id)}>
                            {n.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button size="small" variant="contained" onClick={sendInstruction} disabled={moduleLoading}>
                      Send instruction
                    </Button>
                  </Stack>
                </>
              )}
            </>
          )}
        </Box>
      </Drawer>

      <Dialog open={patientFormOpen} onClose={() => setPatientFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{patientFormMode === "create" ? "Create patient" : `Edit patient #${patientFormId}`}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="First name" value={patientForm.first_name} onChange={setPatientField("first_name")}
              error={!!patientFormErrors.first_name} helperText={patientFormErrors.first_name?.[0]} fullWidth
            />
            <TextField label="Last name" value={patientForm.last_name} onChange={setPatientField("last_name")}
              error={!!patientFormErrors.last_name} helperText={patientFormErrors.last_name?.[0]} fullWidth
            />
            <TextField label="Phone" value={patientForm.phone} onChange={setPatientField("phone")}
              error={!!patientFormErrors.phone} helperText={patientFormErrors.phone?.[0]} fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField label="DOB" type="date" value={patientForm.dob} onChange={setPatientField("dob")} InputLabelProps={{ shrink: true }} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select label="Gender" value={patientForm.gender} onChange={setPatientField("gender")}>
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Address" value={patientForm.address} onChange={setPatientField("address")} fullWidth />
            <TextField label="Medical history summary" value={patientForm.medical_history_summary} onChange={setPatientField("medical_history_summary")} fullWidth multiline minRows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientFormOpen(false)} disabled={patientFormLoading}>Cancel</Button>
          <Button variant="contained" onClick={submitPatientForm} disabled={patientFormLoading}>
            {patientFormLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!patientDeleteId} onClose={() => setPatientDeleteId(null)}>
        <DialogTitle>Delete patient</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete patient #{patientDeleteId}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientDeleteId(null)} disabled={patientDeleteLoading}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doPatientDelete} disabled={patientDeleteLoading}>
            {patientDeleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={priceOpen} onClose={() => setPriceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set consultation price</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl size="small">
              <InputLabel>Pricing</InputLabel>
              <Select
                label="Pricing"
                value={priceIsFree ? "free" : "paid"}
                onChange={(e) => setPriceIsFree(e.target.value === "free")}
              >
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="free">Free</MenuItem>
              </Select>
            </FormControl>
            {!priceIsFree && (
              <TextField
                label="Price (DZD)"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriceOpen(false)} disabled={priceLoading}>Cancel</Button>
          <Button variant="contained" onClick={submitPrice} disabled={priceLoading}>
            {priceLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
          </Container>
        </Box>
      </Stack>
    </Box>
  );
}
