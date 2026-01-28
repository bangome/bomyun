-- 관리자용 RLS 정책 추가
-- 관리자 이메일 확인 함수
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email = 'jinhwa@aegisep.com'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- user_profiles: 관리자는 모든 사용자 프로필 조회 가능
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
CREATE POLICY "Super admins can view all profiles" ON user_profiles
  FOR SELECT USING (is_super_admin());

-- complexes: 관리자는 모든 단지 조회 가능
DROP POLICY IF EXISTS "Super admins can view all complexes" ON complexes;
CREATE POLICY "Super admins can view all complexes" ON complexes
  FOR SELECT USING (is_super_admin());

-- documents: 관리자는 모든 문서 조회 가능
DROP POLICY IF EXISTS "Super admins can view all documents" ON documents;
CREATE POLICY "Super admins can view all documents" ON documents
  FOR SELECT USING (is_super_admin());

-- labels: 관리자는 모든 라벨 조회 가능
DROP POLICY IF EXISTS "Super admins can view all labels" ON labels;
CREATE POLICY "Super admins can view all labels" ON labels
  FOR SELECT USING (is_super_admin());

-- folders: 관리자는 모든 폴더 조회 가능
DROP POLICY IF EXISTS "Super admins can view all folders" ON folders;
CREATE POLICY "Super admins can view all folders" ON folders
  FOR SELECT USING (is_super_admin());

-- page_names: 관리자는 모든 페이지 이름 조회 가능
DROP POLICY IF EXISTS "Super admins can view all page_names" ON page_names;
CREATE POLICY "Super admins can view all page_names" ON page_names
  FOR SELECT USING (is_super_admin());

-- 관리자용: 사용자 프로필과 이메일을 함께 반환하는 함수
CREATE OR REPLACE FUNCTION get_user_profiles_with_email()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  complex_id UUID,
  complex_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- 관리자만 호출 가능
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.display_name,
    au.email,
    up.complex_id,
    c.name as complex_name,
    up.role,
    up.created_at
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.id
  LEFT JOIN complexes c ON c.id = up.complex_id
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
