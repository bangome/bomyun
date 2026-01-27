import { useCallback } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { useStore } from '../../store';
import { usePDF } from '../../hooks/usePDF';

export function PageList() {
  const { pageNames, numPages } = useStore();
  const { goToPage, currentPage } = usePDF();

  // 페이지 클릭 시 해당 페이지로 이동
  const handlePageClick = useCallback((pageNumber: number) => {
    goToPage(pageNumber);
  }, [goToPage]);

  // 페이지 이름이 설정된 페이지만 필터링
  const namedPages = pageNames
    .slice()
    .sort((a, b) => a.page_number - b.page_number);

  // 전체 페이지 목록 생성 (이름 있는 페이지만)
  const pageList = namedPages.map((pn) => ({
    pageNumber: pn.page_number,
    name: pn.name,
    id: pn.id,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          페이지 목록
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {namedPages.length}개의 이름 지정됨 / 전체 {numPages}페이지
        </p>
      </div>

      {/* 페이지 목록 */}
      <div className="flex-1 overflow-y-auto">
        {pageList.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>이름이 지정된 페이지가 없습니다</p>
            <p className="text-xs mt-1">PDF 페이지 좌측 상단에서 이름을 추가하세요</p>
          </div>
        ) : (
          <div className="divide-y">
            {pageList.map((page) => (
              <button
                key={page.id}
                onClick={() => handlePageClick(page.pageNumber)}
                className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  currentPage === page.pageNumber ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600">
                  {page.pageNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {page.name}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 전체 페이지 빠른 이동 */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">페이지 이동:</span>
          <select
            value={currentPage}
            onChange={(e) => handlePageClick(Number(e.target.value))}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
              const pageName = namedPages.find((p) => p.page_number === pageNum);
              return (
                <option key={pageNum} value={pageNum}>
                  {pageNum}페이지{pageName ? ` - ${pageName.name}` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
