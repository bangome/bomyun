import { useState } from 'react';
import { Building2, KeyRound, Plus, Loader2 } from 'lucide-react';
import { useComplex } from '../hooks/useComplex';

type SetupMode = 'select' | 'join' | 'create';

export function ComplexSetupPage() {
  const { joinWithInviteCode, createNewComplex, error: hookError } = useComplex();
  const [mode, setMode] = useState<SetupMode>('select');
  const [inviteCode, setInviteCode] = useState('');
  const [complexName, setComplexName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('초대 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await joinWithInviteCode(inviteCode.trim().toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : '단지 가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complexName.trim()) {
      setError('단지 이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createNewComplex(complexName.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : '단지 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">단지 설정</h1>
          <p className="text-gray-500 mt-2">
            문서를 공유할 단지에 가입하거나 새로 만드세요
          </p>
        </div>

        {/* 선택 모드 */}
        {mode === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('join')}
              className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100">
                  <KeyRound className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">초대 코드로 가입</h3>
                  <p className="text-sm text-gray-500">기존 단지에 가입합니다</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('create')}
              className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">새 단지 만들기</h3>
                  <p className="text-sm text-gray-500">새로운 단지를 생성합니다</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* 초대 코드 입력 */}
        {mode === 'join' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <button
              onClick={() => setMode('select')}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              ← 뒤로
            </button>

            <h2 className="text-lg font-semibold mb-4">초대 코드 입력</h2>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  초대 코드
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-lg tracking-widest font-mono"
                  maxLength={8}
                  autoFocus
                />
              </div>

              {(error || hookError) && (
                <p className="text-sm text-red-600">{error || hookError}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  '단지 가입'
                )}
              </button>
            </form>
          </div>
        )}

        {/* 새 단지 만들기 */}
        {mode === 'create' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <button
              onClick={() => setMode('select')}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              ← 뒤로
            </button>

            <h2 className="text-lg font-semibold mb-4">새 단지 만들기</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단지 이름
                </label>
                <input
                  type="text"
                  value={complexName}
                  onChange={(e) => setComplexName(e.target.value)}
                  placeholder="예: 행복아파트"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>

              {(error || hookError) && (
                <p className="text-sm text-red-600">{error || hookError}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  '단지 생성'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                단지를 생성하면 자동으로 관리자가 됩니다.
                <br />
                초대 코드가 발급되어 다른 사용자를 초대할 수 있습니다.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
