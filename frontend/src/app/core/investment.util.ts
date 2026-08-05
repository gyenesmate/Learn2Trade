export function isInvestmentSold(investment: { sold_at: string | null }): boolean {
  return investment.sold_at != null;
}
