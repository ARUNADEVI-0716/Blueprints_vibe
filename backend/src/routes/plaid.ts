import { Router, Response } from 'express'
import { verifyToken, AuthRequest, supabaseAdmin, userDb } from '../middleware/auth'
import { createLinkToken, exchangePublicToken, getAccounts, getTransactions } from '../services/plaidService'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()

// ── POST /api/plaid/create-link-token ─────────────────────────
router.post('/create-link-token', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const linkToken = await createLinkToken(req.userId!)
        res.json({ link_token: linkToken })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ── POST /api/plaid/exchange-token ────────────────────────────
router.post('/exchange-token', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { public_token, institution_name } = req.body
        const { accessToken, itemId } = await exchangePublicToken(public_token)

        // Write with admin client (needs to bypass RLS to insert)
        const { data: plaidItem, error: itemErr } = await supabaseAdmin
            .from('plaid_items')
            .insert([{
                user_id:          req.userId,
                access_token:     accessToken,
                item_id:          itemId,
                institution_name: institution_name || 'Unknown Bank'
            }])
            .select()
            .single()

        if (itemErr) throw itemErr

        const accounts    = await getAccounts(accessToken)
        const accountRows = accounts.map((a: any) => ({
            user_id:       req.userId,
            plaid_item_id: plaidItem.id,
            account_id:    a.account_id,
            name:          a.name,
            balance:       a.balances.current,
            account_type:  a.type
        }))
        await supabaseAdmin.from('bank_accounts').insert(accountRows)

        const transactions = await getTransactions(accessToken)
        const txRows = transactions.map((t: any) => ({
            user_id:        req.userId,
            account_id:     t.account_id,
            amount:         t.amount,
            date:           t.date,
            merchant:       t.merchant_name || t.name,
            category:       t.category?.[0] || 'Other',
            transaction_id: t.transaction_id
        }))
        await supabaseAdmin.from('transactions').upsert(txRows, { onConflict: 'transaction_id' })

        res.json({
            success:      true,
            accounts:     accounts.length,
            transactions: transactions.length,
            institution:  institution_name
        })
    } catch (err: any) {
        console.error('Exchange token error:', err)
        res.status(500).json({ error: err.message })
    }
})

// ── GET /api/plaid/bank-summary ───────────────────────────────
// Uses userDb → RLS enforced → only this user's data returned
router.get('/bank-summary', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const db = userDb(req.userToken!)

        const [
            { data: accounts },
            { data: transactions },
            { data: plaidItems }
        ] = await Promise.all([
            db.from('bank_accounts')
                .select('*')
                .eq('user_id', req.userId),
            db.from('transactions')
                .select('*')
                .eq('user_id', req.userId)
                .order('date', { ascending: false })
                .limit(90),
            db.from('plaid_items')
                .select('institution_name, created_at')
                .eq('user_id', req.userId)
        ])

        res.json({
            connected:    (plaidItems?.length || 0) > 0,
            institution:  plaidItems?.[0]?.institution_name || null,
            accounts:     accounts     || [],
            transactions: transactions || [],
            totalBalance: (accounts || []).reduce((s: number, a: any) => s + (a.balance || 0), 0)
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export default router