import type { MaritalStatus } from '@/lib/types/domain';

export function maritalStatusLabel(status: MaritalStatus) {
  if (status === 'single') return '独身';
  if (status === 'married') return '既婚';
  if (status === 'divorced') return '離婚';
  return 'パートナーあり';
}
