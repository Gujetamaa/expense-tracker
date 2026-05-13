'use client';

import { getSalarySettings, clearSalarySettings } from '@/lib/storage';

export default function SettingsPage() {
  const salarySettings = getSalarySettings();

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all salary settings? This action cannot be undone.')) {
      clearSalarySettings();
      alert('Salary settings cleared!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">Settings</h1>

        {/* Salary Settings Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Salary Settings</h2>

          {salarySettings ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Basic Monthly Salary:</span>
                <span className="font-semibold text-gray-800">
                  ₱{salarySettings.basicMonthlySalary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payroll Frequency:</span>
                <span className="font-semibold text-gray-800">{salarySettings.payrollFrequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxable Allowance:</span>
                <span className="font-semibold text-gray-800">
                  ₱{salarySettings.taxableAllowance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Non-Taxable Allowance:</span>
                <span className="font-semibold text-gray-800">
                  ₱{salarySettings.nonTaxableAllowance.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No salary settings configured. Go to Salary Calculator to set them up.</p>
          )}

          <div className="mt-4">
            <button
              onClick={handleClearData}
              className="w-full bg-red-500 text-white font-semibold py-2 rounded-lg hover:bg-red-600 transition"
            >
              Clear Salary Settings
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-blue-50 rounded-lg shadow-md p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-4">About</h2>

          <div className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>Personal Finance Tracker</strong>
            </p>
            <p>A local-first personal finance tracker for Philippine users with salary calculations and savings goal tracking.</p>

            <div className="mt-4 pt-4 border-t border-blue-200 space-y-2">
              <p>
                <strong>Features:</strong>
              </p>
              <ul className="list-disc list-inside">
                <li>Income, expense, and savings transfer tracking</li>
                <li>PH salary calculator with SSS, PhilHealth, Pag-IBIG, and BIR tax calculations</li>
                <li>Savings accounts with progress tracking</li>
                <li>100% local data storage (no cloud sync)</li>
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-xs">Built with Next.js, TypeScript, and Tailwind CSS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
