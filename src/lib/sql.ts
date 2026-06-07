// HTTP-based Neon SQL client — NO TCP connection pool limits
// Use this for ALL read operations

import { neon } from '@neondatabase/serverless'

const NEON_URL = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'

process.env.DATABASE_URL = NEON_URL

export const sql = neon(NEON_URL)
