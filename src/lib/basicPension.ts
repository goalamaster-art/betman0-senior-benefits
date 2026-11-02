/**
 * 2026년 기초연금 소득인정액·예상 지급액 계산.
 * 수치 원장: src/content/articles/basic-pension-2026-guide.md, basic-pension-income-asset-conversion-guide.md
 * (보건복지부 2026 선정기준액 고시, 기초연금법 제5·8조, 시행령 제11조, 시행규칙 제2~4조)
 */
export const BP_2026 = {
  thresholdSingle: 2_470_000,
  thresholdCouple: 3_952_000,
  baseAmount: 349_700,
  earnedIncomeDeduction: 1_160_000,
  earnedIncomeRate: 0.7,
  financialDeduction: 20_000_000,
  conversionRate: 0.04,
  basicProperty: { metro: 135_000_000, city: 85_000_000, rural: 72_500_000 },
  luxuryCarValue: 40_000_000,
  nationalPensionLinkLimit: 524_550, // 기준연금액의 150%
} as const;

export type Region = keyof typeof BP_2026.basicProperty;

export interface BasicPensionInput {
  couple: boolean;
  /** 부부가구일 때 65세 이상으로 함께 받는 사람 수(1 또는 2) */
  recipients: 1 | 2;
  region: Region;
  earnedSelf: number;
  earnedSpouse: number;
  /** 사업소득·국민연금 등 공적연금·연금보험·이자 등 (월) */
  otherIncome: number;
  /** 주택·토지·건물 시가표준액 + 전월세 보증금 + 4천만 원 미만 차량 */
  generalProperty: number;
  financialProperty: number;
  debt: number;
  /** 4천만 원 이상 승용차·회원권 가액 (공제 없이 전액 월 소득) */
  luxuryAssets: number;
  /** 본인 국민연금 노령연금 월액 (연계감액 안내용) */
  nationalPension: number;
}

export interface BasicPensionResult {
  incomeEval: number;
  propertyIncome: number;
  recognizedIncome: number;
  threshold: number;
  eligible: boolean;
  /** 가구 합산 예상 월 지급액 (10원 미만 버림) */
  householdAmount: number;
  perPersonAmount: number;
  reducedByIncomeReversal: boolean;
  nationalPensionLinkWarning: boolean;
}

const floor10 = (n: number) => Math.floor(n / 10) * 10;
const pos = (n: number) => Math.max(0, n || 0);

export function calcBasicPension(i: BasicPensionInput): BasicPensionResult {
  const c = BP_2026;
  const earned = (v: number) => c.earnedIncomeRate * pos(pos(v) - c.earnedIncomeDeduction);
  const incomeEval = earned(i.earnedSelf) + (i.couple ? earned(i.earnedSpouse) : 0) + pos(i.otherIncome);

  // 일반재산에서 기본재산액을 빼고, 다 못 뺀 공제액은 금융재산에서 이어서 뺀다
  let general = pos(i.generalProperty) - c.basicProperty[i.region];
  let financial = pos(i.financialProperty) - c.financialDeduction;
  if (general < 0) {
    financial += general;
    general = 0;
  }
  const netProperty = pos(general + pos(financial) - pos(i.debt));
  const propertyIncome = (netProperty * c.conversionRate) / 12 + pos(i.luxuryAssets);

  const recognizedIncome = Math.floor(incomeEval + propertyIncome);
  const threshold = i.couple ? c.thresholdCouple : c.thresholdSingle;
  const eligible = recognizedIncome <= threshold;

  const both = i.couple && i.recipients === 2;
  const full = both ? c.baseAmount * 2 * 0.8 : c.baseAmount;
  const minimum = both ? c.baseAmount * 0.2 : c.baseAmount * 0.1;
  let household = full;
  let reducedByIncomeReversal = false;
  if (eligible && recognizedIncome + full > threshold) {
    household = Math.max(minimum, threshold - recognizedIncome);
    reducedByIncomeReversal = true;
  }
  household = eligible ? floor10(household) : 0;

  return {
    incomeEval: Math.floor(incomeEval),
    propertyIncome: Math.floor(propertyIncome),
    recognizedIncome,
    threshold,
    eligible,
    householdAmount: household,
    perPersonAmount: both ? floor10(household / 2) : household,
    reducedByIncomeReversal,
    nationalPensionLinkWarning: pos(i.nationalPension) > c.nationalPensionLinkLimit,
  };
}
