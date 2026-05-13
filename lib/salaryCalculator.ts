import { SalarySettings, SalaryDeductions } from '@/types';
import {
  getSSSContribution,
  getPhilHealthContribution,
  getPagIbigContribution,
  getWithholdingTax,
} from './phTaxTables';

export function calculateSalaryDeductions(settings: SalarySettings): SalaryDeductions {
  // Determine frequency multiplier
  const frequencyMultiplier = settings.payrollFrequency === 'Monthly' ? 1 : 2;

  // Convert to monthly if semi-monthly
  const monthlyBasicSalary = settings.basicMonthlySalary * frequencyMultiplier;
  const monthlyTaxableAllowance = settings.taxableAllowance * frequencyMultiplier;
  const monthlyNonTaxableAllowance = settings.nonTaxableAllowance * frequencyMultiplier;
  const monthlyReimbursements = settings.reimbursements * frequencyMultiplier;

  // Calculate gross compensation (for contribution purposes)
  const grossCompensation =
    monthlyBasicSalary + monthlyTaxableAllowance + monthlyNonTaxableAllowance;

  // Calculate contributions (based on gross)
  const sssContribution = getSSSContribution(grossCompensation);
  const philHealthContribution = getPhilHealthContribution(grossCompensation);
  const pagIbigContribution = getPagIbigContribution(grossCompensation);

  // Calculate taxable income
  // Taxable income = Gross - Non-taxable allowances - Contributions
  // Note: The ₱90,000 annual limit applies to 13th month pay and other benefits, not regular monthly allowances
  const nonTaxableDeductions = sssContribution + philHealthContribution + pagIbigContribution;
  const taxableIncome = Math.max(
    0,
    monthlyBasicSalary +
      monthlyTaxableAllowance -
      monthlyNonTaxableAllowance -
      nonTaxableDeductions
  );

  // Calculate withholding tax
  const withholdingTax = getWithholdingTax(grossCompensation, taxableIncome);

  // Calculate net pay (for the pay period, adjust if semi-monthly)
  const totalDeductions = sssContribution + philHealthContribution + pagIbigContribution + withholdingTax;
  const monthlyNetPay =
    monthlyBasicSalary +
    monthlyTaxableAllowance +
    monthlyNonTaxableAllowance +
    monthlyReimbursements -
    totalDeductions;

  return {
    sssContribution: sssContribution / frequencyMultiplier,
    philHealthContribution: philHealthContribution / frequencyMultiplier,
    pagIbigContribution: pagIbigContribution / frequencyMultiplier,
    withholdingTax: withholdingTax / frequencyMultiplier,
    totalDeductions: totalDeductions / frequencyMultiplier,
    monthlyNetPay: monthlyNetPay / frequencyMultiplier,
  };
}

export function calculateMonthlyNetPay(settings: SalarySettings): number {
  const deductions = calculateSalaryDeductions(settings);
  return deductions.monthlyNetPay;
}

export function calculateAnnualNetPay(settings: SalarySettings): number {
  const monthlyNetPay = calculateMonthlyNetPay(settings);
  const paymentsPerYear = settings.payrollFrequency === 'Monthly' ? 12 : 24;
  return monthlyNetPay * paymentsPerYear;
}
