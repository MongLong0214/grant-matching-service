-- 지원금 테이블
CREATE TABLE IF NOT EXISTS supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  category TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  detail_url TEXT NOT NULL,
  target_regions TEXT[],
  target_business_types TEXT[],
  target_employee_min INTEGER,
  target_employee_max INTEGER,
  target_revenue_min BIGINT,
  target_revenue_max BIGINT,
  target_business_age_min INTEGER,
  target_business_age_max INTEGER,
  amount TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 진단 테이블
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type TEXT NOT NULL,
  region TEXT NOT NULL,
  employee_count INTEGER NOT NULL,
  annual_revenue BIGINT NOT NULL,
  business_start_date DATE NOT NULL,
  email TEXT,
  matched_support_ids UUID[],
  matched_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_supports_is_active ON supports(is_active);
CREATE INDEX IF NOT EXISTS idx_supports_end_date ON supports(end_date);
CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON diagnoses(created_at);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS supports_updated_at ON supports;
CREATE TRIGGER supports_updated_at
  BEFORE UPDATE ON supports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 샘플 지원금 데이터 (30개)
-- 지역명: 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
-- 업종명: 음식점업, 소매업, 도매업, 제조업, 건설업, 운수업, 숙박업, 정보통신업, 전문서비스업, 교육서비스업, 보건업, 예술/스포츠, 기타서비스업
-- 업력(target_business_age_min/max): 개월 단위
INSERT INTO supports (title, organization, category, start_date, end_date, detail_url, target_regions, target_business_types, target_employee_min, target_employee_max, target_revenue_min, target_revenue_max, target_business_age_min, target_business_age_max, amount) VALUES
-- 금융 (5개)
('소상공인 정책자금 융자', '소상공인시장진흥공단', '금융', '2025-01-01', '2025-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=10001', ARRAY['서울', '경기', '인천'], ARRAY['음식점업', '소매업', '기타서비스업'], NULL, 10, NULL, 5000000000, NULL, NULL, '최대 7천만원, 이자 2.0% 지원'),
('청년창업자 특례보증', '중소기업진흥공단', '금융', '2025-01-01', '2025-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=10002', NULL, NULL, NULL, 50, NULL, NULL, NULL, 36, '최대 1억원 보증, 보증료 0.5% 감면'),
('중소기업 성장지원 융자', '중소벤처기업부', '금융', '2025-01-01', NULL, 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=10003', NULL, ARRAY['제조업', '정보통신업'], 5, 300, NULL, 100000000000, NULL, NULL, '최대 30억원, 이자 1.5% 지원'),
('소상공인 희망대출', '신용보증재단중앙회', '금융', '2025-03-01', '2025-11-30', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=10004', NULL, ARRAY['음식점업', '소매업', '숙박업'], NULL, 5, NULL, 3000000000, 1, 120, '최대 2천만원, 이자 3.0%'),
('기술보증기금 스타트업 특별보증', '기술보증기금', '금융', '2025-01-01', '2025-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=10005', NULL, NULL, NULL, 30, NULL, 30000000000, NULL, 60, '최대 5억원, 보증료 0.3% 감면'),

-- 기술 (3개)
('중소기업 R&D 지원사업', '중소벤처기업부', '기술', '2025-01-01', '2026-06-30', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=20001', NULL, ARRAY['제조업', '정보통신업'], 10, NULL, NULL, NULL, 36, NULL, '최대 3억원, 개발비 80% 지원'),
('AI·빅데이터 기술개발 지원', '한국산업기술진흥원', '기술', '2025-02-01', '2026-08-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=20002', ARRAY['서울', '경기', '대전'], ARRAY['정보통신업'], 5, 100, NULL, NULL, NULL, NULL, '최대 5억원, 연구개발비 75% 지원'),
('스마트공장 구축 지원', '중소벤처기업부', '기술', '2025-01-01', NULL, 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=20003', NULL, ARRAY['제조업'], 20, NULL, 10000000000, NULL, 60, NULL, '최대 1억원, 구축비 50% 지원'),

-- 인력 (4개)
('청년 일자리 도약 장려금', '고용노동부', '인력', '2025-01-01', '2026-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=30001', NULL, NULL, NULL, 30, NULL, NULL, NULL, NULL, '청년 1인당 월 80만원, 최대 12개월'),
('중소기업 청년 인턴십', '중소벤처기업부', '인력', '2025-01-01', '2026-10-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=30002', NULL, NULL, 5, 300, NULL, 50000000000, NULL, NULL, '인턴 1인당 월 100만원, 3개월'),
('고용창출장려금', '고용노동부', '인력', '2025-01-01', NULL, 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=30003', ARRAY['부산', '대구', '광주', '울산'], NULL, NULL, 50, NULL, 20000000000, NULL, NULL, '신규 고용 1인당 월 60만원, 최대 12개월'),
('일학습병행 지원금', '한국산업인력공단', '인력', '2025-01-01', '2026-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=30004', NULL, ARRAY['제조업'], 10, NULL, NULL, NULL, NULL, NULL, '훈련생 1인당 월 40만원, 훈련비 100% 지원'),

-- 창업 (5개)
('예비창업패키지', '중소벤처기업부', '창업', '2025-01-01', '2026-03-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=40001', NULL, NULL, NULL, 5, NULL, NULL, NULL, 12, '최대 1억원, 창업비용 100% 지원'),
('청년창업사관학교', '중소벤처기업부', '창업', '2025-02-01', '2026-04-30', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=40002', NULL, NULL, NULL, 3, NULL, NULL, NULL, 24, '최대 1억원, 사업화 자금 지원'),
('서울시 청년창업지원', '서울시', '창업', '2025-01-01', '2026-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=40003', ARRAY['서울'], NULL, NULL, 10, NULL, 3000000000, NULL, 36, '최대 5천만원, 임차료·인건비 지원'),
('소상공인 재창업 지원', '소상공인시장진흥공단', '창업', '2025-01-01', NULL, 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=40004', NULL, ARRAY['음식점업', '소매업', '기타서비스업'], NULL, 5, NULL, 2000000000, NULL, NULL, '최대 3천만원, 창업비용 70% 지원'),
('경기도 청년창업 1000+ 프로젝트', '경기도', '창업', '2025-03-01', '2026-09-30', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=40005', ARRAY['경기'], NULL, NULL, 5, NULL, NULL, NULL, 24, '최대 2천만원, 사무공간·멘토링 제공'),

-- 경영 (8개)
('소상공인 온라인 판로개척 지원', '소상공인시장진흥공단', '경영', '2025-01-01', '2026-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=50001', NULL, ARRAY['소매업', '음식점업'], NULL, 10, NULL, 3000000000, NULL, NULL, '최대 500만원, 온라인 판로개척 지원'),
('중소기업 해외마케팅 지원', '중소벤처기업부', '경영', '2025-01-01', NULL, 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=50002', NULL, ARRAY['제조업', '정보통신업'], 10, NULL, 5000000000, NULL, 36, NULL, '최대 2억원, 수출 마케팅비 50% 지원'),
('소상공인 경영개선 컨설팅', '소상공인시장진흥공단', '경영', '2025-01-01', '2026-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=50003', NULL, NULL, NULL, 10, NULL, 5000000000, 12, NULL, '무료 컨설팅 제공, 최대 20시간'),
('중소기업 디지털 전환 지원', '중소기업진흥공단', '경영', '2025-02-01', '2026-11-30', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=50004', NULL, NULL, 5, 100, NULL, 50000000000, NULL, NULL, '최대 5천만원, 디지털화 비용 70% 지원'),
('소상공인 배달앱 수수료 지원', '서울시', '경영', '2025-01-01', '2026-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=50005', ARRAY['서울'], ARRAY['음식점업'], NULL, 5, NULL, 2000000000, NULL, NULL, '배달앱 수수료 50% 환급, 월 최대 100만원'),
('중소기업 특허출원 지원', '특허청', '경영', '2025-01-01', NULL, 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=50006', NULL, ARRAY['제조업', '정보통신업'], NULL, 50, NULL, 30000000000, NULL, NULL, '특허출원료 100% 지원, 최대 10건'),
('소상공인 에너지 효율화 지원', '한국에너지공단', '경영', '2025-03-01', '2026-10-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=50007', NULL, ARRAY['음식점업', '제조업', '숙박업'], NULL, 20, NULL, 10000000000, 36, NULL, '최대 1천만원, 설비교체 비용 80% 지원'),
('중소기업 수출바우처', '중소벤처기업부', '경영', '2025-01-01', '2026-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=50008', NULL, ARRAY['제조업'], 5, NULL, NULL, NULL, NULL, NULL, '최대 2천만원, 수출활동 지원'),

-- 기타 (5개)
('재난피해 소상공인 특별지원', '소상공인시장진흥공단', '기타', '2025-01-01', '2026-06-30', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=60001', NULL, ARRAY['음식점업', '소매업', '숙박업'], NULL, 10, NULL, 3000000000, NULL, NULL, '최대 2천만원, 피해복구 지원'),
('착한임대인 세액공제', '국세청', '기타', '2025-01-01', NULL, 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=60002', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '임대료 인하액의 70% 세액공제'),
('소상공인 전기요금 특별지원', '중소벤처기업부', '기타', '2025-01-01', '2026-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=60003', NULL, ARRAY['음식점업', '소매업', '제조업'], NULL, 10, NULL, 5000000000, NULL, NULL, '전기요금 20% 감면, 월 최대 50만원'),
('중소기업 사회보험료 지원', '고용노동부', '기타', '2025-01-01', NULL, 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=60004', NULL, NULL, NULL, 30, NULL, 10000000000, NULL, NULL, '사회보험료 50% 지원, 최대 12개월'),
('부산시 소상공인 재난지원금', '부산광역시', '기타', '2025-01-01', '2026-12-31', 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?seq=60005', ARRAY['부산'], ARRAY['음식점업', '소매업', '기타서비스업'], NULL, 5, NULL, 2000000000, NULL, NULL, '업체당 200만원 일시 지급');
