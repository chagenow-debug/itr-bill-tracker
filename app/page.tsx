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

const positionColors = {
  Support: "bg-green-100 text-green-800",
  Against: "bg-red-100 text-red-800",
  Monitor: "bg-yellow-100 text-yellow-800",
  Undecided: "bg-gray-100 text-gray-800",
};

export default function Home() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch("/api/bills");
        if (!response.ok) {
          throw new Error(`Failed to fetch bills: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setBills(data);
        } else {
          setBills([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error fetching bills:", errorMessage);
        setError(errorMessage);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const filteredBills = filter === "All"
    ? bills
    : bills.filter(bill => bill.position === filter);

  const stats = {
    Support: bills.filter(b => b.position === "Support").length,
    Against: bills.filter(b => b.position === "Against").length,
    Monitor: bills.filter(b => b.position === "Monitor").length,
    Undecided: bills.filter(b => b.position === "Undecided").length,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ITR Bill Tracker
          </h1>
          <p className="text-gray-600">
            Iowa General Assembly bill positions for Iowans for Tax Relief
          </p>
          <a
            href="/admin"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Admin Panel
          </a>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">Error: {error}</p>
            <p className="text-sm text-red-600 mt-2">Unable to load bills. Please try refreshing the page.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-gray-900">{stats.Support}</div>
            <div className="text-sm text-gray-600">Support</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-gray-900">{stats.Against}</div>
            <div className="text-sm text-gray-600">Against</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-gray-900">{stats.Monitor}</div>
            <div className="text-sm text-gray-600">Monitor</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-gray-900">{stats.Undecided}</div>
            <div className="text-sm text-gray-600">Undecided</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {["All", "Support", "Against", "Monitor", "Undecided"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Bills List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading bills...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBills.map(bill => (
              <div key={bill.id} className="bg-white p-6 rounded shadow hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {bill.bill_number}
                    </h3>
                    <p className="text-gray-700 font-semibold">{bill.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{bill.short_title}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      positionColors[bill.position]
                    }`}
                  >
                    {bill.position}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {bill.chamber && <p>Chamber: {bill.chamber}</p>}
                  {bill.status && <p>Status: {bill.status}</p>}
                  {bill.sponsor && <p>Sponsor: {bill.sponsor}</p>}
                </div>
                {bill.url && (
                  <a
                    href={bill.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Bill →
                  </a>
                )}
              </div>
            ))}
            {filteredBills.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No bills found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
