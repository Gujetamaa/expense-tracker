// Philippine SSS Contribution Rates for 2024
// Based on monthly salary ranges
export const SSS_CONTRIBUTION_TABLE = [
  { minSalary: 0, maxSalary: 999.99, employeeRate: 0.03, employerRate: 0.08 },
  { minSalary: 1000, maxSalary: 1249.99, employeeRate: 0.03, employerRate: 0.08 },
  { minSalary: 1250, maxSalary: 1499.99, employeeRate: 0.03, employerRate: 0.08 },
  { minSalary: 1500, maxSalary: 1749.99, employeeRate: 0.03, employerRate: 0.08 },
  { minSalary: 1750, maxSalary: 1999.99, employeeRate: 0.03, employerRate: 0.08 },
  { minSalary: 2000, maxSalary: 2249.99, employeeRate: 0.04, employerRate: 0.08 },
  { minSalary: 2250, maxSalary: 2499.99, employeeRate: 0.04, employerRate: 0.09 },
  { minSalary: 2500, maxSalary: 2749.99, employeeRate: 0.04, employerRate: 0.09 },
  { minSalary: 2750, maxSalary: 2999.99, employeeRate: 0.04, employerRate: 0.09 },
  { minSalary: 3000, maxSalary: 3249.99, employeeRate: 0.05, employerRate: 0.1 },
  { minSalary: 3250, maxSalary: 3499.99, employeeRate: 0.05, employerRate: 0.1 },
  { minSalary: 3500, maxSalary: 3749.99, employeeRate: 0.05, employerRate: 0.1 },
  { minSalary: 3750, maxSalary: 3999.99, employeeRate: 0.05, employerRate: 0.1 },
  { minSalary: 4000, maxSalary: 4249.99, employeeRate: 0.06, employerRate: 0.11 },
  { minSalary: 4250, maxSalary: 4499.99, employeeRate: 0.06, employerRate: 0.11 },
  { minSalary: 4500, maxSalary: 4749.99, employeeRate: 0.06, employerRate: 0.11 },
  { minSalary: 4750, maxSalary: 4999.99, employeeRate: 0.06, employerRate: 0.11 },
  { minSalary: 5000, maxSalary: Infinity, employeeRate: 0.06, employerRate: 0.11 },
];

// PhilHealth Premium Rates for 2024
// Based on monthly salary
export const PHILHEALTH_RATES = {
  minSalary: 10000,
  basePremium: 300,
  percentageRate: 0.025, // 2.5% of salary above minimum
};

// Pag-IBIG Contribution Rates for 2024
export const PAGIBIG_RATES = {
  employeeRate: 0.01, // 1% of gross salary
  maxBaseSalary: 5000,
  maxContribution: 100,
};

// BIR Withholding Tax Table 2024 (Non-Resident Alien / Resident Citizen)
// Monthly compensation range and tax rates
export const BIR_WITHHOLDING_TAX_TABLE = [
  { minAmount: 0, maxAmount: 20832.33, taxAmount: 0, excessRate: 0 },
  { minAmount: 20832.34, maxAmount: 33333.33, taxAmount: 0, excessRate: 0.05 },
  { minAmount: 33333.34, maxAmount: 66666.67, taxAmount: 625, excessRate: 0.1 },
  { minAmount: 66666.68, maxAmount: 166666.67, taxAmount: 4041.67, excessRate: 0.15 },
  { minAmount: 166666.68, maxAmount: 666666.67, taxAmount: 19041.67, excessRate: 0.2 },
  { minAmount: 666666.68, maxAmount: Infinity, taxAmount: 119041.67, excessRate: 0.25 },
];

// Tax-free income components (non-taxable)
export const NON_TAXABLE_COMPONENTS = {
  mealAllowance: 1700, // Monthly
  transportAllowance: 2000, // Monthly
  maxNonTaxableAllowance: 90000, // Monthly
};

export function getSSSContribution(monthlySalary: number): number {
  const entry = SSS_CONTRIBUTION_TABLE.find(
    (row) => monthlySalary >= row.minSalary && monthlySalary <= row.maxSalary
  );
  if (!entry) return 0;
  return monthlySalary * entry.employeeRate;
}

export function getPhilHealthContribution(monthlySalary: number): number {
  if (monthlySalary < PHILHEALTH_RATES.minSalary) {
    return PHILHEALTH_RATES.basePremium / 2; // Minimum premium
  }
  return (
    PHILHEALTH_RATES.basePremium +
    (monthlySalary - PHILHEALTH_RATES.minSalary) * PHILHEALTH_RATES.percentageRate
  ) / 2;
}

export function getPagIbigContribution(monthlySalary: number): number {
  const baseSalary = Math.min(monthlySalary, PAGIBIG_RATES.maxBaseSalary);
  return Math.min(baseSalary * PAGIBIG_RATES.employeeRate, PAGIBIG_RATES.maxContribution);
}

export function getWithholdingTax(grossIncome: number, taxableIncome: number): number {
  const entry = BIR_WITHHOLDING_TAX_TABLE.find(
    (row) => taxableIncome >= row.minAmount && taxableIncome <= row.maxAmount
  );

  if (!entry) return 0;

  const excess = taxableIncome - entry.minAmount;
  const tax = entry.taxAmount + excess * entry.excessRate;
  return Math.max(0, tax);
}
