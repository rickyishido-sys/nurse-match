insert into users (id, email, role, gender, nickname, birthdate, age, location, bio, profile_image_url, desired_gender, verification_status, identity_document_url, is_suspended)
values
  ('00000000-0000-0000-0000-0000000000f1', 'hana@nursematch.app', 'user', 'female', 'はな', '1996-03-10', 30, '東京都', '都内で働く看護師です。', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800', 'both', 'approved', 'private/identity/u_f_1.pdf', false),
  ('00000000-0000-0000-0000-0000000000f2', 'yui@nursematch.app', 'user', 'female', 'ゆい', '1998-05-23', 27, '神奈川県', '夜勤あり。映画好き。', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800', 'female', 'approved', 'private/identity/u_f_2.pdf', false),
  ('00000000-0000-0000-0000-0000000000m1', 'taro@nursematch.app', 'user', 'male', 'タロウ', '1992-11-05', 33, '東京都', 'IT企業勤務。', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800', 'female', 'approved', 'private/identity/u_m_1.pdf', false),
  ('00000000-0000-0000-0000-0000000000a1', 'admin@nursematch.app', 'super_admin', 'female', '運営', '1990-01-01', 36, '東京都', '運営アカウント', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800', 'both', 'approved', 'private/identity/admin.pdf', false),
  ('00000000-0000-0000-0000-0000000000a2', 'female-admin@nursematch.app', 'female_admin', 'female', '女性管理', '1991-01-01', 35, '東京都', '女性管理者', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800', 'both', 'approved', 'private/identity/admin-f.pdf', false),
  ('00000000-0000-0000-0000-0000000000a3', 'male-admin@nursematch.app', 'male_admin', 'male', '男性管理', '1991-01-01', 35, '東京都', '男性管理者', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800', 'both', 'approved', 'private/identity/admin-m.pdf', false);

-- optional env-driven initial admin (run manually if needed)
-- email: current_setting('app.settings.initial_admin_email', true)
-- password provisioning is handled in Supabase Auth dashboard/API.
