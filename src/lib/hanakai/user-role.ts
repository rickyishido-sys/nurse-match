import type { HanakaiUserRole } from '@/lib/hanakai/session';

export function getRoleDisplayLabel(role: HanakaiUserRole): string {
  switch (role) {
    case 'super_admin':
      return '管理者';
    case 'connection_admin':
      return 'Connection Admin';
    case 'user':
      return '一般ユーザー';
  }
}

export function getRoleToneClass(role: HanakaiUserRole): string {
  switch (role) {
    case 'super_admin':
      return 'text-red-600';
    case 'connection_admin':
      return 'text-[#1f5d4f]';
    case 'user':
      return 'text-[#6b6b6b]';
  }
}
