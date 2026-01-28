"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  message: string;
  imported: any[];
  errors: string[];
  skipped: number;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/bills/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Import failed");
        setResult(data);
        return;
      }

      setResult(data);
      setFile(null);
    } catch (err) {
      setError("An error occurred during import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Admin
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Import Bills from CSV</h1>
          <p className="text-gray-600 mt-2">Upload a CSV file to bulk add or update bills</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">CSV Format Required:</h2>
          <p className="text-sm text-blue-800 font-mono mb-3">
            bill_number,companion_bills,chamber,title,short_title,description,committee,committee_key,status,position,sponsor,subcommittee,fiscal_note,lsb,url,notes
          </p>
          <div className="text-sm text-blue-800">
            <p className="mb-2"><strong>Required fields:</strong> bill_number, chamber, title, short_title, position</p>
            <p className="mb-2"><strong>Position values:</strong> Support, Against, Monitor, Undecided</p>
            <p><strong>Chambers:</strong> House, Senate</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8">
          <div className="mb-6">
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              id="file"
              type="file"
              accept=".csv,.pdf,application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:px-4 file:py-2 file:bg-blue-50 file:text-blue-600 file:border-0 file:rounded hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-2">Note: CSV format recommended. If PDF files appear greyed out, select &quot;All Files&quot; from the file picker dropdown.</p>
            {file && (
              <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Importing..." : "Import Bills"}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="bg-white p-6 rounded shadow">
            <div className={`mb-4 p-4 rounded ${
              !result.errors || result.errors.length === 0 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
            }`}>
              <p className={`font-semibold ${
                !result.errors || result.errors.length === 0 ? "text-green-900" : "text-yellow-900"
              }`}>
                {result.message}
              </p>
            </div>

            {result.imported.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Imported Bills ({result.imported.length})</h3>
                <div className="space-y-2">
                  {result.imported.map(bill => (
                    <div key={bill.id} className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <strong>{bill.bill_number}</strong>: {bill.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Errors ({result.errors.length})</h3>
                <div className="space-y-2">
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-sm text-red-700 bg-red-50 p-3 rounded">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.push("/admin")}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Admin
            </button>
          </div>
        )}

        {/* Sample CSV */}
        <div className="bg-white p-6 rounded shadow mt-8">
          <h2 className="font-semibold text-gray-900 mb-3">Sample CSV Format</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto text-gray-700">
{`bill_number,chamber,title,short_title,position
HF 123,House,An Act relating to tax relief,Income Tax Cut,Support
SF 456,Senate,An Act relating to education funding,Education Bill,Monitor`}
          </pre>
        </div>
      </div>
    </main>
  );
}
