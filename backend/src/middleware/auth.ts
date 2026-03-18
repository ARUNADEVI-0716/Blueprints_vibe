// import { Request, Response, NextFunction } from 'express'
// import { createClient } from '@supabase/supabase-js'
// import dotenv from 'dotenv'
//
// dotenv.config()
//
// const supabase = createClient(
//     process.env.SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!
// )
//
// export interface AuthRequest extends Request {
//     userId?: string
//     userEmail?: string
// }
//
// export async function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
//     const authHeader = req.headers.authorization
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ error: 'No token provided' })
//     }
//
//     const token = authHeader.split(' ')[1]
//
//     try {
//         const { data: { user }, error } = await supabase.auth.getUser(token)
//         if (error || !user) {
//             return res.status(401).json({ error: 'Invalid token' })
//         }
//         req.userId = user.id
//         req.userEmail = user.email
//         next()
//     } catch {
//         return res.status(401).json({ error: 'Token verification failed' })
//     }
// }

import { Request, Response, NextFunction } from 'express'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// ── Admin client — bypasses RLS (use ONLY for writes or officer queries) ──
export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── User-scoped client — enforces RLS (use for ALL user data reads) ──────
// Each user can only see their own rows when using this client
export function userDb(token: string): SupabaseClient {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            }
        }
    )
}

// ── Helper: extract raw token from request ────────────────────────────────
export function getToken(req: Request): string {
    return req.headers.authorization?.split(' ')[1] || ''
}

export interface AuthRequest extends Request {
    userId?:    string
    userEmail?: string
    userToken?: string   // raw JWT, forwarded for userDb()
}

export async function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' })
        }
        req.userId    = user.id
        req.userEmail = user.email
        req.userToken = token   // store so routes can call userDb(req.userToken)
        next()
    } catch {
        return res.status(401).json({ error: 'Token verification failed' })
    }
}