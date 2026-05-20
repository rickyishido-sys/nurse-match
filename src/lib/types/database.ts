export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'user' | 'female_admin' | 'male_admin' | 'super_admin';
          gender: 'female' | 'male';
          nickname: string;
          birthdate: string;
          age: number;
          location: string;
          bio: string;
          profile_image_url: string;
          desired_gender: 'male' | 'female' | 'both';
          onboarding_status: 'provisional' | 'profile_completed' | 'verified';
          risk_check_status: 'not_checked' | 'checking' | 'clear' | 'review_required' | 'rejected';
          verification_status: 'pending' | 'approved' | 'rejected';
          identity_document_url: string | null;
          rejected_reason: string | null;
          moderation_action: 'none' | 'warning' | 'suspend' | 'permanent_ban';
          is_suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']> & {
          id: string;
          email: string;
          gender: 'female' | 'male';
          nickname: string;
          birthdate: string;
          age: number;
        };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      profile_images: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          sort_order: number;
          is_main: boolean;
          approved_status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profile_images']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profile_images']['Row']>;
      };
      female_profiles: {
        Row: {
          user_id: string;
          nurse_document_url: string;
          nurse_verification_status: 'pending' | 'approved' | 'rejected';
          workplace_type: 'hospital' | 'clinic' | 'beauty' | 'nightshift' | 'other';
          has_night_shift: boolean;
        };
        Insert: Database['public']['Tables']['female_profiles']['Row'];
        Update: Partial<Database['public']['Tables']['female_profiles']['Row']>;
      };
      male_profiles: {
        Row: {
          user_id: string;
          job: string;
          income: string;
          marital_status: 'single' | 'married' | 'divorced' | 'partner';
          has_children: boolean;
          male_review_status: 'pending' | 'approved' | 'rejected';
          income_verified: boolean;
          face_photo_verified: boolean;
          internal_memo: string | null;
          height: number | null;
          body_type: string | null;
          holiday: string | null;
          smoking: string | null;
          drinking: string | null;
          night_shift_understanding: boolean;
          shift_work_understanding: boolean;
          late_night_contact_ok: boolean;
          first_date_cost: string | null;
          personality_tags: string[] | null;
        };
        Insert: Partial<Database['public']['Tables']['male_profiles']['Row']> & {
          user_id: string;
          job: string;
          income: string;
          marital_status: 'single' | 'married' | 'divorced' | 'partner';
        };
        Update: Partial<Database['public']['Tables']['male_profiles']['Row']>;
      };
      identity_documents: {
        Row: {
          id: string;
          user_id: string;
          document_url: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['identity_documents']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['identity_documents']['Row']>;
      };
      likes: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: 'like' | 'skip';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['likes']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['likes']['Row']>;
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          target_user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['favorites']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['favorites']['Row']>;
      };
      daily_recommendations: {
        Row: {
          id: string;
          user_id: string;
          target_user_id: string;
          recommendation_date: string;
          rank: number;
          reason: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_recommendations']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['daily_recommendations']['Row']>;
      };
      matches: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          relationship_status: 'active' | 'relationship_mode' | 'scheduled_delete' | 'deleted';
          relationship_started_at: string | null;
          scheduled_delete_at: string | null;
          hold_deletion: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['matches']['Row']>;
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['messages']['Row']>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_user_id: string;
          reason: string;
          reason_type: 'fake_marital_status' | 'harassment' | 'dangerous' | 'fake_profile' | 'spam' | 'other';
          detail: string;
          status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['reports']['Row']>;
      };
      blocks: {
        Row: {
          id: string;
          blocker_user_id: string;
          blocked_user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blocks']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['blocks']['Row']>;
      };
      admin_actions: {
        Row: {
          id: string;
          admin_user_id: string;
          target_user_id: string;
          action_type:
            | 'verification_status_changed'
            | 'nurse_verification_status_changed'
            | 'male_review_status_changed'
            | 'user_suspended'
            | 'user_permanent_banned'
            | 'rejected_reason_updated'
            | 'internal_memo_updated';
          before_value: string | null;
          after_value: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_actions']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['admin_actions']['Row']>;
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_user_id: string;
          target_user_id: string | null;
          action: 'approve' | 'reject' | 'suspend' | 'permanent_ban' | 'image_reject' | 'deletion_hold';
          reason: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_audit_logs']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_audit_logs']['Row']>;
      };
      risk_checks: {
        Row: {
          id: string;
          user_id: string;
          status: 'not_checked' | 'checking' | 'clear' | 'review_required' | 'rejected';
          searched_at: string;
          search_keywords: string[];
          hit_count: number;
          source_urls: string[];
          admin_memo: string | null;
          final_decider_id: string | null;
          decided_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['risk_checks']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['risk_checks']['Row']>;
      };
    };
    Views: {
      public_user_cards: {
        Row: {
          id: string;
          gender: 'female' | 'male';
          nickname: string;
          age: number;
          location: string;
          bio: string;
          profile_image_url: string;
          desired_gender: 'male' | 'female' | 'both';
          verification_status: 'pending' | 'approved' | 'rejected';
          is_suspended: boolean;
        };
      };
      female_profile_public: {
        Row: {
          user_id: string;
          nurse_verification_status: 'pending' | 'approved' | 'rejected';
          workplace_type: 'hospital' | 'clinic' | 'beauty' | 'nightshift' | 'other';
          has_night_shift: boolean;
        };
      };
      male_profile_public: {
        Row: {
          user_id: string;
          job: string;
          income: string;
          marital_status: 'single' | 'married' | 'divorced' | 'partner';
          has_children: boolean;
          male_review_status: 'pending' | 'approved' | 'rejected';
          income_verified: boolean;
          face_photo_verified: boolean;
          height: number | null;
          body_type: string | null;
          holiday: string | null;
          smoking: string | null;
          drinking: string | null;
          night_shift_understanding: boolean;
          shift_work_understanding: boolean;
          late_night_contact_ok: boolean;
          first_date_cost: string | null;
          personality_tags: string[] | null;
        };
      };
    };
  };
};
