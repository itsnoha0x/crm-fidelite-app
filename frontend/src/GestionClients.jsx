import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8080/api/clients";

const fetchClients = async () => {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Erreur de chargement");
  return res.json();
};

const saveClient = async (client, isEdit) => {
  const url = isEdit ? `${API_BASE}/${client.id}` : API_BASE;
  // Envoyer seulement les champs attendus par le backend
  const payload = {
    prenom: client.prenom,
    nom: client.nom,
    email: client.email,
    telephone: client.telephone || null,
    adresse: client.adresse || null,
    segment: client.segment,
  };
  const res = await fetch(url, {
    method: isEdit ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try { const t = await res.text(); if (t) msg += ` : ${t}`; } catch {}
    throw new Error(msg);
  }
  return res.json();
};

const deleteClient = async (id) => {
  if (!id) throw new Error("ID manquant");
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try { const t = await res.text(); if (t) msg += ` : ${t}`; } catch {}
    throw new Error(msg);
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SEGMENTS = ["VIP", "STANDARD", "PREMIUM", "NOUVEAU"];
const EMPTY_FORM = { nom: "", prenom: "", email: "", telephone: "", segment: "STANDARD", adresse: "" };

export default function GestionClients() {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("Tous");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchClients();
      setClients(data);
    } catch {
      setGlobalError("Impossible de contacter le serveur. Vérifiez que Spring Boot tourne sur le port 8080.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = clients;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.nom + " " + c.prenom + " " + c.email).toLowerCase().includes(q)
      );
    }
    if (segmentFilter !== "Tous") {
      result = result.filter(c => c.segment === segmentFilter);
    }
    setFiltered(result);
  }, [clients, search, segmentFilter]);

  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setEditId(null);
    setFieldErrors({});
    setGlobalError("");
    setShowForm(true);
  };

  const openEdit = (client) => {
    setFormData({ ...client });
    setEditId(client.id);
    setFieldErrors({});
    setGlobalError("");
    setShowForm(true);
    setSelectedClient(null);
  };

  const handleFieldChange = (key, value) => {
    setFormData(p => ({ ...p, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors(p => ({ ...p, [key]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nom.trim()) {
      errors.nom = "Le nom est obligatoire.";
    }
    if (!formData.email.trim()) {
      errors.email = "L'email est obligatoire.";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      errors.email = "L'adresse email n'est pas valide (ex: exemple@domaine.com).";
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    setGlobalError("");
    setFieldErrors({});
    try {
      await saveClient(formData, !!editId);
      showToast(editId ? "Client modifié avec succès !" : "Client ajouté avec succès !");
      setShowForm(false);
      load();
    } catch (err) {
      setGlobalError(err.message || "Une erreur serveur est survenue. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClient(id);
      showToast("Client supprimé.", "danger");
      setSelectedClient(null);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setGlobalError(err.message || "Erreur lors de la suppression.");
      setConfirmDelete(null);
    }
  };

  const segmentColor = (seg) => ({
    VIP: "#f59e0b",
    PREMIUM: "#8b5cf6",
    STANDARD: "#3b82f6",
    NOUVEAU: "#10b981",
  }[seg] || "#6b7280");

  const segmentBg = (seg) => ({
    VIP: "rgba(245,158,11,0.12)",
    PREMIUM: "rgba(139,92,246,0.12)",
    STANDARD: "rgba(59,130,246,0.12)",
    NOUVEAU: "rgba(16,185,129,0.12)",
  }[seg] || "rgba(107,114,128,0.12)");

  const initials = (c) =>
    ((c.prenom?.[0] || "") + (c.nom?.[0] || "")).toUpperCase() || "?";

  return (
    <div style={styles.root}>
      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
        }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>CRM<span style={styles.logoAccent}>pro</span></span>
        </div>
        <nav style={styles.nav}>
          {[
            { icon: "⬡", label: "Dashboard", active: false },
            { icon: "◉", label: "Clients", active: true },
            { icon: "◈", label: "Fidélité", active: false },
            { icon: "◇", label: "Analytics", active: false },
            { icon: "◎", label: "Notifications", active: false },
          ].map(item => (
            <div key={item.label} style={{ ...styles.navItem, ...(item.active ? styles.navItemActive : {}) }}>
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {item.active && <div style={styles.navIndicator} />}
            </div>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.avatar}>KZ</div>
          <div>
            <div style={styles.userName}>Kenza</div>
            <div style={styles.userRole}>Gestionnaire</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Gestion Clients</h1>
            <p style={styles.pageSubtitle}>{clients.length} clients enregistrés</p>
          </div>
          <button style={styles.addBtn} onClick={openAdd}>
            <span style={{ fontSize: 18, marginRight: 8 }}>+</span> Nouveau client
          </button>
        </header>

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              style={styles.search}
              placeholder="Rechercher par nom, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={styles.segmentTabs}>
            {["Tous", ...SEGMENTS].map(s => (
              <button
                key={s}
                style={{
                  ...styles.tab,
                  ...(segmentFilter === s ? {
                    background: s === "Tous" ? "#1e293b" : segmentBg(s),
                    color: s === "Tous" ? "#f8fafc" : segmentColor(s),
                    borderColor: s === "Tous" ? "#1e293b" : segmentColor(s),
                  } : {}),
                }}
                onClick={() => setSegmentFilter(s)}
              >{s}</button>
            ))}
          </div>
        </div>

        {globalError && !showForm && (
          <div style={styles.errorBar}>{globalError}</div>
        )}

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <p style={{ color: "#94a3b8", marginTop: 16 }}>Chargement des clients...</p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Client", "Email", "Téléphone", "Segment", "Actions"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.empty}>
                      <span style={{ fontSize: 32 }}>◎</span>
                      <br />Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      style={{ ...styles.tr, animationDelay: `${i * 40}ms` }}
                      onClick={() => setSelectedClient(c)}
                    >
                      <td style={styles.td}>
                        <div style={styles.clientCell}>
                          <div style={{ ...styles.initials, background: segmentColor(c.segment) }}>
                            {initials(c)}
                          </div>
                          <div>
                            <div style={styles.clientName}>{c.prenom} {c.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...styles.td, color: "#94a3b8" }}>{c.email}</td>
                      <td style={{ ...styles.td, color: "#94a3b8" }}>{c.telephone || "—"}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          color: segmentColor(c.segment),
                          background: segmentBg(c.segment),
                          border: `1px solid ${segmentColor(c.segment)}33`,
                        }}>{c.segment}</span>
                      </td>
                      <td style={styles.td} onClick={e => e.stopPropagation()}>
                        <div style={styles.actions}>
                          <button style={styles.actionBtn} onClick={() => openEdit(c)} title="Modifier">✎</button>
                          <button
                            style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                            onClick={() => setConfirmDelete(c)}
                            title="Supprimer"
                          >🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Client Detail Panel */}
      {selectedClient && (
        <div style={styles.detailOverlay} onClick={() => setSelectedClient(null)}>
          <div style={styles.detailPanel} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setSelectedClient(null)}>✕</button>
            <div style={{ ...styles.detailAvatar, background: segmentColor(selectedClient.segment) }}>
              {initials(selectedClient)}
            </div>
            <h2 style={styles.detailName}>{selectedClient.prenom} {selectedClient.nom}</h2>
            <span style={{
              ...styles.badge,
              color: segmentColor(selectedClient.segment),
              background: segmentBg(selectedClient.segment),
              fontSize: 13, padding: "4px 14px", marginBottom: 24, display: "inline-block"
            }}>{selectedClient.segment}</span>

            {[
              { label: "Email", value: selectedClient.email, icon: "✉" },
              { label: "Téléphone", value: selectedClient.telephone || "—", icon: "☎" },
              { label: "Adresse", value: selectedClient.adresse || "—", icon: "⌖" },
            ].map(row => (
              <div key={row.label} style={styles.detailRow}>
                <span style={styles.detailIcon}>{row.icon}</span>
                <div>
                  <div style={styles.detailLabel}>{row.label}</div>
                  <div style={styles.detailValue}>{row.value}</div>
                </div>
              </div>
            ))}

            <div style={styles.detailActions}>
              <button style={styles.editDetailBtn} onClick={() => openEdit(selectedClient)}>✎ Modifier</button>
              <button
                style={styles.deleteDetailBtn}
                onClick={() => { setConfirmDelete(selectedClient); setSelectedClient(null); }}
              >🗑 Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editId ? "Modifier le client" : "Nouveau client"}</h2>
              <button style={styles.closeBtn} onClick={() => { setShowForm(false); setFieldErrors({}); setGlobalError(""); }}>✕</button>
            </div>

            {globalError && <div style={styles.errorBar}>{globalError}</div>}

            <div style={styles.formGrid}>
              {[
                { key: "prenom", label: "Prénom", type: "text", placeholder: "Prénom" },
                { key: "nom", label: "Nom *", type: "text", placeholder: "Nom de famille" },
                { key: "email", label: "Email *", type: "email", placeholder: "email@exemple.com" },
                { key: "telephone", label: "Téléphone", type: "tel", placeholder: "+212 6XX XXX XXX" },
                { key: "adresse", label: "Adresse", type: "text", placeholder: "Adresse complète" },
              ].map(f => (
                <div key={f.key} style={f.key === "adresse" ? { ...styles.formGroup, gridColumn: "1/-1" } : styles.formGroup}>
                  <label style={styles.label}>{f.label}</label>
                  <input
                    style={{
                      ...styles.input,
                      ...(fieldErrors[f.key] ? styles.inputError : {}),
                    }}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={formData[f.key] || ""}
                    onChange={e => handleFieldChange(f.key, e.target.value)}
                  />
                  {fieldErrors[f.key] && (
                    <span style={styles.fieldErrorMsg}>⚠ {fieldErrors[f.key]}</span>
                  )}
                </div>
              ))}
              <div style={styles.formGroup}>
                <label style={styles.label}>Segment</label>
                <select
                  style={styles.input}
                  value={formData.segment}
                  onChange={e => handleFieldChange("segment", e.target.value)}
                >
                  {SEGMENTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setFieldErrors({}); setGlobalError(""); }}>Annuler</button>
              <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? "Sauvegarde..." : editId ? "Enregistrer les modifications" : "Ajouter le client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: 420 }}>
            <h2 style={{ ...styles.modalTitle, color: "#ef4444", marginBottom: 12 }}>Confirmer la suppression</h2>
            <p style={{ color: "#94a3b8", marginBottom: 24 }}>
              Voulez-vous supprimer définitivement{" "}
              <strong style={{ color: "#f8fafc" }}>{confirmDelete.prenom} {confirmDelete.nom}</strong> ?
              Cette action est irréversible.
            </p>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button
                style={{ ...styles.submitBtn, background: "#ef4444", boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }}
                onClick={() => handleDelete(confirmDelete.id)}
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1a; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        tbody tr { animation: fadeSlideIn 0.3s both; cursor: pointer; }
        tbody tr:hover { background: rgba(248,250,252,0.04) !important; }
        button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
        input, select { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "#0a0f1a",
    fontFamily: "'DM Sans', sans-serif",
    color: "#f8fafc",
  },
  sidebar: {
    width: 240,
    background: "#0d1424",
    borderRight: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    padding: "28px 0",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 24px 32px",
    borderBottom: "1px solid #1e293b",
    marginBottom: 24,
  },
  logoIcon: { fontSize: 24, color: "#3b82f6" },
  logoText: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: -0.5 },
  logoAccent: { color: "#3b82f6" },
  nav: { flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "0 12px" },
  navItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "11px 14px", borderRadius: 10,
    color: "#475569", fontSize: 14, fontWeight: 500,
    cursor: "pointer", position: "relative", transition: "all 0.2s",
  },
  navItemActive: { background: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  navIcon: { fontSize: 16, width: 20, textAlign: "center" },
  navIndicator: {
    position: "absolute", right: 12, width: 6, height: 6,
    borderRadius: "50%", background: "#3b82f6",
  },
  sidebarFooter: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "20px 24px 0",
    borderTop: "1px solid #1e293b",
    marginTop: "auto",
  },
  avatar: {
    width: 36, height: 36, borderRadius: 10,
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700,
  },
  userName: { fontSize: 13, fontWeight: 600 },
  userRole: { fontSize: 11, color: "#475569" },
  main: { flex: 1, padding: "40px 48px", overflowY: "auto" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 36,
  },
  pageTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
    letterSpacing: -1, marginBottom: 4,
  },
  pageSubtitle: { color: "#475569", fontSize: 14 },
  addBtn: {
    display: "flex", alignItems: "center",
    background: "#3b82f6", color: "#fff",
    border: "none", borderRadius: 12,
    padding: "12px 22px", fontSize: 14, fontWeight: 600,
    boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
    transition: "all 0.2s",
  },
  filters: { display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" },
  searchWrap: { flex: 1, minWidth: 260, position: "relative" },
  searchIcon: {
    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
    color: "#475569", fontSize: 18, pointerEvents: "none",
  },
  search: {
    width: "100%", padding: "12px 14px 12px 42px",
    background: "#0d1424", border: "1px solid #1e293b",
    borderRadius: 12, color: "#f8fafc", fontSize: 14, outline: "none",
  },
  segmentTabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  tab: {
    padding: "10px 16px", borderRadius: 10,
    background: "transparent", border: "1px solid #1e293b",
    color: "#475569", fontSize: 13, fontWeight: 500,
    transition: "all 0.2s",
  },
  tableWrap: {
    background: "#0d1424", border: "1px solid #1e293b",
    borderRadius: 16, overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "14px 20px", textAlign: "left",
    fontSize: 11, fontWeight: 600, letterSpacing: 1,
    color: "#475569", textTransform: "uppercase",
    borderBottom: "1px solid #1e293b",
    background: "#0a0f1a",
  },
  tr: {
    borderBottom: "1px solid #0f172a",
    transition: "background 0.15s",
  },
  td: { padding: "16px 20px", fontSize: 14 },
  clientCell: { display: "flex", alignItems: "center", gap: 12 },
  initials: {
    width: 38, height: 38, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
  },
  clientName: { fontWeight: 600, fontSize: 14 },
  badge: {
    display: "inline-block", padding: "4px 10px",
    borderRadius: 8, fontSize: 11, fontWeight: 600,
    letterSpacing: 0.5,
  },
  actions: { display: "flex", gap: 8 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 8,
    background: "rgba(248,250,252,0.06)", border: "1px solid #1e293b",
    color: "#94a3b8", fontSize: 16,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s",
  },
  deleteBtn: {
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.25)",
    background: "rgba(239,68,68,0.08)",
    fontSize: 14,
  },
  empty: {
    padding: "60px 20px", textAlign: "center",
    color: "#475569", fontSize: 14, lineHeight: 2.5,
  },
  loading: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: 80,
  },
  spinner: {
    width: 40, height: 40, border: "3px solid #1e293b",
    borderTop: "3px solid #3b82f6", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorBar: {
    background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
    color: "#f87171", borderRadius: 10, padding: "12px 16px",
    fontSize: 13, marginBottom: 16,
  },
  modalOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: 24,
  },
  modal: {
    background: "#0d1424", border: "1px solid #1e293b",
    borderRadius: 20, padding: 32, width: "100%", maxWidth: 600,
    maxHeight: "90vh", overflowY: "auto",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 28,
  },
  modalTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700,
  },
  closeBtn: {
    background: "rgba(248,250,252,0.08)", border: "1px solid #1e293b",
    color: "#94a3b8", width: 32, height: 32, borderRadius: 8, fontSize: 14,
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase" },
  input: {
    padding: "12px 14px", background: "#0a0f1a",
    border: "1px solid #1e293b", borderRadius: 10,
    color: "#f8fafc", fontSize: 14, outline: "none",
    transition: "border-color 0.2s",
  },
  inputError: {
    borderColor: "rgba(239,68,68,0.6)",
    background: "rgba(239,68,68,0.04)",
  },
  fieldErrorMsg: {
    fontSize: 12, color: "#f87171", marginTop: 2,
  },
  modalFooter: { display: "flex", gap: 12, justifyContent: "flex-end" },
  cancelBtn: {
    padding: "12px 22px", background: "transparent",
    border: "1px solid #1e293b", borderRadius: 10,
    color: "#94a3b8", fontSize: 14, fontWeight: 500,
  },
  submitBtn: {
    padding: "12px 24px", background: "#3b82f6",
    border: "none", borderRadius: 10, color: "#fff",
    fontSize: 14, fontWeight: 600,
    boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
  },
  detailOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)", zIndex: 90,
    display: "flex", justifyContent: "flex-end",
  },
  detailPanel: {
    width: 360, height: "100vh",
    background: "#0d1424", borderLeft: "1px solid #1e293b",
    padding: 32, overflowY: "auto", position: "relative",
    animation: "fadeSlideIn 0.25s ease",
    display: "flex", flexDirection: "column", alignItems: "center",
    textAlign: "center",
  },
  detailAvatar: {
    width: 72, height: 72, borderRadius: 20,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, fontWeight: 800, color: "#fff",
    marginBottom: 16, marginTop: 24,
  },
  detailName: {
    fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8,
  },
  detailRow: {
    display: "flex", alignItems: "flex-start", gap: 14,
    width: "100%", padding: "14px 0",
    borderBottom: "1px solid #1e293b", textAlign: "left",
  },
  detailIcon: { fontSize: 18, color: "#475569", width: 24, textAlign: "center", marginTop: 2 },
  detailLabel: { fontSize: 11, color: "#475569", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 },
  detailValue: { fontSize: 14, color: "#f8fafc" },
  detailActions: { display: "flex", gap: 10, marginTop: 28, width: "100%" },
  editDetailBtn: {
    flex: 1, padding: "12px", background: "rgba(59,130,246,0.12)",
    border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10,
    color: "#3b82f6", fontSize: 13, fontWeight: 600,
  },
  deleteDetailBtn: {
    flex: 1, padding: "12px", background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10,
    color: "#ef4444", fontSize: 13, fontWeight: 600,
  },
  toast: {
    position: "fixed", top: 24, right: 24, zIndex: 200,
    padding: "14px 20px", borderRadius: 12, color: "#fff",
    fontSize: 14, fontWeight: 600,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    animation: "toastIn 0.3s ease",
  },
};