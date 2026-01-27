import { supabase } from '../lib/supabase';
import type { PageName, GlobalPageSearchResult } from '../types/database.types';

// 사용자의 complex_id 가져오기
async function getUserComplexId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('complex_id')
    .eq('id', user.id)
    .single();

  return data?.complex_id || null;
}

// 문서의 모든 페이지 이름 조회
export async function getPageNames(documentId: string): Promise<PageName[]> {
  const { data, error } = await supabase
    .from('page_names')
    .select('*')
    .eq('document_id', documentId)
    .order('page_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 페이지 이름 생성 또는 업데이트 (upsert)
export async function upsertPageName(
  documentId: string,
  pageNumber: number,
  name: string
): Promise<PageName> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');

  // 사용자 프로필에서 complex_id 가져오기
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('complex_id')
    .eq('id', user.id)
    .single();

  const { data, error } = await supabase
    .from('page_names')
    .upsert(
      {
        document_id: documentId,
        page_number: pageNumber,
        name,
        user_id: user.id,
        complex_id: profile?.complex_id || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'document_id,page_number',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 페이지 이름 삭제
export async function deletePageName(pageNameId: string): Promise<void> {
  const { error } = await supabase
    .from('page_names')
    .delete()
    .eq('id', pageNameId);

  if (error) throw error;
}

// 페이지 번호로 이름 삭제
export async function deletePageNameByPage(
  documentId: string,
  pageNumber: number
): Promise<void> {
  const { error } = await supabase
    .from('page_names')
    .delete()
    .eq('document_id', documentId)
    .eq('page_number', pageNumber);

  if (error) throw error;
}

// 전역 페이지 이름 검색 (같은 단지의 모든 문서에서 검색)
export async function searchPageNamesGlobal(query: string): Promise<GlobalPageSearchResult[]> {
  if (!query.trim()) return [];

  // 현재 사용자의 complex_id 확인
  const complexId = await getUserComplexId();
  if (!complexId) return []; // 단지에 가입되지 않은 경우 빈 배열 반환

  const { data, error } = await supabase
    .from('page_names')
    .select(`
      id,
      name,
      page_number,
      document_id,
      created_at,
      documents!inner(title)
    `)
    .eq('complex_id', complexId)
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  // 결과 타입 변환
  return (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    page_number: item.page_number,
    document_id: item.document_id,
    document_title: item.documents?.title || '제목 없음',
    created_at: item.created_at,
  }));
}
