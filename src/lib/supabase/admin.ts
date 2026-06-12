import { createClient } from '@supabase/supabase-js';

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('SUPABASE_ADMIN_CLIENT_INIT', {
    keyName: 'SUPABASE_SERVICE_ROLE_KEY',
    hasServiceRole: Boolean(serviceRole),
    hasAnonKey: Boolean(anonKey),
  });

  if (!url || !serviceRole) {
    console.error('SUPABASE_ADMIN_CLIENT_UNAVAILABLE', {
      reason: 'missing_url_or_service_role',
      hasUrl: Boolean(url),
      hasServiceRole: Boolean(serviceRole),
      keyName: 'SUPABASE_SERVICE_ROLE_KEY',
    });
    return null;
  }

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
