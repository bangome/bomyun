import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Building2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getComplexByInviteCode, joinComplex, getUserProfile, createUserProfile } from '../api/complex';

export function JoinPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_joined'>('loading');
  const [complexName, setComplexName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function handleJoin() {
      if (authLoading) return;

      // 로그인되지 않은 경우 로그인 페이지로 (초대 코드 저장)
      if (!isAuthenticated) {
        // 초대 코드를 localStorage에 저장하고 로그인 후 다시 시도
        if (inviteCode) {
          localStorage.setItem('pendingInviteCode', inviteCode);
        }
        navigate('/login', { replace: true });
        return;
      }

      if (!inviteCode) {
        setStatus('error');
        setErrorMessage('초대 코드가 없습니다.');
        return;
      }

      try {
        // 프로필 확인/생성
        let profile = await getUserProfile();
        if (!profile) {
          profile = await createUserProfile();
        }

        // 이미 단지에 가입된 경우
        if (profile.complex_id) {
          setStatus('already_joined');
          return;
        }

        // 초대 코드로 단지 조회
        const complexInfo = await getComplexByInviteCode(inviteCode.toUpperCase());
        if (!complexInfo) {
          setStatus('error');
          setErrorMessage('유효하지 않은 초대 코드입니다.');
          return;
        }

        setComplexName(complexInfo.name);

        // 단지 가입
        await joinComplex(complexInfo.id);

        // 저장된 초대 코드 삭제
        localStorage.removeItem('pendingInviteCode');

        setStatus('success');

        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);

      } catch (err) {
        console.error('가입 실패:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : '단지 가입에 실패했습니다.');
      }
    }

    handleJoin();
  }, [inviteCode, isAuthenticated, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          {/* 로딩 */}
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900">단지 가입 중...</h2>
              <p className="text-gray-500 mt-2">잠시만 기다려주세요</p>
            </>
          )}

          {/* 성공 */}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">가입 완료!</h2>
              <p className="text-gray-500 mt-2">
                <span className="font-medium text-gray-900">{complexName}</span>에 가입되었습니다.
              </p>
              <p className="text-sm text-gray-400 mt-4">잠시 후 메인 페이지로 이동합니다...</p>
            </>
          )}

          {/* 에러 */}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">가입 실패</h2>
              <p className="text-gray-500 mt-2">{errorMessage}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                홈으로 이동
              </button>
            </>
          )}

          {/* 이미 가입됨 */}
          {status === 'already_joined' && (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">이미 단지에 가입되어 있습니다</h2>
              <p className="text-gray-500 mt-2">
                다른 단지에 가입하려면 먼저 현재 단지에서 탈퇴해주세요.
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                홈으로 이동
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
