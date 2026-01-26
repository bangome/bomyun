export interface Database {
  public: {
    Tables: {
      complexes: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          complex_id: string | null;
          display_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          complex_id?: string | null;
          display_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          complex_id?: string | null;
          display_name?: string | null;
          role?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          complex_id: string | null;
          title: string;
          file_path: string;
          file_size: number | null;
          page_count: number | null;
          rotation: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          complex_id?: string | null;
          title: string;
          file_path: string;
          file_size?: number | null;
          page_count?: number | null;
          rotation?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          complex_id?: string | null;
          title?: string;
          file_path?: string;
          file_size?: number | null;
          page_count?: number | null;
          rotation?: number;
          updated_at?: string;
        };
      };
      labels: {
        Row: {
          id: string;
          user_id: string;
          complex_id: string | null;
          document_id: string;
          page_number: number;
          text: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          complex_id?: string | null;
          document_id: string;
          page_number: number;
          text: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          complex_id?: string | null;
          document_id?: string;
          page_number?: number;
          text?: string;
          color?: string;
          updated_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          complex_id: string | null;
          document_id: string;
          page_number: number;
          title: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          complex_id?: string | null;
          document_id: string;
          page_number: number;
          title?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          complex_id?: string | null;
          document_id?: string;
          page_number?: number;
          title?: string | null;
          sort_order?: number;
        };
      };
    };
  };
}

export type Complex = Database['public']['Tables']['complexes']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type Label = Database['public']['Tables']['labels']['Row'];
export type Bookmark = Database['public']['Tables']['bookmarks']['Row'];

// 전역 라벨 검색 결과 타입
export interface GlobalLabelSearchResult {
  id: string;
  text: string;
  color: string;
  page_number: number;
  document_id: string;
  document_title: string;
  created_at: string;
}
