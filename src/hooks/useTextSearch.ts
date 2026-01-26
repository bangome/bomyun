import { useCallback } from 'react';
import { useStore } from '../store';
import type { SearchMatch } from '../types/pdf.types';

export function useTextSearch() {
  const {
    document,
    query,
    matches,
    currentMatchIndex,
    isSearching,
    setQuery,
    setMatches,
    setCurrentMatchIndex,
    setSearching,
    clearSearch,
    setCurrentPage,
  } = useStore();

  const search = useCallback(
    async (searchQuery: string) => {
      if (!document || !searchQuery.trim()) {
        clearSearch();
        return;
      }

      setQuery(searchQuery);
      setSearching(true);

      try {
        const allMatches: SearchMatch[] = [];
        const normalizedQuery = searchQuery.toLowerCase();

        for (let pageNum = 1; pageNum <= document.numPages; pageNum++) {
          const page = await document.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1 });

          let matchIndex = 0;
          for (const item of textContent.items) {
            if ('str' in item) {
              const textItem = item as any;
              const text = textItem.str;
              const lowerText = text.toLowerCase();

              let pos = 0;
              while ((pos = lowerText.indexOf(normalizedQuery, pos)) !== -1) {
                const transform = textItem.transform;

                // 텍스트 위치 계산
                const fontSize = Math.sqrt(transform[0] ** 2 + transform[1] ** 2);
                const charWidth = textItem.width / text.length;

                allMatches.push({
                  pageIndex: pageNum - 1,
                  matchIndex: matchIndex++,
                  text: text.substring(pos, pos + searchQuery.length),
                  position: {
                    left: (transform[4] + pos * charWidth) / viewport.width * 100,
                    top: (viewport.height - transform[5] - fontSize) / viewport.height * 100,
                    width: (searchQuery.length * charWidth) / viewport.width * 100,
                    height: (fontSize * 1.2) / viewport.height * 100,
                  },
                });

                pos += normalizedQuery.length;
              }
            }
          }
        }

        setMatches(allMatches);
      } catch (error) {
        console.error('검색 중 오류:', error);
        setMatches([]);
      } finally {
        setSearching(false);
      }
    },
    [document, setQuery, setMatches, setSearching, clearSearch]
  );

  const goToMatch = useCallback(
    (index: number) => {
      if (index >= 0 && index < matches.length) {
        setCurrentMatchIndex(index);
        const match = matches[index];
        setCurrentPage(match.pageIndex + 1);
      }
    },
    [matches, setCurrentMatchIndex, setCurrentPage]
  );

  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % matches.length;
    goToMatch(nextIndex);
  }, [matches.length, currentMatchIndex, goToMatch]);

  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;

    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    goToMatch(prevIndex);
  }, [matches.length, currentMatchIndex, goToMatch]);

  const getCurrentMatch = useCallback(() => {
    if (currentMatchIndex >= 0 && currentMatchIndex < matches.length) {
      return matches[currentMatchIndex];
    }
    return null;
  }, [matches, currentMatchIndex]);

  const getMatchesForPage = useCallback(
    (pageIndex: number) => {
      return matches.filter((m) => m.pageIndex === pageIndex);
    },
    [matches]
  );

  return {
    query,
    matches,
    currentMatchIndex,
    totalMatches: matches.length,
    isSearching,
    currentMatch: getCurrentMatch(),
    search,
    goToMatch,
    goToNextMatch,
    goToPrevMatch,
    getMatchesForPage,
    clearSearch,
  };
}
