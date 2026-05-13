// Philippine SSS Contribution Rates for 2026
// SIMPLIFIED ESTIMATION: Employee share 5%, Employer share 10% of monthly salary credit
// TODO: Replace simplified SSS logic with exact official SSS Monthly Salary Credit table.
export const SSS_RATES = {
  employeeRate: 0.05, // 5% of monthly salary credit
  employerRate: 0.1, // 10% of monthly salary credit
  totalRate: 0.15, // 15% combined
};

// PhilHealth Premium Rates for 2026
// Premium rate: 5% total (Employee 2.5%, Employer 2.5%)
// Monthly salary floor: ₱10,000, ceiling: ₱100,000
export const PHILHEALTH_RATES = {
  employeeRate: 0.025, // 2.5% employee share
  employerRate: 0.025, // 2.5% employer share
  minSalary: 10000,
  maxSalary: 100000,
};

// Pag-IBIG Contribution Rates for 2026
// Employee contribution: 2%, Employer contribution: 2%
// Monthly compensation cap: ₱10,000, Max employee contribution: ₱200
export const PAGIBIG_RATES = {
  employeeRate: 0.02, // 2% of monthly compensation
  employerRate: 0.02, // 2% of monthly compensation
  maxBaseSalary: 10000,
  maxEmployeeContribution: 200,
};

// BIR Withholding Tax Table 2026 (Resident Citizen / Non-Resident Alien)
// Monthly compensation range and tax computation
export const BIR_WITHHOLDING_TAX_TABLE = [
  { minAmount: 0, maxAmount: 20833, taxAmount: 0, excessRate: 0 },
  { minAmount: 20833.01, maxAmount: 33333, taxAmount: 0, excessRate: 0.15 },
  { minAmount: 33333.01, maxAmount: 66667, taxAmount: 1875, excessRate: 0.20 },
  { minAmount: 66667.01, maxAmount: 166667, taxAmount: 8541.8, excessRate: 0.25 },
  { minAmount: 166667.01, maxAmount: 666667, taxAmount: 33541.8, excessRate: 0.30 },
  { minAmount: 666667.01, maxAmount: Infinity, taxAmount: 183541.8, excessRate: 0.35 },
];

// Non-taxable income limits (2026)
export const NON_TAXABLE_LIMITS = {
  annualThirteenthMonthAndOtherBenefitsLimit: 90000, // Annual limit for 13th month pay and other benefits
};

// Calculate SSS employee contribution (simplified 2026 estimate)
export function getSSSContribution(monthlySalary: number): number {
  return monthlySalary * SSS_RATES.employeeRate;
}

// Calculate PhilHealth employee contribution (2026 rates)
export function getPhilHealthContribution(monthlySalary: number): number {
  const salaryBase = Math.min(Math.max(monthlySalary, PHILHEALTH_RATES.minSalary), PHILHEALTH_RATES.maxSalary);
  return salaryBase * PHILHEALTH_RATES.employeeRate;
}

// Calculate Pag-IBIG employee contribution (2026 rates)
export function getPagIbigContribution(monthlySalary: number): number {
  const salaryBase = Math.min(monthlySalary, PAGIBIG_RATES.maxBaseSalary);
  return Math.min(salaryBase * PAGIBIG_RATES.employeeRate, PAGIBIG_RATES.maxEmployeeContribution);
}

// Calculate BIR withholding tax (2026 rates)
export function getWithholdingTax(grossIncome: number, taxableIncome: number): number {
  const entry = BIR_WITHHOLDING_TAX_TABLE.find(
    (row) => taxableIncome >= row.minAmount && taxableIncome <= row.maxAmount
  );

  if (!entry) return 0;

  const excess = taxableIncome - entry.minAmount;
  const tax = entry.taxAmount + excess * entry.excessRate;
  return Math.max(0, tax);
}

// DISCLAIMER: This calculator provides estimates for Philippine payroll taxes and contributions.
// Actual payroll calculations may differ based on employer payroll setup, special arrangements,
// or updates to tax laws and rates. Always verify with official BIR, SSS, PhilHealth, and Pag-IBIG
// guidance for accurate and up-to-date information.
