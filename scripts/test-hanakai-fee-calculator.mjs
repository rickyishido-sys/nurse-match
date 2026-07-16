const SERVICE_FEE_RATE = 0.1;

function calculateReferralFee(input) {
  const salesTaxRate = input.salesTaxRate ?? 0.1;
  const billingTaxRate = input.billingTaxRate ?? salesTaxRate;
  const totalParticipants = Math.max(0, input.totalParticipants);
  const hanakaiCheckinCount = Math.max(0, input.hanakaiCheckinCount);
  const grossSalesTaxIncluded = Math.max(0, input.grossSalesTaxIncluded);
  if (hanakaiCheckinCount > totalParticipants) throw new Error('HANAKAI_CHECKIN_EXCEEDS_PARTICIPANTS');
  const grossSalesTaxExcluded = Math.round(grossSalesTaxIncluded / (1 + salesTaxRate));
  const referralRatio = totalParticipants > 0 ? hanakaiCheckinCount / totalParticipants : 0;
  const hanakaiTargetSales = Math.round(grossSalesTaxExcluded * referralRatio);
  const serviceFeeTaxExcluded = Math.round(hanakaiTargetSales * SERVICE_FEE_RATE);
  const taxAmount = Math.round(serviceFeeTaxExcluded * billingTaxRate);
  return { grossSalesTaxExcluded, hanakaiTargetSales, serviceFeeTaxExcluded, taxAmount, totalAmountTaxIncluded: serviceFeeTaxExcluded + taxAmount };
}

const cases = [
  {
    name: 'standard 50% referral',
    input: { totalParticipants: 14, hanakaiCheckinCount: 7, grossSalesTaxIncluded: 55000, salesTaxRate: 0.1, billingTaxRate: 0.1 },
    expect: { grossSalesTaxExcluded: 50000, hanakaiTargetSales: 25000, serviceFeeTaxExcluded: 2500, taxAmount: 250, totalAmountTaxIncluded: 2750 },
  },
];

let failed = 0;
for (const c of cases) {
  const r = calculateReferralFee(c.input);
  const ok =
    r.grossSalesTaxExcluded === c.expect.grossSalesTaxExcluded &&
    r.hanakaiTargetSales === c.expect.hanakaiTargetSales &&
    r.serviceFeeTaxExcluded === c.expect.serviceFeeTaxExcluded &&
    r.taxAmount === c.expect.taxAmount &&
    r.totalAmountTaxIncluded === c.expect.totalAmountTaxIncluded;
  console.log(`${ok ? '✓' : '✗'} ${c.name}`, ok ? '' : r);
  if (!ok) failed += 1;
}

try {
  calculateReferralFee({ totalParticipants: 5, hanakaiCheckinCount: 10, grossSalesTaxIncluded: 1000 });
  console.log('✗ should reject checkins > participants');
  failed += 1;
} catch {
  console.log('✓ rejects checkins > participants');
}

process.exit(failed > 0 ? 1 : 0);
