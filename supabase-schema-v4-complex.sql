-- =============================================
-- 단지(Complex) 기반 멀티테넌트 스키마
-- =============================================

-- 1. 단지 테이블 생성
CREATE TABLE IF NOT EXISTS complexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 프로필 테이블 (단지 연결)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  complex_id UUID REFERENCES complexes(id) ON DELETE SET NULL,
  display_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 기존 테이블에 complex_id 추가
ALTER TABLE documents ADD COLUMN IF NOT EXISTS complex_id UUID REFERENCES complexes(id) ON DELETE CASCADE;
ALTER TABLE labels ADD COLUMN IF NOT EXISTS complex_id UUID REFERENCES complexes(id) ON DELETE CASCADE;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS complex_id UUID REFERENCES complexes(id) ON DELETE CASCADE;

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_documents_complex_id ON documents(complex_id);
CREATE INDEX IF NOT EXISTS idx_labels_complex_id ON labels(complex_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_complex_id ON bookmarks(complex_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_complex_id ON user_profiles(complex_id);
CREATE INDEX IF NOT EXISTS idx_complexes_invite_code ON complexes(invite_code);

-- 5. RLS 활성화
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users own documents" ON documents;
DROP POLICY IF EXISTS "Users own labels" ON labels;
DROP POLICY IF EXISTS "Users own bookmarks" ON bookmarks;

-- 7. 단지 기반 RLS 정책 생성

-- complexes: 누구나 생성 가능, 본인이 속한 단지만 조회 가능
CREATE POLICY "Anyone can create complex" ON complexes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their complex" ON complexes
  FOR SELECT USING (
    id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  );

-- user_profiles: 본인 프로필 또는 같은 단지 멤버 조회 가능
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view same complex members" ON user_profiles
  FOR SELECT USING (
    complex_id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- documents: 같은 단지 문서 접근
CREATE POLICY "Complex members can access documents" ON documents
  FOR ALL USING (
    complex_id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    complex_id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  );

-- labels: 같은 단지 라벨 접근
CREATE POLICY "Complex members can access labels" ON labels
  FOR ALL USING (
    complex_id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    complex_id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  );

-- bookmarks: 같은 단지 북마크 접근
CREATE POLICY "Complex members can access bookmarks" ON bookmarks
  FOR ALL USING (
    complex_id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    complex_id IN (SELECT complex_id FROM user_profiles WHERE id = auth.uid())
  );

-- 8. 초대 코드로 단지 조회 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION get_complex_by_invite_code(code VARCHAR)
RETURNS TABLE (id UUID, name VARCHAR)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name
  FROM complexes c
  WHERE c.invite_code = code;
END;
$$ LANGUAGE plpgsql;

-- 9. 사용자 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 10. Storage 정책 업데이트 (단지 기반)
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- 단지 기반 Storage 정책
-- 업로드: 본인이 속한 단지 폴더에만 업로드 가능
CREATE POLICY "Complex members can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pdfs' AND
    (storage.foldername(name))[1] IN (
      SELECT complex_id::text FROM user_profiles WHERE id = auth.uid()
    )
  );

-- 읽기: 본인이 속한 단지 폴더만 읽기 가능
CREATE POLICY "Complex members can read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pdfs' AND
    (storage.foldername(name))[1] IN (
      SELECT complex_id::text FROM user_profiles WHERE id = auth.uid()
    )
  );

-- 삭제: 본인이 속한 단지 폴더만 삭제 가능
CREATE POLICY "Complex members can delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pdfs' AND
    (storage.foldername(name))[1] IN (
      SELECT complex_id::text FROM user_profiles WHERE id = auth.uid()
    )
  );
