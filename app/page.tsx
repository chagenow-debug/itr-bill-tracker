"use client";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <p className="text-blue-900">Bill list coming soon...</p>
        </div>
      </div>
    </main>
  );
}
