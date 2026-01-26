import { FileText, Clock } from 'lucide-react';
import { useDocumentLibrary } from '../../hooks/useDocumentLibrary';
import { usePDF } from '../../hooks/usePDF';
import { useStore } from '../../store';
import { updateDocumentLastOpened } from '../../api/documents';
import type { Document } from '../../types/database.types';

interface WelcomeScreenProps {
  className?: string;
}

export function WelcomeScreen({ className = '' }: WelcomeScreenProps) {
  const { documents, getDocUrl } = useDocumentLibrary();
  const { loadDocument } = usePDF();
  const { setCurrentDocumentTitle } = useStore();

  // 최근 연 순서로 정렬 (updated_at 기준)
  const sortedDocuments = [...documents].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const handleDocumentClick = async (doc: Document) => {
    try {
      // 최근 연 시간 업데이트
      await updateDocumentLastOpened(doc.id);

      const url = await getDocUrl(doc.file_path);
      await loadDocument(url, doc.id);
      setCurrentDocumentTitle(doc.title);
    } catch (error) {
      console.error('문서 열기 실패:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? '방금 전' : `${diffMins}분 전`;
      }
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 문서가 없으면 기존 메시지 표시
  if (documents.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="text-gray-500 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg mb-2">PDF 파일을 선택해주세요</p>
          <p className="text-sm">파일을 업로드하거나 URL을 입력하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-gray-100 overflow-auto ${className}`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">최근 문서</h1>
          <p className="text-sm text-gray-500 mt-1">
            {documents.length}개의 문서
          </p>
        </div>

        {/* 문서 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDocuments.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleDocumentClick(doc)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all text-left group"
            >
              {/* 아이콘 */}
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
                <FileText className="w-6 h-6 text-red-500" />
              </div>

              {/* 제목 */}
              <h3 className="font-medium text-gray-800 truncate mb-1" title={doc.title}>
                {doc.title}
              </h3>

              {/* 메타 정보 */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(doc.updated_at)}</span>
                {doc.file_size && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </>
                )}
                {doc.page_count && (
                  <>
                    <span>•</span>
                    <span>{doc.page_count}페이지</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
