import { Search, FileText, Tag, Loader2, BookOpen } from 'lucide-react';
import { useGlobalLabelSearch } from '../../hooks/useGlobalLabelSearch';
import { useDocumentNavigation } from '../../hooks/useDocumentNavigation';
import type { GlobalSearchResult } from '../../types/database.types';

export function GlobalLabelSearch() {
  const { query, results, isSearching, setQuery, clearSearch } = useGlobalLabelSearch();
  const { navigateToLabel } = useDocumentNavigation();

  const handleResultClick = async (result: GlobalSearchResult) => {
    await navigateToLabel(result.document_id, result.page_number);
  };

  // 문서별로 그룹화하고, 각 문서 내에서 라벨과 페이지로 분류
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.document_id]) {
      acc[result.document_id] = {
        documentTitle: result.document_title,
        labels: [],
        pages: [],
      };
    }
    if (result.type === 'label') {
      acc[result.document_id].labels.push(result);
    } else {
      acc[result.document_id].pages.push(result);
    }
    return acc;
  }, {} as Record<string, { documentTitle: string; labels: GlobalSearchResult[]; pages: GlobalSearchResult[] }>);

  // 결과 통계
  const labelCount = results.filter(r => r.type === 'label').length;
  const pageCount = results.filter(r => r.type === 'page').length;

  return (
    <div className="h-full flex flex-col">
      {/* 검색 입력 */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="라벨, 페이지 이름 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : !query ? (
          <div className="text-center py-8 px-4 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">모든 문서의 라벨과 페이지를 검색하세요</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 px-4 text-gray-500">
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(groupedResults).map(([documentId, { documentTitle, labels, pages }]) => (
              <div key={documentId} className="py-3">
                {/* 문서 제목 */}
                <div className="px-4 pb-2 flex items-center gap-2 text-xs text-gray-500">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="font-medium truncate">{documentTitle}</span>
                </div>

                {/* 페이지 이름 목록 */}
                {pages.length > 0 && (
                  <div className="space-y-1 mb-1">
                    {pages.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{result.text}</p>
                            <p className="text-xs text-gray-500">
                              {result.page_number}페이지
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 라벨 목록 */}
                {labels.length > 0 && (
                  <div className="space-y-1">
                    {labels.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <Tag
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{ color: result.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{result.text}</p>
                            <p className="text-xs text-gray-500">
                              {result.page_number}페이지
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 결과 개수 */}
      {results.length > 0 && (
        <div className="p-3 border-t text-xs text-gray-500 text-center">
          {labelCount > 0 && `라벨 ${labelCount}개`}
          {labelCount > 0 && pageCount > 0 && ', '}
          {pageCount > 0 && `페이지 ${pageCount}개`}
          {' 발견'}
        </div>
      )}
    </div>
  );
}
