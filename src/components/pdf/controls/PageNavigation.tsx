import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { usePDF } from '../../../hooks/usePDF';

export function PageNavigation() {
  const { currentPage, numPages, goToPage, nextPage, prevPage } = usePDF();
  const [inputValue, setInputValue] = useState(String(currentPage));

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const page = parseInt(inputValue);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      goToPage(page);
    } else {
      setInputValue(String(currentPage));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setInputValue(String(currentPage));
      (e.target as HTMLInputElement).blur();
    }
  };

  if (numPages === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="첫 페이지 (Home)"
      >
        <ChevronsLeft className="w-5 h-5" />
      </button>

      <button
        onClick={prevPage}
        disabled={currentPage === 1}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="이전 페이지 (←)"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 px-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="w-12 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <span className="text-gray-500">/</span>
        <span className="text-gray-700">{numPages}</span>
      </div>

      <button
        onClick={nextPage}
        disabled={currentPage === numPages}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="다음 페이지 (→)"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <button
        onClick={() => goToPage(numPages)}
        disabled={currentPage === numPages}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="마지막 페이지 (End)"
      >
        <ChevronsRight className="w-5 h-5" />
      </button>
    </div>
  );
}
