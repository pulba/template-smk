// tina/PendaftaranScreen.tsx
import React, { useEffect, useState } from "react";

interface Pendaftar {
    id: number;
    kode_pendaftaran: string;
    tahun_ppdb: string;
    nama_lengkap: string;
    nama_panggilan: string;
    email: string;
    nomor_hp: string;
    status: string;
    created_at: string;
}

const STATUS_OPTIONS = ["pending", "review", "approved", "rejected"];
const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    review: "#3b82f6",
    approved: "#10b981",
    rejected: "#ef4444",
};
const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    review: "Direview",
    approved: "Diterima",
    rejected: "Ditolak",
};

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div
            style={{
                background: "#fff",
                borderRadius: 12,
                padding: "16px 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                borderTop: `4px solid ${color}`,
                minWidth: 130,
                flex: 1,
            }}
        >
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{label}</div>
        </div>
    );
}

export function PendaftaranScreen() {
    const [data, setData] = useState<Pendaftar[]>([]);
    const [filtered, setFiltered] = useState<Pendaftar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterTahun, setFilterTahun] = useState<string>("all");
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/pendaftaran/list");
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Gagal mengambil data");
            setData(json.data || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let result = [...data];
        if (filterStatus !== "all") result = result.filter((d) => d.status === filterStatus);
        if (filterTahun !== "all") result = result.filter((d) => d.tahun_ppdb === filterTahun);
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (d) =>
                    d.nama_lengkap?.toLowerCase().includes(q) ||
                    d.kode_pendaftaran?.toLowerCase().includes(q) ||
                    d.email?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [data, filterStatus, filterTahun, search]);

    const currentYear = new Date().getFullYear();
    const upcomingYears = Array.from({ length: 10 }, (_, i) => {
        const start = currentYear + i;
        return `${start}/${start + 1}`;
    });
    const dataYears = data.map((d) => d.tahun_ppdb).filter(Boolean);
    const tahunOptions = [...new Set([...dataYears, ...upcomingYears])].sort();

    const stats = STATUS_OPTIONS.map((s) => ({
        label: STATUS_LABELS[s],
        count: data.filter((d) => d.status === s).length,
        color: STATUS_COLORS[s],
    }));

    const updateStatus = async (id: number, newStatus: string) => {
        setUpdatingId(id);
        try {
            const url = `/api/pendaftaran/update-status?id=${id}&status=${newStatus}`;
            const res = await fetch(url);
            if (res.ok || res.redirected) {
                setData((prev) =>
                    prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
                );
            } else {
                alert("Gagal mengubah status");
            }
        } catch (e) {
            alert("Error mengubah status");
        } finally {
            setUpdatingId(null);
        }
    };

    const formatDate = (iso: string) => {
        if (!iso) return "-";
        return new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(iso));
    };

    const exportCSV = () => {
        if (filtered.length === 0) {
            alert("Tidak ada data untuk di-export");
            return;
        }
        const headers = ["Kode Pendaftaran", "Nama Lengkap", "Email", "Nomor HP", "Tahun SPMB", "Status", "Tanggal Daftar"];
        const rows = filtered.map((d) => [
            d.kode_pendaftaran,
            d.nama_lengkap,
            d.email,
            d.nomor_hp,
            d.tahun_ppdb,
            STATUS_LABELS[d.status] || d.status,
            formatDate(d.created_at),
        ]);
        const csvContent = [headers, ...rows]
            .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const tahunLabel = filterTahun === "all" ? "Semua" : filterTahun.replace("/", "-");
        const statusLabel = filterStatus === "all" ? "Semua" : filterStatus;
        link.href = url;
        link.download = `Pendaftaran_${tahunLabel}_${statusLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                    <div style={{ color: "#6b7280" }}>Memuat data pendaftaran...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: 24 }}>
                <div
                    style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 10,
                        padding: 16,
                        color: "#dc2626",
                    }}
                >
                    <strong>❌ Gagal memuat data:</strong> {error}
                    <br />
                    <button
                        onClick={fetchData}
                        style={{
                            marginTop: 10,
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 14px",
                            cursor: "pointer",
                        }}
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px 32px", fontFamily: "Inter, system-ui, sans-serif", maxWidth: "100%", background: "#f9fafb", minHeight: "100vh" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
                    📋 Manajemen Pendaftaran SPMB
                </h1>
                <p style={{ color: "#6b7280", marginTop: 4, fontSize: 14 }}>
                    Total {data.length} pendaftar terdaftar
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                <StatCard label="Total" count={data.length} color="#6366f1" />
                {stats.map((s) => (
                    <StatCard key={s.label} label={s.label} count={s.count} color={s.color} />
                ))}
            </div>

            {/* Filters */}
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 20,
                    background: "#fff",
                    padding: 16,
                    borderRadius: 10,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
            >
                <input
                    type="text"
                    placeholder="🔍 Cari nama, kode, atau email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 2,
                        minWidth: 220,
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        outline: "none",
                    }}
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        background: "#fff",
                        cursor: "pointer",
                    }}
                >
                    <option value="all">Semua Status</option>
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                        </option>
                    ))}
                </select>
                <select
                    value={filterTahun}
                    onChange={(e) => setFilterTahun(e.target.value)}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        background: "#fff",
                        cursor: "pointer",
                    }}
                >
                    <option value="all">Semua Tahun</option>
                    {tahunOptions.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
                <button
                    onClick={fetchData}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#6366f1",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    🔄 Refresh
                </button>
                <button
                    onClick={exportCSV}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#16a34a",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    📥 Export CSV
                </button>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: "60px 20px",
                        background: "#fff",
                        borderRadius: 10,
                        color: "#9ca3af",
                    }}
                >
                    <div style={{ fontSize: 40 }}>📭</div>
                    <div style={{ marginTop: 10, fontSize: 16 }}>Tidak ada data yang cocok</div>
                </div>
            ) : (
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        overflow: "auto",
                    }}
                >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                                {["#", "Kode Pendaftaran", "Nama Lengkap", "Email", "Tahun SPMB", "Tanggal Daftar", "Status", "Aksi"].map(
                                    (h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: "12px 14px",
                                                textAlign: "left",
                                                fontWeight: 600,
                                                color: "#374151",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {h}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, i) => (
                                <tr
                                    key={row.id}
                                    style={{
                                        borderBottom: "1px solid #f3f4f6",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) =>
                                        ((e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb")
                                    }
                                    onMouseLeave={(e) =>
                                        ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")
                                    }
                                >
                                    <td style={{ padding: "11px 14px", color: "#9ca3af" }}>{i + 1}</td>
                                    <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#4b5563", fontSize: 12 }}>
                                        {row.kode_pendaftaran}
                                    </td>
                                    <td style={{ padding: "11px 14px", fontWeight: 600, color: "#111827" }}>
                                        {row.nama_lengkap}
                                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>
                                            {row.nomor_hp}
                                        </div>
                                    </td>
                                    <td style={{ padding: "11px 14px", color: "#6b7280" }}>{row.email}</td>
                                    <td style={{ padding: "11px 14px", color: "#6b7280" }}>{row.tahun_ppdb}</td>
                                    <td style={{ padding: "11px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>
                                        {formatDate(row.created_at)}
                                    </td>
                                    <td style={{ padding: "11px 14px" }}>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "3px 10px",
                                                borderRadius: 20,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                background: `${STATUS_COLORS[row.status] || "#e5e7eb"}22`,
                                                color: STATUS_COLORS[row.status] || "#374151",
                                                border: `1px solid ${STATUS_COLORS[row.status] || "#e5e7eb"}55`,
                                                textTransform: "uppercase",
                                                letterSpacing: ".5px",
                                            }}
                                        >
                                            {STATUS_LABELS[row.status] || row.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "11px 14px" }}>
                                        <select
                                            value={row.status}
                                            disabled={updatingId === row.id}
                                            onChange={(e) => updateStatus(row.id, e.target.value)}
                                            style={{
                                                padding: "5px 10px",
                                                borderRadius: 7,
                                                border: "1px solid #d1d5db",
                                                background: "#fff",
                                                fontSize: 12,
                                                cursor: "pointer",
                                                opacity: updatingId === row.id ? 0.5 : 1,
                                            }}
                                        >
                                            {STATUS_OPTIONS.map((s) => (
                                                <option key={s} value={s}>
                                                    {STATUS_LABELS[s]}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div
                        style={{
                            padding: "10px 16px",
                            borderTop: "1px solid #f3f4f6",
                            color: "#9ca3af",
                            fontSize: 12,
                        }}
                    >
                        Menampilkan {filtered.length} dari {data.length} pendaftar
                    </div>
                </div>
            )}
        </div>
    );
}
