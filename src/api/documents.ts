import { supabase } from '../lib/supabase';
import type { Document } from '../types/database.types';

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

export async function getDocuments(): Promise<Document[]> {
  // RLS가 자동으로 같은 단지 문서만 반환
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createDocument(
  title: string,
  file: File
): Promise<Document> {
  // 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다.');

  // 단지 ID 가져오기
  const complexId = await getUserComplexId();
  if (!complexId) throw new Error('단지에 가입되어 있지 않습니다.');

  // 1. Storage에 파일 업로드 (단지 ID로 폴더 구분)
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${complexId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // 2. documents 테이블에 레코드 생성 (complex_id 포함)
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      complex_id: complexId,
      title,
      file_path: filePath,
      file_size: file.size,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocumentPageCount(
  id: string,
  pageCount: number
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ page_count: pageCount, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteDocument(id: string): Promise<void> {
  // 1. 문서 정보 가져오기
  const doc = await getDocument(id);
  if (!doc) return;

  // 2. Storage에서 파일 삭제
  const { error: storageError } = await supabase.storage
    .from('pdfs')
    .remove([doc.file_path]);

  if (storageError) console.error('Storage 삭제 실패:', storageError);

  // 3. documents 테이블에서 삭제 (labels, bookmarks는 CASCADE로 삭제됨)
  const { error } = await supabase.from('documents').delete().eq('id', id);

  if (error) throw error;
}

export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage.from('pdfs').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function updateDocumentRotation(
  id: string,
  rotation: number
): Promise<void> {
  // rotation은 0, 90, 180, 270만 허용
  const validRotation = ((rotation % 360) + 360) % 360;
  if (![0, 90, 180, 270].includes(validRotation)) {
    throw new Error('Invalid rotation value');
  }

  const { error } = await supabase
    .from('documents')
    .update({ rotation: validRotation, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function updateDocumentLastOpened(id: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}
