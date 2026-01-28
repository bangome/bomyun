import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { getLabels } from '../api/labels';
import type { Label } from '../types/database.types';

export function useRealtimeLabels(documentId: string | null) {
  const { setLabels, addLabel, updateLabel, removeLabel, labels } = useStore();

  useEffect(() => {
    if (!documentId || documentId === 'local') return;

    // 실시간 구독 설정
    const channel = supabase
      .channel(`labels:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'labels',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          const newLabel = payload.new as Label;
          // 이미 존재하지 않는 경우에만 추가
          const exists = labels.some((l) => l.id === newLabel.id);
          if (!exists) {
            addLabel(newLabel);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'labels',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          const updatedLabel = payload.new as Label;
          updateLabel(updatedLabel.id, updatedLabel);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'labels',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          const deletedLabel = payload.old as { id: string };
          removeLabel(deletedLabel.id);
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, addLabel, updateLabel, removeLabel, labels]);

  // 문서 변경 시 라벨 다시 로드
  useEffect(() => {
    if (!documentId || documentId === 'local') return;

    async function loadLabels() {
      try {
        const labels = await getLabels(documentId!);
        setLabels(labels);
      } catch (error) {
        console.error('라벨 로드 실패:', error);
      }
    }

    loadLabels();
  }, [documentId, setLabels]);
}
