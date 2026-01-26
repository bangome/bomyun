-- PDF 뷰어 Supabase 데이터베이스 스키마
-- Supabase SQL Editor에서 이 스크립트를 실행하세요

-- documents 테이블
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  page_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- labels 테이블
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labels_document_id ON labels(document_id);
CREATE INDEX IF NOT EXISTS idx_labels_page_number ON labels(document_id, page_number);

-- bookmarks 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  title TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_document_id ON bookmarks(document_id);

-- RLS (Row Level Security) 정책
-- 현재는 모든 사용자가 접근 가능하도록 설정 (개발용)
-- 프로덕션에서는 사용자 인증 후 적절한 정책 설정 필요

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기/쓰기 권한 부여 (개발용)
CREATE POLICY "Allow all for documents" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for labels" ON labels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for bookmarks" ON bookmarks FOR ALL USING (true) WITH CHECK (true);

-- Storage 버킷 생성 (Supabase 대시보드 > Storage에서 수동으로 생성해야 함)
-- 버킷 이름: pdfs
-- Public 접근 허용
