import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePDF } from '../../../hooks/usePDF';

export function MobilePageNavigation() {
  const { currentPage, numPages, nextPage, prevPage } = usePDF();

  if (numPages === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={prevPage}
        disabled={currentPage === 1}
        className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-xs font-medium text-gray-600 min-w-[4rem] text-center">
        {currentPage} / {numPages}
      </span>

      <button
        onClick={nextPage}
        disabled={currentPage === numPages}
        className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
