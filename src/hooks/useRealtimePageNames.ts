import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { getPageNames } from '../api/pageNames';
import type { PageName } from '../types/database.types';

export function useRealtimePageNames(documentId: string | null) {
  const { setPageNames, addPageName, updatePageName, removePageName, pageNames } = useStore();

  useEffect(() => {
    if (!documentId || documentId === 'local') return;

    // 실시간 구독 설정
    const channel = supabase
      .channel(`page_names:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_names',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          const newPageName = payload.new as PageName;
          const exists = pageNames.some((p) => p.id === newPageName.id);
          if (!exists) {
            addPageName(newPageName);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'page_names',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          const updatedPageName = payload.new as PageName;
          updatePageName(updatedPageName.id, updatedPageName);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'page_names',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          const deletedPageName = payload.old as { id: string };
          removePageName(deletedPageName.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, addPageName, updatePageName, removePageName, pageNames]);

  // 문서 변경 시 페이지 이름 다시 로드
  useEffect(() => {
    if (!documentId || documentId === 'local') return;

    async function loadPageNames() {
      try {
        const names = await getPageNames(documentId!);
        setPageNames(names);
      } catch (error) {
        console.error('페이지 이름 로드 실패:', error);
      }
    }

    loadPageNames();
  }, [documentId, setPageNames]);
}
