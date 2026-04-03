"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Chart from "chart.js/auto";
import { BarChart3, Building2, CheckCircle2, Clock3, LayoutDashboard, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { apiBase, appRoutes } from "../../scripts/runtime-config.js";
import { BodyConfig } from "../../next/body-config.jsx";
import { ChatbotWidget } from "../public/ChatbotClient.jsx";
import { LocationMapCard } from "../shared/LocationMapCard.jsx";

const wards = Array.from({ length: 33 }, (_, index) => String(index + 1));

const chartColors = {
  blue: "rgba(26,58,107,0.85)",
  green: "rgba(40,167,69,0.85)",
  amber: "rgba(255,193,7,0.85)",
  red: "rgba(220,53,69,0.85)",
  teal: "rgba(32,178,170,0.85)",
  purple: "rgba(111,66,193,0.85)",
  palette: ["#1a3a6b", "#2ecc71", "#f39c12", "#e74c3c", "#3498db", "#9b59b6", "#1abc9c", "#e67e22", "#e91e63", "#00bcd4"],
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function EmptyState({ text }) {
  return <div className="admin-empty-state">{text}</div>;
}

function SummaryCards({ cards }) {
  return (
    <>
      {cards.map((card) => {
        const MetricIcon = card.icon;
        return (
          <article className={`admin-orbit-metric ${card.tone || ""}`} key={card.label}>
            {MetricIcon ? (
              <div className="admin-orbit-metric-icon">
                <MetricIcon size={18} />
              </div>
            ) : null}
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.note || ""}</span>
          </article>
        );
      })}
    </>
  );
}

function BarStack({ items, emptyText, formatter = (item) => `${item.count}` }) {
  if (!items.length) return <EmptyState text={emptyText} />;
  const max = Math.max(...items.map((item) => item.count || item.total || 0), 1);
  return (
    <div className="admin-orbit-bars">
      {items.map((item) => {
        const value = item.count || item.total || 0;
        return (
          <div className="admin-orbit-bar" key={item.label}>
            <div className="admin-orbit-bar-head">
              <span>{item.label}</span>
              <strong>{formatter(item)}</strong>
            </div>
            <div className="admin-orbit-bar-track">
              <div className="admin-orbit-bar-fill" style={{ width: `${Math.max(10, (value / max) * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompactCardList({ items, emptyText, onOpen }) {
  if (!items.length) return <EmptyState text={emptyText} />;
  return (
    <>
      {items.map((item) => (
        <article className="admin-orbit-card compact" key={item.tokenNumber || item.name}>
          <div className="admin-orbit-card-head">
            <span className={`admin-orbit-pill ${item.status || ""}`}>{(item.status || "open").replaceAll("_", " ")}</span>
            <strong>{item.tokenNumber || item.name}</strong>
          </div>
          <h4>{item.title || item.name}</h4>
          <p>{item.assignedOfficeLabel || item.text || item.reviewMeta?.note || "-"}</p>
          {item.tokenNumber ? (
            <div className="admin-orbit-card-actions">
              <button type="button" className="button compact-button" onClick={() => onOpen?.(item.tokenNumber)}>
                Open
              </button>
            </div>
          ) : null}
        </article>
      ))}
    </>
  );
}

function ChartCanvas({ type, data, options, emptyText }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.datasets?.length || !data.datasets[0]?.data?.length) return undefined;

    const chart = new Chart(canvas, {
      type,
      data,
      options,
    });

    return () => {
      chart.destroy();
    };
  }, [data, options, type]);

  if (!data?.datasets?.length || !data.datasets[0]?.data?.length) {
    return <EmptyState text={emptyText} />;
  }

  return <canvas ref={canvasRef} />;
}

export function AdminPanelClient({ initialSection = "dashboard", initialOversightTab = "escalated" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState(null);
  const [adminAuthToken, setAdminAuthToken] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [rotations, setRotations] = useState([]);
  const [oversight, setOversight] = useState({
    escalated: [],
    invalidPending: [],
    officerActionReviews: [],
  });
  const [complaints, setComplaints] = useState([]);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [activeOversightTab, setActiveOversightTab] = useState(initialOversightTab);
  const [selectedOversightToken, setSelectedOversightToken] = useState("");
  const [selectedAnalyticsToken, setSelectedAnalyticsToken] = useState("");
  const [loadingError, setLoadingError] = useState("");
  const [officerFormMessage, setOfficerFormMessage] = useState({ type: "", text: "" });
  const [rotationFormMessage, setRotationFormMessage] = useState({ type: "", text: "" });
  const [oversightFormMessage, setOversightFormMessage] = useState({ type: "", text: "" });
  const [departmentFormMessage, setDepartmentFormMessage] = useState({ type: "", text: "" });
  const [analyticsFilters, setAnalyticsFilters] = useState({
    departmentCode: "",
    officerId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [officerForm, setOfficerForm] = useState({
    editingOfficerId: "",
    officeType: "department",
    departmentCode: "",
    sectionName: "",
    wardNumber: "",
    name: "",
    email: "",
    loginId: "",
    password: "",
    active: true,
  });
  const [rotationForm, setRotationForm] = useState({
    officerId: "",
    startDate: "",
    endDate: "",
  });
  const [oversightForm, setOversightForm] = useState({
    action: "transfer_department",
    invalidAction: "approve_invalid",
    reviewAction: "validate_review",
    targetDivisionName: "",
    targetSectionName: "",
    comment: "",
  });
  const [departmentForm, setDepartmentForm] = useState({
    editingCode: "",
    code: "",
    name: "",
    type: "Mahashakha",
    description: "",
  });
  const [pointsForms, setPointsForms] = useState({});
  const adminSectionRoutes = appRoutes.adminSections || {
    dashboard: "/admin/dashboard",
    officers: "/admin/officers",
    oversight: "/admin/oversight",
    analytics: "/admin/analytics",
    departments: "/admin/departments",
  };
  const adminOversightRoutes = appRoutes.adminOversightSections || {
    escalated: "/admin/oversight/escalated",
    invalid: "/admin/oversight/invalid",
    reviews: "/admin/oversight/reviews",
  };

  function getDepartmentByCode(code) {
    return departments.find((department) => department.code === code) || null;
  }

  const routingDepartments = departments.filter((department) => !department.parentCode && department.active !== false);
  const getRoutingDepartmentByCode = (code) => routingDepartments.find((department) => department.code === code) || null;
  const getRoutingSections = (departmentCode) => {
    const department = getRoutingDepartmentByCode(departmentCode);
    const directSections = Array.isArray(department?.subDepartments)
      ? department.subDepartments.map((item) => String(item).trim()).filter(Boolean)
      : [];
    if (directSections.length) return directSections;
    return department?.name ? [department.name] : [];
  };

  const selectedDepartment = getRoutingDepartmentByCode(officerForm.departmentCode);
  const selectedDepartmentSections = getRoutingSections(officerForm.departmentCode);
  const selectedOversightDepartment = getRoutingDepartmentByCode(oversightForm.targetDivisionName);
  const selectedOversightSections = getRoutingSections(oversightForm.targetDivisionName);
  const oversightQueue =
    activeOversightTab === "invalid"
      ? oversight.invalidPending
      : activeOversightTab === "reviews"
        ? oversight.officerActionReviews
        : oversight.escalated;
  const selectedOversightComplaint = complaints.find((complaint) => complaint.tokenNumber === selectedOversightToken) || null;
  const filteredComplaints = complaints.filter((complaint) => {
    const createdAt = new Date(complaint.createdAt).getTime();
    const departmentName = getRoutingDepartmentByCode(analyticsFilters.departmentCode)?.name || "";
    return (!analyticsFilters.departmentCode || complaint.divisionName === departmentName)
      && (!analyticsFilters.officerId || complaint.assignedOfficerId === analyticsFilters.officerId)
      && (!analyticsFilters.dateFrom || createdAt >= new Date(analyticsFilters.dateFrom).getTime())
      && (!analyticsFilters.dateTo || createdAt <= new Date(`${analyticsFilters.dateTo}T23:59:59`).getTime());
  });
  const selectedAnalyticsComplaint = filteredComplaints.find((complaint) => complaint.tokenNumber === selectedAnalyticsToken) || null;

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    setActiveOversightTab(initialOversightTab);
    if (initialSection === "oversight") {
      setActiveSection("oversight");
    }
  }, [initialOversightTab, initialSection]);

  useEffect(() => {
    const storedAdmin = sessionStorage.getItem("admin_user");
    const storedToken = sessionStorage.getItem("admin_auth_token");

    if (!storedAdmin || !storedToken) {
      router.replace(appRoutes.adminLogin);
      return;
    }

    setAdminUser(JSON.parse(storedAdmin));
    setAdminAuthToken(storedToken);
  }, [router]);

  function handleSectionChange(nextSection) {
    setActiveSection(nextSection);
    const targetRoute = adminSectionRoutes[nextSection] || appRoutes.adminPanel;
    if (pathname !== targetRoute) {
      router.push(targetRoute);
    }
  }

  function handleOversightTabChange(nextTab, nextToken = "") {
    setActiveSection("oversight");
    setActiveOversightTab(nextTab);
    if (nextToken) {
      setSelectedOversightToken(nextToken);
    }
    const targetRoute = adminOversightRoutes[nextTab] || adminSectionRoutes.oversight || appRoutes.adminPanel;
    if (pathname !== targetRoute) {
      router.push(targetRoute);
    }
  }

  useEffect(() => {
    if (!routingDepartments.length) return;

    setOfficerForm((current) => {
      const nextDepartmentCode = routingDepartments.some((department) => department.code === current.departmentCode)
        ? current.departmentCode
        : routingDepartments[0]?.code || "";
      const nextSections = getRoutingSections(nextDepartmentCode);
      return {
        ...current,
        departmentCode: nextDepartmentCode,
        sectionName: current.officeType === "department"
          ? (nextSections.includes(current.sectionName) ? current.sectionName : nextSections[0] || "")
          : current.sectionName,
      };
    });

    setOversightForm((current) => {
      const nextDepartmentCode = routingDepartments.some((department) => department.code === current.targetDivisionName)
        ? current.targetDivisionName
        : routingDepartments[0]?.code || "";
      const nextSections = getRoutingSections(nextDepartmentCode);
      return {
        ...current,
        targetDivisionName: nextDepartmentCode,
        targetSectionName: nextSections.includes(current.targetSectionName) ? current.targetSectionName : nextSections[0] || "",
      };
    });
  }, [departments]);

  useEffect(() => {
    if (!filteredComplaints.some((complaint) => complaint.tokenNumber === selectedAnalyticsToken)) {
      setSelectedAnalyticsToken(filteredComplaints[0]?.tokenNumber || "");
    }
  }, [filteredComplaints, selectedAnalyticsToken]);

  useEffect(() => {
    if (!adminAuthToken) return;
    let ignore = false;

    async function loadAllData() {
      try {
        setLoadingError("");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminAuthToken}`,
        };

        const responses = await Promise.all([
          fetch(`${apiBase}/api/admin/dashboard`, { headers }),
          fetch(`${apiBase}/api/admin/departments`, { headers }),
          fetch(`${apiBase}/api/admin/officers`, { headers }),
          fetch(`${apiBase}/api/admin/rotations`, { headers }),
          fetch(`${apiBase}/api/admin/oversight`, { headers }),
          fetch(`${apiBase}/api/admin/complaints`, { headers }),
        ]);

        const results = await Promise.all(responses.map((response) => response.json()));
        const failed = responses.findIndex((response) => !response.ok);
        if (failed >= 0) {
          throw new Error(results[failed].message || "Request failed.");
        }

        if (ignore) return;

        setDashboard(results[0].dashboard);
        setDepartments(results[1].departments || []);
        setOfficers(results[2].officers || []);
        setRotations(results[3].rotations || []);
        setOversight(results[4].oversight || { escalated: [], invalidPending: [], officerActionReviews: [] });
        setComplaints(results[5].complaints || []);
      } catch (error) {
        if (!ignore) {
          setLoadingError(error.message || "Request failed.");
        }
      }
    }

    loadAllData();
    return () => {
      ignore = true;
    };
  }, [adminAuthToken]);

  useEffect(() => {
    const queue =
      activeOversightTab === "invalid"
        ? oversight.invalidPending
        : activeOversightTab === "reviews"
          ? oversight.officerActionReviews
          : oversight.escalated;

    if (!queue.some((item) => item.tokenNumber === selectedOversightToken)) {
      setSelectedOversightToken(queue[0]?.tokenNumber || "");
    }
  }, [activeOversightTab, oversight, selectedOversightToken]);

  async function request(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminAuthToken}`,
        ...(options.headers || {}),
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Request failed.");
    }
    return result;
  }

  async function reloadData() {
    if (!adminAuthToken) return;
    try {
      setLoadingError("");
      const [dashboardResult, departmentsResult, officersResult, rotationsResult, oversightResult, complaintsResult] = await Promise.all([
        request("/api/admin/dashboard"),
        request("/api/admin/departments"),
        request("/api/admin/officers"),
        request("/api/admin/rotations"),
        request("/api/admin/oversight"),
        request("/api/admin/complaints"),
      ]);

      setDashboard(dashboardResult.dashboard);
      setDepartments(departmentsResult.departments || []);
      setOfficers(officersResult.officers || []);
      setRotations(rotationsResult.rotations || []);
      setOversight(oversightResult.oversight || { escalated: [], invalidPending: [], officerActionReviews: [] });
      setComplaints(complaintsResult.complaints || []);
    } catch (error) {
      setLoadingError(error.message || "Request failed.");
    }
  }

  function resetOfficerForm() {
    setOfficerForm({
      editingOfficerId: "",
      officeType: "department",
      departmentCode: routingDepartments[0]?.code || "",
      sectionName: getRoutingSections(routingDepartments[0]?.code || "")[0] || "",
      wardNumber: "",
      name: "",
      email: "",
      loginId: "",
      password: "",
      active: true,
    });
    setOfficerFormMessage({ type: "", text: "" });
  }

  async function handleOfficerSubmit(event) {
    event.preventDefault();
    const trimmedName = String(officerForm.name || "").trim();
    const trimmedLoginId = String(officerForm.loginId || "").trim();
    const trimmedEmail = String(officerForm.email || "").trim();
    const trimmedPassword = String(officerForm.password || "").trim();

    if (!trimmedName || !trimmedLoginId) {
      setOfficerFormMessage({ type: "error", text: "Officer name and login ID are required." });
      return;
    }
    if (!officerForm.editingOfficerId && !trimmedPassword) {
      setOfficerFormMessage({ type: "error", text: "Password is required when creating a new officer." });
      return;
    }
    const nextOfficerSections = getRoutingSections(officerForm.departmentCode);
    const resolvedOfficerSectionName = String(officerForm.sectionName || "").trim() || nextOfficerSections[0] || "";
    if (officerForm.officeType === "department" && (!officerForm.departmentCode || !resolvedOfficerSectionName)) {
      setOfficerFormMessage({ type: "error", text: "Select both the department and sub department." });
      return;
    }
    if (officerForm.officeType === "ward" && !String(officerForm.wardNumber || "").trim()) {
      setOfficerFormMessage({ type: "error", text: "Select a ward for ward officers." });
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setOfficerFormMessage({ type: "error", text: "Enter a valid officer email address." });
      return;
    }

    const department = getRoutingDepartmentByCode(officerForm.departmentCode);
    const payload = {
      officeType: officerForm.officeType,
      departmentCode: officerForm.officeType === "department" ? department?.code || "" : "",
      divisionName: officerForm.officeType === "department" ? department?.name || "" : "",
      sectionName: officerForm.officeType === "department" ? resolvedOfficerSectionName : "",
      wardNumber: officerForm.officeType === "ward" ? String(officerForm.wardNumber || "").trim() : "",
      name: trimmedName,
      email: trimmedEmail,
      loginId: trimmedLoginId,
      password: trimmedPassword,
      active: Boolean(officerForm.active),
    };

    try {
      if (officerForm.editingOfficerId) {
        await request(`/api/admin/officers/${officerForm.editingOfficerId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setOfficerFormMessage({ type: "success", text: "Officer updated successfully." });
      } else {
        await request("/api/admin/officers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setOfficerFormMessage({ type: "success", text: "Officer saved with one-week activation." });
      }
      resetOfficerForm();
      await reloadData();
    } catch (error) {
      setOfficerFormMessage({ type: "error", text: error.message });
    }
  }

  async function handleRotationSubmit(event) {
    event.preventDefault();
    if (!String(rotationForm.officerId || "").trim() || !String(rotationForm.startDate || "").trim() || !String(rotationForm.endDate || "").trim()) {
      setRotationFormMessage({ type: "error", text: "Officer, start date, and end date are required." });
      return;
    }
    if (new Date(rotationForm.endDate).getTime() < new Date(rotationForm.startDate).getTime()) {
      setRotationFormMessage({ type: "error", text: "End date must be on or after the start date." });
      return;
    }
    try {
      await request("/api/admin/rotations", {
        method: "POST",
        body: JSON.stringify({
          officerId: String(rotationForm.officerId || "").trim(),
          startDate: String(rotationForm.startDate || "").trim(),
          endDate: String(rotationForm.endDate || "").trim(),
        }),
      });
      setRotationForm({ officerId: "", startDate: "", endDate: "" });
      setRotationFormMessage({ type: "success", text: "Rotation scheduled successfully." });
      await reloadData();
    } catch (error) {
      setRotationFormMessage({ type: "error", text: error.message });
    }
  }

  async function handleOversightSubmit(event) {
    event.preventDefault();
    const action =
      activeOversightTab === "escalated"
        ? oversightForm.action
        : activeOversightTab === "invalid"
          ? oversightForm.invalidAction
          : oversightForm.reviewAction;
    const resolvedOversightSectionName = String(oversightForm.targetSectionName || "").trim() || selectedOversightSections[0] || "";

    if (action === "transfer_department" && (!selectedOversightDepartment || !resolvedOversightSectionName)) {
      setOversightFormMessage({ type: "error", text: "Select a department and routing section for this transfer." });
      return;
    }

    try {
      await request(`/api/admin/oversight/${selectedOversightToken}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          targetDepartmentCode: selectedOversightDepartment?.code || "",
          targetDivisionName: selectedOversightDepartment?.name || "",
          targetSectionName: resolvedOversightSectionName,
          comment: String(oversightForm.comment || "").trim(),
        }),
      });
      setOversightFormMessage({ type: "success", text: "Central admin response recorded." });
      setOversightForm((current) => ({ ...current, comment: "" }));
      await reloadData();
    } catch (error) {
      setOversightFormMessage({ type: "error", text: error.message });
    }
  }

  async function handleLogout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch {}
    sessionStorage.removeItem("admin_user");
    sessionStorage.removeItem("admin_auth_token");
    router.replace(appRoutes.adminLogin);
  }

  async function toggleOfficer(officer) {
    try {
      await request(`/api/admin/officers/${officer.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          officeType: officer.officeType,
          departmentCode: officer.departmentCode,
          divisionName: officer.divisionName,
          sectionName: officer.sectionName,
          wardNumber: officer.wardNumber,
          name: officer.name,
          email: officer.email,
          loginId: officer.loginId,
          active: officer.status !== "active",
        }),
      });
      await reloadData();
    } catch (error) {
      setOfficerFormMessage({ type: "error", text: error.message });
    }
  }

  function editOfficer(officer) {
    const inferredDepartmentCode = officer.departmentCode || departments.find((item) => item.name === officer.divisionName)?.code || "";
    const nextSections = getRoutingSections(inferredDepartmentCode);
    handleSectionChange("officers");
    setOfficerForm({
      editingOfficerId: officer.id,
      officeType: officer.officeType,
      departmentCode: inferredDepartmentCode,
      sectionName: officer.sectionName || nextSections[0] || "",
      wardNumber: officer.wardNumber || "",
      name: officer.name || "",
      email: officer.email || "",
      loginId: officer.loginId || "",
      password: "",
      active: officer.status === "active",
    });
  }

  function setPointsForm(officerId, patch) {
    setPointsForms((current) => ({
      ...current,
      [officerId]: {
        open: false,
        value: "",
        reason: "",
        message: { type: "", text: "" },
        ...(current[officerId] || {}),
        ...patch,
      },
    }));
  }

  async function submitPoints(officerId) {
    const entry = pointsForms[officerId] || {};
    const pts = parseInt(entry.value || "0", 10);
    const reason = (entry.reason || "").trim();
    if (!pts || !reason) {
      setPointsForm(officerId, { message: { type: "error", text: "Points and reason are required." } });
      return;
    }
    try {
      await request(`/api/admin/officers/${officerId}`, {
        method: "PATCH",
        body: JSON.stringify({ performanceAdjustment: { points: pts, message: reason, pending: true } }),
      });
      setPointsForm(officerId, {
        open: false,
        value: "",
        reason: "",
        message: { type: "success", text: "Saved — awaiting your verification." },
      });
      await reloadData();
    } catch (error) {
      setPointsForm(officerId, { message: { type: "error", text: error.message } });
    }
  }

  async function verifyAdjustment(officerId, adjIdx, action) {
    try {
      await request(`/api/admin/officers/${officerId}/adjustments/${adjIdx}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await reloadData();
    } catch (error) {
      setOfficerFormMessage({ type: "error", text: error.message });
    }
  }

  async function handleDepartmentSubmit(event) {
    event.preventDefault();
    const trimmedCode = String(departmentForm.code || "").trim().toUpperCase();
    const trimmedName = String(departmentForm.name || "").trim();
    if (!trimmedCode || !trimmedName) {
      setDepartmentFormMessage({ type: "error", text: "Department code and full name are required." });
      return;
    }
    const payload = {
      code: trimmedCode,
      name: trimmedName,
      type: departmentForm.type,
      description: String(departmentForm.description || "").trim(),
      active: true,
    };

    try {
      if (departmentForm.editingCode) {
        await request(`/api/admin/departments/${departmentForm.editingCode}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setDepartmentFormMessage({ type: "success", text: "Department updated." });
      } else {
        await request("/api/admin/departments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setDepartmentFormMessage({ type: "success", text: "Department created." });
      }
      setDepartmentForm({
        editingCode: "",
        code: "",
        name: "",
        type: "Mahashakha",
        description: "",
      });
      await reloadData();
    } catch (error) {
      setDepartmentFormMessage({ type: "error", text: error.message });
    }
  }

  function editDepartment(dept) {
    handleSectionChange("departments");
    setDepartmentForm({
      editingCode: dept.code,
      code: dept.code,
      name: dept.name,
      type: dept.type || "Mahashakha",
      description: dept.description || "",
    });
  }

  async function deleteDepartment(code) {
    if (!window.confirm(`Delete department ${code}? This cannot be undone.`)) return;
    try {
      await request(`/api/admin/departments/${code}`, { method: "DELETE" });
      await reloadData();
    } catch (error) {
      setDepartmentFormMessage({ type: "error", text: error.message });
    }
  }

  function exportCsv() {
    const rows = [
      ["Token", "Title", "Department", "Status", "Officer", "Updated"],
      ...filteredComplaints.map((complaint) => [
        complaint.tokenNumber,
        complaint.title,
        complaint.divisionName || `Ward ${complaint.wardNumber || "-"}`,
        complaint.status,
        complaint.assignedOfficerName || "",
        formatDateTime(complaint.updatedAt || complaint.createdAt),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "central-admin-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderPendingAdjustments(officer) {
    return (officer.performanceAdjustments || [])
      .map((adj, idx) => ({ ...adj, idx }))
      .filter((adj) => adj.status === "pending");
  }

  const activeOfficers = officers.filter((officer) => officer.status === "active");
  const departmentGroups = [];
  const wardGroups = [];
  activeOfficers.forEach((officer) => {
    if (officer.officeType === "department") {
      const key = `${officer.divisionName}__${officer.sectionName || "Division-wide"}`;
      const existing = departmentGroups.find((group) => group.key === key);
      if (existing) {
        existing.items.push(officer);
      } else {
        departmentGroups.push({ key, title: key.replaceAll("__", " / "), items: [officer] });
      }
      return;
    }
    const key = `Ward ${officer.wardNumber}`;
    const existing = wardGroups.find((group) => group.key === key);
    if (existing) {
      existing.items.push(officer);
    } else {
      wardGroups.push({ key, title: key, items: [officer] });
    }
  });

  const complaintsByDepartment = dashboard?.charts?.complaintsByDepartment || [];
  const solvedByDepartment = dashboard?.charts?.solvedByDepartment || [];

  const dashboardDepartmentChartData = {
    labels: complaintsByDepartment.map((item) => item.label),
    datasets: [
      {
        label: "Complaints",
        data: complaintsByDepartment.map((item) => item.count || 0),
        backgroundColor: chartColors.palette.slice(0, complaintsByDepartment.length),
        borderRadius: 4,
      },
    ],
  };

  const dashboardSolvedChartData = {
    labels: solvedByDepartment.map((item) => item.label),
    datasets: [
      {
        label: "Solved",
        data: solvedByDepartment.map((item) => item.solved || 0),
        backgroundColor: chartColors.green,
        borderRadius: 4,
      },
      {
        label: "Total",
        data: solvedByDepartment.map((item) => (item.total || 0) - (item.solved || 0)),
        backgroundColor: "rgba(200,200,200,0.5)",
        borderRadius: 4,
      },
    ],
  };

  const pending = filteredComplaints.filter((item) => item.status === "pending").length;
  const inProgress = filteredComplaints.filter((item) => item.status === "in_progress").length;
  const solved = filteredComplaints.filter((item) => item.status === "solved").length;
  const forwarded = filteredComplaints.filter((item) => item.status === "forwarded").length;
  const delayed = filteredComplaints.filter((item) => item.status === "delayed").length;
  const higherLevel = filteredComplaints.filter(
    (item) => item.forwardedToLabel === "Transferred to higher level authority" || item.status === "escalated",
  ).length;

  const analyticsStatusChartData = {
    labels: ["Pending", "In Progress", "Solved", "Delayed", "Forwarded", "Escalated"],
    datasets: [
      {
        data: [pending, inProgress, solved, delayed, forwarded, higherLevel],
        backgroundColor: [chartColors.amber, chartColors.blue, chartColors.green, chartColors.red, chartColors.teal, chartColors.purple],
        borderWidth: 2,
      },
    ],
  };

  const analyticsForwardChartData = {
    labels: ["Transferred to department", "Transferred to higher level"],
    datasets: [
      {
        label: "Complaints",
        data: [forwarded, higherLevel],
        backgroundColor: [chartColors.blue, chartColors.red],
        borderRadius: 4,
      },
    ],
  };

  const topOfficerPoints = officers
    .map((officer) => ({ label: officer.name, count: officer.currentWeekPoints || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (!adminUser || !adminAuthToken) {
    return <BodyConfig className="admin-orbit-body" />;
  }

  return (
    <>
      <BodyConfig className="admin-orbit-body" />
      <div className="admin-orbit-shell">
        <header className="admin-orbit-hero">
          <div className="admin-orbit-hero-top">
            <div className="admin-orbit-lockup">
              <div className="brand-mark crest government-emblem">
                <img src="/assets/images/nepal-gov-emblem.png" alt="Government of Nepal emblem" />
              </div>
              <div>
                <p className="admin-orbit-kicker">Government of Nepal · Pokhara Metropolitan City · Central Command</p>
                <h1>Central Admin Command Panel</h1>
                <p className="admin-orbit-subtitle">
                  Officer activation, escalation decisions, validation review, and municipal analytics in one control room.
                </p>
              </div>
            </div>
            <div className="admin-orbit-hero-tools">
              <div className="admin-orbit-date">
                {new Intl.DateTimeFormat("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(new Date())}
              </div>
              <button type="button" className="button secondary compact-button" onClick={reloadData}>
                Refresh
              </button>
              <button type="button" className="button compact-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="admin-orbit-summary">
            <SummaryCards
              cards={[
                { label: "Monthly complaints", value: dashboard?.overview?.totalComplaintsMonth || 0, note: "Current reporting month", icon: BarChart3 },
                { label: "Solved rate", value: `${dashboard?.overview?.solvedRate || 0}%`, note: "City-wide resolution ratio", tone: "success", icon: CheckCircle2 },
                { label: "Pending", value: dashboard?.overview?.pending || 0, note: "Needs operational follow-up", tone: "warning", icon: Clock3 },
                { label: "Escalated", value: dashboard?.overview?.escalated || 0, note: "Central admin decisions due", tone: "danger", icon: ShieldAlert },
                { label: "Active officers", value: dashboard?.overview?.officers || 0, note: `${dashboard?.overview?.activeRotations || 0} active rotations`, icon: Users },
              ]}
            />
          </div>
        </header>

        <div className="admin-orbit-layout">
          <aside className="admin-orbit-sidebar">
            <button type="button" className={`admin-orbit-nav ${activeSection === "dashboard" ? "active" : ""}`} onClick={() => handleSectionChange("dashboard")}>
              <span className="portal-nav-row">
                <span className="portal-nav-icon"><LayoutDashboard size={17} /></span>
                <span>Dashboard</span>
              </span>
              <strong>{dashboard?.overview?.totalComplaintsMonth || 0}</strong>
            </button>
            <button type="button" className={`admin-orbit-nav ${activeSection === "officers" ? "active" : ""}`} onClick={() => handleSectionChange("officers")}>
              <span className="portal-nav-row">
                <span className="portal-nav-icon"><Users size={17} /></span>
                <span>Officers & Rotations</span>
              </span>
              <strong>{dashboard?.overview?.officers || 0}</strong>
            </button>
            <button type="button" className={`admin-orbit-nav ${activeSection === "oversight" ? "active" : ""}`} onClick={() => handleSectionChange("oversight")}>
              <span className="portal-nav-row">
                <span className="portal-nav-icon"><ShieldCheck size={17} /></span>
                <span>Escalations & Reviews</span>
              </span>
              <strong>{oversight.escalated.length + oversight.invalidPending.length + oversight.officerActionReviews.length}</strong>
            </button>
            <button type="button" className={`admin-orbit-nav ${activeSection === "analytics" ? "active" : ""}`} onClick={() => handleSectionChange("analytics")}>
              <span className="portal-nav-row">
                <span className="portal-nav-icon"><BarChart3 size={17} /></span>
                <span>Analytics & Reports</span>
              </span>
              <strong>{dashboard?.overview?.solvedRate || 0}%</strong>
            </button>
            <button type="button" className={`admin-orbit-nav ${activeSection === "departments" ? "active" : ""}`} onClick={() => handleSectionChange("departments")}>
              <span className="portal-nav-row">
                <span className="portal-nav-icon"><Building2 size={17} /></span>
                <span>Departments</span>
              </span>
              <strong>{departments.length}</strong>
            </button>
          </aside>

          <main className="admin-orbit-main">
            {loadingError ? (
              <div className="admin-orbit-panel">
                <div className="form-message error">{loadingError}</div>
              </div>
            ) : null}

            <section className={`admin-orbit-section ${activeSection === "dashboard" ? "active" : ""}`}>
              <div className="admin-orbit-grid admin-orbit-grid-two">
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Department pressure map</p>
                      <h3>Complaint load by department</h3>
                    </div>
                  </div>
                  <div style={{ position: "relative", height: 220 }}>
                    <ChartCanvas
                      type="bar"
                      data={dashboardDepartmentChartData}
                      options={{
                        indexAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
                      }}
                      emptyText="No data available."
                    />
                  </div>
                </article>
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Resolution watch</p>
                      <h3>Solved complaints by department</h3>
                    </div>
                  </div>
                  <div style={{ position: "relative", height: 220 }}>
                    <ChartCanvas
                      type="bar"
                      data={dashboardSolvedChartData}
                      options={{
                        indexAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "bottom" } },
                        scales: {
                          x: { beginAtZero: true, ticks: { precision: 0 } },
                          y: {},
                        },
                      }}
                      emptyText="No data available."
                    />
                  </div>
                </article>
              </div>

              <div className="admin-orbit-grid admin-orbit-grid-three">
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Escalated</p>
                      <h3>Needs central response</h3>
                    </div>
                  </div>
                  <CompactCardList
                    items={oversight.escalated.slice(0, 4)}
                    emptyText="No escalated complaints right now."
                    onOpen={(token) => {
                      handleOversightTabChange("escalated", token);
                    }}
                  />
                </article>
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Invalid verification</p>
                      <h3>Pending admin decision</h3>
                    </div>
                  </div>
                  <CompactCardList
                    items={oversight.invalidPending.slice(0, 4)}
                    emptyText="No invalid complaints awaiting verification."
                    onOpen={(token) => {
                      handleOversightTabChange("invalid", token);
                    }}
                  />
                </article>
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Officer action reviews</p>
                      <h3>Cross-week validation queue</h3>
                    </div>
                  </div>
                  <CompactCardList
                    items={oversight.officerActionReviews.slice(0, 4)}
                    emptyText="No officer action reviews pending."
                    onOpen={(token) => {
                      handleOversightTabChange("reviews", token);
                    }}
                  />
                </article>
              </div>
            </section>

            <section className={`admin-orbit-section ${activeSection === "officers" ? "active" : ""}`}>
              <div className="admin-orbit-grid admin-orbit-grid-two">
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Add / edit officer</p>
                      <h3>Weekly activation starts immediately</h3>
                    </div>
                  </div>
                  <form className="admin-orbit-form" onSubmit={handleOfficerSubmit} noValidate>
                    <input type="hidden" value={officerForm.editingOfficerId} readOnly />
                    <label>
                      <span>Office type</span>
                      <select value={officerForm.officeType} onChange={(event) => setOfficerForm((current) => ({ ...current, officeType: event.target.value }))}>
                        <option value="department">Department</option>
                        <option value="ward">Ward</option>
                      </select>
                    </label>
                    <label className={officerForm.officeType !== "department" ? "officer-department-field hidden" : "officer-department-field"}>
                      <span>Select department</span>
                      <select
                        value={officerForm.departmentCode}
                        onChange={(event) => {
                          const nextDepartmentCode = event.target.value;
                          const nextSections = getRoutingSections(nextDepartmentCode);
                          setOfficerForm((current) => ({
                            ...current,
                            departmentCode: nextDepartmentCode,
                            sectionName: nextSections[0] || "",
                          }));
                        }}
                      >
                        <option value="">Select department</option>
                        {routingDepartments.map((department) => (
                          <option value={department.code} key={department.code}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={officerForm.officeType !== "department" ? "officer-subdepartment-field hidden" : "officer-subdepartment-field"}>
                      <span>Select sub department</span>
                      <select value={officerForm.sectionName} onChange={(event) => setOfficerForm((current) => ({ ...current, sectionName: event.target.value }))}>
                        <option value="">Select sub department</option>
                        {selectedDepartmentSections.map((subDepartment) => (
                          <option value={subDepartment} key={subDepartment}>
                            {subDepartment}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={officerForm.officeType !== "ward" ? "officer-ward-field hidden" : "officer-ward-field"}>
                      <span>Ward number</span>
                      <select value={officerForm.wardNumber} onChange={(event) => setOfficerForm((current) => ({ ...current, wardNumber: event.target.value }))}>
                        <option value="">Select ward</option>
                        {wards.map((ward) => (
                          <option value={ward} key={ward}>
                            Ward {ward}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Officer name</span>
                      <input type="text" value={officerForm.name} onChange={(event) => setOfficerForm((current) => ({ ...current, name: event.target.value }))} placeholder="Officer full name" />
                    </label>
                    <label>
                      <span>Gmail / email</span>
                      <input type="email" value={officerForm.email} onChange={(event) => setOfficerForm((current) => ({ ...current, email: event.target.value }))} placeholder="officer@pokharamun.gov.np" />
                    </label>
                    <label>
                      <span>Login ID</span>
                      <input type="text" value={officerForm.loginId} onChange={(event) => setOfficerForm((current) => ({ ...current, loginId: event.target.value }))} placeholder="infra_officer_01" />
                    </label>
                    <label>
                      <span>Password</span>
                      <input type="password" value={officerForm.password} onChange={(event) => setOfficerForm((current) => ({ ...current, password: event.target.value }))} placeholder="Set password" />
                    </label>
                    <label className="admin-orbit-inline-check">
                      <input type="checkbox" checked={officerForm.active} onChange={(event) => setOfficerForm((current) => ({ ...current, active: event.target.checked }))} />
                      <span>Activate for this week</span>
                    </label>
                    <div className="admin-orbit-form-actions">
                      <button type="submit" className="button">Save Officer</button>
                      <button type="button" className="button secondary" onClick={resetOfficerForm}>Reset</button>
                    </div>
                  </form>
                  {officerFormMessage.text ? <div className={`form-message ${officerFormMessage.type}`}>{officerFormMessage.text}</div> : null}
                </article>

                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Officer directory</p>
                      <h3>By department and ward</h3>
                    </div>
                  </div>
                  {[...departmentGroups, ...wardGroups].length ? (
                    [...departmentGroups, ...wardGroups].map((group) => (
                      <section className="admin-orbit-group" key={group.key}>
                        <h4>{group.title}</h4>
                        <div className="admin-orbit-group-list">
                          {group.items.map((officer) => {
                            const pendingAdjustments = renderPendingAdjustments(officer);
                            const pointsEntry = pointsForms[officer.id] || { open: false, value: "", reason: "", message: { type: "", text: "" } };
                            return (
                              <article className="admin-orbit-card" key={officer.id}>
                                <div className="admin-orbit-card-head">
                                  <strong>{officer.name}</strong>
                                  <span className={`admin-orbit-pill ${officer.isOnDutyThisWeek ? "success" : "warning"}`}>
                                    {officer.isOnDutyThisWeek ? "On duty" : "Scheduled"}
                                  </span>
                                </div>
                                <p>{officer.loginId} · {officer.email || "No email"}</p>
                                <div className="admin-orbit-meta-row">
                                  <span>Week pts: <strong>{officer.currentWeekPoints || 0}</strong></span>
                                  <span>All-time: <strong>{officer.allTimePoints || 0}</strong></span>
                                </div>
                                {pendingAdjustments.length ? (
                                  <div className="admin-orbit-pending-adjustments">
                                    <strong className="admin-orbit-pending-title">Pending point adjustments:</strong>
                                    {pendingAdjustments.map((adj) => (
                                      <div className="admin-orbit-adj-row" key={`${officer.id}-${adj.idx}`}>
                                        <span>{adj.points > 0 ? "+" : ""}{adj.points} pts — {adj.message || "No reason"}</span>
                                        <button type="button" className="button compact-button admin-orbit-verify-btn" onClick={() => verifyAdjustment(officer.id, adj.idx, "verify")}>
                                          Verify
                                        </button>
                                        <button type="button" className="button secondary compact-button admin-orbit-reject-btn" onClick={() => verifyAdjustment(officer.id, adj.idx, "reject")}>
                                          Reject
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                <div className="admin-orbit-card-actions admin-orbit-card-actions-wrap">
                                  <button type="button" className="button secondary compact-button" onClick={() => editOfficer(officer)}>Edit</button>
                                  <button type="button" className="button destructive compact-button" onClick={() => toggleOfficer(officer)}>
                                    Deactivate
                                  </button>
                                  <button type="button" className="button gold compact-button" onClick={() => setPointsForm(officer.id, { open: !pointsEntry.open })}>
                                    ± Points
                                  </button>
                                </div>
                                {pointsEntry.open ? (
                                  <div className="admin-orbit-points-form">
                                    <div className="admin-orbit-points-grid">
                                      <input type="number" value={pointsEntry.value} onChange={(event) => setPointsForm(officer.id, { value: event.target.value })} placeholder="Points (+/-)" />
                                      <input type="text" value={pointsEntry.reason} onChange={(event) => setPointsForm(officer.id, { reason: event.target.value })} placeholder="Reason (required)" />
                                      <button type="button" className="button compact-button" onClick={() => submitPoints(officer.id)}>
                                        Apply
                                      </button>
                                    </div>
                                    {pointsEntry.message?.text ? (
                                      <div className={`admin-orbit-points-message ${pointsEntry.message.type}`}>
                                        {pointsEntry.message.text}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    ))
                  ) : (
                    <EmptyState text="No active officers available." />
                  )}
                </article>
              </div>

              <article className="admin-orbit-panel top-gap">
                <div className="admin-orbit-panel-head">
                  <div>
                    <p className="eyebrow small">Rotation scheduler</p>
                    <h3>Keep weekly coverage healthy</h3>
                  </div>
                </div>
                <div className="admin-orbit-grid admin-orbit-grid-two">
                  <form className="admin-orbit-form" onSubmit={handleRotationSubmit} noValidate>
                    <label>
                      <span>Officer</span>
                      <select value={rotationForm.officerId} onChange={(event) => setRotationForm((current) => ({ ...current, officerId: event.target.value }))}>
                        <option value="">Select officer</option>
                        {officers.map((officer) => (
                          <option value={officer.id} key={officer.id}>
                            {officer.name} · {officer.divisionName || `Ward ${officer.wardNumber}`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Start date</span>
                      <input type="date" value={rotationForm.startDate} onChange={(event) => setRotationForm((current) => ({ ...current, startDate: event.target.value }))} />
                    </label>
                    <label>
                      <span>End date</span>
                      <input type="date" value={rotationForm.endDate} onChange={(event) => setRotationForm((current) => ({ ...current, endDate: event.target.value }))} />
                    </label>
                    <div className="admin-orbit-form-actions">
                      <button type="submit" className="button">Schedule Rotation</button>
                    </div>
                  </form>
                  <div>
                    {rotations.length ? (
                      rotations.map((rotation) => (
                        <article className="admin-orbit-card compact" key={`${rotation.officerId}-${rotation.startDate}`}>
                          <div className="admin-orbit-card-head">
                            <strong>{rotation.officerName}</strong>
                            <span className={`admin-orbit-pill ${rotation.active ? "success" : "warning"}`}>{rotation.active ? "Active" : "Scheduled"}</span>
                          </div>
                          <p>{rotation.divisionName || `Ward ${rotation.wardNumber}`}{rotation.sectionName ? ` / ${rotation.sectionName}` : ""}</p>
                          <small>{formatDate(rotation.startDate)} to {formatDate(rotation.endDate)}</small>
                        </article>
                      ))
                    ) : (
                      <EmptyState text="No rotations scheduled yet." />
                    )}
                  </div>
                </div>
                {rotationFormMessage.text ? <div className={`form-message ${rotationFormMessage.type}`}>{rotationFormMessage.text}</div> : null}
              </article>
            </section>

            <section className={`admin-orbit-section ${activeSection === "oversight" ? "active" : ""}`}>
              <div className="admin-orbit-subtabs">
                <button type="button" className={`admin-orbit-subtab ${activeOversightTab === "escalated" ? "active" : ""}`} onClick={() => handleOversightTabChange("escalated")}>
                  Escalated Complaints
                </button>
                <button type="button" className={`admin-orbit-subtab ${activeOversightTab === "invalid" ? "active" : ""}`} onClick={() => handleOversightTabChange("invalid")}>
                  Invalid Complaints
                </button>
                <button type="button" className={`admin-orbit-subtab ${activeOversightTab === "reviews" ? "active" : ""}`} onClick={() => handleOversightTabChange("reviews")}>
                  Officer Action Reviews
                </button>
              </div>

              <div className="admin-orbit-grid admin-orbit-grid-two">
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">
                        {activeOversightTab === "reviews" ? "Officer action reviews" : activeOversightTab === "invalid" ? "Invalid complaints" : "Escalated queue"}
                      </p>
                      <h3>
                        {activeOversightTab === "reviews"
                          ? "Cross-week officer validations"
                          : activeOversightTab === "invalid"
                            ? "Invalid complaint verification"
                            : "Escalations awaiting central admin response"}
                      </h3>
                    </div>
                  </div>
                  {oversightQueue.length ? (
                    oversightQueue.map((complaint) => (
                      <article className={`admin-orbit-card ${selectedOversightToken === complaint.tokenNumber ? "selected" : ""}`} key={complaint.tokenNumber}>
                        <div className="admin-orbit-card-head">
                          <strong>{complaint.tokenNumber}</strong>
                          <span className={`admin-orbit-pill ${complaint.status}`}>{complaint.status.replaceAll("_", " ")}</span>
                        </div>
                        <h4>{complaint.title}</h4>
                        <p>{complaint.assignedOfficeLabel || complaint.assignedDepartment || "-"}</p>
                        <small>{formatDateTime(complaint.updatedAt || complaint.createdAt)}</small>
                        <div className="admin-orbit-card-actions">
                          <button type="button" className="button compact-button" onClick={() => setSelectedOversightToken(complaint.tokenNumber)}>
                            Open
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <EmptyState text="Nothing is waiting in this queue." />
                  )}
                </article>

                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Decision desk</p>
                      <h3>Admin response</h3>
                    </div>
                  </div>

                  {selectedOversightComplaint ? (
                    <>
                      <div className="admin-orbit-detail">
                        <div className="admin-orbit-card-head">
                          <strong>{selectedOversightComplaint.tokenNumber}</strong>
                          <span className={`admin-orbit-pill ${selectedOversightComplaint.status}`}>
                            {selectedOversightComplaint.status.replaceAll("_", " ")}
                          </span>
                        </div>
                        <h3>{selectedOversightComplaint.title}</h3>
                        <p>{selectedOversightComplaint.description || "-"}</p>
                        <div className="admin-orbit-detail-grid">
                          <div>
                            <h4>Current office</h4>
                            <p>{selectedOversightComplaint.assignedOfficeLabel || selectedOversightComplaint.assignedDepartment || "-"}</p>
                          </div>
                          <div>
                            <h4>Citizen</h4>
                            <p>{selectedOversightComplaint.citizenName || "Anonymous"}{selectedOversightComplaint.citizenPhone ? ` · ${selectedOversightComplaint.citizenPhone}` : ""}</p>
                          </div>
                          <div>
                            <h4>Location</h4>
                            <p>{selectedOversightComplaint.locationText || "-"}{selectedOversightComplaint.wardNumber ? ` · Ward ${selectedOversightComplaint.wardNumber}` : ""}</p>
                          </div>
                          <div>
                            <h4>Latest officer</h4>
                            <p>{selectedOversightComplaint.assignedOfficerName || "Unassigned"}</p>
                          </div>
                        </div>
                        <LocationMapCard
                          className="top-gap"
                          locationText={selectedOversightComplaint.locationText}
                          locationCoordinates={selectedOversightComplaint.locationCoordinates}
                          wardNumber={selectedOversightComplaint.wardNumber}
                        />
                        {(selectedOversightComplaint.proofImage?.dataUrl || selectedOversightComplaint.attachments?.length) ? (
                          <div className="admin-orbit-media-card">
                            <h4>Complaint media</h4>
                            {selectedOversightComplaint.proofImage?.dataUrl ? (
                              <div className="admin-orbit-proof-wrap">
                                <img
                                  src={selectedOversightComplaint.proofImage.dataUrl}
                                  alt={selectedOversightComplaint.proofImage.name || "Complaint proof"}
                                  className="admin-orbit-proof-image"
                                />
                              </div>
                            ) : null}
                            {selectedOversightComplaint.attachments?.length ? (
                              <div className="admin-orbit-attachment-list">
                                {selectedOversightComplaint.attachments.map((attachment) => (
                                  <a
                                    key={`${selectedOversightComplaint.tokenNumber}-${attachment.name}`}
                                    className="department-guidance-chip"
                                    href={attachment.dataUrl}
                                    download={attachment.name}
                                  >
                                    {attachment.name}
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="admin-orbit-detail-grid top-gap">
                          <div className="admin-orbit-review-note">
                            <strong>Officer comments</strong>
                            {(selectedOversightComplaint.comments || []).length ? (
                              selectedOversightComplaint.comments.map((comment, index) => (
                                <div className="department-detail-line" key={`${comment.actorName || "comment"}-${index}`}>
                                  <strong>{comment.actorName || "Officer"}</strong>
                                  <span>{comment.message || "-"}</span>
                                  <small>{formatDateTime(comment.createdAt)}</small>
                                </div>
                              ))
                            ) : (
                              <p>No comments recorded yet.</p>
                            )}
                          </div>
                          <div className="admin-orbit-review-note">
                            <strong>Progress timeline</strong>
                            {(selectedOversightComplaint.history || []).length ? (
                              selectedOversightComplaint.history.map((entry, index) => (
                                <div className="department-detail-line" key={`${entry.action || "timeline"}-${index}`}>
                                  <strong>{String(entry.action || "update").replaceAll("_", " ")}</strong>
                                  <span>{entry.note || "-"}</span>
                                  <small>{formatDateTime(entry.timestamp || entry.createdAt)}</small>
                                </div>
                              ))
                            ) : (
                              <p>No timeline recorded yet.</p>
                            )}
                          </div>
                        </div>
                        {selectedOversightComplaint.reviewMeta ? (
                          <div className="admin-orbit-review-note">
                            <strong>Officer review context</strong>
                            <p>{selectedOversightComplaint.reviewMeta.note || "-"}</p>
                          </div>
                        ) : null}
                        {selectedOversightComplaint.handoverFlag ? (
                          <div className="admin-orbit-review-note" style={{ background: "#fff8e1", borderLeft: "4px solid #c9a227", padding: 10, marginTop: 10, borderRadius: 4 }}>
                            <strong style={{ color: "#c9a227" }}>Handover Flag</strong>
                            <p style={{ margin: "4px 0" }}>Flagged by: <strong>{selectedOversightComplaint.handoverFlag.flaggedByOfficerName || "Officer"}</strong></p>
                            <p style={{ margin: "4px 0" }}>Reason: {selectedOversightComplaint.handoverFlag.reason}</p>
                            <p style={{ margin: "4px 0", fontSize: "0.75rem", color: "#666" }}>
                              Status: <strong>{selectedOversightComplaint.handoverFlagStatus || "pending"}</strong> · {formatDateTime(selectedOversightComplaint.handoverFlag.flaggedAt)}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <form className="admin-orbit-form" onSubmit={handleOversightSubmit}>
                        {activeOversightTab === "escalated" ? (
                          <div className="oversight-mode oversight-mode-escalated">
                            <label>
                              <span>Central admin response</span>
                              <select value={oversightForm.action} onChange={(event) => setOversightForm((current) => ({ ...current, action: event.target.value }))}>
                                <option value="transfer_department">Transfer to specific department</option>
                                <option value="transfer_higher_level">Transfer to higher level</option>
                              </select>
                            </label>
                            <label>
                              <span>Target department</span>
                              <select
                                value={oversightForm.targetDivisionName}
                                onChange={(event) => {
                                  const nextDepartmentCode = event.target.value;
                                  const nextSections = getRoutingSections(nextDepartmentCode);
                                  setOversightForm((current) => ({
                                    ...current,
                                    targetDivisionName: nextDepartmentCode,
                                    targetSectionName: nextSections[0] || "",
                                  }));
                                }}
                              >
                                <option value="">Select department</option>
                                {routingDepartments.map((department) => (
                                  <option value={department.code} key={department.code}>
                                    {department.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              <span>Target sub department</span>
                              <select value={oversightForm.targetSectionName} onChange={(event) => setOversightForm((current) => ({ ...current, targetSectionName: event.target.value }))}>
                                <option value="">Select sub department</option>
                                {selectedOversightSections.map((subDepartment) => (
                                  <option value={subDepartment} key={subDepartment}>
                                    {subDepartment}
                                  </option>
                                ))}
                              </select>
                              {!selectedOversightSections.length ? (
                                <small className="field-hint">No child sections are configured, so this transfer will use the selected department directly.</small>
                              ) : null}
                            </label>
                          </div>
                        ) : null}

                        {activeOversightTab === "invalid" ? (
                          <div className="oversight-mode oversight-mode-invalid">
                            <label>
                              <span>Invalid complaint decision</span>
                              <select value={oversightForm.invalidAction} onChange={(event) => setOversightForm((current) => ({ ...current, invalidAction: event.target.value }))}>
                                <option value="approve_invalid">Approve invalid marking</option>
                                <option value="reject_invalid">Reject invalid marking</option>
                                <option value="verify_handover_flag">Verify handover flag (deduct outgoing officer pts)</option>
                                <option value="reject_handover_flag">Reject handover flag (restore to solved)</option>
                              </select>
                            </label>
                          </div>
                        ) : null}

                        {activeOversightTab === "reviews" ? (
                          <div className="oversight-mode oversight-mode-reviews">
                            <label>
                              <span>Officer action review</span>
                              <select value={oversightForm.reviewAction} onChange={(event) => setOversightForm((current) => ({ ...current, reviewAction: event.target.value }))}>
                                <option value="validate_review">Validate review</option>
                                <option value="dismiss_review">Dismiss review</option>
                              </select>
                            </label>
                          </div>
                        ) : null}

                        <label className="admin-orbit-form-span-2">
                          <span>Comments</span>
                          <textarea rows="5" value={oversightForm.comment} onChange={(event) => setOversightForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Record the central admin response here" />
                        </label>

                        <div className="admin-orbit-form-actions admin-orbit-form-span-2">
                          <button type="submit" className="button">Submit Response</button>
                        </div>
                      </form>
                      {oversightFormMessage.text ? <div className={`form-message ${oversightFormMessage.type}`}>{oversightFormMessage.text}</div> : null}
                    </>
                  ) : (
                    <EmptyState text="Choose a complaint from the queue to answer it." />
                  )}
                </article>
              </div>
            </section>

            <section className={`admin-orbit-section ${activeSection === "analytics" ? "active" : ""}`}>
              <article className="admin-orbit-panel">
                <div className="admin-orbit-panel-head">
                  <div>
                    <p className="eyebrow small">Filter and export</p>
                    <h3>Analytics and official reports</h3>
                  </div>
                  <div className="admin-orbit-form-actions">
                    <button type="button" className="button secondary" onClick={exportCsv}>Export CSV</button>
                    <button type="button" className="button secondary" onClick={() => window.print()}>Export PDF</button>
                  </div>
                </div>
                <div className="admin-orbit-filterbar">
                  <label>
                    <span>Department</span>
                    <select value={analyticsFilters.departmentCode} onChange={(event) => setAnalyticsFilters((current) => ({ ...current, departmentCode: event.target.value }))}>
                      <option value="">Select department</option>
                      {routingDepartments.map((department) => (
                        <option value={department.code} key={department.code}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Officer</span>
                    <select value={analyticsFilters.officerId} onChange={(event) => setAnalyticsFilters((current) => ({ ...current, officerId: event.target.value }))}>
                      <option value="">Select officer</option>
                      {officers.map((officer) => (
                        <option value={officer.id} key={officer.id}>
                          {officer.name} · {officer.divisionName || `Ward ${officer.wardNumber}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Date from</span>
                    <input type="date" value={analyticsFilters.dateFrom} onChange={(event) => setAnalyticsFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
                  </label>
                  <label>
                    <span>Date to</span>
                    <input type="date" value={analyticsFilters.dateTo} onChange={(event) => setAnalyticsFilters((current) => ({ ...current, dateTo: event.target.value }))} />
                  </label>
                  <button type="button" className="button secondary compact-button" onClick={() => setAnalyticsFilters({ departmentCode: "", officerId: "", dateFrom: "", dateTo: "" })}>
                    Reset
                  </button>
                </div>
              </article>

              <div className="admin-orbit-summary top-gap">
                <SummaryCards
                  cards={[
                    { label: "Filtered complaints", value: filteredComplaints.length, note: "Current report scope" },
                    { label: "Solved", value: solved, note: "Closed and verified", tone: "success" },
                    { label: "Pending", value: pending, note: "Waiting for first action", tone: "warning" },
                    { label: "Forward / higher-level", value: forwarded + higherLevel, note: "Requires coordination", tone: "danger" },
                  ]}
                />
              </div>

              <div className="admin-orbit-grid admin-orbit-grid-two top-gap">
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Status breakdown</p>
                      <h3>Pending vs in-progress vs solved</h3>
                    </div>
                  </div>
                  <div style={{ position: "relative", height: 220 }}>
                    <ChartCanvas
                      type="doughnut"
                      data={analyticsStatusChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "bottom" } },
                      }}
                      emptyText="No data available."
                    />
                  </div>
                </article>
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Forwarding pattern</p>
                      <h3>Department transfers vs higher-level transfers</h3>
                    </div>
                  </div>
                  <div style={{ position: "relative", height: 220 }}>
                    <ChartCanvas
                      type="bar"
                      data={analyticsForwardChartData}
                      options={{
                        indexAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
                      }}
                      emptyText="No data available."
                    />
                  </div>
                </article>
              </div>

              <div className="admin-orbit-grid admin-orbit-grid-two top-gap">
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Performance leaderboard</p>
                      <h3>Officer points</h3>
                    </div>
                  </div>
                  <BarStack items={topOfficerPoints} emptyText="No data available." />
                </article>
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div>
                      <p className="eyebrow small">Report register</p>
                      <h3>Complaint list</h3>
                    </div>
                  </div>
                  {filteredComplaints.length ? (
                    <div className="admin-table-wrap">
                      <table className="department-work-table">
                        <thead>
                          <tr>
                            <th>Token</th>
                            <th>Title</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Officer</th>
                            <th>Updated</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredComplaints.slice(0, 20).map((complaint) => (
                            <tr key={complaint.tokenNumber}>
                              <td>{complaint.tokenNumber}</td>
                              <td>{complaint.title}</td>
                              <td>{complaint.divisionName || `Ward ${complaint.wardNumber || "-"}`}</td>
                              <td>{complaint.status.replaceAll("_", " ")}</td>
                              <td>{complaint.assignedOfficerName || "-"}</td>
                              <td>{formatDateTime(complaint.updatedAt || complaint.createdAt)}</td>
                              <td>
                                <button type="button" className="button compact-button" onClick={() => setSelectedAnalyticsToken(complaint.tokenNumber)}>
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState text="No complaints match these filters." />
                  )}
                </article>
              </div>

              <article className="admin-orbit-panel top-gap">
                <div className="admin-orbit-panel-head">
                  <div>
                    <p className="eyebrow small">Complaint detail preview</p>
                    <h3>Selected complaint from report register</h3>
                  </div>
                </div>
                {selectedAnalyticsComplaint ? (
                  <div className="admin-orbit-grid admin-orbit-grid-two">
                    <div className="admin-orbit-detail">
                      <div className="admin-orbit-card-head">
                        <strong>{selectedAnalyticsComplaint.tokenNumber}</strong>
                        <span className={`admin-orbit-pill ${selectedAnalyticsComplaint.status}`}>
                          {selectedAnalyticsComplaint.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <h3>{selectedAnalyticsComplaint.title}</h3>
                      <p>{selectedAnalyticsComplaint.description || "-"}</p>
                      <div className="admin-orbit-detail-grid">
                        <div>
                          <h4>Current office</h4>
                          <p>{selectedAnalyticsComplaint.assignedOfficeLabel || selectedAnalyticsComplaint.assignedDepartment || "-"}</p>
                        </div>
                        <div>
                          <h4>Citizen</h4>
                          <p>{selectedAnalyticsComplaint.citizenName || "Anonymous"}{selectedAnalyticsComplaint.citizenPhone ? ` · ${selectedAnalyticsComplaint.citizenPhone}` : ""}</p>
                        </div>
                        <div>
                          <h4>Location</h4>
                          <p>{selectedAnalyticsComplaint.locationText || "-"}{selectedAnalyticsComplaint.wardNumber ? ` · Ward ${selectedAnalyticsComplaint.wardNumber}` : ""}</p>
                        </div>
                        <div>
                          <h4>Latest officer</h4>
                          <p>{selectedAnalyticsComplaint.assignedOfficerName || "Unassigned"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="admin-orbit-media-stack">
                      <LocationMapCard
                        locationText={selectedAnalyticsComplaint.locationText}
                        locationCoordinates={selectedAnalyticsComplaint.locationCoordinates}
                        wardNumber={selectedAnalyticsComplaint.wardNumber}
                      />
                      {(selectedAnalyticsComplaint.proofImage?.dataUrl || selectedAnalyticsComplaint.attachments?.length) ? (
                        <div className="admin-orbit-media-card">
                          <h4>Complaint media</h4>
                          {selectedAnalyticsComplaint.proofImage?.dataUrl ? (
                            <div className="admin-orbit-proof-wrap">
                              <img
                                src={selectedAnalyticsComplaint.proofImage.dataUrl}
                                alt={selectedAnalyticsComplaint.proofImage.name || "Complaint proof"}
                                className="admin-orbit-proof-image"
                              />
                            </div>
                          ) : null}
                          {selectedAnalyticsComplaint.attachments?.length ? (
                            <div className="admin-orbit-attachment-list">
                              {selectedAnalyticsComplaint.attachments.map((attachment) => (
                                <a
                                  key={`${selectedAnalyticsComplaint.tokenNumber}-${attachment.name}`}
                                  className="department-guidance-chip"
                                  href={attachment.dataUrl}
                                  download={attachment.name}
                                >
                                  {attachment.name}
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <EmptyState text="Select a complaint from the report register to inspect details." />
                )}
              </article>
            </section>

            <section className={`admin-orbit-section ${activeSection === "departments" ? "active" : ""}`}>
              <div className="admin-orbit-grid">
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div><p className="eyebrow small">Department registry</p><h3>Add / Edit Department</h3></div>
                  </div>
                  <form className="admin-orbit-form" onSubmit={handleDepartmentSubmit} noValidate>
                    <input type="hidden" value={departmentForm.editingCode} readOnly />
                    <label>
                      <span>Department code</span>
                      <input
                        type="text"
                        value={departmentForm.code}
                        onChange={(event) => {
                          setDepartmentForm((current) => ({ ...current, code: event.target.value }));
                          if (departmentFormMessage.text) setDepartmentFormMessage({ type: "", text: "" });
                        }}
                        placeholder="e.g. INFRA"
                      />
                    </label>
                    <label>
                      <span>Full name</span>
                      <input
                        type="text"
                        value={departmentForm.name}
                        onChange={(event) => {
                          setDepartmentForm((current) => ({ ...current, name: event.target.value }));
                          if (departmentFormMessage.text) setDepartmentFormMessage({ type: "", text: "" });
                        }}
                        placeholder="Infrastructure Development"
                      />
                    </label>
                    <label>
                      <span>Type</span>
                      <select
                        value={departmentForm.type}
                        onChange={(event) => {
                          setDepartmentForm((current) => ({ ...current, type: event.target.value }));
                          if (departmentFormMessage.text) setDepartmentFormMessage({ type: "", text: "" });
                        }}
                      >
                        <option value="Mahashakha">Mahashakha (Division)</option>
                        <option value="Upa-Sakha">Upa-Sakha (Sub-division)</option>
                        <option value="Ward Office">Ward Office</option>
                      </select>
                    </label>
                    <label>
                      <span>Description</span>
                      <textarea
                        rows="2"
                        value={departmentForm.description}
                        onChange={(event) => {
                          setDepartmentForm((current) => ({ ...current, description: event.target.value }));
                          if (departmentFormMessage.text) setDepartmentFormMessage({ type: "", text: "" });
                        }}
                        placeholder="Brief description"
                      />
                    </label>
                    <div className="admin-orbit-form-actions">
                      <button type="submit" className="button">Save Department</button>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => {
                          setDepartmentForm({ editingCode: "", code: "", name: "", type: "Mahashakha", description: "" });
                          setDepartmentFormMessage({ type: "", text: "" });
                        }}
                      >
                        Reset
                      </button>
                    </div>
                    {departmentFormMessage.text ? <p className={`form-message ${departmentFormMessage.type}`}>{departmentFormMessage.text}</p> : null}
                  </form>
                </article>
                <article className="admin-orbit-panel">
                  <div className="admin-orbit-panel-head">
                    <div><p className="eyebrow small">Registered departments</p><h3>Department List</h3></div>
                  </div>
                  {departments.length ? (
                    departments.map((dept) => (
                      <article className="admin-orbit-card admin-orbit-card-spaced" key={dept.code}>
                        <div className="admin-orbit-card-head">
                          <strong>{dept.name}</strong>
                          <span className={`admin-orbit-pill ${dept.active !== false ? "success" : ""}`}>{dept.code}</span>
                        </div>
                        <p className="admin-orbit-card-subtitle">{dept.type || "Mahashakha"}{dept.description ? ` · ${dept.description}` : ""}</p>
                        <div className="admin-orbit-card-actions">
                          <button type="button" className="button secondary compact-button" onClick={() => editDepartment(dept)}>
                            Edit
                          </button>
                          <button type="button" className="button destructive compact-button" onClick={() => deleteDepartment(dept.code)}>
                            Delete
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <EmptyState text="No departments registered." />
                  )}
                </article>
              </div>
            </section>
          </main>
        </div>
        <ChatbotWidget mode="admin" />
      </div>
    </>
  );
}
