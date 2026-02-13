"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Bill {
  id: number;
  bill_number: string;
  companion_bills?: string;
  previous_bill_number?: string;
  subject: string;
  position: "Support" | "Against" | "Monitor" | "Undecided";
  chamber: string;
  status?: string;
  sponsor?: string;
  description?: string;
  committee?: string;
  committee_key?: string;
  manager?: string;
  subcommittee?: string;
  fiscal_note?: string;
  lsb?: string;
  url?: string;
  notes?: string;
  is_pinned?: boolean;
  section_pin_order?: number;
  is_archived?: boolean;
}

export default function AdminPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bill_number: "",
    companion_bills: "",
    previous_bill_number: "",
    subject: "",
    chamber: "House",
    position: "Undecided" as const,
    status: "",
    sponsor: "",
    description: "",
    committee: "",
    committee_key: "",
    manager: "",
    subcommittee: "",
    fiscal_note: "",
    lsb: "",
    url: "",
    notes: "",
    is_pinned: false,
    section_pin_order: undefined as number | undefined,
    is_archived: false,
  });
  const router = useRouter();

  // Helper function to sort bills with companion grouping (same as main site)
  const sortBillsWithCompanions = (billsToSort: Bill[]) => {
    // Helper to check if two bills are companions (bidirectional)
    const areCompanions = (bill1: Bill, bill2: Bill): boolean => {
      return (bill1.companion_bills && bill1.companion_bills.includes(bill2.bill_number)) ||
             (bill2.companion_bills && bill2.companion_bills.includes(bill1.bill_number));
    };

    // Helper to get the sort key for a bill (used for grouping companions)
    const getCompanionGroupKey = (bill: Bill): string => {
      // Find the "first" bill in a companion group by comparing all companion relationships
      let groupRepresentative = bill;
      for (const otherBill of billsToSort) {
        if (areCompanions(bill, otherBill)) {
          // Use the one that comes first alphabetically as the group representative
          if (otherBill.bill_number < groupRepresentative.bill_number) {
            groupRepresentative = otherBill;
          }
        }
      }
      return groupRepresentative.bill_number;
    };

    return billsToSort.sort((a, b) => {
      // Sort by section_pin_order first (pinned items)
      if ((a.section_pin_order ?? 999) !== (b.section_pin_order ?? 999)) {
        return (a.section_pin_order ?? 999) - (b.section_pin_order ?? 999);
      }

      // Check if bills are in the same companion group
      const aGroupKey = getCompanionGroupKey(a);
      const bGroupKey = getCompanionGroupKey(b);

      if (aGroupKey !== bGroupKey) {
        // Different groups, sort by group representative
        return aGroupKey.localeCompare(bGroupKey);
      }

      // Same group, sort by bill number within group
      return a.bill_number.localeCompare(b.bill_number);
    });
  };

  useEffect(() => {
    const checkAuthAndLoadBills = async () => {
      try {
        // Check if authenticated first
        const authResponse = await fetch("/api/auth/check", {
          credentials: "include",
        });

        if (authResponse.status === 401) {
          router.push("/admin/login");
          return;
        }

        // Load bills if authenticated
        const billsResponse = await fetch("/api/bills", {
          credentials: "include",
        });

        if (!billsResponse.ok) throw new Error("Failed to fetch bills");
        const data = await billsResponse.json();
        setBills(data);
      } catch (error) {
        console.error("Error loading admin:", error);
        // Don't redirect, let the page show an error or load without auth
      }
    };

    checkAuthAndLoadBills();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/bills/${editingId}` : "/api/bills";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to save bill");
      }

      const savedBill = await response.json();

      if (editingId) {
        setBills(bills.map(b => (b.id === editingId ? savedBill : b)));
      } else {
        setBills([...bills, savedBill]);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        bill_number: "",
        companion_bills: "",
        previous_bill_number: "",
        subject: "",
        chamber: "House",
        position: "Undecided",
        status: "",
        sponsor: "",
        description: "",
        committee: "",
        committee_key: "",
        manager: "",
        subcommittee: "",
        fiscal_note: "",
        lsb: "",
        url: "",
        notes: "",
        is_pinned: false,
        section_pin_order: undefined,
        is_archived: false,
      });
    } catch (error: any) {
      console.error("Error saving bill:", error);
      alert("Error saving bill: " + (error.message || "Unknown error"));
    }
  };

  const handleEdit = (bill: Bill) => {
    setEditingId(bill.id);
    setFormData({
      ...bill,
      // Ensure all fields have proper default values
      chamber: bill.chamber || "House",
      position: bill.position || "Undecided",
      bill_number: bill.bill_number || "",
      companion_bills: bill.companion_bills || "",
      previous_bill_number: bill.previous_bill_number || "",
      subject: bill.subject || "",
      status: bill.status || "",
      sponsor: bill.sponsor || "",
      description: bill.description || "",
      committee: bill.committee || "",
      committee_key: bill.committee_key || "",
      manager: bill.manager || "",
      subcommittee: bill.subcommittee || "",
      fiscal_note: bill.fiscal_note || "",
      lsb: bill.lsb || "",
      url: bill.url || "",
      notes: bill.notes || "",
      is_pinned: bill.is_pinned || false,
      section_pin_order: bill.section_pin_order,
      is_archived: bill.is_archived || false,
    } as any);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch(`/api/bills/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Delete failed");
      setBills(bills.filter(b => b.id !== id));
    } catch (error) {
      alert("Error deleting bill");
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" />
      <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage bills and positions</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                bill_number: "",
                companion_bills: "",
                previous_bill_number: "",
                subject: "",
                chamber: "House",
                position: "Undecided",
                status: "",
                sponsor: "",
                description: "",
                committee: "",
                committee_key: "",
                manager: "",
                subcommittee: "",
                fiscal_note: "",
                lsb: "",
                url: "",
                notes: "",
                is_pinned: false,
                section_pin_order: undefined,
                is_archived: false,
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "Add New Bill"}
          </button>
          <a
            href="/admin/import"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Import CSV
          </a>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 rounded shadow mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit Bill" : "Add New Bill"}
            </h2>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="bill_number"
                  placeholder="Bill Number (e.g., HF 123)"
                  value={formData.bill_number}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                  required
                />
                <select
                  name="chamber"
                  value={formData.chamber}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                >
                  <option>House</option>
                  <option>Senate</option>
                </select>
              </div>

              <input
                name="companion_bills"
                placeholder="Companion Bill Number (e.g., SF 456) - reference to related chamber version"
                value={formData.companion_bills}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
              />

              <input
                name="previous_bill_number"
                placeholder="Previous Bill Number (e.g., HSB 123 -> HF 123) - bill renumbering"
                value={formData.previous_bill_number}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
              />

              <input
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                required
              />

              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                  required
                >
                  <option>Support</option>
                  <option>Against</option>
                  <option>Monitor</option>
                  <option>Undecided</option>
                </select>

                <input
                  name="status"
                  placeholder="Status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  name="sponsor"
                  placeholder="Sponsor"
                  value={formData.sponsor}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                />
                <input
                  name="committee"
                  placeholder="Committee"
                  value={formData.committee}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  name="manager"
                  placeholder="Manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                />
                <input
                  name="committee_key"
                  placeholder="Committee Key"
                  value={formData.committee_key}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  name="subcommittee"
                  placeholder="Subcommittee"
                  value={formData.subcommittee}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  name="url"
                  type="url"
                  placeholder="Bill URL"
                  value={formData.url}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                />
                <input
                  name="lsb"
                  placeholder="LSB #"
                  value={formData.lsb}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2"
                />
              </div>

              <input
                type="url"
                name="fiscal_note"
                placeholder="Fiscal Note URL (if available)"
                value={formData.fiscal_note}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
              />

              <textarea
                name="notes"
                placeholder="Internal Notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                rows={2}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  className="w-4 h-4 cursor-pointer"
                  id="is_pinned"
                />
                <label htmlFor="is_pinned" className="text-sm font-medium cursor-pointer">
                  Pin as ITR Priority Bill
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_archived"
                  checked={formData.is_archived}
                  onChange={handleInputChange}
                  className="w-4 h-4 cursor-pointer"
                  id="is_archived"
                />
                <label htmlFor="is_archived" className="text-sm font-medium cursor-pointer">
                  Archive Bill
                </label>
              </div>

              <input
                type="number"
                name="section_pin_order"
                placeholder="Section Pin Order (1 = top, leave empty to not pin within section)"
                value={formData.section_pin_order ?? ""}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
                min="1"
              />

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
              >
                {editingId ? "Update Bill" : "Create Bill"}
              </button>
            </form>
          </div>
        )}

        {/* Bills organized by section (same order as main site) */}
        <div className="space-y-6">
          {/* Priority Bills */}
          {(() => {
            const priorityBills = sortBillsWithCompanions(bills.filter(bill => bill.is_pinned));
            return priorityBills.length > 0 ? (
              <div className="bg-white rounded shadow overflow-hidden">
                <div className="bg-red-700 text-white px-6 py-3 font-semibold">
                  ⭐ Priority Bills ({priorityBills.length})
                </div>
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bill #</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Chamber</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {priorityBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => handleEdit(bill)}>{bill.bill_number}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{bill.subject}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{bill.chamber}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            bill.position === "Support" ? "bg-green-100 text-green-800" :
                            bill.position === "Against" ? "bg-red-100 text-red-800" :
                            bill.position === "Monitor" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {bill.position}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm space-x-2">
                          <button
                            onClick={() => handleEdit(bill)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null;
          })()}

          {/* Registration Bills */}
          {(() => {
            const registrationBills = sortBillsWithCompanions(bills.filter(bill => !bill.is_pinned && bill.position !== "Monitor"));
            return registrationBills.length > 0 ? (
              <div className="bg-white rounded shadow overflow-hidden">
                <div className="bg-blue-700 text-white px-6 py-3 font-semibold">
                  Registrations ({registrationBills.length})
                </div>
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bill #</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Chamber</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {registrationBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => handleEdit(bill)}>{bill.bill_number}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{bill.subject}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{bill.chamber}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            bill.position === "Support" ? "bg-green-100 text-green-800" :
                            bill.position === "Against" ? "bg-red-100 text-red-800" :
                            bill.position === "Monitor" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {bill.position}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm space-x-2">
                          <button
                            onClick={() => handleEdit(bill)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null;
          })()}

          {/* Monitoring Bills */}
          {(() => {
            const monitoringBills = sortBillsWithCompanions(bills.filter(bill => !bill.is_pinned && bill.position === "Monitor"));
            return monitoringBills.length > 0 ? (
              <div className="bg-white rounded shadow overflow-hidden">
                <div className="bg-amber-700 text-white px-6 py-3 font-semibold">
                  Monitoring ({monitoringBills.length})
                </div>
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bill #</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Chamber</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {monitoringBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => handleEdit(bill)}>{bill.bill_number}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{bill.subject}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{bill.chamber}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            bill.position === "Support" ? "bg-green-100 text-green-800" :
                            bill.position === "Against" ? "bg-red-100 text-red-800" :
                            bill.position === "Monitor" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {bill.position}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm space-x-2">
                          <button
                            onClick={() => handleEdit(bill)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null;
          })()}

          {/* Archive Bills */}
          {(() => {
            const archiveBills = sortBillsWithCompanions(bills.filter(bill => bill.is_archived));
            return archiveBills.length > 0 ? (
              <div className="bg-white rounded shadow overflow-hidden">
                <div className="bg-gray-700 text-white px-6 py-3 font-semibold">
                  Archive ({archiveBills.length})
                </div>
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bill #</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Chamber</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {archiveBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => handleEdit(bill)}>{bill.bill_number}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{bill.subject}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{bill.chamber}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            bill.position === "Support" ? "bg-green-100 text-green-800" :
                            bill.position === "Against" ? "bg-red-100 text-red-800" :
                            bill.position === "Monitor" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {bill.position}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm space-x-2">
                          <button
                            onClick={() => handleEdit(bill)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </main>
    </>
  );
}
