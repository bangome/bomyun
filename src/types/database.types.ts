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
          folder_id: string | null;
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
          folder_id?: string | null;
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
          folder_id?: string | null;
          title?: string;
          file_path?: string;
          file_size?: number | null;
          page_count?: number | null;
          rotation?: number;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          complex_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_id?: string | null;
          complex_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          parent_id?: string | null;
          complex_id?: string | null;
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
          position_x: number;
          position_y: number;
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
          position_x?: number;
          position_y?: number;
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
          position_x?: number;
          position_y?: number;
          updated_at?: string;
        };
      };
      page_names: {
        Row: {
          id: string;
          document_id: string;
          page_number: number;
          name: string;
          user_id: string;
          complex_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          page_number: number;
          name: string;
          user_id: string;
          complex_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          page_number?: number;
          name?: string;
          user_id?: string;
          complex_id?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

export type Complex = Database['public']['Tables']['complexes']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type Folder = Database['public']['Tables']['folders']['Row'];
export type Label = Database['public']['Tables']['labels']['Row'];
export type PageName = Database['public']['Tables']['page_names']['Row'];

// 전역 라벨 검색 결과 타입
export interface GlobalLabelSearchResult {
  id: string;
  text: string;
  color: string;
  page_number: number;
  position_x: number;
  position_y: number;
  document_id: string;
  document_title: string;
  created_at: string;
}

// 전역 페이지 검색 결과 타입
export interface GlobalPageSearchResult {
  id: string;
  name: string;
  page_number: number;
  document_id: string;
  document_title: string;
  created_at: string;
}

// 통합 검색 결과 타입
export type GlobalSearchResultType = 'label' | 'page';

export interface GlobalSearchResult {
  type: GlobalSearchResultType;
  id: string;
  text: string; // 라벨 텍스트 또는 페이지 이름
  page_number: number;
  document_id: string;
  document_title: string;
  created_at: string;
  // 라벨 전용 필드
  color?: string;
  position_x?: number;
  position_y?: number;
}
