import { supabase } from '../lib/supabase';
import type { Complex, UserProfile } from '../types/database.types';

// 사용자 프로필 조회
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // 프로필이 없으면 null 반환 (트리거가 생성하지 않은 경우)
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// 사용자 프로필 생성 (프로필이 없는 경우)
export async function createUserProfile(): Promise<UserProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다.');

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({ id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 초대 코드로 단지 조회
export async function getComplexByInviteCode(inviteCode: string): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase
    .rpc('get_complex_by_invite_code', { code: inviteCode });

  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0];
}

// 단지 가입 (프로필에 complex_id 설정)
export async function joinComplex(complexId: string): Promise<UserProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다.');

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ complex_id: complexId, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 새 단지 생성 (관리자용)
export async function createComplex(name: string): Promise<Complex> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다.');

  // 랜덤 초대 코드 생성 (8자리)
  const inviteCode = generateInviteCode();

  const { data, error } = await supabase
    .from('complexes')
    .insert({ name, invite_code: inviteCode })
    .select()
    .single();

  if (error) throw error;

  // 생성자를 관리자로 설정하고 단지에 가입
  await supabase
    .from('user_profiles')
    .update({
      complex_id: data.id,
      role: 'admin',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  return data;
}

// 현재 사용자의 단지 조회
export async function getCurrentComplex(): Promise<Complex | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('complex_id')
    .eq('id', user.id)
    .single();

  if (!profile?.complex_id) return null;

  const { data, error } = await supabase
    .from('complexes')
    .select('*')
    .eq('id', profile.complex_id)
    .single();

  if (error) return null;
  return data;
}

// 단지 탈퇴
export async function leaveComplex(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다.');

  const { error } = await supabase
    .from('user_profiles')
    .update({
      complex_id: null,
      role: 'member',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) throw error;
}

// 랜덤 초대 코드 생성
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되는 문자 제외
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
