// Runs before every test file. `config/env.ts` validates these at import time,
// so they must exist before any backend module is imported. Values are dummies —
// real services are never contacted (Prisma/Supabase are mocked in tests).
process.env.NODE_ENV ||= "test";
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
process.env.SUPABASE_URL ||= "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY ||= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
process.env.RAZORPAY_KEY_SECRET ||= "rzp_test_secret";
