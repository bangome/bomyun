import { supabase } from '../lib/supabase';
import type { Bookmark } from '../types/database.types';

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

export async function getBookmarks(documentId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('document_id', documentId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createBookmark(
  documentId: string,
  pageNumber: number,
  title?: string
): Promise<Bookmark> {
  // 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다.');

  const complexId = await getUserComplexId();
  if (!complexId) throw new Error('단지에 가입되어 있지 않습니다.');

  // 현재 최대 sort_order 조회
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('sort_order')
    .eq('document_id', documentId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: user.id,
      complex_id: complexId,
      document_id: documentId,
      page_number: pageNumber,
      title,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBookmark(
  id: string,
  updates: { title?: string; sort_order?: number }
): Promise<Bookmark> {
  const { data, error } = await supabase
    .from('bookmarks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBookmark(id: string): Promise<void> {
  const { error } = await supabase.from('bookmarks').delete().eq('id', id);
  if (error) throw error;
}

export async function isPageBookmarked(
  documentId: string,
  pageNumber: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('document_id', documentId)
    .eq('page_number', pageNumber)
    .limit(1);

  if (error) throw error;
  return data !== null && data.length > 0;
}

export async function toggleBookmark(
  documentId: string,
  pageNumber: number,
  title?: string
): Promise<{ added: boolean; bookmark?: Bookmark }> {
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('document_id', documentId)
    .eq('page_number', pageNumber)
    .limit(1);

  if (existing && existing.length > 0) {
    await deleteBookmark(existing[0].id);
    return { added: false };
  } else {
    const bookmark = await createBookmark(documentId, pageNumber, title);
    return { added: true, bookmark };
  }
}
