"use client";

import React, { useEffect, useState } from "react";

interface Bill {
  id: number;
  bill_number: string;
  companion_bills?: string;
  previous_bill_number?: string;
  subject: string;
  position: "Support" | "Against" | "Monitor" | "Undecided" | "Archive";
  chamber: string;
  status?: string;
  sponsor?: string;
  url?: string;
  committee?: string;
  manager?: string;
  description?: string;
  fiscal_note?: string;
  is_pinned?: boolean;
  section_pin_order?: number;
  created_at?: string;
  updated_at?: string;
  is_archived?: boolean;
  is_funnel?: boolean;
}

export default function Home() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
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
      bill.subject.toLowerCase().includes(search.toLowerCase()) ||
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
      case "Support": return "position-support";
      case "Against": return "position-oppose";
      case "Monitor": return "position-monitor";
      default: return "position-tbd";
    }
  };

  const isNewBill = (createdAt?: string): boolean => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const daysSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated <= 6;
  };

  const normalizeBillNumber = (bn: string): string => bn.replace(/\s+/g, '').toUpperCase();

  const sortBillsWithCompanions = (billsToSort: Bill[]) => {
    const areCompanions = (bill1: Bill, bill2: Bill): boolean => {
      const companions1 = bill1.companion_bills ? bill1.companion_bills.split(',').map(b => normalizeBillNumber(b.trim())) : [];
      const companions2 = bill2.companion_bills ? bill2.companion_bills.split(',').map(b => normalizeBillNumber(b.trim())) : [];
      const norm1 = normalizeBillNumber(bill1.bill_number);
      const norm2 = normalizeBillNumber(bill2.bill_number);
      return companions1.includes(norm2) || companions2.includes(norm1);
    };

    const getCompanionGroupKey = (bill: Bill): string => {
      let groupRepresentative = bill;
      for (const otherBill of billsToSort) {
        if (areCompanions(bill, otherBill)) {
          if (otherBill.bill_number < groupRepresentative.bill_number) {
            groupRepresentative = otherBill;
          }
        }
      }
      return groupRepresentative.bill_number;
    };

    return billsToSort.sort((a, b) => {
      if ((a.section_pin_order ?? 999) !== (b.section_pin_order ?? 999)) {
        return (a.section_pin_order ?? 999) - (b.section_pin_order ?? 999);
      }
      const aGroupKey = getCompanionGroupKey(a);
      const bGroupKey = getCompanionGroupKey(b);
      if (aGroupKey !== bGroupKey) return aGroupKey.localeCompare(bGroupKey);
      return a.bill_number.localeCompare(b.bill_number);
    });
  };

  const registrationBills = sortBillsWithCompanions(
    filteredBills.filter(bill => (bill.is_pinned || (bill.position !== "Monitor" && bill.position !== "Archive")) && !bill.is_archived && !bill.is_funnel)
  );
  const monitoringBills = sortBillsWithCompanions(
    filteredBills.filter(bill => !bill.is_pinned && bill.position === "Monitor" && !bill.is_archived && !bill.is_funnel)
  );
  const funnelBills = sortBillsWithCompanions(
    filteredBills.filter(bill => bill.is_funnel && !bill.is_archived && bill.position !== "Archive")
  );
  const archivedBills = sortBillsWithCompanions(
    filteredBills.filter(bill => bill.is_archived || bill.position === "Archive")
  );

  const renderBillsTable = (sectionBills: Bill[], title: string) => {
    const renderCompanionGroup = (groupBills: Bill[]) => {
      const firstBill = groupBills[0];
      const representativeId = firstBill.id;
      const isExpanded = expanded.has(representativeId);

      return (
        <React.Fragment key={`group-${firstBill.bill_number}`}>
          <tr className={isExpanded ? "row-expanded" : ""}>
            <td className="expand-col" style={{ verticalAlign: 'top', paddingTop: '14px' }}>
              <button
                className={`expand-btn ${isExpanded ? "active" : ""}`}
                onClick={() => toggleDetail(representativeId)}
                title="Expand details"
                aria-label="Expand bill details"
              >
                <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
                  <path d="M1 0.5L7 5L1 9.5V0.5Z" />
                </svg>
              </button>
            </td>
            <td className="bill-number-col" style={{ verticalAlign: "middle" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {groupBills.map((bill) => (
                  <div key={bill.id} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    <a href={bill.url || "#"} target="_blank" rel="noopener noreferrer" className="bill-link">
                      {bill.bill_number}
                    </a>
                    {bill.previous_bill_number && (
                      <div className="prev-bill">Prev: {bill.previous_bill_number}</div>
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td className="title-col" style={{ verticalAlign: "middle" }}>
              <div className="bill-title">
                <span>{groupBills[0].subject}</span>
                {isNewBill(groupBills[0].created_at) && (
                  <span className="badge-new">NEW</span>
                )}
              </div>
            </td>
            <td className="fiscal-col" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                {groupBills.map((bill) => (
                  <div key={bill.id}>
                    {bill.fiscal_note ? (
                      <a href={bill.fiscal_note} target="_blank" rel="noopener noreferrer" title="View Fiscal Note" className="fiscal-link">$</a>
                    ) : (
                      <span className="empty-cell">—</span>
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td style={{ verticalAlign: 'middle' }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {groupBills.map((bill) => (
                  <div key={bill.id}>
                    {bill.committee ? <span className="tag tag-committee">{bill.committee}</span> : <span className="empty-cell">—</span>}
                  </div>
                ))}
              </div>
            </td>
            <td style={{ verticalAlign: 'middle' }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {groupBills.map((bill) => (
                  <div key={bill.id}>
                    {bill.manager ? <span className="tag tag-manager">{bill.manager}</span> : <span className="empty-cell">—</span>}
                  </div>
                ))}
              </div>
            </td>
            <td style={{ verticalAlign: 'middle' }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {groupBills.map((bill) => (
                  <div key={bill.id}>
                    {bill.status ? <span className="tag tag-status">{bill.status}</span> : <span className="empty-cell">—</span>}
                  </div>
                ))}
              </div>
            </td>
            <td style={{ verticalAlign: 'middle' }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {groupBills.map((bill) => (
                  <span key={bill.id} className={`position-badge ${getPositionClass(bill.position)}`}>
                    {bill.position}
                  </span>
                ))}
              </div>
            </td>
          </tr>
          {isExpanded && (
            <tr className="detail-row">
              <td colSpan={8}>
                <div className="bill-detail active">
                  {groupBills.map((bill, idx) => (
                    <div key={bill.id} className={`detail-block ${idx < groupBills.length - 1 ? "detail-block-border" : ""}`}>
                      <div className="detail-bill-label">{bill.bill_number}</div>
                      <div className="detail-grid">
                        <div className="detail-section">
                          <h5>Description</h5>
                          <p>{bill.description || "No description available"}</p>
                        </div>
                        <div className="detail-section">
                          <h5>Bill Information</h5>
                          <p><strong>Sponsor:</strong> {bill.sponsor || "Not specified"}</p>
                          <p><strong>Chamber:</strong> {bill.chamber}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    };

    const areCompanions = (bill1: Bill, bill2: Bill): boolean => {
      const companions1 = bill1.companion_bills ? bill1.companion_bills.split(',').map(b => normalizeBillNumber(b.trim())) : [];
      const companions2 = bill2.companion_bills ? bill2.companion_bills.split(',').map(b => normalizeBillNumber(b.trim())) : [];
      return companions1.includes(normalizeBillNumber(bill2.bill_number)) || companions2.includes(normalizeBillNumber(bill1.bill_number));
    };

    const groupedBills = new Map<string, Bill[]>();
    const processedIds = new Set<number>();
    for (const bill of sectionBills) {
      if (processedIds.has(bill.id)) continue;
      const group = [bill];
      processedIds.add(bill.id);
      const queue = [bill];
      while (queue.length > 0) {
        const currentBill = queue.shift()!;
        for (const otherBill of sectionBills) {
          if (!processedIds.has(otherBill.id) && areCompanions(currentBill, otherBill)) {
            group.push(otherBill);
            processedIds.add(otherBill.id);
            queue.push(otherBill);
          }
        }
      }
      group.sort((a, b) => a.bill_number.localeCompare(b.bill_number));
      groupedBills.set(group[0].bill_number, group);
    }

    if (sectionBills.length === 0) return null;

    return (
      <div className="section-block">
        <div className="section-label">
          <span className="section-label-text">{title}</span>
          <span className="section-label-count">{sectionBills.length}</span>
        </div>
        <div className="table-wrap">
          <table className="bills-table">
            <thead>
              <tr>
                <th className="expand-col"></th>
                <th className="bill-number-col">Bill #</th>
                <th className="title-col">Title</th>
                <th className="fiscal-col">Fiscal</th>
                <th>Committee</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(groupedBills.values()).map((group) => renderCompanionGroup(group))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        :root {
          --blue: #011689;
          --blue-dark: #010c52;
          --red: #930027;
          --red-light: #b8003a;
          --teal: #7ab6cc;
          --teal-light: #e8f4f8;
          --white: #FFFFFF;
          --bg: #f0f2f5;
          --surface: #FFFFFF;
          --border: #e4e7ec;
          --border-light: #f0f1f3;
          --text-primary: #1a1d26;
          --text-secondary: #5f6777;
          --text-muted: #9ca3b0;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg);
          min-height: 100vh;
          color: var(--text-primary);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 700;
        }

        /* ═══ HEADER ═══ */
        .header {
          background: var(--blue);
          position: relative;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.1) 100%);
          pointer-events: none;
        }

        .header-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 18px 0;
        }

        .header-logo { height: 44px; width: auto; }

        .header h1 {
          color: white;
          font-size: 1.5em;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 18px 0;
        }

        .session-badge {
          font-size: 0.78em;
          color: rgba(255,255,255,0.65);
          line-height: 1.5;
          text-align: right;
        }

        .session-badge strong {
          color: var(--teal);
          font-weight: 600;
        }

        .header-accent {
          height: 3px;
          background: var(--red);
        }

        /* ═══ CONTAINER ═══ */
        .container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px 32px 40px;
        }

        /* ═══ FILTERS ═══ */
        .filters {
          background: var(--surface);
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 28px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: flex-end;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px var(--border);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filter-group label {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.65em;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .filter-group select,
        .filter-group input {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--white);
          color: var(--text-primary);
          font-family: 'Open Sans', sans-serif;
          font-size: 0.88em;
          min-width: 165px;
          transition: all 0.2s ease;
        }

        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: var(--blue);
          box-shadow: 0 0 0 3px rgba(1, 22, 137, 0.08);
        }

        .admin-btn {
          background: var(--blue);
          color: white;
          padding: 8px 22px;
          border-radius: 8px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.82em;
          font-weight: 700;
          text-decoration: none;
          margin-left: auto;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }

        .admin-btn:hover {
          background: var(--blue-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(1, 22, 137, 0.25);
        }

        /* ═══ SECTION ═══ */
        .section-block {
          margin-bottom: 32px;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 0;
          padding: 14px 20px;
          background: var(--blue);
          border-radius: 10px 10px 0 0;
          position: relative;
        }

        .section-label::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--red);
        }

        .section-label-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85em;
          font-weight: 800;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .section-label-count {
          font-family: 'Montserrat', sans-serif;
          background: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.85);
          font-size: 0.72em;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 20px;
        }

        /* ═══ TABLE ═══ */
        .table-wrap {
          background: var(--surface);
          border-radius: 0 0 10px 10px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px var(--border);
        }

        .bills-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .bills-table thead {
          background: #f8f9fb;
        }

        .bills-table th {
          padding: 10px 12px;
          text-align: left;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          color: var(--text-muted);
          font-size: 0.67em;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid var(--border);
        }

        .bills-table td {
          padding: 12px;
          font-size: 0.88em;
          vertical-align: top;
          border-bottom: 1px solid var(--border-light);
        }

        .bills-table tbody tr {
          transition: background 0.12s ease;
        }

        .bills-table tbody tr:hover {
          background: #f8f9fb;
        }

        .bills-table tbody tr.row-expanded {
          background: var(--teal-light);
        }

        .bills-table tbody tr.row-expanded:hover {
          background: var(--teal-light);
        }

        /* Column widths */
        .expand-col { width: 36px; text-align: center; }
        .bill-number-col { width: 80px; }
        .title-col { width: 220px; }
        .fiscal-col { width: 60px; text-align: center; }
        .bills-table td:nth-child(5), .bills-table th:nth-child(5) { width: 100px; }
        .bills-table td:nth-child(6), .bills-table th:nth-child(6) { width: 85px; }
        .bills-table td:nth-child(7), .bills-table th:nth-child(7) { width: 165px; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; }
        .bills-table td:nth-child(8), .bills-table th:nth-child(8) { width: 105px; }

        /* ═══ BILL LINK ═══ */
        .bill-link {
          color: var(--blue);
          text-decoration: none;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.92em;
          letter-spacing: -0.01em;
          transition: color 0.15s;
        }

        .bill-link:hover {
          color: var(--red);
        }

        .prev-bill {
          font-size: 0.72em;
          color: var(--text-muted);
          white-space: nowrap;
        }

        /* ═══ TITLE ═══ */
        .bill-title {
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.35;
        }

        /* ═══ BADGES & TAGS ═══ */
        .badge-new {
          display: inline-block;
          background: var(--red);
          color: white;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.6em;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 3px;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .position-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 4px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.68em;
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
          letter-spacing: 0.03em;
        }

        .position-support {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .position-oppose {
          background: #fff1f2;
          color: #9f1239;
          border: 1px solid #fecdd3;
        }

        .position-monitor {
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .position-tbd {
          background: #f9fafb;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.78em;
          font-weight: 600;
          white-space: nowrap;
        }

        .tag-committee {
          background: var(--teal-light);
          color: #0e5f7a;
          border: 1px solid #c3dfe8;
        }

        .tag-manager {
          background: #f5f3ff;
          color: #5b21b6;
          border: 1px solid #e0d8fd;
        }

        .tag-status {
          background: #eef2ff;
          color: var(--blue);
          border: 1px solid #c7d2fe;
          font-size: 0.75em;
        }

        .fiscal-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          border-radius: 4px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 0.82em;
          text-decoration: none;
          transition: all 0.15s;
        }

        .fiscal-link:hover {
          background: #065f46;
          color: white;
          border-color: #065f46;
        }

        .empty-cell {
          color: var(--border);
          font-size: 0.85em;
        }

        /* ═══ EXPAND BUTTON ═══ */
        .expand-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .expand-btn:hover {
          color: var(--blue);
          background: #eef2ff;
        }

        .expand-btn.active {
          transform: rotate(90deg);
          color: var(--blue);
        }

        /* ═══ DETAIL ROW ═══ */
        .detail-row td {
          padding: 0 !important;
          border-bottom: 2px solid var(--teal) !important;
        }

        .bill-detail {
          display: none;
          background: #fafbfd;
          padding: 20px 24px;
          border-top: 1px solid var(--border);
        }

        .bill-detail.active { display: block; }

        .detail-block { padding: 4px 0; }

        .detail-block-border {
          padding-bottom: 16px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .detail-bill-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.78em;
          font-weight: 800;
          color: var(--blue);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 10px;
          padding-left: 10px;
          border-left: 3px solid var(--red);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .detail-section h5 {
          font-family: 'Montserrat', sans-serif;
          color: var(--text-muted);
          font-size: 0.65em;
          margin-bottom: 6px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .detail-section p {
          color: var(--text-primary);
          line-height: 1.7;
          font-size: 0.88em;
          margin: 4px 0;
        }

        /* ═══ FOOTER ═══ */
        .footer {
          text-align: center;
          padding: 28px 20px;
          color: var(--text-muted);
          font-size: 0.82em;
        }

        .footer a {
          color: var(--blue);
          text-decoration: none;
          font-weight: 600;
        }

        .footer a:hover {
          color: var(--red);
        }

        .empty-message {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
          font-size: 0.95em;
        }

        /* ═══ RESPONSIVE: 1024 ═══ */
        @media (max-width: 1024px) {
          .container { padding: 20px; }
          .header-inner { padding: 0 20px; }
          .expand-col { width: 32px; }
          .bill-number-col { width: 68px; }
          .title-col { width: 175px; }
          .bills-table td:nth-child(5), .bills-table th:nth-child(5) { width: 85px; }
          .bills-table td:nth-child(6), .bills-table th:nth-child(6) { width: 72px; }
          .bills-table td:nth-child(7), .bills-table th:nth-child(7) { width: 135px; }
          .bills-table td:nth-child(8), .bills-table th:nth-child(8) { width: 95px; }
        }

        /* ═══ RESPONSIVE: 768 ═══ */
        @media (max-width: 768px) {
          .header-inner { flex-direction: column; padding: 0 16px; }
          .header-left { padding: 14px 0 8px; gap: 12px; justify-content: center; }
          .header h1 { font-size: 1.25em; }
          .header-right { padding: 0 0 14px; justify-content: center; }
          .session-badge { text-align: center; }
          .container { padding: 14px; }
          .filters { flex-direction: column; padding: 14px; }
          .filter-group { width: 100%; }
          .filter-group select, .filter-group input { width: 100%; }
          .admin-btn { margin-left: 0; width: 100%; text-align: center; display: block; }
          .bills-table { font-size: 0.78em; }
          .bills-table th { padding: 8px 6px; font-size: 0.64em; }
          .bills-table td { padding: 8px 6px; }
          .expand-col { width: 26px; }
          .bill-number-col { width: 54px; font-size: 0.82em; }
          .title-col { width: 135px; }
          .bills-table td:nth-child(4), .bills-table th:nth-child(4) { width: 44px; }
          .bills-table td:nth-child(5), .bills-table th:nth-child(5) { width: 58px; }
          .bills-table td:nth-child(6), .bills-table th:nth-child(6) { width: 52px; }
          .bills-table td:nth-child(7), .bills-table th:nth-child(7) { width: 105px; }
          .bills-table td:nth-child(8), .bills-table th:nth-child(8) { width: 72px; }
          .position-badge { font-size: 0.6em; padding: 2px 6px; }
          .tag { font-size: 0.7em; padding: 2px 4px; }
          .bill-title { font-size: 0.85em; }
          .section-label { padding: 12px 16px; }
          .section-label-text { font-size: 0.78em; }
        }

        /* ═══ RESPONSIVE: 480 ═══ */
        @media (max-width: 480px) {
          .header-left { padding: 12px 0 6px; }
          .header-logo { height: 36px; }
          .header h1 { font-size: 1.05em; }
          .session-badge { font-size: 0.72em; }
          .filters { padding: 12px; gap: 10px; }
          .filter-group select, .filter-group input { min-width: unset; }
          .container { padding: 10px; }
          .bills-table th { white-space: normal; }
          .bills-table td { vertical-align: middle; }
          .expand-col { width: 24px; }
          .bill-number-col { width: 48px; font-size: 0.8em; }
          .title-col { width: auto; }
          .fiscal-col { width: 34px; }
          .bills-table td:nth-child(5), .bills-table th:nth-child(5) { width: 50px; }
          .bills-table td:nth-child(6), .bills-table th:nth-child(6) { width: 46px; }
          .bills-table td:nth-child(7), .bills-table th:nth-child(7) { display: none; }
          .bills-table td:nth-child(8), .bills-table th:nth-child(8) { width: 58px; }
          .position-badge { font-size: 0.58em; padding: 2px 4px; }
          .tag { font-size: 0.68em; padding: 1px 4px; }
          .bill-title { font-size: 0.82em; }
          .section-label { border-radius: 8px 8px 0 0; padding: 10px 14px; }
          .table-wrap { border-radius: 0 0 8px 8px; }
          .detail-grid { grid-template-columns: 1fr; gap: 14px; }
        }
      `}</style>

      <div className="header">
        <div className="header-inner">
          <div className="header-left">
            <img src="/itr_logo.png" alt="Iowans for Tax Relief" className="header-logo" />
            <h1>Bill Tracker</h1>
          </div>
          <div className="header-right">
            <div className="session-badge">
              <div>91st General Assembly <strong>(2025–2027)</strong></div>
              <div style={{ opacity: 0.6, fontSize: '0.9em' }}>Last Updated: January 28, 2026</div>
            </div>
          </div>
        </div>
        <div className="header-accent" />
      </div>

      <div className="container">
        <div className="filters">
          <div className="filter-group">
            <label>Search</label>
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
            <label>Position</label>
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
          <div className="empty-message">Loading bills...</div>
        ) : filteredBills.length === 0 ? (
          <div className="empty-message">No bills found</div>
        ) : (
          <>
            {renderBillsTable(registrationBills, "Registrations")}
            {renderBillsTable(monitoringBills, "Monitoring")}
            {renderBillsTable(funnelBills, "Did Not Survive Funnel")}
            {renderBillsTable(archivedBills, "Archive")}
          </>
        )}

        <div className="footer">
          <p>Data sourced from <a href="https://www.legis.iowa.gov">Iowa Legislature</a></p>
        </div>
      </div>
    </>
  );
}
