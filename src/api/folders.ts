import { supabase } from '../lib/supabase';
import type { Folder } from '../types/database.types';

// 현재 사용자의 complex_id 가져오기
async function getUserComplexId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('complex_id')
    .eq('id', user.id)
    .single();

  return profile?.complex_id || null;
}

// 폴더 목록 조회 (특정 부모 폴더 하위)
export async function getFolders(parentId: string | null = null): Promise<Folder[]> {
  // 현재 사용자의 complex_id 확인
  const complexId = await getUserComplexId();
  if (!complexId) return []; // 단지에 가입되지 않은 경우 빈 배열 반환

  let query = supabase
    .from('folders')
    .select('*')
    .eq('complex_id', complexId)
    .order('name', { ascending: true });

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// 폴더 생성
export async function createFolder(name: string, parentId: string | null = null): Promise<Folder> {
  const complexId = await getUserComplexId();
  if (!complexId) throw new Error('단지에 가입되어 있지 않습니다.');

  const { data, error } = await supabase
    .from('folders')
    .insert({
      name,
      parent_id: parentId,
      complex_id: complexId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 폴더 이름 수정
export async function updateFolder(id: string, name: string): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 폴더 삭제 (하위 폴더와 문서는 CASCADE 또는 SET NULL로 처리됨)
export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// 폴더 이동 (부모 폴더 변경)
export async function moveFolder(id: string, newParentId: string | null): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .update({ parent_id: newParentId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 폴더 경로 조회 (브레드크럼용)
export async function getFolderPath(folderId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .rpc('get_folder_path', { folder_id: folderId });

  if (error) throw error;
  return data || [];
}

// 문서를 폴더로 이동
export async function moveDocumentToFolder(documentId: string, folderId: string | null): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ folder_id: folderId, updated_at: new Date().toISOString() })
    .eq('id', documentId);

  if (error) throw error;
}

// 특정 폴더의 문서 조회
export async function getDocumentsInFolder(folderId: string | null): Promise<any[]> {
  // 현재 사용자의 complex_id 확인
  const complexId = await getUserComplexId();
  if (!complexId) return []; // 단지에 가입되지 않은 경우 빈 배열 반환

  let query = supabase
    .from('documents')
    .select('*')
    .eq('complex_id', complexId)
    .order('updated_at', { ascending: false });

  if (folderId) {
    query = query.eq('folder_id', folderId);
  } else {
    query = query.is('folder_id', null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}
