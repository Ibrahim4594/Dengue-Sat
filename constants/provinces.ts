import { Province } from '../lib/types';

export const PROVINCES: Province[] = [
  {
    id: 'sindh',
    name: 'Sindh',
    nameUrdu: 'سندھ',
    cities: [
      {
        id: 'karachi',
        name: 'Karachi',
        nameUrdu: 'کراچی',
        lat: 24.8607,
        lng: 67.0011,
        population: 20382881,
        districts: [
          { id: 'east', name: 'East', nameUrdu: 'مشرق', lat: 24.9266, lng: 67.1141, population: 3957078 },
          { id: 'central', name: 'Central', nameUrdu: 'وسطی', lat: 24.9181, lng: 67.0635, population: 3823350 },
          { id: 'korangi', name: 'Korangi', nameUrdu: 'کورنگی', lat: 24.8253, lng: 67.1318, population: 3128971 },
          { id: 'west', name: 'West', nameUrdu: 'مغرب', lat: 24.9447, lng: 66.9924, population: 2683018 },
          { id: 'malir', name: 'Malir', nameUrdu: 'ملیر', lat: 24.9100, lng: 67.2065, population: 2400000 },
          { id: 'south', name: 'South', nameUrdu: 'جنوب', lat: 24.8418, lng: 67.0123, population: 2333411 },
          { id: 'keamari', name: 'Keamari', nameUrdu: 'کیماڑی', lat: 24.8350, lng: 66.9821, population: 2071000 },
        ],
      },
      {
        id: 'hyderabad',
        name: 'Hyderabad',
        nameUrdu: 'حیدرآباد',
        lat: 25.3960,
        lng: 68.3578,
        population: 2432540,
        districts: [
          { id: 'qasimabad', name: 'Qasimabad', nameUrdu: 'قاسم آباد', lat: 25.3849, lng: 68.3262, population: 410000 },
          { id: 'latifabad', name: 'Latifabad', nameUrdu: 'لطیف آباد', lat: 25.3613, lng: 68.3690, population: 580000 },
        ],
      },
    ],
  },
  {
    id: 'punjab',
    name: 'Punjab',
    nameUrdu: 'پنجاب',
    cities: [
      {
        id: 'lahore',
        name: 'Lahore',
        nameUrdu: 'لاہور',
        lat: 31.5204,
        lng: 74.3587,
        population: 13004135,
        districts: [
          { id: 'gulberg', name: 'Gulberg', nameUrdu: 'گلبرگ', lat: 31.5096, lng: 74.3460, population: 850000 },
          { id: 'model-town', name: 'Model Town', nameUrdu: 'ماڈل ٹاؤن', lat: 31.4810, lng: 74.3290, population: 920000 },
        ],
      },
      {
        id: 'rawalpindi',
        name: 'Rawalpindi',
        nameUrdu: 'راولپنڈی',
        lat: 33.5651,
        lng: 73.0169,
        population: 2098231,
        districts: [
          { id: 'saddar', name: 'Saddar', nameUrdu: 'صدر', lat: 33.5973, lng: 73.0479, population: 410000 },
        ],
      },
      {
        id: 'multan',
        name: 'Multan',
        nameUrdu: 'ملتان',
        lat: 30.1575,
        lng: 71.5249,
        population: 1871843,
        districts: [
          { id: 'cantt', name: 'Cantt', nameUrdu: 'چھاؤنی', lat: 30.1986, lng: 71.4687, population: 380000 },
        ],
      },
    ],
  },
  {
    id: 'kp',
    name: 'Khyber Pakhtunkhwa',
    nameUrdu: 'خیبر پختونخوا',
    cities: [
      {
        id: 'peshawar',
        name: 'Peshawar',
        nameUrdu: 'پشاور',
        lat: 34.0151,
        lng: 71.5249,
        population: 1970042,
        districts: [
          { id: 'cantt', name: 'Cantt', nameUrdu: 'چھاؤنی', lat: 34.0096, lng: 71.5466, population: 410000 },
        ],
      },
      {
        id: 'charsadda',
        name: 'Charsadda',
        nameUrdu: 'چارسدہ',
        lat: 34.1453,
        lng: 71.7308,
        population: 105414,
        districts: [
          { id: 'urban', name: 'Urban', nameUrdu: 'شہری', lat: 34.1453, lng: 71.7308, population: 105414 },
        ],
      },
    ],
  },
  {
    id: 'balochistan',
    name: 'Balochistan',
    nameUrdu: 'بلوچستان',
    cities: [
      {
        id: 'quetta',
        name: 'Quetta',
        nameUrdu: 'کوئٹہ',
        lat: 30.1798,
        lng: 66.9750,
        population: 1001205,
        districts: [
          { id: 'cantt', name: 'Cantt', nameUrdu: 'چھاؤنی', lat: 30.1865, lng: 66.9956, population: 240000 },
        ],
      },
    ],
  },
  {
    id: 'ict',
    name: 'Islamabad Capital Territory',
    nameUrdu: 'وفاقی دارالحکومت اسلام آباد',
    cities: [
      {
        id: 'islamabad',
        name: 'Islamabad',
        nameUrdu: 'اسلام آباد',
        lat: 33.6844,
        lng: 73.0479,
        population: 2363000,
        districts: [
          { id: 'g10', name: 'G-10', nameUrdu: 'جی-۱۰', lat: 33.6803, lng: 73.0223, population: 65000 },
          { id: 'f7', name: 'F-7', nameUrdu: 'ایف-۷', lat: 33.7227, lng: 73.0593, population: 28000 },
        ],
      },
    ],
  },
];

export function findDistrict(provinceId: string, cityId: string, districtId: string) {
  const province = PROVINCES.find(p => p.id === provinceId);
  if (!province) return null;
  const city = province.cities.find(c => c.id === cityId);
  if (!city) return null;
  const district = city.districts.find(d => d.id === districtId);
  if (!district) return null;
  return { province, city, district };
}
