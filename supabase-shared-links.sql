-- 공유 링크 테이블 생성
CREATE TABLE IF NOT EXISTS shared_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  short_code VARCHAR(8) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  view_count INTEGER DEFAULT 0
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_shared_links_short_code ON shared_links(short_code);
CREATE INDEX IF NOT EXISTS idx_shared_links_document_id ON shared_links(document_id);

-- RLS 활성화
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 자신이 생성한 공유 링크 관리 가능
CREATE POLICY "Users can manage own shared links" ON shared_links
  FOR ALL USING (auth.uid() = created_by);

-- 모든 사용자(비인증 포함)는 short_code로 조회 가능
CREATE POLICY "Anyone can view shared links by short_code" ON shared_links
  FOR SELECT USING (true);

-- 공유된 문서는 누구나 조회 가능하도록 documents 테이블에 정책 추가
-- (기존 정책이 있으면 추가로 생성)
CREATE POLICY "Shared documents are viewable" ON documents
  FOR SELECT USING (
    id IN (SELECT document_id FROM shared_links WHERE expires_at IS NULL OR expires_at > NOW())
  );

-- 공유된 문서의 라벨도 조회 가능
CREATE POLICY "Labels of shared documents are viewable" ON labels
  FOR SELECT USING (
    document_id IN (SELECT document_id FROM shared_links WHERE expires_at IS NULL OR expires_at > NOW())
  );

-- 공유된 문서의 페이지 이름도 조회 가능
CREATE POLICY "Page names of shared documents are viewable" ON page_names
  FOR SELECT USING (
    document_id IN (SELECT document_id FROM shared_links WHERE expires_at IS NULL OR expires_at > NOW())
  );
