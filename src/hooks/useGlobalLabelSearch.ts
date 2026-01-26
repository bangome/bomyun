import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { searchLabelsGlobal } from '../api/labels';

export function useGlobalLabelSearch() {
  const {
    globalQuery,
    globalResults,
    isGlobalSearching,
    setGlobalQuery,
    setGlobalResults,
    setGlobalSearching,
    clearGlobalSearch,
  } = useStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGlobalResults([]);
      setGlobalSearching(false);
      return;
    }

    setGlobalSearching(true);
    try {
      const results = await searchLabelsGlobal(query);
      setGlobalResults(results);
    } catch (error) {
      console.error('전역 검색 실패:', error);
      setGlobalResults([]);
    } finally {
      setGlobalSearching(false);
    }
  }, [setGlobalResults, setGlobalSearching]);

  // 디바운스 검색
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);
  }, [search]);

  // 쿼리 변경 시 디바운스 검색 실행
  useEffect(() => {
    debouncedSearch(globalQuery);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [globalQuery, debouncedSearch]);

  const handleQueryChange = useCallback((query: string) => {
    setGlobalQuery(query);
  }, [setGlobalQuery]);

  return {
    query: globalQuery,
    results: globalResults,
    isSearching: isGlobalSearching,
    setQuery: handleQueryChange,
    clearSearch: clearGlobalSearch,
  };
}
