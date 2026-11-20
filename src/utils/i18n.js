export const REGION_ES = Object.freeze({
  'Central and Eastern Europe': 'Europa Central y del Este',
  'Commonwealth of Independent States': 'CEI (ex URSS)',
  'East Asia': 'Asia Oriental',
  'Latin America and Caribbean': 'Latinoamérica y Caribe',
  'Middle East and North Africa': 'Medio Oriente y N. de África',
  'North America and ANZ': 'Norteamérica y Oceanía',
  'South Asia': 'Asia Meridional',
  'Southeast Asia': 'Sudeste Asiático',
  'Sub-Saharan Africa': 'África Subsahariana',
  'Western Europe': 'Europa Occidental',
})

export function regionEs(region) {
  return REGION_ES[region] ?? region
}
