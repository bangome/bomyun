import { supabase } from '../lib/supabase';

// 관리자 이메일 목록
const SUPER_ADMIN_EMAILS = ['jinhwa@aegisep.com'];

export function isSuperAdmin(email: string | undefined): boolean {
  return email ? SUPER_ADMIN_EMAILS.includes(email) : false;
}

export interface AdminStats {
  totalUsers: number;
  totalComplexes: number;
  totalDocuments: number;
  totalLabels: number;
  totalFolders: number;
  totalPageNames: number;
}

export interface UserActivity {
  id: string;
  display_name: string | null;
  complex_id: string | null;
  complex_name: string | null;
  role: string;
  created_at: string;
  document_count: number;
  label_count: number;
}

export interface ComplexWithStats {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  member_count: number;
  document_count: number;
  label_count: number;
}

export interface RecentActivity {
  id: string;
  type: 'document' | 'label' | 'user' | 'complex';
  description: string;
  user_name: string | null;
  complex_name: string | null;
  created_at: string;
}

// 전체 통계 가져오기
export async function getAdminStats(): Promise<AdminStats> {
  const [users, complexes, documents, labels, folders, pageNames] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('complexes').select('id', { count: 'exact', head: true }),
    supabase.from('documents').select('id', { count: 'exact', head: true }),
    supabase.from('labels').select('id', { count: 'exact', head: true }),
    supabase.from('folders').select('id', { count: 'exact', head: true }),
    supabase.from('page_names').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: users.count || 0,
    totalComplexes: complexes.count || 0,
    totalDocuments: documents.count || 0,
    totalLabels: labels.count || 0,
    totalFolders: folders.count || 0,
    totalPageNames: pageNames.count || 0,
  };
}

// 사용자별 활동 통계
export async function getUserActivities(): Promise<UserActivity[]> {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      display_name,
      complex_id,
      role,
      created_at,
      complexes (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const activities: UserActivity[] = [];

  for (const profile of profiles || []) {
    const [docCount, labelCount] = await Promise.all([
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      supabase.from('labels').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
    ]);

    activities.push({
      id: profile.id,
      display_name: profile.display_name,
      complex_id: profile.complex_id,
      complex_name: (profile.complexes as any)?.name || null,
      role: profile.role,
      created_at: profile.created_at,
      document_count: docCount.count || 0,
      label_count: labelCount.count || 0,
    });
  }

  return activities;
}

// 단지별 통계
export async function getComplexesWithStats(): Promise<ComplexWithStats[]> {
  const { data: complexes, error } = await supabase
    .from('complexes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const complexesWithStats: ComplexWithStats[] = [];

  for (const complex of complexes || []) {
    const [memberCount, docCount, labelCount] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('complex_id', complex.id),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('complex_id', complex.id),
      supabase.from('labels').select('id', { count: 'exact', head: true }).eq('complex_id', complex.id),
    ]);

    complexesWithStats.push({
      id: complex.id,
      name: complex.name,
      invite_code: complex.invite_code,
      created_at: complex.created_at,
      member_count: memberCount.count || 0,
      document_count: docCount.count || 0,
      label_count: labelCount.count || 0,
    });
  }

  return complexesWithStats;
}

// 최근 활동 가져오기
export async function getRecentActivities(limit = 30): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // 최근 문서 업로드
  const { data: recentDocs } = await supabase
    .from('documents')
    .select(`
      id,
      title,
      created_at,
      user_id,
      user_profiles!documents_user_id_fkey (display_name),
      complexes (name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  for (const doc of recentDocs || []) {
    activities.push({
      id: `doc-${doc.id}`,
      type: 'document',
      description: `문서 업로드: ${doc.title}`,
      user_name: (doc.user_profiles as any)?.display_name || '(이름 없음)',
      complex_name: (doc.complexes as any)?.name || null,
      created_at: doc.created_at,
    });
  }

  // 최근 라벨 생성
  const { data: recentLabels } = await supabase
    .from('labels')
    .select(`
      id,
      text,
      created_at,
      user_id,
      user_profiles!labels_user_id_fkey (display_name),
      complexes (name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  for (const label of recentLabels || []) {
    activities.push({
      id: `label-${label.id}`,
      type: 'label',
      description: `라벨 생성: ${label.text.length > 20 ? label.text.slice(0, 20) + '...' : label.text}`,
      user_name: (label.user_profiles as any)?.display_name || '(이름 없음)',
      complex_name: (label.complexes as any)?.name || null,
      created_at: label.created_at,
    });
  }

  // 최근 사용자 가입
  const { data: recentUsers } = await supabase
    .from('user_profiles')
    .select(`
      id,
      display_name,
      created_at,
      complexes (name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  for (const user of recentUsers || []) {
    activities.push({
      id: `user-${user.id}`,
      type: 'user',
      description: `신규 가입: ${user.display_name || '(이름 없음)'}`,
      user_name: user.display_name || '(이름 없음)',
      complex_name: (user.complexes as any)?.name || null,
      created_at: user.created_at,
    });
  }

  // 최근 단지 생성
  const { data: recentComplexes } = await supabase
    .from('complexes')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  for (const complex of recentComplexes || []) {
    activities.push({
      id: `complex-${complex.id}`,
      type: 'complex',
      description: `단지 생성: ${complex.name}`,
      user_name: null,
      complex_name: complex.name,
      created_at: complex.created_at,
    });
  }

  // 시간순 정렬
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return activities.slice(0, limit);
}
