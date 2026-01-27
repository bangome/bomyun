import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { searchLabelsGlobal } from '../api/labels';
import { searchPageNamesGlobal } from '../api/pageNames';
import type { GlobalSearchResult } from '../types/database.types';

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
      // 라벨과 페이지 이름을 병렬로 검색
      const [labelResults, pageResults] = await Promise.all([
        searchLabelsGlobal(query),
        searchPageNamesGlobal(query),
      ]);

      // 결과를 통합 타입으로 변환
      const combinedResults: GlobalSearchResult[] = [
        // 라벨 결과
        ...labelResults.map((item) => ({
          type: 'label' as const,
          id: item.id,
          text: item.text,
          page_number: item.page_number,
          document_id: item.document_id,
          document_title: item.document_title,
          created_at: item.created_at,
          color: item.color,
          position_x: item.position_x,
          position_y: item.position_y,
        })),
        // 페이지 이름 결과
        ...pageResults.map((item) => ({
          type: 'page' as const,
          id: item.id,
          text: item.name,
          page_number: item.page_number,
          document_id: item.document_id,
          document_title: item.document_title,
          created_at: item.created_at,
        })),
      ];

      // 생성일 기준 정렬
      combinedResults.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setGlobalResults(combinedResults);
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
