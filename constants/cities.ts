/**
 * Pakistan City Metadata — PBS Census 2023
 * Coordinates, population, districts for top 6 dengue-affected cities
 */

export interface CityData {
  id: string;
  name: string;
  nameUrdu: string;
  province: string;
  latitude: number;
  longitude: number;
  population: number;
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  nameUrdu: string;
  population: number;
  latitude: number;
  longitude: number;
}

export const cities: CityData[] = [
  {
    id: 'karachi',
    name: 'Karachi',
    nameUrdu: 'کراچی',
    province: 'Sindh',
    latitude: 24.8607,
    longitude: 67.0011,
    population: 20382881,
    districts: [
      { id: 'karachi-east', name: 'Karachi East', nameUrdu: 'کراچی ایسٹ', population: 3950000, latitude: 24.8900, longitude: 67.0800 },
      { id: 'karachi-central', name: 'Karachi Central', nameUrdu: 'کراچی سینٹرل', population: 3820000, latitude: 24.8700, longitude: 67.0500 },
      { id: 'korangi', name: 'Korangi', nameUrdu: 'کورنگی', population: 3128971, latitude: 24.8200, longitude: 67.0700 },
      { id: 'karachi-west', name: 'Karachi West', nameUrdu: 'کراچی ویسٹ', population: 2680000, latitude: 24.8800, longitude: 66.9800 },
      { id: 'malir', name: 'Malir', nameUrdu: 'ملیر', population: 2400000, latitude: 24.8900, longitude: 67.1800 },
      { id: 'karachi-south', name: 'Karachi South', nameUrdu: 'کراچی ساؤتھ', population: 2330000, latitude: 24.8200, longitude: 67.0200 },
      { id: 'keamari', name: 'Keamari', nameUrdu: 'کیماری', population: 2070000, latitude: 24.8300, longitude: 66.9500 },
    ],
  },
  {
    id: 'lahore',
    name: 'Lahore',
    nameUrdu: 'لاہور',
    province: 'Punjab',
    latitude: 31.5204,
    longitude: 74.3587,
    population: 13004135,
    districts: [
      { id: 'lahore-city', name: 'Lahore City', nameUrdu: 'لاہور شہر', population: 13004135, latitude: 31.5204, longitude: 74.3587 },
    ],
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    nameUrdu: 'حیدرآباد',
    province: 'Sindh',
    latitude: 25.3960,
    longitude: 68.3578,
    population: 2432540,
    districts: [
      { id: 'hyderabad-city', name: 'Hyderabad City', nameUrdu: 'حیدرآباد شہر', population: 2432540, latitude: 25.3960, longitude: 68.3578 },
    ],
  },
  {
    id: 'rawalpindi',
    name: 'Rawalpindi',
    nameUrdu: 'راولپنڈی',
    province: 'Punjab',
    latitude: 33.5651,
    longitude: 73.0169,
    population: 2098231,
    districts: [
      { id: 'rawalpindi-city', name: 'Rawalpindi City', nameUrdu: 'راولپنڈی شہر', population: 2098231, latitude: 33.5651, longitude: 73.0169 },
    ],
  },
  {
    id: 'peshawar',
    name: 'Peshawar',
    nameUrdu: 'پشاور',
    province: 'KP',
    latitude: 34.0151,
    longitude: 71.5249,
    population: 2019118,
    districts: [
      { id: 'peshawar-city', name: 'Peshawar City', nameUrdu: 'پشاور شہر', population: 2019118, latitude: 34.0151, longitude: 71.5249 },
    ],
  },
  {
    id: 'islamabad',
    name: 'Islamabad',
    nameUrdu: 'اسلام آباد',
    province: 'ICT',
    latitude: 33.6844,
    longitude: 73.0479,
    population: 2363000,
    districts: [
      { id: 'islamabad-city', name: 'Islamabad', nameUrdu: 'اسلام آباد', population: 2363000, latitude: 33.6844, longitude: 73.0479 },
    ],
  },
];

export function getCityById(id: string): CityData | undefined {
  return cities.find(c => c.id === id);
}

export function getDistrictById(id: string): District | undefined {
  for (const city of cities) {
    const district = city.districts.find(d => d.id === id);
    if (district) return district;
  }
  return undefined;
}
