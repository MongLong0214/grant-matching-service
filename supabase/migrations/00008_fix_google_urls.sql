-- Google 검색 URL을 실제 정부 지원사업 페이지 URL로 교체
-- 기존 seed 데이터가 google.com/search?q=... 형태로 삽입된 레코드를 수정

-- 금융 (5개)
UPDATE supports SET detail_url = 'https://www.semas.or.kr/web/SUP/supportFund.kmdc'
WHERE title = '소상공인 정책자금 융자' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.kibo.or.kr/src/main.do'
WHERE title = '청년창업자 특례보증' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.kosmes.or.kr/sbc/SH/SBI/SHSBI004M0.do'
WHERE title = '중소기업 성장지원 융자' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.semas.or.kr/web/SUP/supportFund.kmdc'
WHERE title = '소상공인 희망대출' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.kibo.or.kr/src/main.do'
WHERE title = '기술보증기금 스타트업 특별보증' AND detail_url LIKE '%google.com/search%';

-- 기술 (3개)
UPDATE supports SET detail_url = 'https://www.smtech.go.kr'
WHERE title = '중소기업 R&D 지원사업' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.iitp.kr'
WHERE title = 'AI·빅데이터 기술개발 지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.smart-factory.kr'
WHERE title = '스마트공장 구축 지원' AND detail_url LIKE '%google.com/search%';

-- 인력 (4개)
UPDATE supports SET detail_url = 'https://www.ei.go.kr'
WHERE title = '청년 일자리 도약 장려금' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.work.go.kr'
WHERE title = '중소기업 청년 인턴십' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.ei.go.kr/ei/eih/eg/pb/pbPersonBnef/retrievePb0203Info.do'
WHERE title = '고용창출장려금' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.bizhrd.net'
WHERE title = '일학습병행 지원금' AND detail_url LIKE '%google.com/search%';

-- 창업 (5개)
UPDATE supports SET detail_url = 'https://www.k-startup.go.kr'
WHERE title = '예비창업패키지' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://start.kosmes.or.kr'
WHERE title = '청년창업사관학교' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.seoul.go.kr/main/index.jsp'
WHERE title = '서울시 청년창업지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.semas.or.kr'
WHERE title = '소상공인 재창업 지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.gyeonggi.go.kr'
WHERE title = '경기도 청년창업 1000+ 프로젝트' AND detail_url LIKE '%google.com/search%';

-- 경영 (8개)
UPDATE supports SET detail_url = 'https://www.semas.or.kr/web/SUP/supportOnlineBiz.kmdc'
WHERE title = '소상공인 온라인 판로개척 지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.kotra.or.kr'
WHERE title = '중소기업 해외마케팅 지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.semas.or.kr'
WHERE title = '소상공인 경영개선 컨설팅' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.kosmes.or.kr'
WHERE title = '중소기업 디지털 전환 지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.mss.go.kr'
WHERE title = '소상공인 배달앱 수수료 지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.kipa.org'
WHERE title = '중소기업 특허출원 지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.semas.or.kr'
WHERE title = '소상공인 에너지 효율화 지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.exportvoucher.com'
WHERE title = '중소기업 수출바우처' AND detail_url LIKE '%google.com/search%';

-- 기타 (5개)
UPDATE supports SET detail_url = 'https://www.mss.go.kr'
WHERE title = '재난피해 소상공인 특별지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.nts.go.kr'
WHERE title = '착한임대인 세액공제' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.mss.go.kr/site/smba/ex/bbs/View.do'
WHERE title = '소상공인 전기요금 특별지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.work.go.kr'
WHERE title = '중소기업 사회보험료 지원' AND detail_url LIKE '%google.com/search%';

UPDATE supports SET detail_url = 'https://www.busan.go.kr'
WHERE title = '부산시 소상공인 재난지원금' AND detail_url LIKE '%google.com/search%';
