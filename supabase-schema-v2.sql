-- PDF 뷰어 Supabase 데이터베이스 스키마 v2
-- 사용자 인증 및 문서 라이브러리 지원
-- Supabase SQL Editor에서 이 스크립트를 실행하세요

-- 1. 기존 테이블에 user_id 컬럼 추가
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE labels ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. user_id 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

-- 3. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Allow all for documents" ON documents;
DROP POLICY IF EXISTS "Allow all for labels" ON labels;
DROP POLICY IF EXISTS "Allow all for bookmarks" ON bookmarks;

-- 4. 새로운 사용자별 데이터 격리 RLS 정책
-- documents: 사용자는 자신의 문서만 접근 가능
CREATE POLICY "Users own documents" ON documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- labels: 사용자는 자신의 라벨만 접근 가능
CREATE POLICY "Users own labels" ON labels
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- bookmarks: 사용자는 자신의 북마크만 접근 가능
CREATE POLICY "Users own bookmarks" ON bookmarks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. 전역 라벨 검색을 위한 복합 인덱스 (텍스트 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_labels_text_search ON labels USING gin(to_tsvector('simple', text));

-- 6. Storage 정책 업데이트 (사용자별 폴더 접근)
-- Supabase 대시보드 > Storage > Policies에서 설정 필요
-- 버킷: pdfs
-- 정책 예시:
--   SELECT: (bucket_id = 'pdfs') AND (auth.uid()::text = (storage.foldername(name))[1])
--   INSERT: (bucket_id = 'pdfs') AND (auth.uid()::text = (storage.foldername(name))[1])
--   DELETE: (bucket_id = 'pdfs') AND (auth.uid()::text = (storage.foldername(name))[1])
