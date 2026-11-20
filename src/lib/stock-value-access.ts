/** Stock managers and people with money access may see inventory valuations. */
export function canViewStockValue(manageStock: boolean, seeMoney: boolean): boolean {
  return manageStock || seeMoney;
}