# Database Setup Complete

## Overview
The Supabase database for the grant matching service has been successfully set up and populated with seed data.

## What Was Created

### 1. Migration File
**Location:** `/Users/isaac/projects/grant-matching-service/supabase/migrations/00001_initial_schema.sql`

This migration creates:
- **supports table**: Stores government support program information (30 records)
- **diagnoses table**: Stores user diagnosis results
- **Indexes**: For performance optimization on frequently queried fields
- **Trigger**: Auto-updates `updated_at` timestamp on supports table

### 2. Seed Script
**Location:** `/Users/isaac/projects/grant-matching-service/scripts/setup-db.mjs`

This Node.js script:
- Connects to Supabase using the service role key
- Inserts 30 sample support programs covering 6 categories:
  - 금융 (Finance): 5 programs
  - 기술 (Technology): 3 programs
  - 인력 (Human Resources): 4 programs
  - 창업 (Startup): 5 programs
  - 경영 (Management): 8 programs
  - 기타 (Others): 5 programs

## Database Schema

### supports table
```sql
- id: UUID (primary key)
- title: TEXT (support program name)
- organization: TEXT (government agency)
- category: TEXT (support category)
- start_date: DATE
- end_date: DATE
- detail_url: TEXT
- target_regions: TEXT[] (array of region names)
- target_business_types: TEXT[] (array of business types)
- target_employee_min/max: INTEGER (employee count range)
- target_revenue_min/max: BIGINT (annual revenue range in KRW)
- target_business_age_min/max: INTEGER (business age in months)
- amount: TEXT (support amount description)
- is_active: BOOLEAN (default: true)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### diagnoses table
```sql
- id: UUID (primary key)
- business_type: TEXT
- region: TEXT
- employee_count: INTEGER
- annual_revenue: BIGINT
- business_start_date: DATE
- email: TEXT (optional)
- matched_support_ids: UUID[] (array of matched support IDs)
- matched_count: INTEGER
- created_at: TIMESTAMPTZ
```

## Verification Results

✅ **Migration applied successfully**
✅ **30 support programs inserted**
✅ **Data retrieval verified via REST API**
✅ **Both tables created and accessible**

## Sample Data
The database includes diverse support programs such as:
- 소상공인 정책자금 융자 (Small Business Policy Loan)
- 청년창업자 특례보증 (Youth Entrepreneur Special Guarantee)
- 중소기업 R&D 지원사업 (SME R&D Support)
- AI·빅데이터 기술개발 지원 (AI/Big Data Development Support)
- 청년 일자리 도약 장려금 (Youth Employment Incentive)

## Next Steps

The database is now ready for use with the grant matching service API:
1. API endpoints can query the `supports` table for matching logic
2. User diagnoses can be stored in the `diagnoses` table
3. The matching algorithm can filter by region, business type, employee count, revenue, and business age

## Connection Information

- **Supabase URL**: https://jutlqmvhwsbfmwbxbvmj.supabase.co
- **Project Ref**: jutlqmvhwsbfmwbxbvmj
- **Environment**: Production (linked)

The service role key is stored in `.env.local` for API access.
