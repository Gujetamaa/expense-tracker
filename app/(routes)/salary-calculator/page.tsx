'use client';

import { useState, useEffect } from 'react';
import { SalarySettings, SalaryDeductions } from '@/types';
import { getSalarySettings, saveSalarySettings } from '@/lib/storage';
import { calculateSalaryDeductions } from '@/lib/salaryCalculator';

export default function SalaryCalculatorPage() {
  const [basicMonthlySalary, setBasicMonthlySalary] = useState('22500');
  const [taxableAllowance, setTaxableAllowance] = useState('0');
  const [nonTaxableAllowance, setNonTaxableAllowance] = useState('0');
  const [reimbursements, setReimbursements] = useState('0');
  const [payrollFrequency, setPayrollFrequency] = useState<'Monthly' | 'Semi-monthly'>('Monthly');
  const [deductions, setDeductions] = useState<SalaryDeductions | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getSalarySettings();
    if (stored) {
      setBasicMonthlySalary(stored.basicMonthlySalary.toString());
      setTaxableAllowance(stored.taxableAllowance.toString());
      setNonTaxableAllowance(stored.nonTaxableAllowance.toString());
      setReimbursements(stored.reimbursements.toString());
      setPayrollFrequency(stored.payrollFrequency);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    calculateDeductions();
  }, [basicMonthlySalary, taxableAllowance, nonTaxableAllowance, reimbursements, payrollFrequency, mounted]);

  const calculateDeductions = () => {
    const settings: SalarySettings = {
      basicMonthlySalary: parseFloat(basicMonthlySalary) || 0,
      taxableAllowance: parseFloat(taxableAllowance) || 0,
      nonTaxableAllowance: parseFloat(nonTaxableAllowance) || 0,
      reimbursements: parseFloat(reimbursements) || 0,
      payrollFrequency,
    };
    const calc = calculateSalaryDeductions(settings);
    setDeductions(calc);
  };

  const handleSave = () => {
    const settings: SalarySettings = {
      basicMonthlySalary: parseFloat(basicMonthlySalary) || 0,
      taxableAllowance: parseFloat(taxableAllowance) || 0,
      nonTaxableAllowance: parseFloat(nonTaxableAllowance) || 0,
      reimbursements: parseFloat(reimbursements) || 0,
      payrollFrequency,
    };
    saveSalarySettings(settings);
    alert('Salary settings saved!');
  };

  const fmt = (num: number) => num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="page-bg p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="heading-page mb-8">PH Salary Calculator</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="form-card p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Income & Deductions</h2>

            <div>
              <label className="form-label">Basic Monthly Salary (₱)</label>
              <input
                type="number"
                value={basicMonthlySalary}
                onChange={(e) => setBasicMonthlySalary(e.target.value)}
                step="100"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Taxable Allowance (₱)</label>
              <input
                type="number"
                value={taxableAllowance}
                onChange={(e) => setTaxableAllowance(e.target.value)}
                step="100"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Non-Taxable Allowance (₱)</label>
              <input
                type="number"
                value={nonTaxableAllowance}
                onChange={(e) => setNonTaxableAllowance(e.target.value)}
                step="100"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Reimbursements (₱)</label>
              <input
                type="number"
                value={reimbursements}
                onChange={(e) => setReimbursements(e.target.value)}
                step="100"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Payroll Frequency</label>
              <select
                value={payrollFrequency}
                onChange={(e) => setPayrollFrequency(e.target.value as 'Monthly' | 'Semi-monthly')}
                className="form-input"
              >
                <option value="Monthly">Monthly</option>
                <option value="Semi-monthly">Semi-monthly</option>
              </select>
            </div>

            <button
              onClick={handleSave}
              className="button-primary w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
            >
              Save Settings
            </button>
          </div>

          {/* Results */}
          {deductions && (
            <div className="space-y-4">
              {/* Gross Income */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-md p-6 border border-blue-200 dark:border-blue-700/40">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3">Gross Compensation</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  ₱{fmt(
                    parseFloat(basicMonthlySalary) +
                      parseFloat(taxableAllowance) +
                      parseFloat(nonTaxableAllowance)
                  )}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Basic + Taxable + Non-Taxable Allowances</p>
              </div>

              {/* Deductions */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-700/40 space-y-3">
                <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-3">Mandatory Deductions</h3>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">SSS Employee Contribution</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">₱{fmt(deductions.sssContribution)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">PhilHealth Employee Contribution</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">₱{fmt(deductions.philHealthContribution)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Pag-IBIG Employee Contribution</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">₱{fmt(deductions.pagIbigContribution)}</span>
                </div>

                <div className="border-t border-red-200 dark:border-red-700/40 pt-3 flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">BIR Withholding Tax</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-200">₱{fmt(deductions.withholdingTax)}</span>
                </div>

                <div className="border-t border-red-200 dark:border-red-700/40 pt-3 flex justify-between font-bold">
                  <span className="text-red-900 dark:text-red-300">Total Deductions</span>
                  <span className="text-red-600 dark:text-red-400">₱{fmt(deductions.totalDeductions)}</span>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-md p-6 border border-green-200 dark:border-green-700/40">
                <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-3">Take-Home Pay</h3>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">₱{fmt(deductions.monthlyNetPay)}</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">Per {payrollFrequency.toLowerCase()} period</p>

                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700/40">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Annual Net Pay (×{payrollFrequency === 'Monthly' ? '12' : '24'}):
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₱{fmt(deductions.monthlyNetPay * (payrollFrequency === 'Monthly' ? 12 : 24))}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-md p-4 border border-yellow-200 dark:border-yellow-700/40 text-sm text-yellow-800 dark:text-yellow-300">
                <p className="font-semibold mb-1">ℹ️ Note:</p>
                <p>This calculator uses 2026 BIR tax tables. Actual deductions may vary based on your tax status and other factors.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
