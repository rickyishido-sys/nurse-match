import { AppShell, type AppShellProps } from '@/components/app-shell';

/** 管理画面向け — PC幅で表示 */
export function AdminShell({ user, children }: Omit<AppShellProps, 'wide'>) {
  return (
    <AppShell user={user} wide>
      {children}
    </AppShell>
  );
}
