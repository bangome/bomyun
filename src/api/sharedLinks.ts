import { supabase } from '../lib/supabase';
import type { SharedLink, Document, Label, PageName } from '../types/database.types';

// 짧은 코드 생성 (6자리 영숫자)
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 공유 링크 생성
export async function createSharedLink(documentId: string): Promise<SharedLink> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');

  // 이미 해당 문서의 공유 링크가 있는지 확인
  const { data: existing } = await supabase
    .from('shared_links')
    .select('*')
    .eq('document_id', documentId)
    .eq('created_by', user.id)
    .maybeSingle();

  if (existing) {
    return existing as SharedLink;
  }

  // 새 공유 링크 생성
  let shortCode = generateShortCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const { data, error } = await supabase
      .from('shared_links')
      .insert({
        document_id: documentId,
        short_code: shortCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (!error) {
      return data as SharedLink;
    }

    // 중복 코드면 재시도
    if (error.code === '23505') {
      shortCode = generateShortCode();
      attempts++;
    } else {
      throw error;
    }
  }

  throw new Error('공유 링크 생성 실패');
}

// 공유 링크 조회 (short_code로)
export async function getSharedLink(shortCode: string): Promise<SharedLink | null> {
  const { data, error } = await supabase
    .from('shared_links')
    .select('*')
    .eq('short_code', shortCode)
    .maybeSingle();

  if (error) throw error;
  return data as SharedLink | null;
}

// 공유 링크로 문서 조회
export async function getSharedDocument(shortCode: string): Promise<{
  document: Document;
  labels: Label[];
  pageNames: PageName[];
} | null> {
  // 공유 링크 확인
  const { data: sharedLink, error: linkError } = await supabase
    .from('shared_links')
    .select('*')
    .eq('short_code', shortCode)
    .maybeSingle();

  if (linkError) throw linkError;
  if (!sharedLink) return null;

  // 만료 확인
  if (sharedLink.expires_at && new Date(sharedLink.expires_at) < new Date()) {
    return null;
  }

  // 조회수 증가
  await supabase
    .from('shared_links')
    .update({ view_count: (sharedLink.view_count || 0) + 1 })
    .eq('id', sharedLink.id);

  // 문서 조회
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', sharedLink.document_id)
    .single();

  if (docError) throw docError;

  // 라벨 조회
  const { data: labels, error: labelsError } = await supabase
    .from('labels')
    .select('*')
    .eq('document_id', sharedLink.document_id)
    .order('page_number', { ascending: true });

  if (labelsError) throw labelsError;

  // 페이지 이름 조회
  const { data: pageNames, error: pageNamesError } = await supabase
    .from('page_names')
    .select('*')
    .eq('document_id', sharedLink.document_id)
    .order('page_number', { ascending: true });

  if (pageNamesError) throw pageNamesError;

  return {
    document: document as Document,
    labels: (labels || []) as Label[],
    pageNames: (pageNames || []) as PageName[],
  };
}

// 문서의 공유 링크 목록 조회
export async function getSharedLinksForDocument(documentId: string): Promise<SharedLink[]> {
  const { data, error } = await supabase
    .from('shared_links')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SharedLink[];
}

// 공유 링크 삭제
export async function deleteSharedLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('shared_links')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// 공유 링크 URL 생성
export function getShareUrl(shortCode: string): string {
  return `${window.location.origin}/s/${shortCode}`;
}
