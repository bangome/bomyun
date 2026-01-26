import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useTextSearch } from '../../hooks/useTextSearch';

interface TextSearchProps {
  className?: string;
  autoFocus?: boolean;
}

export function TextSearch({ className = '', autoFocus = false }: TextSearchProps) {
  const {
    query,
    totalMatches,
    currentMatchIndex,
    isSearching,
    search,
    goToNextMatch,
    goToPrevMatch,
    clearSearch,
  } = useTextSearch();

  const [inputValue, setInputValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 디바운스 검색
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      debounceRef.current = setTimeout(() => {
        search(value);
      }, 300);
    },
    [search]
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    clearSearch();
    inputRef.current?.focus();
  }, [clearSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          goToPrevMatch();
        } else {
          goToNextMatch();
        }
      } else if (e.key === 'Escape') {
        handleClear();
      }
    },
    [goToNextMatch, goToPrevMatch, handleClear]
  );

  // Ctrl+F로 검색창 포커스
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="텍스트 검색 (Ctrl+F)"
          autoFocus={autoFocus}
          className="w-full pl-9 pr-20 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : totalMatches > 0 ? (
            <span className="text-xs text-gray-500 px-1">
              {currentMatchIndex + 1}/{totalMatches}
            </span>
          ) : inputValue && !isSearching ? (
            <span className="text-xs text-gray-500 px-1">없음</span>
          ) : null}

          {inputValue && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
              title="검색 지우기"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {totalMatches > 0 && (
        <>
          <button
            onClick={goToPrevMatch}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="이전 결과 (Shift+Enter)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMatch}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="다음 결과 (Enter)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
