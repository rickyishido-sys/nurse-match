import type { MaritalStatus } from '@/lib/types/domain';

export function maritalStatusLabel(status: MaritalStatus) {
  if (status === 'single') return '独身';
  if (status === 'married') return '既婚';
  if (status === 'divorced') return '離婚';
  return 'パートナーあり';
}

export function seekingGenderLabel(value: 'male' | 'female' | 'both') {
  if (value === 'male') return '男性';
  if (value === 'female') return '女性';
  return 'どちらも';
}
