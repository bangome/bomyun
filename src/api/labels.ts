import { supabase } from '../lib/supabase';
import type { Label, GlobalLabelSearchResult } from '../types/database.types';

export async function getLabels(documentId: string): Promise<Label[]> {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('document_id', documentId)
    .order('page_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getLabelsForPage(
  documentId: string,
  pageNumber: number
): Promise<Label[]> {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('document_id', documentId)
    .eq('page_number', pageNumber);

  if (error) throw error;
  return data || [];
}

export async function createLabel(
  documentId: string,
  pageNumber: number,
  text: string,
  color: string = '#3B82F6'
): Promise<Label> {
  // 현재 사용자 ID 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다.');

  const { data, error } = await supabase
    .from('labels')
    .insert({
      user_id: user.id,
      document_id: documentId,
      page_number: pageNumber,
      text,
      color,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLabel(
  id: string,
  updates: { text?: string; color?: string }
): Promise<Label> {
  const { data, error } = await supabase
    .from('labels')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLabel(id: string): Promise<void> {
  const { error } = await supabase.from('labels').delete().eq('id', id);
  if (error) throw error;
}

export async function searchLabels(
  documentId: string,
  query: string
): Promise<Label[]> {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('document_id', documentId)
    .ilike('text', `%${query}%`)
    .order('page_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 전역 라벨 검색 (모든 문서에서 검색)
export async function searchLabelsGlobal(query: string): Promise<GlobalLabelSearchResult[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('labels')
    .select(`
      id,
      text,
      color,
      page_number,
      document_id,
      created_at,
      documents!inner(title)
    `)
    .ilike('text', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  // 결과 타입 변환
  return (data || []).map((item: any) => ({
    id: item.id,
    text: item.text,
    color: item.color,
    page_number: item.page_number,
    document_id: item.document_id,
    document_title: item.documents?.title || '제목 없음',
    created_at: item.created_at,
  }));
}
