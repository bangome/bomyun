import { useState } from 'react';
import { X, User, Lock, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProfileModalProps {
  user: {
    id: string;
    email?: string;
  };
  displayName: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function ProfileModal({ user, displayName, onClose, onUpdate }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'name' | 'password'>('name');

  // 이름 변경
  const [newName, setNewName] = useState(displayName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsUpdatingName(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ display_name: newName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setNameSuccess(true);
      onUpdate();
      setTimeout(() => setNameSuccess(false), 2000);
    } catch (err) {
      console.error('이름 변경 실패:', err);
      setNameError('이름 변경에 실패했습니다.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      // 현재 비밀번호로 재인증
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError('현재 비밀번호가 올바르지 않습니다.');
        setIsUpdatingPassword(false);
        return;
      }

      // 새 비밀번호로 변경
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 2000);
    } catch (err) {
      console.error('비밀번호 변경 실패:', err);
      setPasswordError('비밀번호 변경에 실패했습니다.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl z-50 w-[90%] max-w-md">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">프로필 설정</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('name')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'name'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" />
            이름 변경
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock className="w-4 h-4" />
            비밀번호 변경
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-5">
          {activeTab === 'name' ? (
            <form onSubmit={handleUpdateName}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              {nameError && (
                <p className="text-sm text-red-600 mb-4">{nameError}</p>
              )}
              <button
                type="submit"
                disabled={isUpdatingName || !newName.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  nameSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                } disabled:opacity-50`}
              >
                {isUpdatingName ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : nameSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    저장됨
                  </>
                ) : (
                  '저장'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (6자 이상)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-600 mb-4">{passwordError}</p>
              )}
              <button
                type="submit"
                disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  passwordSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                } disabled:opacity-50`}
              >
                {isUpdatingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : passwordSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    변경됨
                  </>
                ) : (
                  '비밀번호 변경'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
