/** Edge / middleware 安全 — 重い repo 依存なし */
export function isHanakaiAdminPath(pathname: string): boolean {
  return pathname === '/admin/hanakai' || pathname.startsWith('/admin/hanakai/');
}
