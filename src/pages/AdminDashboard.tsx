import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  FileText,
  Tag,
  Folder,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  getAdminStats,
  getUserActivities,
  getComplexesWithStats,
  getRecentActivities,
  type AdminStats,
  type UserActivity,
  type ComplexWithStats,
  type RecentActivity,
} from '../api/admin';

type TabType = 'overview' | 'users' | 'complexes' | 'activities';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [complexes, setComplexes] = useState<ComplexWithStats[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData, complexesData, activitiesData] = await Promise.all([
        getAdminStats(),
        getUserActivities(),
        getComplexesWithStats(),
        getRecentActivities(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setComplexes(complexesData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return formatDate(dateString);
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'label':
        return <Tag className="w-4 h-4 text-green-500" />;
      case 'user':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'complex':
        return <Building2 className="w-4 h-4 text-amber-500" />;
    }
  };

  const tabs = [
    { id: 'overview' as const, label: '개요', icon: TrendingUp },
    { id: 'users' as const, label: '사용자', icon: Users },
    { id: 'complexes' as const, label: '단지', icon: Building2 },
    { id: 'activities' as const, label: '활동 로그', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
            </div>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* 개요 탭 */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                {/* 통계 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard
                    icon={Users}
                    label="총 사용자"
                    value={stats.totalUsers}
                    color="blue"
                  />
                  <StatCard
                    icon={Building2}
                    label="총 단지"
                    value={stats.totalComplexes}
                    color="amber"
                  />
                  <StatCard
                    icon={FileText}
                    label="총 문서"
                    value={stats.totalDocuments}
                    color="green"
                  />
                  <StatCard
                    icon={Tag}
                    label="총 라벨"
                    value={stats.totalLabels}
                    color="purple"
                  />
                  <StatCard
                    icon={Folder}
                    label="총 폴더"
                    value={stats.totalFolders}
                    color="orange"
                  />
                  <StatCard
                    icon={BookOpen}
                    label="페이지 이름"
                    value={stats.totalPageNames}
                    color="pink"
                  />
                </div>

                {/* 최근 활동 미리보기 */}
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {activity.complex_name && `${activity.complex_name} · `}
                            {formatRelativeTime(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 사용자 탭 */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          사용자
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          단지
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          역할
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          문서
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          라벨
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          가입일
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.display_name || '(이름 없음)'}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                {user.id.slice(0, 8)}...
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.complex_name || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                user.role === 'admin'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {user.role === 'admin' ? '관리자' : '멤버'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {user.document_count}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {user.label_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && (
                  <div className="p-8 text-center text-gray-500">사용자가 없습니다</div>
                )}
              </div>
            )}

            {/* 단지 탭 */}
            {activeTab === 'complexes' && (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          단지명
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          초대 코드
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          멤버
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          문서
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          라벨
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          생성일
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {complexes.map((complex) => (
                        <tr key={complex.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{complex.name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                              {complex.invite_code}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {complex.member_count}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {complex.document_count}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {complex.label_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(complex.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {complexes.length === 0 && (
                  <div className="p-8 text-center text-gray-500">단지가 없습니다</div>
                )}
              </div>
            )}

            {/* 활동 로그 탭 */}
            {activeTab === 'activities' && (
              <div className="bg-white rounded-xl border p-6">
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="p-2 bg-white rounded-lg border">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          {activity.user_name && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {activity.user_name}
                            </span>
                          )}
                          {activity.complex_name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {activity.complex_name}
                            </span>
                          )}
                          <span>{formatRelativeTime(activity.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {activities.length === 0 && (
                  <div className="p-8 text-center text-gray-500">활동 기록이 없습니다</div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'amber' | 'green' | 'purple' | 'orange' | 'pink';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    pink: 'bg-pink-50 text-pink-600',
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
