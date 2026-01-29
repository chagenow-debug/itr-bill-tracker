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
  committee?: string;
  description?: string;
}

export default function Home() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [chamber, setChamber] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

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

  const filteredBills = bills.filter(bill => {
    const matchSearch = !search ||
      bill.bill_number.toLowerCase().includes(search.toLowerCase()) ||
      bill.short_title.toLowerCase().includes(search.toLowerCase()) ||
      bill.title.toLowerCase().includes(search.toLowerCase()) ||
      (bill.description?.toLowerCase().includes(search.toLowerCase()) || false);

    const matchChamber = chamber === "all" ||
      bill.chamber.toLowerCase().includes(chamber === "senate" ? "senate" : "house");

    const matchPosition = position === "all" || bill.position === position;

    return matchSearch && matchChamber && matchPosition;
  });

  const toggleDetail = (id: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const getPositionClass = (pos: string) => {
    switch (pos) {
      case "Support":
        return "position-support";
      case "Against":
        return "position-oppose";
      case "Monitor":
        return "position-monitor";
      default:
        return "position-tbd";
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f5f5;
          min-height: 100vh;
          color: #333;
        }

        .header {
          background: linear-gradient(90deg, #c41e3a 0%, #8b0000 100%);
          padding: 15px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .header h1 {
          color: white;
          font-size: 1.5em;
          font-weight: 600;
        }

        .header-subtitle {
          color: rgba(255,255,255,0.9);
          font-size: 0.85em;
          margin-top: 3px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .session-info {
          background: rgba(255,255,255,0.15);
          padding: 8px 15px;
          border-radius: 6px;
          text-align: right;
          font-size: 0.85em;
        }

        .session-info span {
          color: #ffd700;
          font-weight: 600;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .filters {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          align-items: center;
          border: 1px solid #ddd;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .filter-group label {
          font-size: 0.8em;
          color: #666;
        }

        .filter-group select, .filter-group input {
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #ccc;
          background: white;
          color: #333;
          font-size: 0.9em;
          min-width: 160px;
        }

        .filter-group select:focus, .filter-group input:focus {
          outline: none;
          border-color: #c41e3a;
        }

        .bills-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .bills-table thead {
          background: #c41e3a;
        }

        .bills-table th {
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          color: white;
          font-size: 0.85em;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }

        .bills-table th:hover {
          background: #a01830;
        }

        .bills-table td {
          padding: 8px;
          border-bottom: 1px solid #eee;
          font-size: 0.9em;
          vertical-align: top;
        }

        .bills-table tbody tr {
          transition: background 0.2s;
        }

        .bills-table tbody tr:hover {
          background: #f9f9f9;
        }

        .bill-link {
          color: #1565c0;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .bill-link:hover {
          color: #0d47a1;
          text-decoration: underline;
        }

        .position-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .position-support {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #a5d6a7;
        }

        .position-oppose {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ef9a9a;
        }

        .position-monitor {
          background: #fff8e1;
          color: #f57f17;
          border: 1px solid #ffe082;
        }

        .position-tbd {
          background: #f5f5f5;
          color: #757575;
          border: 1px solid #bdbdbd;
        }

        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.75em;
          background: #e3f2fd;
          color: #1565c0;
          border: 1px solid #90caf9;
        }

        .committee-tag {
          background: #f3e5f5;
          color: #7b1fa2;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8em;
        }

        .bill-detail {
          display: none;
          background: #fafafa;
          padding: 15px;
          margin-top: -1px;
          border-bottom: 1px solid #ddd;
        }

        .bill-detail.active {
          display: table-row;
        }

        .bill-detail h4 {
          color: #c41e3a;
          margin-bottom: 10px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .detail-section h5 {
          color: #666;
          font-size: 0.8em;
          margin-bottom: 5px;
          text-transform: uppercase;
        }

        .detail-section p {
          color: #333;
          line-height: 1.5;
          font-size: 0.9em;
        }

        .expand-btn {
          background: none;
          border: none;
          color: #1565c0;
          cursor: pointer;
          font-size: 1em;
          transition: transform 0.2s;
          width: 20px;
          height: 20px;
        }

        .expand-btn:hover {
          color: #0d47a1;
        }

        .expand-btn.active {
          transform: rotate(90deg);
        }

        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 0.8em;
          margin-top: 20px;
        }

        .admin-btn {
          background: #c41e3a;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
          margin-left: auto;
          transition: background 0.2s;
        }

        .admin-btn:hover {
          background: #a01830;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            text-align: center;
            gap: 10px;
            padding: 15px;
          }

          .filters {
            flex-direction: column;
          }

          .filter-group select, .filter-group input {
            width: 100%;
          }

          .bills-table {
            font-size: 0.8em;
          }

          .bills-table th, .bills-table td {
            padding: 6px 4px;
          }
        }
      `}</style>

      <div className="header">
        <div className="header-content">
          <div>
            <h1>ITR Bill Tracker</h1>
            <div className="header-subtitle">Legislative Bill Tracker - 91st General Assembly</div>
          </div>
        </div>
        <div className="session-info">
          <div>Session: <span>91st GA (2025-2027)</span></div>
          <div style={{ color: "#666", fontSize: "0.8em", marginTop: "5px" }}>Last Updated: January 28, 2026</div>
        </div>
      </div>

      <div className="container">
        <div className="filters">
          <div className="filter-group">
            <label>Search Bills</label>
            <input
              type="text"
              placeholder="Bill #, title, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Chamber</label>
            <select value={chamber} onChange={(e) => setChamber(e.target.value)}>
              <option value="all">All Chambers</option>
              <option value="senate">Senate</option>
              <option value="house">House</option>
            </select>
          </div>
          <div className="filter-group">
            <label>ITR Position</label>
            <select value={position} onChange={(e) => setPosition(e.target.value)}>
              <option value="all">All Positions</option>
              <option value="Support">Support</option>
              <option value="Against">Against</option>
              <option value="Monitor">Monitor</option>
              <option value="Undecided">Undecided</option>
            </select>
          </div>
          <a href="/admin" className="admin-btn">Admin Panel</a>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "8px" }}>
            <p style={{ color: "#666" }}>Loading bills...</p>
          </div>
        ) : (
          <>
            <table className="bills-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}></th>
                  <th>Bill #</th>
                  <th>Title</th>
                  <th>Committee</th>
                  <th>Status</th>
                  <th>ITR Position</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                      No bills found
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tbody key={bill.id}>
                      <tr>
                        <td>
                          <button
                            className={`expand-btn ${expanded.has(bill.id) ? "active" : ""}`}
                            onClick={() => toggleDetail(bill.id)}
                          >
                            ▶
                          </button>
                        </td>
                        <td>
                          <a href={bill.url || "#"} target="_blank" rel="noopener noreferrer" className="bill-link">
                            {bill.bill_number}
                          </a>
                        </td>
                        <td>
                          <strong>{bill.short_title}</strong>
                          <br />
                          <small style={{ color: "#666" }}>
                            {bill.title.substring(0, 60)}
                            {bill.title.length > 60 ? "..." : ""}
                          </small>
                        </td>
                        <td>
                          {bill.committee && <span className="committee-tag">{bill.committee}</span>}
                        </td>
                        <td>
                          {bill.status && <span className="status-badge">{bill.status}</span>}
                        </td>
                        <td>
                          <span className={`position-badge ${getPositionClass(bill.position)}`}>
                            {bill.position}
                          </span>
                        </td>
                      </tr>
                      {expanded.has(bill.id) && (
                        <tr>
                          <td colSpan={6}>
                            <div className="bill-detail active">
                              <div className="detail-grid">
                                <div className="detail-section">
                                  <h5>Full Description</h5>
                                  <p>{bill.description || "No description available"}</p>
                                </div>
                                <div className="detail-section">
                                  <h5>Bill Information</h5>
                                  <p><strong>Sponsor:</strong> {bill.sponsor || "Not specified"}</p>
                                  <p><strong>Chamber:</strong> {bill.chamber}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}

        <div className="footer">
          <p>Iowans for Tax Relief - A 501(c)(4) Organization Promoting Free Market Principles</p>
          <p style={{ marginTop: "10px" }}>
            Data sourced from{" "}
            <a href="https://www.legis.iowa.gov" style={{ color: "#1565c0" }}>
              Iowa Legislature
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
