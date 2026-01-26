import { useState, useEffect, useCallback } from 'react';
import {
  getUserProfile,
  createUserProfile,
  getComplexByInviteCode,
  joinComplex,
  createComplex,
  getCurrentComplex,
  leaveComplex,
} from '../api/complex';
import { useAuth } from './useAuth';
import type { Complex, UserProfile } from '../types/database.types';

export function useComplex() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [complex, setComplex] = useState<Complex | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 프로필 및 단지 정보 로드
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setComplex(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let userProfile = await getUserProfile();

      // 프로필이 없으면 생성
      if (!userProfile) {
        userProfile = await createUserProfile();
      }

      setProfile(userProfile);

      // 단지 정보 로드
      if (userProfile.complex_id) {
        const complexInfo = await getCurrentComplex();
        setComplex(complexInfo);
      } else {
        setComplex(null);
      }
    } catch (err) {
      console.error('프로필 로드 실패:', err);
      setError('프로필을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // 초대 코드로 단지 가입
  const joinWithInviteCode = useCallback(async (inviteCode: string) => {
    setError(null);
    try {
      const complexInfo = await getComplexByInviteCode(inviteCode);
      if (!complexInfo) {
        throw new Error('유효하지 않은 초대 코드입니다.');
      }

      const updatedProfile = await joinComplex(complexInfo.id);
      setProfile(updatedProfile);

      const fullComplex = await getCurrentComplex();
      setComplex(fullComplex);

      return complexInfo;
    } catch (err) {
      const message = err instanceof Error ? err.message : '단지 가입에 실패했습니다.';
      setError(message);
      throw err;
    }
  }, []);

  // 새 단지 생성
  const createNewComplex = useCallback(async (name: string) => {
    setError(null);
    try {
      const newComplex = await createComplex(name);
      setComplex(newComplex);

      // 프로필 다시 로드
      await loadProfile();

      return newComplex;
    } catch (err) {
      const message = err instanceof Error ? err.message : '단지 생성에 실패했습니다.';
      setError(message);
      throw err;
    }
  }, [loadProfile]);

  // 단지 탈퇴
  const leave = useCallback(async () => {
    setError(null);
    try {
      await leaveComplex();
      setComplex(null);
      await loadProfile();
    } catch (err) {
      const message = err instanceof Error ? err.message : '단지 탈퇴에 실패했습니다.';
      setError(message);
      throw err;
    }
  }, [loadProfile]);

  return {
    profile,
    complex,
    isLoading,
    error,
    hasComplex: !!complex,
    isAdmin: profile?.role === 'admin',
    joinWithInviteCode,
    createNewComplex,
    leave,
    refresh: loadProfile,
  };
}
