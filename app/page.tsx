"use client";

import { useEffect, useState } from "react";

interface Bill {
  id: number;
  bill_number: string;
  title: string;
  short_title: string;
  position: "Support" | "Against" | "Monitor" | "Undecided";
  chamber: string;
  status?: string;
  sponsor?: string;
  url?: string;
}

const positionColors: Record<string, string> = {
  Support: "bg-green-100 text-green-800",
  Against: "bg-red-100 text-red-800",
  Monitor: "bg-yellow-100 text-yellow-800",
  Undecided: "bg-gray-100 text-gray-800",
};

export default function Home() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    const loadBills = async () => {
      try {
        const response = await fetch("/api/bills");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setBills(data);
          }
        }
      } catch (e) {
        console.log("Bills load failed");
      } finally {
        setLoading(false);
      }
    };

    loadBills();
  }, []);

  const filteredBills = filter === "All"
    ? bills
    : bills.filter(b => b.position === filter);

  const stats = {
    Support: bills.filter(b => b.position === "Support").length,
    Against: bills.filter(b => b.position === "Against").length,
    Monitor: bills.filter(b => b.position === "Monitor").length,
    Undecided: bills.filter(b => b.position === "Undecided").length,
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#111827", marginBottom: "0.5rem" }}>
            ITR Bill Tracker
          </h1>
          <p style={{ color: "#4b5563" }}>
            Iowa General Assembly bill positions for Iowans for Tax Relief
          </p>
          <a
            href="/admin"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            Admin Panel
          </a>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280" }}>Loading bills...</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ backgroundColor: "white", padding: "1rem", borderRadius: "0.375rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>{stats.Support}</div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Support</div>
              </div>
              <div style={{ backgroundColor: "white", padding: "1rem", borderRadius: "0.375rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>{stats.Against}</div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Against</div>
              </div>
              <div style={{ backgroundColor: "white", padding: "1rem", borderRadius: "0.375rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>{stats.Monitor}</div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Monitor</div>
              </div>
              <div style={{ backgroundColor: "white", padding: "1rem", borderRadius: "0.375rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827" }}>{stats.Undecided}</div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Undecided</div>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["All", "Support", "Against", "Monitor", "Undecided"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    backgroundColor: filter === f ? "#2563eb" : "white",
                    color: filter === f ? "white" : "#374151",
                    border: filter === f ? "none" : "1px solid #d1d5db",
                    cursor: "pointer",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              {filteredBills.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: "3rem", paddingBottom: "3rem", backgroundColor: "white", borderRadius: "0.375rem" }}>
                  <p style={{ color: "#6b7280" }}>No bills found</p>
                </div>
              ) : (
                filteredBills.map(bill => (
                  <div
                    key={bill.id}
                    style={{
                      backgroundColor: "white",
                      padding: "1.5rem",
                      borderRadius: "0.375rem",
                      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#111827" }}>
                          {bill.bill_number}
                        </h3>
                        <p style={{ color: "#4b5563" }}>{bill.title}</p>
                      </div>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          backgroundColor: positionColors[bill.position]?.split(" ")[0] || "white",
                          color: positionColors[bill.position]?.split(" ")[1] || "black",
                        }}
                      >
                        {bill.position}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.5rem" }}>
                      {bill.chamber && <p>{bill.chamber}</p>}
                      {bill.status && <p>Status: {bill.status}</p>}
                      {bill.sponsor && <p>Sponsor: {bill.sponsor}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
