"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Bill {
  id: number;
  bill_number: string;
  title: string;
  short_title: string;
  position: "Support" | "Against" | "Monitor" | "Undecided";
  chamber: string;
  status?: string;
  sponsor?: string;
}

export default function AdminPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bill_number: "",
    title: "",
    short_title: "",
    chamber: "House",
    position: "Undecided" as const,
    status: "",
    sponsor: "",
    description: "",
    committee: "",
    committee_key: "",
    subcommittee: "",
    fiscal_note: false,
    lsb: "",
    url: "",
    notes: "",
    is_pinned: false,
  });
  const router = useRouter();

  useEffect(() => {
    const loadBills = async () => {
      try {
        // Fetch bills - will return 401 if not authenticated
        const billsResponse = await fetch("/api/bills", {
          credentials: "include",
        });

        if (billsResponse.status === 401) {
          router.push("/admin/login");
          return;
        }

        if (!billsResponse.ok) throw new Error("Failed to fetch bills");
        const data = await billsResponse.json();
        setBills(data);
      } catch (error) {
        console.error("Error loading admin:", error);
        // Don't redirect, let the page show an error or load without auth
      }
    };

    loadBills();
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

      if (!response.ok) throw new Error("Failed to save bill");

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
        title: "",
        short_title: "",
        chamber: "House",
        position: "Undecided",
        status: "",
        sponsor: "",
        description: "",
        committee: "",
        committee_key: "",
        subcommittee: "",
        fiscal_note: false,
        lsb: "",
        url: "",
        notes: "",
        is_pinned: false,
      });
    } catch (error) {
      alert("Error saving bill");
    }
  };

  const handleEdit = (bill: Bill) => {
    setEditingId(bill.id);
    setFormData({ ...bill, fiscal_note: false } as any);
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
                title: "",
                short_title: "",
                chamber: "House",
                position: "Undecided",
                status: "",
                sponsor: "",
                description: "",
                committee: "",
                committee_key: "",
                subcommittee: "",
                fiscal_note: false,
                lsb: "",
                url: "",
                notes: "",
                is_pinned: false,
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
                name="title"
                placeholder="Full Title (optional - will default to Short Title)"
                value={formData.title}
                onChange={handleInputChange}
                className="border rounded px-3 py-2"
              />

              <input
                name="short_title"
                placeholder="Short Title"
                value={formData.short_title}
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

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
              >
                {editingId ? "Update Bill" : "Create Bill"}
              </button>
            </form>
          </div>
        )}

        {/* Bills Table */}
        <div className="bg-white rounded shadow overflow-hidden">
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
              {bills.map(bill => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{bill.bill_number}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{bill.short_title}</td>
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
      </div>
    </main>
  );
}
