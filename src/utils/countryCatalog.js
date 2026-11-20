import happiness from '../data/happiness.json'

const displayNames = new Intl.DisplayNames(['es'], { type: 'region' })

export const COUNTRY_ALPHA2 = Object.freeze({
  Afghanistan:'AF', Albania:'AL', Algeria:'DZ', Angola:'AO', Argentina:'AR', Armenia:'AM', Australia:'AU', Austria:'AT', Azerbaijan:'AZ',
  Bahrain:'BH', Bangladesh:'BD', Belarus:'BY', Belgium:'BE', Belize:'BZ', Benin:'BJ', Bhutan:'BT', Bolivia:'BO', 'Bosnia and Herzegovina':'BA', Botswana:'BW', Brazil:'BR', Bulgaria:'BG', 'Burkina Faso':'BF', Burundi:'BI',
  Cambodia:'KH', Cameroon:'CM', Canada:'CA', 'Central African Republic':'CF', Chad:'TD', Chile:'CL', China:'CN', Colombia:'CO', Comoros:'KM', 'Congo (Brazzaville)': 'CG', 'Congo (Kinshasa)': 'CD', 'Costa Rica':'CR', Croatia:'HR', Cyprus:'CY', 'Czech Republic':'CZ',
  Denmark:'DK', Djibouti:'DJ', 'Dominican Republic':'DO', Ecuador:'EC', Egypt:'EG', 'El Salvador':'SV', Estonia:'EE', Ethiopia:'ET',
  Finland:'FI', France:'FR', Gabon:'GA', Gambia:'GM', Georgia:'GE', Germany:'DE', Ghana:'GH', Greece:'GR', Guatemala:'GT', Guinea:'GN',
  Haiti:'HT', Honduras:'HN', 'Hong Kong':'HK', Hungary:'HU', Iceland:'IS', India:'IN', Indonesia:'ID', Iran:'IR', Iraq:'IQ', Ireland:'IE', Israel:'IL', Italy:'IT', 'Ivory Coast':'CI',
  Jamaica:'JM', Japan:'JP', Jordan:'JO', Kazakhstan:'KZ', Kenya:'KE', Kosovo:'XK', Kuwait:'KW', Kyrgyzstan:'KG', Laos:'LA', Latvia:'LV', Lebanon:'LB', Lesotho:'LS', Liberia:'LR', Libya:'LY', Lithuania:'LT', Luxembourg:'LU',
  Macedonia:'MK', Madagascar:'MG', Malawi:'MW', Malaysia:'MY', Maldives:'MV', Mali:'ML', Malta:'MT', Mauritania:'MR', Mauritius:'MU', Mexico:'MX', Moldova:'MD', Mongolia:'MN', Montenegro:'ME', Morocco:'MA', Mozambique:'MZ', Myanmar:'MM',
  Namibia:'NA', Nepal:'NP', Netherlands:'NL', 'New Zealand':'NZ', Nicaragua:'NI', Niger:'NE', Nigeria:'NG', 'North Cyprus':'CY', Norway:'NO', Oman:'OM', Pakistan:'PK', 'Palestinian Territories':'PS', Panama:'PA', Paraguay:'PY', Peru:'PE', Philippines:'PH', Poland:'PL', Portugal:'PT', 'Puerto Rico':'PR',
  Qatar:'QA', Romania:'RO', Russia:'RU', Rwanda:'RW', 'Saudi Arabia':'SA', Senegal:'SN', Serbia:'RS', 'Sierra Leone':'SL', Singapore:'SG', Slovakia:'SK', Slovenia:'SI', Somalia:'SO', 'Somaliland region':'SO', 'South Africa':'ZA', 'South Korea':'KR', 'South Sudan':'SS', Spain:'ES', 'Sri Lanka':'LK', Sudan:'SD', Suriname:'SR', Swaziland:'SZ', Sweden:'SE', Switzerland:'CH', Syria:'SY',
  Taiwan:'TW', Tajikistan:'TJ', Tanzania:'TZ', Thailand:'TH', Togo:'TG', 'Trinidad and Tobago':'TT', Tunisia:'TN', Turkey:'TR', Turkmenistan:'TM', Uganda:'UG', Ukraine:'UA', 'United Arab Emirates':'AE', 'United Kingdom':'GB', 'United States':'US', Uruguay:'UY', Uzbekistan:'UZ', Venezuela:'VE', Vietnam:'VN', Yemen:'YE', Zambia:'ZM', Zimbabwe:'ZW',
})

const COUNTRY_NAME_ES = Object.freeze({
  'Congo (Kinshasa)': 'República Democrática del Congo',
  'Congo (Brazzaville)': 'República del Congo',
  'Palestinian Territories': 'Territorios Palestinos',
  Togo: 'Togo',
  Taiwan: 'Taiwán',
  'Hong Kong': 'Hong Kong',
  'Eswatini': 'Esuatini',
  Swaziland: 'Esuatini',
  'Czech Republic': 'Chequia',
  Macedonia: 'Macedonia del Norte',
  'North Cyprus': 'Chipre del Norte',
  'Ivory Coast': 'Costa de Marfil',
  Turkey: 'Turquía',
  Kosovo: 'Kosovo',
  'Somaliland region': 'Somalilandia',
  Myanmar: 'Myanmar (Birmania)',
})

export function countryEs(country) {
  if (COUNTRY_NAME_ES[country]) return COUNTRY_NAME_ES[country]
  const code = COUNTRY_ALPHA2[country]
  if (!code) return country
  try {
    return displayNames.of(code) ?? country
  } catch {
    return country
  }
}

export function countryInfo(country) {
  return {
    country,
    alpha2: COUNTRY_ALPHA2[country] ?? null,
    nameEs: countryEs(country),
  }
}

const uniqueCountries = [...new Set(happiness.map((row) => row.country))]
export const UNMATCHED_COUNTRIES = uniqueCountries.filter((country) => !COUNTRY_ALPHA2[country])

if (UNMATCHED_COUNTRIES.length) {
  console.warn('[countryCatalog] Países sin emparejar:', UNMATCHED_COUNTRIES)
}
