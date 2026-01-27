-- 페이지 이름 테이블 생성
CREATE TABLE IF NOT EXISTS page_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  complex_id UUID REFERENCES complexes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, page_number)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_page_names_document_id ON page_names(document_id);
CREATE INDEX IF NOT EXISTS idx_page_names_user_id ON page_names(user_id);
CREATE INDEX IF NOT EXISTS idx_page_names_complex_id ON page_names(complex_id);

-- RLS 활성화
ALTER TABLE page_names ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 같은 단지 사용자만 접근 가능
CREATE POLICY "Users can view page_names in their complex"
  ON page_names FOR SELECT
  USING (complex_id IN (
    SELECT complex_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert page_names in their complex"
  ON page_names FOR INSERT
  WITH CHECK (complex_id IN (
    SELECT complex_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update page_names in their complex"
  ON page_names FOR UPDATE
  USING (complex_id IN (
    SELECT complex_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete page_names in their complex"
  ON page_names FOR DELETE
  USING (complex_id IN (
    SELECT complex_id FROM user_profiles WHERE id = auth.uid()
  ));
