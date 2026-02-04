# COMPREHENSIVE LIST: Korean Government Support Program APIs

**Last Updated:** 2026-02-04
**Source:** data.go.kr (Korea Public Data Portal)

---

## TABLE OF CONTENTS

1. [Government Subsidies & General Support](#1-government-subsidies--general-support)
2. [SME & Small Business Support](#2-sme--small-business-support)
3. [Startup Support](#3-startup-support)
4. [Welfare Services](#4-welfare-services)
5. [Employment Support](#5-employment-support)
6. [R&D & Technology Support](#6-rd--technology-support)
7. [Export & Trade Support](#7-export--trade-support)
8. [Agriculture & Fisheries Support](#8-agriculture--fisheries-support)
9. [Youth Support](#9-youth-support)
10. [Women & Disability Support](#10-women--disability-support)
11. [Financial Support (Loans & Credit)](#11-financial-support-loans--credit)
12. [Vocational Training & Education](#12-vocational-training--education)
13. [Patent & IP Support](#13-patent--ip-support)
14. [Regional Development](#14-regional-development)
15. [Social Economy & Cooperatives](#15-social-economy--cooperatives)
16. [Cultural Arts & Content](#16-cultural-arts--content)
17. [Tourism & Service Industry](#17-tourism--service-industry)
18. [Carbon Neutrality & Energy](#18-carbon-neutrality--energy)
19. [Disaster & Emergency Support](#19-disaster--emergency-support)
20. [Public Procurement](#20-public-procurement)
21. [Childcare & Family Support](#21-childcare--family-support)
22. [Healthcare & Elderly Support](#22-healthcare--elderly-support)
23. [Certification & Quality Standards](#23-certification--quality-standards)
24. [Job Matching & Recruitment](#24-job-matching--recruitment)
25. [Facility Rental & Space Support](#25-facility-rental--space-support)
26. [Policy Funding & Investment](#26-policy-funding--investment)
27. [Industrial Complex Support](#27-industrial-complex-support)
28. [Forestry Support](#28-forestry-support)
29. [Tax & Business Registration](#29-tax--business-registration)
30. [Government Service Portals](#30-government-service-portals)

---

## 1. GOVERNMENT SUBSIDIES & GENERAL SUPPORT

### 1.1 기획재정부_국고보조금 정보
- **Provider:** 기획재정부 (Ministry of Economy and Finance)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15097584/openapi.do
- **API Endpoint:** http://apis.data.go.kr/1051000/MoefOpenAPI/T_OPD_PRMSCT_SBBGST
- **Description:** National subsidy information
- **Key Fields:** Subsidy type, amount, recipient information

### 1.2 행정안전부_대한민국 공공서비스 정보 (보조금24)
- **Provider:** 행정안전부 (Ministry of Interior and Safety)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15113968/openapi.do
- **Description:** Public service information from Subsidy24 portal
- **Key Fields:** Benefit programs from ministries, local governments, public institutions
- **Eligibility Criteria:** Yes

### 1.3 행정안전부_통계연보_보조금24
- **Provider:** 행정안전부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15107424/openapi.do
- **Description:** Statistics on Subsidy24 usage including online/visit usage ratios

### 1.4 농림축산식품부_사업보조금지급정보
- **Provider:** 농림축산식품부 (Ministry of Agriculture, Food and Rural Affairs)
- **Type:** File Data (Auto-convertible to API)
- **URL:** https://www.data.go.kr/data/15148406/fileData.do
- **Last Updated:** 2025-07-31
- **Description:** Agricultural project subsidy payment information
- **Key Fields:** Application number, project year, local government project name, national/local subsidies, loans, self-funding

### 1.5 기획재정부_분야·부문별 국고보조금 예산현황 정보
- **Provider:** 기획재정부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15042012/fileData.do
- **Last Updated:** 2021-01-15
- **Description:** National subsidy budget status by sector and division

---

## 2. SME & SMALL BUSINESS SUPPORT

### 2.1 중소벤처기업부_중소기업지원사업목록
- **Provider:** 중소벤처기업부 (Ministry of SMEs and Startups)
- **Type:** File Data (Auto-convertible to REST API JSON/XML)
- **URL:** https://www.data.go.kr/data/3034791/fileData.do
- **Last Updated:** 2025-03-31
- **Data Source:** bizinfo.go.kr (기업마당)
- **Records:** Comprehensive SME support programs
- **Key Fields:**
  - Sector (분야): Finance, Technology, Manpower, Export, Domestic Sales, Startup, Management, Others (8 sectors)
  - Business name (사업명)
  - Application start/end dates (신청시작일자, 신청종료일자)
  - Supervising agency (소관기관)
  - Implementing agency (수행기관)
  - Receiving agency (접수기관)
  - Registration date (등록일자)
  - Detail URL (상세URL)
- **Eligibility Criteria:** Varies by program
- **Notes:** Data from bizinfo.go.kr portal

### 2.2 중소기업기술정보진흥원_중소벤처24 공고정보
- **Provider:** 중소기업기술정보진흥원 (TIPA)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15113191/openapi.do
- **Description:** SME Venture24 announcement information
- **Key Fields:** Announcement name, period, support agency, application status, attachments
- **Eligibility Criteria:** Varies by announcement

### 2.3 중소벤처기업부_사업공고
- **Provider:** 중소벤처기업부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15113297/openapi.do
- **Description:** Business announcements from Ministry of SMEs
- **Key Fields:** Title, author, attachments

### 2.4 소상공인시장진흥공단_상가(상권)정보
- **Provider:** 소상공인시장진흥공단 (Small Enterprise and Market Service)
- **Type:** File Data + REST API
- **URL (File):** https://www.data.go.kr/data/15083033/fileData.do
- **URL (API):** https://www.data.go.kr/data/15012005/openapi.do
- **Last Updated:** 2025-10-30
- **Description:** Store and commercial area information nationwide
- **Key Fields:** Store name, industry code, address, longitude/latitude
- **Records:** All operating stores nationwide

### 2.5 중소벤처기업부_비즈니스지원단_기업애로상담
- **Provider:** 중소벤처기업부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15070472/fileData.do
- **Last Updated:** 2025-01-06
- **Description:** Business consulting for SME difficulties
- **Support Areas:** 12 areas including startup, legal, finance, HR/labor, accounting/tax, management strategy, technology, IT, production management, marketing/design, import/export, patents
- **Key Fields:** Question, answer, consulting area, date

### 2.6 중소벤처기업부_기업마당 정책뉴스
- **Provider:** 중소벤처기업부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15122782/fileData.do
- **Last Updated:** 2025-03-31
- **Data Source:** bizinfo.go.kr
- **Description:** Policy news for SMEs
- **Key Fields:** Support programs, events, policy news, legislation notices

### 2.7 중소벤처기업진흥공단_중소기업 혁신바우처사업 업력별 수행기관 신청 및 선정현황
- **Provider:** 중소벤처기업진흥공단 (SBC)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15124832/fileData.do
- **Last Updated:** 2025-09-10
- **Description:** SME innovation voucher program status by business age

### 2.8 중소벤처기업부_벤처기업확인서
- **Provider:** 중소벤처기업부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15106235/openapi.do
- **Description:** Venture company verification certificate information

### 2.9 중소벤처기업부_벤처기업명단
- **Provider:** 중소벤처기업부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15084581/fileData.do
- **Last Updated:** 2025-02-28
- **Description:** List of registered venture companies

### 2.10 중소벤처기업부_중소기업기술개발과제정보
- **Provider:** 중소벤처기업부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/3044610/fileData.do
- **Last Updated:** 2025-07-16
- **Description:** SME technology development project information

### 2.11 중소벤처기업진흥공단_온라인수출플랫폼 지역별 지원현황
- **Provider:** 중소벤처기업진흥공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15095250/fileData.do
- **Last Updated:** 2025-08-26
- **Description:** Online export platform regional support status

### 2.12 중소기업기술정보진흥원_스마트서비스 사업 공고현황
- **Provider:** 중소기업기술정보진흥원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15135674/fileData.do
- **Last Updated:** 2025-07-31
- **Description:** Smart service business announcement status

### 2.13 신용보증기금_경영컨설팅현황
- **Provider:** 신용보증기금 (Korea Credit Guarantee Fund)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15044156/fileData.do
- **Last Updated:** 2021-12-31
- **Description:** Management consulting status covering business strategy, HR, etc.

### 2.14 신용보증기금_경영지원_경영컨설팅 정책지원 정보
- **Provider:** 신용보증기금
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15120912/fileData.do
- **Last Updated:** 2023-08-28
- **Description:** Management consulting policy support information
- **Key Fields:** Project name, support details, application methods

---

## 3. STARTUP SUPPORT

### 3.1 창업진흥원_K-Startup(사업소개,사업공고,콘텐츠 등)_조회서비스
- **Provider:** 창업진흥원 (KISED - Korea Institute of Startup & Entrepreneurship Development)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15125364/openapi.do
- **Data Source:** k-startup.go.kr
- **Description:** K-Startup support program information
- **Key Fields:**
  - Business name (사업명)
  - Business type (사업구분)
  - Business overview (사업개요)
  - Support targets (지원대상)
  - Recruitment period (모집기간)
  - Application method (신청방법)
  - Contact information (문의처)
- **Eligibility Criteria:** Varies by program (prospective entrepreneurs, startups)

### 3.2 창업진흥원_창업도약패키지 지원사업 특화프로그램 운영정보
- **Provider:** 창업진흥원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15037532/fileData.do
- **Last Updated:** 2025-05-14
- **Description:** Startup leap package specialized program operation information

### 3.3 대구광역시_창업지원 현황
- **Provider:** 대구광역시 (Daegu Metropolitan City)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15130750/fileData.do
- **Last Updated:** 2025-07-25
- **Description:** Startup support status in Daegu

### 3.4 중소벤처기업부_K STARTUP 창업소식
- **Provider:** 중소벤처기업부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15122759/fileData.do
- **Last Updated:** 2025-03-24
- **Description:** K-Startup news and announcements

### 3.5 창업진흥원_창업공간플랫폼(창업공간)_조회서비스
- **Provider:** 창업진흥원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15125365/openapi.do
- **API Endpoint:** http://apis.data.go.kr/B552735/kisedSlpService
- **Description:** Startup space platform - government-supported startup spaces nationwide
- **Key Fields:** Office rentals, meeting room reservations, location, facilities
- **Eligibility Criteria:** Startups, entrepreneurs

### 3.6 창업진흥원_창업에듀(창업교육과정)_조회서비스
- **Provider:** 창업진흥원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15125358/openapi.do
- **Description:** Startup education course information

---

## 4. WELFARE SERVICES

### 4.1 한국사회보장정보원_복지서비스정보
- **Provider:** 한국사회보장정보원 (Korea Social Security Information Service)
- **Type:** File Data (Auto-convertible to REST API)
- **URL:** https://www.data.go.kr/data/15083323/fileData.do
- **Last Updated:** 2025-07-22
- **Data Source:** bokjiro.go.kr (복지로)
- **Description:** Central government welfare service information
- **Key Fields:**
  - Service ID (서비스ID)
  - Service name (서비스명)
  - Service URL (서비스URL)
  - Summary (요약)
  - Site (사이트)
  - Main contact (대표연락처)
  - Supervising ministry name (소관부처명)
  - Supervising organization name (소관기관명)
  - Reference year (기준년도)
  - Last modified date (최종수정일)
- **Eligibility Criteria:** Varies by service

### 4.2 한국사회보장정보원_중앙부처복지서비스
- **Provider:** 한국사회보장정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15090532/openapi.do
- **API Endpoint:** http://apis.data.go.kr/B554287/NationalWelfareInformations/NationalWelfarelist
- **Description:** Central government welfare services for all citizens
- **Operations:** Welfare service list lookup, detailed service lookup
- **Approval:** Auto-approval for development and operation stages
- **Eligibility Criteria:** Yes, searchable by eligibility

### 4.3 한국사회보장정보원_지자체복지서비스
- **Provider:** 한국사회보장정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15108347/openapi.do
- **API Endpoint:** http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations
- **Description:** Local government welfare services
- **Eligibility Criteria:** Yes

### 4.4 한국사회보장정보원_민간복지서비스정보
- **Provider:** 한국사회보장정보원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15116392/fileData.do
- **Last Updated:** 2023-10-26
- **Description:** Private welfare service information

### 4.5 한국사회보장정보원_사회복지시설정보서비스 현황
- **Provider:** 한국사회보장정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15001848/openapi.do
- **Description:** Social welfare facility information service
- **Key Fields:** Facility list, basic facility information, events, recruitment, facility type codes, telecommunication charges

### 4.6 한국사회보장정보원_사회서비스 공통코드 조회
- **Provider:** 한국사회보장정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15059061/openapi.do
- **Description:** Common code information for social services (disabilities, mothers, children, etc.)

---

## 5. EMPLOYMENT SUPPORT

### 5.1 근로복지공단_고용/산재보험 현황정보
- **Provider:** 근로복지공단 (Korea Workers' Compensation & Welfare Service)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15059256/openapi.do
- **Description:** Employment and industrial accident insurance status
- **Key Fields:** Workplace name, address, number of workers, insurance premium information

### 5.2 고용노동부_고용노동통계연감
- **Provider:** 고용노동부 (Ministry of Employment and Labor)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15004889/fileData.do
- **Last Updated:** 2024-12-31
- **Description:** Employment and labor statistics yearbook
- **Key Fields:** Labor economics indicators, employment, wages, labor productivity, unemployment insurance, vocational training

### 5.3 고용노동부_지역산업맞춤형 일자리지원사업 접수처
- **Provider:** 고용노동부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15120704/fileData.do
- **Last Updated:** 2024-04-19
- **Description:** Regional industry-tailored job support program reception centers

### 5.4 고용노동부_대표홈페이지 고용노동 정책사업 이력
- **Provider:** 고용노동부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15133932/fileData.do
- **Last Updated:** 2025-08-21
- **Description:** Employment and labor policy program history

### 5.5 고용노동부_사회적기업 목록
- **Provider:** 고용노동부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15090110/fileData.do
- **Last Updated:** 2025-06-30
- **Description:** List of social enterprises

### 5.6 고용노동부_대체인력 채용지원 (인재채움뱅크)서비스
- **Provider:** 고용노동부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15125549/fileData.do
- **Last Updated:** 2024-12-01
- **Description:** Replacement manpower recruitment support service

---

## 6. R&D & TECHNOLOGY SUPPORT

### 6.1 한국과학기술정보연구원_국가R&D 과제검색 서비스(대국민용)
- **Provider:** 한국과학기술정보연구원 (KISTI)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15077315/openapi.do
- **Description:** National R&D project search service for public
- **Key Fields:** Project metadata, research information

### 6.2 과학기술정보통신부_사업공고
- **Provider:** 과학기술정보통신부 (Ministry of Science and ICT)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15074634/openapi.do
- **Description:** Program announcements for R&D projects, international cooperation, infrastructure development
- **Key Fields:** Announcement title, content, application period
- **Eligibility Criteria:** Varies by program

### 6.3 한국과학기술정보연구원_국가R&D 수행기관 R&D현황조회 서비스(대국민용)
- **Provider:** 한국과학기술정보연구원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15138962/openapi.do
- **Description:** National R&D performing institution status inquiry service

### 6.4 한국과학기술정보연구원_국가R&D 연구보고서 검색 서비스 (대국민용)
- **Provider:** 한국과학기술정보연구원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15102622/openapi.do
- **Description:** National R&D research report search service
- **Key Fields:** Research report metadata

### 6.5 한국산업기술기획평가원_산업기술 연구개발 과제현황
- **Provider:** 한국산업기술기획평가원 (KEIT)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15018033/fileData.do
- **Last Updated:** 2024-07-23
- **Description:** Industrial technology R&D project status (2015-2025)
- **Key Fields:** Project overview, budget, timeline

### 6.6 한국산업기술진흥원_산업기술통계
- **Provider:** 한국산업기술진흥원 (KIAT)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15088711/fileData.do
- **Last Updated:** 2025-09-30
- **Description:** Industrial technology statistics
- **Key Fields:** R&D investments, research personnel, technology trade, innovation processes

### 6.7 한국산업기술진흥원_기술은행 기술정보 DB 서비스
- **Provider:** 한국산업기술진흥원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15059384/openapi.do
- **Description:** Technology bank technology information database
- **Key Fields:** Technology demand number, name, overview, purchase conditions, transfer contract types

### 6.8 한국산업기술진흥원_기술시장정보 및 부가정보 DB 서비스
- **Provider:** 한국산업기술진흥원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15058947/openapi.do
- **Description:** Technology market information and additional information database
- **Key Fields:** Technology sales number, name, industrial/scientific classification, transaction info, project details

### 6.9 한국산업기술진흥원_국제공동 연구개발 국제기술협력지도
- **Provider:** 한국산업기술진흥원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/3072746/fileData.do
- **Last Updated:** 2021-04-06
- **Description:** International joint R&D and technology cooperation map

### 6.10 한국에너지기술평가원_지원과제정보
- **Provider:** 한국에너지기술평가원 (KETEP)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15106650/fileData.do
- **Last Updated:** 2022-12-31
- **Description:** Energy technology support project information

### 6.11 기술보증기금_공급기술수집현황
- **Provider:** 기술보증기금 (Korea Technology Finance Corporation)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15012862/fileData.do
- **Last Updated:** 2024-12-31
- **Description:** Supply technology collection status

### 6.12 특허청_과제상세정보서비스
- **Provider:** 특허청 (Korean Intellectual Property Office)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15058116/openapi.do
- **Description:** Government R&D patent project detailed information

### 6.13 중소기업기술정보진흥원_중소기업기술개발지원사업 연구개발계획서 작성방법 및 온라인신청 방법
- **Provider:** 중소기업기술정보진흥원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15066952/fileData.do
- **Last Updated:** 2023-01-01
- **Description:** SME technology development support program R&D plan writing and online application methods

---

## 7. EXPORT & TRADE SUPPORT

### 7.1 관세청_수출이행내역
- **Provider:** 관세청 (Korea Customs Service)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15126269/openapi.do
- **Description:** Export performance records
- **Key Fields:** Clearance dates, shipping dates

### 7.2 관세청_국가별 수출입실적(GW)
- **Provider:** 관세청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15101612/openapi.do
- **Last Updated:** 2026-01-02
- **Description:** Import/export performance by country

### 7.3 관세청_품목별 국가별 수출입실적(GW)
- **Provider:** 관세청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15100475/openapi.do
- **Description:** Import/export by item and country
- **Key Fields:** Trade statistics by country and HS Code

### 7.4 관세청_시군구별 수출입실적
- **Provider:** 관세청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15134344/openapi.do
- **Description:** Import/export performance by city/county/district

### 7.5 대한무역투자진흥공사_기업성공사례
- **Provider:** 대한무역투자진흥공사 (KOTRA)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15034755/openapi.do
- **Description:** Business success cases of Korean companies entering overseas markets

### 7.6 대한무역투자진흥공사_국가정보
- **Provider:** 대한무역투자진흥공사
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15034830/openapi.do
- **Description:** Country information for trade and investment

### 7.7 산업통상자원부_무역정보서비스안내
- **Provider:** 산업통상자원부 (Ministry of Trade, Industry and Energy)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15001806/openapi.do
- **Description:** Trade information service guide

### 7.8 산업통상자원부_내국거래 실적정보서비스
- **Provider:** 산업통상자원부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15001811/openapi.do
- **Description:** Domestic trade performance information service

---

## 8. AGRICULTURE & FISHERIES SUPPORT

### 8.1 농림축산식품부_농림축산식품분야 보조금 현황
- **Provider:** 농림축산식품부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15101737/fileData.do
- **Last Updated:** 2024-01-01
- **Description:** Agriculture, forestry, and livestock subsidy status
- **Records:** 530 detailed projects
- **Key Fields:** Project budget, eligibility requirements

### 8.2 경기도 양주시_농업 보조금사업 현황
- **Provider:** 경기도 양주시
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15148545/fileData.do
- **Last Updated:** 2025-09-16
- **Description:** Agricultural subsidy program status in Yangju City

### 8.3 농촌진흥청_공공 데이터
- **Provider:** 농촌진흥청 (Rural Development Administration)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15087193/openapi.do
- **Description:** Agricultural portal public data

### 8.4 농촌진흥청_이달의 농업기술
- **Provider:** 농촌진흥청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15086337/openapi.do
- **Description:** Monthly agricultural technology information
- **Key Fields:** Crop management, smart farming, drone pest control

### 8.5 농촌진흥청_스마트팜 생산성 향상 모델 오픈 API 조회 서비스
- **Provider:** 농촌진흥청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15125691/openapi.do
- **Description:** Smart farm productivity model
- **Key Fields:** Optimal environment settings for tomatoes, strawberries, paprika

### 8.6 농촌진흥청_똑똑청년농부
- **Provider:** 농촌진흥청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15112316/openapi.do
- **Description:** Smart young farmers program
- **Key Fields:** Policies, education, projects for young farmers

### 8.7 농촌진흥청_스마트팜 우수농가 공개용 데이터
- **Provider:** 농촌진흥청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15042594/openapi.do
- **Description:** Smart farm excellence data
- **Key Fields:** Greenhouse environment, crop growth, production data

### 8.8 농촌진흥청_농약등록정보 검색서비스
- **Provider:** 농촌진흥청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15057994/openapi.do
- **Description:** Pesticide registration information search

### 8.9 농림축산식품부_농업재해대책업무편람 정보
- **Provider:** 농림축산식품부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15030110/fileData.do
- **Last Updated:** 2019-01-31
- **Description:** Agricultural disaster support manual information

### 8.10 해양수산부_연도별 총괄 어업생산통계
- **Provider:** 해양수산부 (Ministry of Oceans and Fisheries)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15043939/openapi.do
- **API Endpoint:** http://apis.data.go.kr/1192000/select0180List/getselect0180List
- **Description:** Annual fisheries production statistics
- **Key Fields:** Coastal, offshore, inland, distant water fishing data

### 8.11 해양수산부_해운항만물류정보_어획물품목코드
- **Provider:** 해양수산부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15132540/fileData.do
- **Last Updated:** 2025-07-31
- **Description:** Catch product code information
- **Key Fields:** HS code, catch product classification

### 8.12 해양수산과학기술진흥원_해양수산 과학기술 연구개발 RND 동향
- **Provider:** 해양수산과학기술진흥원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15037997/fileData.do
- **Last Updated:** 2019-09-02
- **Description:** Marine and fisheries science technology R&D trends

---

## 9. YOUTH SUPPORT

### 9.1 한국고용정보원_온통청년_청년정책API
- **Provider:** 한국고용정보원 (KEIS)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15143273/openapi.do
- **Description:** Youth policy information API
- **Key Fields:** Various youth policies collected through communication, surveys, public hearings, advisory groups
- **Eligibility Criteria:** Age-based criteria for youth programs

### 9.2 한국고용정보원_국민취업지원제도 정책정보
- **Provider:** 한국고용정보원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15118501/fileData.do
- **Last Updated:** 2023-08-11
- **Description:** National employment support system policy information
- **Key Fields:** Youth employment all-in-one support services

### 9.3 한국국제협력단_영프로페셔널(YP) 국내사업수행기관 목록
- **Provider:** 한국국제협력단 (KOICA)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15133614/fileData.do
- **Last Updated:** 2025-07-31
- **Description:** Young Professional (YP) domestic project implementation organization list

---

## 10. WOMEN & DISABILITY SUPPORT

### 10.1 보건복지부_장애인활동지원 통계 정보
- **Provider:** 보건복지부 (Ministry of Health and Welfare)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/3084474/fileData.do
- **Last Updated:** 2024-12-31
- **Description:** Disability activity support statistics (2022-2024)
- **Key Fields:** Regional disability activity support data

### 10.2 보건복지부_장애인 실태조사
- **Provider:** 보건복지부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15044550/fileData.do
- **Last Updated:** 2023-12-31
- **Description:** Disability survey (published every 3 years)

### 10.3 보건복지부_장애인 직업재활시설현황_시도별
- **Provider:** 보건복지부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15127923/fileData.do
- **Last Updated:** 2023-12-31
- **Description:** Disability vocational rehabilitation facilities by region

### 10.4 한국장애인고용공단_근로지원비용 지원 정보
- **Provider:** 한국장애인고용공단 (KEAD)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/3072377/fileData.do
- **Last Updated:** 2024-12-31
- **Description:** Work support cost assistance information

### 10.5 여성가족부 정책 자료 목록 조회 서비스
- **Provider:** 여성가족부 (Ministry of Gender Equality and Family)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15057520/openapi.do
- **Description:** Women and family ministry policy data

### 10.6 여성가족부_아이돌봄 서비스제공기관 정보 서비스
- **Provider:** 여성가족부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15078130/openapi.do
- **Description:** Childcare service provider information
- **Key Fields:** Regional names, institution names, contact numbers, addresses, coordinates

---

## 11. FINANCIAL SUPPORT (LOANS & CREDIT)

### 11.1 서민금융진흥원_대출상품한눈에 정보 서비스
- **Provider:** 서민금융진흥원 (Korea Inclusive Finance Agency)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15106208/openapi.do
- **Description:** Comprehensive loan product comparison information

### 11.2 금융위원회_서민금융상품기본정보
- **Provider:** 금융위원회 (Financial Services Commission)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15094787/openapi.do
- **Description:** Basic information on financial products for common people
- **Key Fields:** Loan products, asset formation products, social finance products, interest rates, loan limits, repayment methods

### 11.3 금융위원회_사회적금융지원정보
- **Provider:** 금융위원회
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15139269/openapi.do
- **Description:** Social finance support information
- **Key Fields:** Product names, interest rates, loan conditions, support targets by financial institution

### 11.4 신용보증기금_보증종류별 현황조회서비스 정보
- **Provider:** 신용보증기금
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15034319/openapi.do
- **Description:** Credit guarantee status by type
- **Key Fields:** Loan guarantees, payment guarantees, promissory note guarantees, tax guarantees, performance guarantees by year

### 11.5 서울특별시_은행별 대출금리(시중은행협력자금) 정보
- **Provider:** 서울특별시 (Seoul Metropolitan Government)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15093934/openapi.do
- **Description:** Bank loan interest rates (commercial bank cooperation funds)
- **Key Fields:** Minimum, maximum, average interest rates for loans over 3 months

### 11.6 중소벤처기업진흥공단_정책자금 자금종류별 융자 현황
- **Provider:** 중소벤처기업진흥공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15070036/fileData.do
- **Last Updated:** 2023-06-30
- **Description:** Policy funding loan status by fund type
- **Key Fields:** Loan status by detailed project

### 11.7 금융위원회_차입투자정보
- **Provider:** 금융위원회
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15059585/openapi.do
- **Description:** Borrowing and investment information
- **Key Fields:** NPL recovery, bankruptcy info, policy funding utilization, public fund utilization

---

## 12. VOCATIONAL TRAINING & EDUCATION

### 12.1 한국고용정보원_직업훈련_국민내일배움카드 훈련과정
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15109032/openapi.do
- **Description:** National Tomorrow Learning Card training courses
- **Key Fields:** Training course information for lifelong learning card program
- **Eligibility Criteria:** Card holders

### 12.2 한국고용정보원_직업훈련 기관 목록
- **Provider:** 한국고용정보원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15149261/fileData.do
- **Last Updated:** 2025-09-10
- **Description:** Vocational training institution list
- **Key Fields:** Institution names, locations, coordinates

### 12.3 한국고용정보원_직업훈련 공통코드 공통코드정보
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15037382/openapi.do
- **Description:** Vocational training common codes
- **Key Fields:** Training regions, training fields

### 12.4 한국고용정보원_직업훈련_사업주훈련과정_사업주훈련 훈련과정
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15037378/openapi.do
- **Description:** Employer-led training courses

### 12.5 한국산업인력공단_NCS 관련 정보 서비스
- **Provider:** 한국산업인력공단 (HRD Korea)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15063879/openapi.do
- **Description:** National Competency Standards information
- **Key Fields:** NCS information for vocational education and training course development

### 12.6 한국산업인력공단_원격훈련모니터링시스템 컨소시엄훈련내역 과정 목록
- **Provider:** 한국산업인력공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15090364/fileData.do
- **Last Updated:** 2021-09-28
- **Description:** Remote training monitoring system consortium training course list

### 12.7 고용노동부_직업능력개발 사업현황
- **Provider:** 고용노동부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15117780/fileData.do
- **Last Updated:** 2024-07-08
- **Description:** Vocational competency development program status

### 12.8 한국고용정보원_워크넷_직업전망 교육훈련 및 학력 전공분포 KNOW 유사직업명
- **Provider:** 한국고용정보원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15119098/fileData.do
- **Last Updated:** 2023-08-18
- **Description:** Job outlook, education/training, academic major distribution, similar job names

---

## 13. PATENT & IP SUPPORT

### 13.1 지식재산처_KIPRISPlus_특허_실용 공개_등록공보_REST API
- **Provider:** 지식재산처 (Korean Intellectual Property Office)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15065437/openapi.do
- **Description:** Korean patent/utility model gazette information
- **Key Fields:** Bibliographic information, representative drawings, full-text
- **Traffic:** 1,000 free API calls per month

### 13.2 특허청_특허실용신안 정보 검색 서비스
- **Provider:** 특허청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15058788/openapi.do
- **Description:** Patent and utility model information search
- **Key Fields:** Bibliographic info, drawings, full-text

### 13.3 지식재산처_KIPRISPlus_해외특허_REST API
- **Provider:** 지식재산처
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15058701/openapi.do
- **Description:** Foreign patent information
- **Coverage:** US, Europe, PCT, China, Japan, Russia, Colombia

### 13.4 지식재산처_KIPRISPlus_특허 패밀리_REST API
- **Provider:** 지식재산처
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15065472/openapi.do
- **Description:** Patent family information

### 13.5 지식재산처_KIPRISPlus_특허_실용 분류코드 변동 이력_REST API
- **Provider:** 지식재산처
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15058587/openapi.do
- **Description:** Patent/utility model classification code change history

### 13.6 한국특허전략개발원_특허 질적 정보 API
- **Provider:** 한국특허전략개발원 (KISTA)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15093719/openapi.do
- **Description:** Patent quality information

### 13.7 한국특허전략개발원_특허 상태정보 API
- **Provider:** 한국특허전략개발원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15093718/openapi.do
- **Description:** Patent status information

### 13.8 특허청_등록원부 실시간 정보 조회 서비스
- **Provider:** 특허청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15124946/openapi.do
- **Description:** Real-time registration information inquiry
- **Key Fields:** Patent/utility model/design/trademark registration info, annual fee info, applicant, attorney, priority, exclusive license

### 13.9 특허청_특허기술거래 기관보유기술 정보
- **Provider:** 특허청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15002122/openapi.do
- **Description:** Patent technology transfer institution-held technology information
- **Coverage:** Includes KIPA (한국발명진흥회) partner institutions

---

## 14. REGIONAL DEVELOPMENT

### 14.1 한국산업기술기획평가원_지역균형발전 지원기관 정보
- **Provider:** 한국산업기술기획평가원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15014832/openapi.do
- **Description:** Regional balanced development support organization information
- **Key Fields:** Organization names, locations, main business activities, website information

### 14.2 한국산업기술기획평가원_지역균형발전 우수사례 정보
- **Provider:** 한국산업기술기획평가원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15084598/openapi.do
- **Description:** Excellent cases of balanced regional development from NABIS
- **Key Fields:** Titles, detail page URLs, issuing organizations, regions

### 14.3 한국산업기술기획평가원_지역균형발전 우수사업 정보
- **Provider:** 한국산업기술기획평가원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15013093/fileData.do
- **Last Updated:** 2024-07-09
- **Description:** Excellent regional development projects by year
- **Key Fields:** Local government information, titles, URI data

---

## 15. SOCIAL ECONOMY & COOPERATIVES

### 15.1 한국사회적기업진흥원_협동조합 경영공시
- **Provider:** 한국사회적기업진흥원 (Korea Social Enterprise Promotion Agency)
- **Type:** File Data + REST API
- **URL:** https://www.data.go.kr/data/15047975/fileData.do
- **Last Updated:** 2025-07-17
- **Description:** Cooperative management disclosure
- **Key Fields:** Cooperative names, disclosure status, addresses, contact info, members, employees, assets, contributions, region, supervising ministry

### 15.2 전국사회적기업표준데이터
- **Provider:** Multiple agencies
- **Type:** Standard Data + REST API
- **URL:** https://www.data.go.kr/data/15012895/standard.do
- **Description:** National social enterprise standard data

### 15.3 한국사회적기업진흥원_사회적경제 교육과정
- **Provider:** 한국사회적기업진흥원
- **Type:** File Data + REST API
- **URL:** https://www.data.go.kr/data/15093605/fileData.do
- **Last Updated:** 2021-10-26
- **Description:** Social economy education courses
- **Key Fields:** Leader courses, startup introduction courses, program participation

### 15.4 한국사회적기업진흥원_사회적가치지표(SVI) 우수사례모음집
- **Provider:** 한국사회적기업진흥원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15125009/fileData.do
- **Last Updated:** 2023-10-24
- **Description:** Social Value Index (SVI) excellence case collection

### 15.5 사회적 협동조합 중간지원기관 현황
- **Provider:** Multiple agencies
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15038604/fileData.do
- **Last Updated:** 2019-09-06
- **Description:** Social cooperative intermediate support organization status

---

## 16. CULTURAL ARTS & CONTENT

### 16.1 한국콘텐츠진흥원_지원사업공고
- **Provider:** 한국콘텐츠진흥원 (KOCCA - Korea Creative Content Agency)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15134251/openapi.do
- **Description:** Support project announcements for content industry
- **Key Fields:** Free/designated open calls, recruitment announcements, project titles, business numbers, categories, views, registration dates, links, application start/end dates, content
- **Eligibility Criteria:** Varies by program

### 16.2 한국문화정보원_한눈에보는문화정보조회서비스
- **Provider:** 한국문화정보원 (KCISA)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15138937/openapi.do
- **Description:** Comprehensive cultural information service
- **Coverage:** Performances, exhibitions, cultural arts, cultural heritage, tourism, sports, books

### 16.3 예술경영지원센터_문화예술 일자리 정보
- **Provider:** 예술경영지원센터 (KAMS)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15135008/openapi.do
- **Description:** Cultural arts job information
- **Key Fields:** Job information, recruitment company information from KAMS Art+More

### 16.4 한국콘텐츠진흥원_콘텐츠아카데미_과정정보
- **Provider:** 한국콘텐츠진흥원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15041617/fileData.do
- **Last Updated:** 2023-08-01
- **Description:** Content academy course information

### 16.5 문화체육관광부_정책기자마당
- **Provider:** 문화체육관광부 (Ministry of Culture, Sports and Tourism)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15104967/openapi.do
- **Description:** Policy journalist platform

### 16.6 문화체육관광부_정책정보포털 최신 정책동향 국내
- **Provider:** 문화체육관광부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15105169/openapi.do
- **Description:** Latest domestic policy trends

### 16.7 문화체육관광부_문체부 기관 문화 및 행사정보
- **Provider:** 문화체육관광부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15105235/openapi.do
- **Description:** Cultural events and information from MCST institutions

### 16.8 문화체육관광부_공연 정보(예술의 전당)
- **Provider:** 문화체육관광부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15056881/openapi.do
- **Description:** Performance information (Seoul Arts Center)

---

## 17. TOURISM & SERVICE INDUSTRY

### 17.1 한국관광공사_국문 관광정보 서비스_GW
- **Provider:** 한국관광공사 (Korea Tourism Organization)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15101578/openapi.do
- **Description:** Korean tourism information service
- **Records:** ~260,000 domestic tourism records
- **Coverage:** 15 types including regional info, events, accommodation

### 17.2 한국관광공사_외래객 친화 관광정보 GW
- **Provider:** 한국관광공사
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15111159/openapi.do
- **Description:** Foreign visitor-friendly tourism information
- **Coverage:** Dining establishments, convenience facilities for Southeast Asian and Middle Eastern tourists

### 17.3 한국관광공사_관광지별 연관 관광지 정보
- **Provider:** 한국관광공사
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15128560/openapi.do
- **Description:** Related tourist sites by region
- **Coverage:** Attractions, food, accommodation (up to 50 entries each)

### 17.4 한국관광공사_관광빅데이터 정보서비스_ GW
- **Provider:** 한국관광공사
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15101972/openapi.do
- **Description:** Tourism big data information service

### 17.5 제주관광공사_비짓제주 관광정보 오픈 (API)
- **Provider:** 제주관광공사 (Jeju Tourism Organization)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15076361/openapi.do
- **Description:** Visit Jeju tourism information

### 17.6 서울관광재단_식당운영정보
- **Provider:** 서울관광재단 (Seoul Tourism Organization)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15098046/fileData.do
- **Last Updated:** 2023-01-11
- **Description:** Food tourism database for post-COVID era

### 17.7 전국종합여행업소표준데이터
- **Provider:** Multiple agencies
- **Type:** Standard Data
- **URL:** https://www.data.go.kr/data/15114122/standard.do
- **Description:** National comprehensive travel agency standard data

---

## 18. CARBON NEUTRALITY & ENERGY

### 18.1 한국환경공단_탄소중립포인트 에너지 참여현황 통계
- **Provider:** 한국환경공단 (Korea Environment Corporation)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15125028/openapi.do
- **Description:** Carbon neutral point energy participation statistics
- **Key Fields:** Energy usage and participation by region (electricity, gas, water consumption)
- **Eligibility Criteria:** Households, commercial, apartment complexes

### 18.2 한국에너지공단_탄소 배출량 검증시스템 정보 서비스
- **Provider:** 한국에너지공단 (Korea Energy Agency)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15097939/openapi.do
- **Description:** Carbon emission verification system
- **Key Fields:** Manufacturer names, factory names, model names, carbon emissions, output, verification codes

### 18.3 한국에너지공단_고효율 에너지기자재 제품
- **Provider:** 한국에너지공단
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15091362/openapi.do
- **Description:** High-efficiency energy equipment products
- **Key Fields:** Certification number, model name, company name, capacity, efficiency

### 18.4 한국전력공사_전력데이터서비스마켓(EDS) OPEN API 서비스 목록
- **Provider:** 한국전력공사 (KEPCO)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15131481/fileData.do
- **Last Updated:** 2025-06-30
- **Description:** KEPCO EDS platform Open API catalog
- **Key Fields:** Service numbers, API categories, service names, content descriptions

### 18.5 한국전력거래소_전력시장 발전설비 정보
- **Provider:** 한국전력거래소 (KPX)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15099767/openapi.do
- **Description:** Power market generation facility information

### 18.6 전국전기차충전소표준데이터
- **Provider:** Multiple agencies
- **Type:** Standard Data
- **URL:** https://www.data.go.kr/data/15013115/standard.do
- **Description:** National electric vehicle charging station standard data

---

## 19. DISASTER & EMERGENCY SUPPORT

### 19.1 행정안전부_긴급재난문자
- **Provider:** 행정안전부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15134001/openapi.do
- **Description:** Emergency disaster text messages
- **Coverage:** Earthquakes, typhoons, fires, and other disasters

### 19.2 국토안전관리원_재난대응 데이터 서비스
- **Provider:** 국토안전관리원 (KALIS)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15155753/openapi.do
- **Description:** Disaster response data service
- **Coverage:** Real-time bridge safety monitoring, sensor data from special bridges

### 19.3 행정안전부_공유플랫폼_재난대응기관
- **Provider:** 행정안전부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15139684/openapi.do
- **Description:** Disaster response organizations
- **Key Fields:** Response agency codes, organization names, hierarchy information

### 19.4 소방청_화재정보서비스
- **Provider:** 소방청 (National Fire Agency)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15077644/openapi.do
- **Description:** Fire information service
- **Key Fields:** Fire incident statistics, occurrence dates, damage information

### 19.5 행정안전부_통계연보_지역별 재난경보 및 재난예방 방송
- **Provider:** 행정안전부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15107241/openapi.do
- **Description:** Disaster warnings and prevention broadcasts by region

### 19.6 한국산업안전보건공단_국내재해사례 게시판 정보 조회서비스
- **Provider:** 한국산업안전보건공단 (KOSHA)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15121001/openapi.do
- **Description:** Domestic disaster case information inquiry service

---

## 20. PUBLIC PROCUREMENT

### 20.1 조달청_나라장터 입찰공고정보서비스
- **Provider:** 조달청 (Public Procurement Service)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15129394/openapi.do
- **Description:** KONEPS bid announcement information
- **Coverage:** Goods, services, construction, foreign procurement
- **Key Fields:** Detailed bid information, base amounts, license restrictions, eligible regions, change history

### 20.2 조달청_나라장터 공공데이터개방표준서비스
- **Provider:** 조달청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15058815/openapi.do
- **Description:** KONEPS public data open standard service
- **Coverage:** Bid, successful bid, contract information based on announcement/opening/contract dates

### 20.3 조달청_공공조달통계정보서비스
- **Provider:** 조달청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15129412/openapi.do
- **Description:** Public procurement statistics
- **Coverage:** 24 electronic procurement systems including KONEPS
- **Key Fields:** Total procurement performance, contract method status, regional restrictions, agency/enterprise/method-specific status

### 20.4 조달청_나라장터 낙찰정보서비스
- **Provider:** 조달청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15129397/openapi.do
- **Description:** KONEPS successful bid information
- **Coverage:** Goods, construction, services, foreign procurement
- **Key Fields:** Final successful bidders, opening rankings, multiple reserve prices

### 20.5 조달청_나라장터 사용자정보서비스
- **Provider:** 조달청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15053472/openapi.do
- **Description:** KONEPS user information service

### 20.6 조달청_낙찰정보
- **Provider:** 조달청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15000591/openapi.do
- **Description:** Successful bid information

---

## 21. CHILDCARE & FAMILY SUPPORT

### 21.1 한국사회보장정보원_전국 어린이집 정보 조회
- **Provider:** 한국사회보장정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15101155/openapi.do
- **Description:** National daycare center information
- **Coverage:** Nationwide daycare facilities

### 21.2 한국사회보장정보원_어린이집별 기본정보 조회
- **Provider:** 한국사회보장정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15101154/openapi.do
- **Description:** Individual daycare center basic information

### 21.3 한국보육진흥원_전국 육아종합지원센터 현황
- **Provider:** 한국보육진흥원 (Korea Childcare Promotion Institute)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15024860/fileData.do
- **Last Updated:** 2023-12-31
- **Description:** National childcare support center status
- **Coverage:** Childcare information collection, provision, parent counseling

### 21.4 한국사회보장정보원_육아종합지원센터 현황
- **Provider:** 한국사회보장정보원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15101484/fileData.do
- **Last Updated:** 2023-09-11
- **Description:** Childcare support center status

### 21.5 보건복지부_보육 실태조사_현황
- **Provider:** 보건복지부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15004306/fileData.do
- **Last Updated:** 2021-12-31
- **Description:** Childcare status survey (2021)

---

## 22. HEALTHCARE & ELDERLY SUPPORT

### 22.1 국민건강보험공단_장기요양기관 시설별 상세조회 서비스
- **Provider:** 국민건강보험공단 (National Health Insurance Service)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15058856/openapi.do
- **API Endpoint:** http://apis.data.go.kr/B550928/getLtcInsttDetailInfoService02
- **Description:** Long-term care institution details
- **Coverage:** Elderly care facilities

### 22.2 건강보험심사평가원_병원정보서비스
- **Provider:** 건강보험심사평가원 (HIRA)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15001698/openapi.do
- **Description:** Hospital information service

### 22.3 건강보험심사평가원_의료기관별상세정보서비스
- **Provider:** 건강보험심사평가원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15001699/openapi.do
- **Description:** Medical institution detailed information

### 22.4 질병관리청_국가건강정보포털
- **Provider:** 질병관리청 (KDCA)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15087442/openapi.do
- **Description:** National health information portal

### 22.5 국민건강보험공단_검진기관별 정보제공
- **Provider:** 국민건강보험공단
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15001672/openapi.do
- **Description:** Health screening institution information

### 22.6 국민건강보험공단_건강검진정보
- **Provider:** 국민건강보험공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15007122/fileData.do
- **Last Updated:** 2024-12-31
- **Description:** Health screening information

---

## 23. CERTIFICATION & QUALITY STANDARDS

### 23.1 과학기술정보통신부 국립전파연구원_적합성평가 DB정보
- **Provider:** 국립전파연구원 (RRA)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/3034183/openapi.do
- **Description:** Conformity assessment DB for broadcasting and communication equipment
- **Key Fields:** Certification/registration status

### 23.2 개인정보보호위원회_정보보호 및 개인정보보호 관리체계 인증 현황
- **Provider:** 개인정보보호위원회 (Personal Information Protection Commission)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15114704/fileData.do
- **Last Updated:** 2024-04-30
- **Description:** ISMS-P certification status
- **Coverage:** Information security and personal information protection system verification

### 23.3 농림축산식품부_등급 코드
- **Provider:** 농림축산식품부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15140554/openapi.do
- **Description:** Agricultural product grade codes
- **Coverage:** Quality grade information for agricultural products in wholesale markets

### 23.4 농림축산식품부 국립농산물품질관리원_친환경인증정보
- **Provider:** 국립농산물품질관리원 (NAQS)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15082975/fileData.do
- **Last Updated:** 2024-09-10
- **Description:** Eco-friendly certification information
- **Key Fields:** Certification number, type, items, cultivation area, production volume, certification period

### 23.5 한국산업인력공단_자격정보 인정 기관 정보
- **Provider:** 한국산업인력공단
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15068045/openapi.do
- **Description:** Qualification information recognized institution information

---

## 24. JOB MATCHING & RECRUITMENT

### 24.1 한국고용정보원_워크넷 채용정보 채용목록 및 상세정보
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/3038225/openapi.do
- **Data Source:** work.go.kr (워크넷)
- **Description:** Worknet recruitment information
- **Coverage:** Comprehensive job postings
- **Key Fields:** Keywords, job types, preferred regions

### 24.2 한국고용정보원_워크넷 채용행사 채용행사목록 및 상세정보
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15031948/openapi.do
- **Description:** Recruitment event information
- **Coverage:** Job fairs, recruitment agency services, interview assistance, job expos

### 24.3 한국고용정보원_워크넷 공채속보 공채기업목록 및 상세정보
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15031951/openapi.do
- **Description:** Public recruitment company information

### 24.4 한국고용정보원_워크넷 공통코드 지역, 직종, 자격면허 등
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15037287/openapi.do
- **Description:** Common codes for recruitment
- **Coverage:** Region, job type, qualifications/licenses, majors, academic fields

### 24.5 한국고용정보원_워크넷_직무데이터사전
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15088880/openapi.do
- **Description:** Job data dictionary

### 24.6 한국고용정보원_워크넷_직업정보
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/3071087/openapi.do
- **Description:** Occupation information

### 24.7 한국고용정보원_구직자취업역량 강화프로그램
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15138815/openapi.do
- **Description:** Job seeker employment competency strengthening program

### 24.8 기획재정부_공공기관 채용정보 조회서비스
- **Provider:** 기획재정부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15125273/openapi.do
- **Description:** Public institution recruitment information inquiry

### 24.9 서울특별시_일자리플러스센터 채용 정보
- **Provider:** 서울특별시
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15047488/openapi.do
- **Description:** Seoul Job Plus Center recruitment information

### 24.10 중소벤처기업진흥공단_기업인력애로센터_일자리매칭플랫폼_채용공고목록 및 상세정보
- **Provider:** 중소벤처기업진흥공단
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15125656/openapi.do
- **Description:** SME job matching platform recruitment announcements
- **Format:** JSON

### 24.11 인사혁신처_공공취업정보 조회
- **Provider:** 인사혁신처 (Ministry of Personnel Management)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15000485/openapi.do
- **Description:** Public employment information inquiry

### 24.12 부산광역시_공공부문 일자리(채용) 정보
- **Provider:** 부산광역시
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15034072/openapi.do
- **Description:** Busan public sector job recruitment information

### 24.13 인사혁신처_공공채용정보
- **Provider:** 인사혁신처
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15151560/fileData.do
- **Last Updated:** 2024-12-31
- **Description:** Public recruitment information

### 24.14 한국고용정보원_워크넷 강소기업 검색
- **Provider:** 한국고용정보원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/3071251/openapi.do
- **Description:** Worknet strong small business search

---

## 25. FACILITY RENTAL & SPACE SUPPORT

### 25.1 국토교통부_건축HUB_건축물대장정보 서비스
- **Provider:** 국토교통부 (Ministry of Land, Infrastructure and Transport)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15134735/openapi.do
- **Description:** Building registry information
- **Key Fields:** Basic overviews, property details

### 25.2 국토교통부_공동주택 기본 정보제공 서비스
- **Provider:** 국토교통부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15058453/openapi.do
- **Description:** Apartment housing information
- **Key Fields:** Management methods, facilities, amenities

### 25.3 국토교통부_공동주택 단지 목록제공 서비스
- **Provider:** 국토교통부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15057332/openapi.do
- **Description:** Apartment complex list

### 25.4 국토교통부_주택토지 분야 사전정보공개
- **Provider:** 국토교통부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15109345/openapi.do
- **Description:** Housing and land advance information

### 25.5 국토교통부_등록민간임대주택 데이터
- **Provider:** 국토교통부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15100433/fileData.do
- **Last Updated:** 2025-09-30
- **Description:** Registered private rental housing data

---

## 26. POLICY FUNDING & INVESTMENT

### 26.1 국토교통부_리츠정보_부동산투자회사(리츠)정보_서비스
- **Provider:** 국토교통부
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15139797/openapi.do
- **Description:** REIT (Real Estate Investment Trust) information

### 26.2 한국예탁결제원_채권정보서비스
- **Provider:** 한국예탁결제원 (KSD)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15074595/openapi.do
- **Description:** Bond information service

### 26.3 한국예탁결제원_주식정보서비스
- **Provider:** 한국예탁결제원
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15001145/openapi.do
- **Description:** Stock information service

### 26.4 금융위원회_채권기본정보
- **Provider:** 금융위원회
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15059592/openapi.do
- **Description:** Bond basic information

### 26.5 금융위원회_모기지론기초자산정보
- **Provider:** 금융위원회
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15059604/openapi.do
- **Description:** Mortgage loan basic asset information

---

## 27. INDUSTRIAL COMPLEX SUPPORT

### 27.1 한국산업단지공단_공장등록필지정보조회서비스
- **Provider:** 한국산업단지공단 (KICOX)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15087615/openapi.do
- **Description:** Factory registration land parcel information
- **Key Fields:** Company name, address, representative name, products (real-time search)

### 27.2 한국산업단지공단_공장등록생산정보조회서비스
- **Provider:** 한국산업단지공단
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15087611/openapi.do
- **Description:** Factory registration production information
- **Key Fields:** Industry sectors, products

### 27.3 한국산업단지공단_국가산업단지 산업동향정보_입주업체 현황
- **Provider:** 한국산업단지공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15085894/fileData.do
- **Last Updated:** 2025-03-31
- **Description:** National industrial complex industry trends - tenant company status
- **Coverage:** Quarterly data on tenant companies in major national industrial complexes

### 27.4 한국산업단지공단_국가산업단지 산업동향정보_업종별 입주업체 현황
- **Provider:** 한국산업단지공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15085901/fileData.do
- **Last Updated:** 2025-03-31
- **Description:** Tenant companies by industry

### 27.5 한국산업단지공단_전국산업단지현황통계
- **Provider:** 한국산업단지공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/3041272/fileData.do
- **Last Updated:** 2025-06-30
- **Description:** National industrial complex status statistics

### 27.6 한국산업단지공단_전국등록공장현황_등록공장현황자료
- **Provider:** 한국산업단지공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15105482/fileData.do
- **Last Updated:** 2024-12-31
- **Description:** Nationwide registered factory status
- **Key Fields:** Company names, industrial complex names, products, factory addresses

### 27.7 한국산업단지공단_국가산업단지 산업동향정보
- **Provider:** 한국산업단지공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/3042071/fileData.do
- **Last Updated:** 2025-03-31
- **Description:** National industrial complex industry trend information

---

## 28. FORESTRY SUPPORT

### 28.1 산림청_산림자원통계 서비스
- **Provider:** 산림청 (Korea Forest Service)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15080832/openapi.do
- **Description:** Forest resource statistics service
- **Coverage:** Forest basic statistics, national forest resource surveys, forest owner status, forest product production surveys, cost surveys, household economic surveys, management surveys, income surveys

### 28.2 산림청_산림사업법인 정보
- **Provider:** 산림청
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/3071214/openapi.do
- **Description:** Forestry business corporation information

### 28.3 산림청_산림임업통계플랫폼 산림통계 마이크로데이터(임분조사표)
- **Provider:** 산림청
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15122903/fileData.do
- **Last Updated:** 2022-11-18
- **Description:** Forest statistics microdata (forest stand survey)

### 28.4 산림청_임업통계연보
- **Provider:** 산림청
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15087207/fileData.do
- **Last Updated:** 2021-09-03
- **Description:** Forestry statistics yearbook

### 28.5 산림청_산림임업통계플랫폼 임업통계연보 산림자원조성
- **Provider:** 산림청
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15124544/fileData.do
- **Last Updated:** 2023-10-19
- **Description:** Forestry statistics yearbook - forest resource development

### 28.6 한국임업진흥원_국가 전문 자격 자격증(개인) 진위여부
- **Provider:** 한국임업진흥원 (Korea Forestry Promotion Institute)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15125833/openapi.do
- **Description:** National professional qualification certificate verification (tree doctors)

---

## 29. TAX & BUSINESS REGISTRATION

### 29.1 국세청_사업자등록정보 진위확인 및 상태조회 서비스
- **Provider:** 국세청 (National Tax Service)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15081808/openapi.do
- **Description:** Business registration information verification and status inquiry
- **Key Fields:** Business registration number, opening date, representative name, operating status (suspension, closure), tax type (general, taxable, exempt), closure date

### 29.2 국세청_세무일정
- **Provider:** 국세청
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15101035/fileData.do
- **Last Updated:** 2025-01-01
- **Description:** Annual tax schedule

### 29.3 국세청_전자(세금)계산서 제도의 이해
- **Provider:** 국세청
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15050750/fileData.do
- **Last Updated:** 2024-11-04
- **Description:** Understanding electronic tax invoice system

### 29.4 국세청_국세상담센터 상담 현황
- **Provider:** 국세청
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15114283/fileData.do
- **Last Updated:** 2024-12-31
- **Description:** National Tax Service counseling center consultation status

---

## 30. GOVERNMENT SERVICE PORTALS

### 30.1 정부24 공공서비스 활용 Open API
- **Provider:** 행정안전부
- **Type:** REST API
- **URL (Portal):** https://www.gov.kr/openapi
- **Data Source:** gov.kr (정부24)
- **Description:** Gov24 government service Open APIs
- **Coverage:** Individual land value confirmation, military service certificates, apartment price information, resident registration documents, various government services

### 30.2 행정안전부_공공데이터 제공신청 및 개방데이터 목록
- **Provider:** 행정안전부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15133954/fileData.do
- **Last Updated:** 2024-12-31
- **Description:** Public data provision application and open data list
- **Coverage:** File data and API listing from past 3 years

### 30.3 산업통상자원부_산업 관련 지원사업 정보
- **Provider:** 산업통상자원부
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/3074362/fileData.do
- **Last Updated:** 2016-01-01
- **Description:** Industry-related support program information
- **Coverage:** 2016 regional policy briefing materials (industrial economy, industrial technology, regional economy, materials/components, system industry, trade, energy resources, technology standards)

### 30.4 한국데이터산업진흥원_데이터바우처 지원사업 선정 공급기업 목록
- **Provider:** 한국데이터산업진흥원 (K-Data)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15127989/fileData.do
- **Last Updated:** 2025-04-01
- **Description:** Data voucher support program selected supplier company list

### 30.5 한국데이터산업진흥원_데이터바우처 사업관리 가공기업 정보
- **Provider:** 한국데이터산업진흥원
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15125657/fileData.do
- **Last Updated:** 2025-07-31
- **Description:** Data voucher project management processing company information

### 30.6 정보통신산업진흥원_세부사업
- **Provider:** 정보통신산업진흥원 (NIPA)
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15149411/fileData.do
- **Last Updated:** 2025-09-12
- **Description:** Detailed business information
- **Coverage:** ICT industry support programs including AI, software, digital technology

### 30.7 과학기술일자리진흥원_미래기술마당 사업화유망기술
- **Provider:** 과학기술일자리진흥원 (COMPA)
- **Type:** REST API
- **URL:** https://www.data.go.kr/data/15076821/openapi.do
- **Description:** Future technology marketplace commercialization promising technology

### 30.8 소상공인시장진흥공단_전국 온누리상품권 가맹점 현황
- **Provider:** 소상공인시장진흥공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/3060079/fileData.do
- **Last Updated:** 2025-07-31
- **Description:** National Onnuri gift certificate merchant status

### 30.9 소상공인시장진흥공단_모바일상품권 가맹점
- **Provider:** 소상공인시장진흥공단
- **Type:** File Data
- **URL:** https://www.data.go.kr/data/15090978/fileData.do
- **Last Updated:** 2021-07-31
- **Description:** Mobile gift certificate merchants

---

## API ACCESS INFORMATION

### General Requirements
- **Registration:** All APIs require registration at data.go.kr (공공데이터포털)
- **Authentication:** Service Key (인증키) required for most APIs
- **Traffic Limits:**
  - Development Account: Typically 10,000 calls
  - Operating Account: Can be increased by registering use cases
- **Formats:** JSON, XML (REST API based)
- **Auto-conversion:** File data (CSV, XLS) automatically converted to REST API

### How to Apply
1. Visit https://www.data.go.kr
2. Register as a member (회원가입)
3. Search for desired API
4. Apply for usage authorization (활용신청)
5. Receive API key (serviceKey)
6. Access API endpoint with authentication

### Contact for Support
- **Public Data Support Center:** Contact via data.go.kr portal
- **Phone:** Available on individual API pages
- **Email:** Support available through portal inquiry system

---

## NOTES

1. **Data Freshness:** Last updated dates vary by dataset. Check individual API pages for most recent update information.

2. **Auto-converted APIs:** File data with open formats (Level 3+) are automatically converted to REST APIs by the Public Data Support Center.

3. **Eligibility Criteria:** Many support programs have specific eligibility requirements (company size, industry, location, etc.). Detailed criteria available in individual API responses.

4. **Portal Integration:** Several portals aggregate support programs:
   - bizinfo.go.kr (기업마당): SME support programs
   - k-startup.go.kr (K-스타트업): Startup support
   - bokjiro.go.kr (복지로): Welfare services
   - work.go.kr (워크넷): Employment services
   - gov.kr (정부24): General government services

5. **Search Strategy:** When searching for support programs, filter by:
   - Sector/Category (분야)
   - Target audience (지원대상)
   - Application period (신청기간)
   - Supervising agency (소관기관)
   - Location (지역)

6. **Missing Categories:** Some searches did not return specific dedicated APIs for:
   - Tax incentives/exemptions (조세특례) - Available through general SME support APIs
   - Smart city digital transformation - Covered under NIPA programs
   - Specific voucher programs - Covered under general support APIs

7. **Total Count:** This document catalogs **200+ distinct APIs and datasets** related to Korean government support programs across 30 major categories.

---

## COMPREHENSIVE SUMMARY BY PROVIDER

### Central Government Ministries
- 기획재정부 (Ministry of Economy and Finance): 3 APIs
- 행정안전부 (Ministry of Interior and Safety): 10+ APIs
- 중소벤처기업부 (Ministry of SMEs and Startups): 15+ APIs
- 고용노동부 (Ministry of Employment and Labor): 8+ APIs
- 과학기술정보통신부 (Ministry of Science and ICT): 5+ APIs
- 농림축산식품부 (Ministry of Agriculture): 8+ APIs
- 해양수산부 (Ministry of Oceans and Fisheries): 5+ APIs
- 산업통상자원부 (Ministry of Trade, Industry and Energy): 5+ APIs
- 국토교통부 (Ministry of Land, Infrastructure and Transport): 12+ APIs
- 보건복지부 (Ministry of Health and Welfare): 8+ APIs
- 여성가족부 (Ministry of Gender Equality and Family): 3+ APIs
- 문화체육관광부 (Ministry of Culture, Sports and Tourism): 8+ APIs
- 환경부 (Ministry of Environment): 3+ APIs
- 산림청 (Korea Forest Service): 6+ APIs
- 국세청 (National Tax Service): 4+ APIs
- 관세청 (Korea Customs Service): 5+ APIs
- 조달청 (Public Procurement Service): 6+ APIs

### Public Agencies
- 한국사회보장정보원: 10+ APIs
- 한국고용정보원: 15+ APIs
- 한국과학기술정보연구원: 4+ APIs
- 창업진흥원: 5+ APIs
- 중소기업기술정보진흥원: 5+ APIs
- 중소벤처기업진흥공단: 8+ APIs
- 신용보증기금: 4+ APIs
- 한국산업기술기획평가원: 5+ APIs
- 한국산업기술진흥원: 5+ APIs
- 한국관광공사: 5+ APIs
- 한국환경공단: 3+ APIs
- 한국콘텐츠진흥원: 4+ APIs
- 한국산업단지공단: 7+ APIs
- 지식재산처/특허청: 10+ APIs

---

**END OF COMPREHENSIVE LIST**

*For the most up-to-date information, always check the official data.go.kr portal.*
