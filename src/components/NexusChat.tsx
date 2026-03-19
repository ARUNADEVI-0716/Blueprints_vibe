import { useState, useRef, useEffect } from 'react'

// ── Knowledge Base ────────────────────────────────────────────
interface QA {
    keywords: string[]
    answer: string
    followups?: string[]
}

const KB: QA[] = [
    {
        keywords: ['hello', 'hi', 'hey', 'start', 'help', 'what can you do', 'nexus'],
        answer: `Welcome to Nexus. I can assist you with:\n\n• **Loan applications** — how to apply, eligibility, status\n• **Credit score** — how it's calculated, improving it\n• **EMI repayments** — paying EMIs, schedules, interest\n• **Documents** — what to upload, PAN, Aadhaar\n• **Guarantor & OTP** — verification process\n• **Loan agreement** — digital signing\n• **Fraud & security** — how we protect you\n\nWhat would you like to know?`,
        followups: ['How do I apply for a loan?', 'What is my credit score?', 'How do I pay EMI?']
    },
    {
        keywords: ['apply', 'loan', 'application', 'how to apply', 'new loan', 'apply loan'],
        answer: `**How to apply for a loan on Nexus:**\n\n1. **Connect your bank** via Plaid (secure, read-only)\n2. **Get your credit score** — AI analyzes your bank data\n3. **Fill the loan form** — amount, purpose, employment, PAN\n4. **Sign the agreement** — digital signature via OTP\n5. **Upload documents** — Aadhaar, PAN card, salary slip, etc.\n6. **Officer reviews** — decision within 24 hours\n7. **Funds disbursed** — via Stripe on approval\n\nYou can start by clicking **Apply for Loan** on your dashboard.`,
        followups: ['What documents do I need?', 'How long does approval take?', 'What is the loan limit?']
    },
    {
        keywords: ['how long', 'approval time', 'when will', 'decision', 'how many days'],
        answer: `**Loan approval timeline:**\n\n• AI credit analysis: **instant** (seconds)\n• Officer review: **within 24 hours**\n• Funds disbursed: **immediately** after approval via Stripe\n\nReal-time status updates are available on the Loan Status page — no need to refresh.`,
        followups: ['How do I check my loan status?', 'What if my loan is rejected?']
    },
    {
        keywords: ['status', 'check status', 'my loan', 'application status', 'pending', 'approved', 'rejected'],
        answer: `**Checking your loan status:**\n\nGo to **Loan Status** from your dashboard. You will see:\n\n• **Pending** — officer is reviewing\n• **Approved** — loan disbursed, start paying EMIs\n• **Rejected** — see officer notes for reason\n• **Repaid** — loan fully paid off\n\nStatus updates happen in real-time.`,
        followups: ['Why was my loan rejected?', 'How do I pay EMI?']
    },
    {
        keywords: ['rejected', 'rejection', 'not approved', 'why rejected', 'declined'],
        answer: `**If your loan was rejected:**\n\nReview the officer notes on your Loan Status page — they explain the reason.\n\nCommon reasons:\n• Low credit score (below 500)\n• Income too low for requested amount\n• Incomplete documents\n• Fraud risk flags detected\n• Guarantor OTP not verified\n\n**Recommended action:** Improve your credit score, ensure all documents are uploaded, and reapply. A smaller loan amount may also be considered.`,
        followups: ['How do I improve my credit score?', 'What documents are required?']
    },
    {
        keywords: ['limit', 'maximum', 'how much', 'loan amount', 'eligible', 'eligibility', 'how much can i borrow'],
        answer: `**Loan limits based on credit grade:**\n\n| Grade | Score | Max Loan |\n|-------|-------|----------|\n| Excellent | 800+ | ₹10,00,000 |\n| Very Good | 700–799 | ₹5,00,000 |\n| Good | 600–699 | ₹3,00,000 |\n| Fair | 500–599 | ₹1,50,000 |\n| Poor | Below 500 | Not eligible |\n\nYour applicable limit is displayed dynamically on the loan application form based on your latest credit score.`,
        followups: ['How is credit score calculated?', 'How do I improve my score?']
    },
    {
        keywords: ['interest', 'interest rate', 'rate', 'how much interest', 'annual rate'],
        answer: `**Interest rates on Nexus (reducing balance method):**\n\n| Credit Grade | Annual Rate |\n|--------------|-------------|\n| Excellent | 10.5% p.a. |\n| Very Good | 11.5% p.a. |\n| Good | 13.5% p.a. |\n| Fair | 16.0% p.a. |\n| Poor | 18.5% p.a. |\n\nInterest is calculated on a **reducing balance** basis — each month you pay less interest as your principal decreases.`,
        followups: ['How is EMI calculated?', 'Can I repay early?']
    },
    {
        keywords: ['purpose', 'loan type', 'personal', 'home loan', 'education', 'business loan', 'medical', 'vehicle'],
        answer: `**Loan purposes available on Nexus:**\n\n• **Personal** — any personal expense\n• **Home** — home improvement or purchase\n• **Education** — tuition, courses, study abroad\n• **Business** — business expansion or startup\n• **Medical** — healthcare, surgery, treatment\n• **Vehicle** — two-wheeler or four-wheeler\n\nSelect your purpose during the loan application.`
    },
    {
        keywords: ['credit score', 'score', 'cibil', 'how is score', 'credit rating', 'my score'],
        answer: `**How your Nexus credit score works:**\n\nScore range: **300 – 950**\n\n**For first-time users (Cold Start):**\n• Transaction regularity (30%)\n• Account balance stability (25%)\n• Income signals from bank data (25%)\n• Spending health (20%)\nMax score: **750**\n\n**For returning users:**\n• Repayment track record (30%)\n• Prior repayment history (15%)\n• Transaction regularity (20%)\n• Balance stability (15%)\n• Income signals (12%)\n• Spending health (8%)\nMax score: **950**\n\nVisit the **Credit Score** page for your full breakdown.`,
        followups: ['How do I improve my score?', 'What is cold start?', 'What is repayment bonus?']
    },
    {
        keywords: ['improve', 'increase score', 'boost score', 'better score', 'higher score'],
        answer: `**How to improve your credit score:**\n\n1. **Repay loans on time** — biggest boost (+20 to +50 points)\n2. **Maintain bank balance** — keep ₹25,000+ average\n3. **Regular transactions** — active account shows stability\n4. **Healthy spending** — keep discretionary spending under 20%\n5. **Consistent income** — regular salary credits\n6. **Pay EMIs on time** — late payments reduce your score\n\nFully repaying your current loan on time unlocks a **+20 to +50 point bonus** on your next application.`,
        followups: ['What is the repayment bonus?', 'How do I pay EMI?']
    },
    {
        keywords: ['cold start', 'first time', 'no credit history', 'new user', 'cold start profile'],
        answer: `**Cold Start — First-time borrowers:**\n\nIf you have no previous loans with Nexus, you are classified as a **Cold Start** user.\n\n• Your score is calculated purely from your **bank data** via Plaid\n• Max score is capped at **750** (vs 950 for returning borrowers)\n• You are still eligible for loans up to ₹5,00,000 with a strong score\n\nOnce you repay your first loan, you become a **returning borrower** — your cap increases to 950 and you receive repayment bonus points.`,
        followups: ['How is credit score calculated?', 'What is the repayment bonus?']
    },
    {
        keywords: ['repayment bonus', 'score boost', 'returning borrower', 'bonus points', 'paid loan'],
        answer: `**Repayment bonus for returning borrowers:**\n\nWhen you fully repay a loan, you receive bonus points on your next credit score calculation:\n\n| Loans Repaid | Bonus Points |\n|--------------|---------------|\n| 1 loan | +20 points |\n| 2 loans | +35 points |\n| 3+ loans | +50 points |\n\nYour score cap also increases from 750 to **950**. On-time repayment qualifies for the full bonus.`,
        followups: ['How do I pay EMI?', 'How is credit score calculated?']
    },
    {
        keywords: ['emi', 'pay emi', 'monthly payment', 'repay', 'repayment', 'installment', 'monthly instalment'],
        answer: `**Paying your EMI on Nexus:**\n\n1. Go to the **Loan Status** page\n2. Click **"Pay EMI"** on your approved loan\n3. Review your full EMI schedule\n4. Click **"Pay ₹X"** to pay the next EMI\n\n**Each EMI includes:**\n• Principal — reduces your loan balance\n• Interest — based on remaining balance\n\nAs you pay more EMIs, your interest portion decreases each month (reducing balance method).`,
        followups: ['What happens if I miss an EMI?', 'How is EMI calculated?', 'Can I pay early?']
    },
    {
        keywords: ['emi calculation', 'how is emi', 'calculate emi', 'emi formula', 'how much emi'],
        answer: `**EMI Calculation:**\n\nNexus uses the standard **reducing balance EMI formula:**\n\nEMI = P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)\n\nWhere:\n• **P** = Principal loan amount\n• **r** = Monthly interest rate (annual rate ÷ 12 ÷ 100)\n• **n** = Tenure in months\n\n**Example:** ₹1,00,000 at 13.5% for 12 months\n→ Monthly rate = 1.125%\n→ EMI = **₹8,934/month**\n→ Total payable = ₹1,07,208`,
        followups: ['What is the interest rate?', 'How do I pay EMI?']
    },
    {
        keywords: ['miss emi', 'late payment', 'overdue', 'missed payment', 'default', 'skip emi'],
        answer: `**If you miss or pay late:**\n\n• The EMI is marked as **Late** in your schedule\n• It affects your repaid_on_time status\n• When the loan is fully repaid, late payments reduce the credit score boost you receive\n• Overdue EMIs are highlighted with a warning on your repayment page\n\nAlways pay on or before the due date to maximize your credit score improvement.`,
        followups: ['How do I pay overdue EMI?', 'How does this affect my credit score?']
    },
    {
        keywords: ['fully paid', 'complete repayment', 'finish loan', 'all emis paid', 'loan complete'],
        answer: `**When your loan is fully repaid:**\n\n1. Loan status changes to **Repaid** automatically\n2. Officer sees the repaid status in their dashboard\n3. Your **credit score gets boosted** on the next calculation\n4. You can apply for a **new loan immediately** — no longer a cold start user\n\nA button will appear: **"Apply for Next Loan"**`,
        followups: ['What is the repayment bonus?', 'How do I apply for a new loan?']
    },
    {
        keywords: ['early repay', 'prepay', 'pay full', 'close loan', 'foreclose'],
        answer: `**Early repayment / prepayment:**\n\nNexus processes EMIs one at a time. To fully close a loan early, you may pay EMIs consecutively.\n\nEach payment reduces your outstanding balance. The interest portion of subsequent EMIs decreases due to the reducing balance method.\n\nContact your officer if you wish to arrange a bulk settlement.`
    },
    {
        keywords: ['connect bank', 'plaid', 'bank account', 'link bank', 'bank connection', 'bank data'],
        answer: `**Connecting your bank via Plaid:**\n\n1. Go to **Connect Bank** from your dashboard\n2. Click "Connect Bank Account"\n3. Select your bank from Plaid's secure list\n4. Enter your bank credentials (encrypted)\n5. Plaid fetches your accounts and last 90 days of transactions\n\nPlaid uses bank-grade 256-bit encryption. Nexus receives **read-only** access — we cannot initiate transactions.\n\nYour bank data is used solely for credit score calculation.`,
        followups: ['Is my data safe?', 'How is credit score calculated?']
    },
    {
        keywords: ['safe', 'secure', 'privacy', 'data safe', 'bank credentials', 'encrypted', 'security'],
        answer: `**Data security on Nexus:**\n\n• **Bank data** — Read-only via Plaid, AES-256 encrypted\n• **Documents** — Stored in private Supabase storage vault\n• **OTPs** — Never displayed on screen, sent to registered mobile only\n• **Passwords** — Hashed, never stored in plain text\n• **Officer login** — Protected with 2FA (TOTP authenticator)\n• **Agreements** — Digitally signed with OTP + IP logged\n\nAll connections use HTTPS/TLS encryption.`
    },
    {
        keywords: ['document', 'documents', 'upload', 'what documents', 'required documents', 'papers'],
        answer: `**Required documents for loan application:**\n\n**Identity (mandatory):**\n• Aadhaar Card (front + back)\n• PAN Card\n\n**Income (mandatory):**\n• Salary slips (last 3 months)\n• Bank statement (last 6 months)\n\n**Address (mandatory):**\n• Utility bill / rental agreement / passport\n\n**Photo:**\n• Recent passport size photograph\n\n**Optional:**\n• ITR / Form 16 (strengthens application)\n\nMax file size: **5 MB** per document. Accepted formats: image or PDF.`,
        followups: ['What is PAN number?', 'What is Aadhaar?', 'How to upload documents?']
    },
    {
        keywords: ['pan', 'pan number', 'pan card', 'pan format', 'permanent account'],
        answer: `**PAN Number on Nexus:**\n\n**Format:** AAAAA9999A (5 letters + 4 digits + 1 letter)\n**Example:** ABCDE1234F\n\nYour PAN is required in two places:\n1. **Loan application form** — employment verification (optional here)\n2. **Document upload page** — mandatory, must match valid format\n\nEnsure your PAN matches the name on your application to avoid fraud flags.`
    },
    {
        keywords: ['aadhaar', 'aadhar', 'aadhaar number', '12 digit', 'uid'],
        answer: `**Aadhaar Number on Nexus:**\n\n**Format:** 12 digits (e.g., 1234 5678 9012)\n\nRequired on the **Document Upload** page.\n\nFor your privacy, the officer only sees the **last 4 digits** (e.g., XXXX XXXX 3453).\n\nUpload both **front and back** of your Aadhaar card as separate documents.`
    },
    {
        keywords: ['document verified', 'verification status', 'doc rejected', 'document rejected', 'reupload'],
        answer: `**Document verification process:**\n\nAfter uploading, documents go through officer verification:\n\n• **Verified** — document accepted\n• **Rejected** — officer provides a reason (e.g., "blurry image")\n\nIf a document is rejected, re-upload a clearer version.\n\nVerification status is visible on the Loan Status page.`
    },
    {
        keywords: ['guarantor', 'guarantee', 'who is guarantor', 'guarantor required', 'guarantor otp'],
        answer: `**Guarantor on Nexus:**\n\nA guarantor is a person who vouches for your loan and is contacted for verification.\n\n**Required information:**\n• Full name\n• 10-digit mobile number\n• Relationship (Parent, Spouse, Friend, etc.)\n\n**Verification:** Their mobile number is verified via OTP before document submission. Ask your guarantor to share the 6-digit code sent to their phone.\n\nIf guarantor OTP is not verified, the officer will see a warning which may affect approval.`,
        followups: ['How does guarantor OTP work?', 'What if guarantor does not receive OTP?']
    },
    {
        keywords: ['guarantor otp', 'otp not received', 'otp expired', 'resend otp', 'otp verification'],
        answer: `**Guarantor OTP verification:**\n\n1. Enter guarantor name + 10-digit mobile on the Document Upload page\n2. Click **"Send OTP"** — OTP is sent to the guarantor's phone\n3. Ask your guarantor to share the 6-digit code\n4. Enter it and click **"Verify"**\n\n**OTP not received?**\n• Wait 60 seconds and click **"Resend"**\n• Confirm the mobile number is correct\n• Ensure the guarantor has network coverage\n\n**OTP expires in 10 minutes** — request a new one if expired.`
    },
    {
        keywords: ['agreement', 'loan agreement', 'digital signature', 'sign', 'otp sign', 'agreement otp'],
        answer: `**Digital Loan Agreement:**\n\nBefore your application is submitted, you must digitally sign the loan agreement.\n\n**Process:**\n1. After reviewing loan details, click **"Generate Loan Agreement"**\n2. A full agreement is generated with your details, EMI schedule, interest rate, and terms\n3. An OTP is sent to your registered email\n4. Enter the OTP to **digitally sign** the agreement\n5. Application status changes from "draft" to "pending"\n\n**The agreement includes:**\n• Loan amount, tenure, EMI, interest rate\n• Your PAN and guarantor details\n• All terms and conditions\n• Digital signature timestamp and IP address`,
        followups: ['What does the agreement contain?', 'Is the signature legally binding?']
    },
    {
        keywords: ['legally binding', 'legal', 'is it valid', 'agreement valid'],
        answer: `**Is the digital agreement legally valid?**\n\nYes. By entering the OTP, you confirm you have read and agreed to all terms. The system records:\n• **Timestamp** of signing\n• **IP address** of the device\n• **OTP verification** as proof of consent\n\nThis constitutes a legally binding digital signature under applicable e-signature regulations.`
    },
    {
        keywords: ['officer', 'loan officer', 'officer login', 'officer dashboard', 'admin'],
        answer: `**Officer portal on Nexus:**\n\nOfficers access the system via **/officer/login** with:\n• Email + password\n• **2FA TOTP** — Google Authenticator or equivalent app\n\n**Officer capabilities:**\n• View all loan applications\n• Review credit scores, bank transactions, fraud reports\n• Verify PAN, Aadhaar, and guarantor details\n• Approve or reject applications (triggers Stripe payout)\n• Mark loans as repaid (triggers credit score recalculation)\n• Verify or reject uploaded documents\n\nThe officer portal is restricted to authorized staff only.`
    },
    {
        keywords: ['2fa', 'two factor', 'authenticator', 'totp', 'setup 2fa', 'google authenticator'],
        answer: `**Officer 2FA (Two-Factor Authentication):**\n\nOfficers must configure 2FA to access the dashboard:\n\n1. Go to **/officer/setup-2fa**\n2. Scan the QR code with **Google Authenticator** or **Authy**\n3. Enter the 6-digit code to complete setup\n\nEvery login requires:\n1. Email + password\n2. 6-digit TOTP code from the authenticator app\n\nCodes refresh every 30 seconds. To reconfigure, visit **/officer/setup-2fa**.`
    },
    {
        keywords: ['fraud', 'fraud detection', 'flagged', 'fraud risk', 'blocked', 'suspicious'],
        answer: `**Fraud Detection on Nexus:**\n\nNexus automatically analyzes every application for fraud signals:\n\n**Checks performed:**\n• PAN format validity\n• Duplicate PAN/Aadhaar across applications\n• Name mismatches on the same PAN\n• Declared income vs actual bank credits\n• Round-number transaction patterns\n• Sudden large deposits before application\n• Inactive accounts with no debit activity\n\n**Risk levels:** Clean → Low → Medium → High → Critical\n\nApplications scoring 80+ are blocked pending investigation. Officers view the full fraud report in the Fraud Analysis tab.`
    },
    {
        keywords: ['forgot password', 'reset password', 'password reset', 'cant login', 'login issue'],
        answer: `**Forgot your password?**\n\n1. Go to the **Login page**\n2. Click **"Forgot password?"**\n3. Enter your registered email\n4. Check your inbox for a reset link\n5. Click the link and set a new password\n\n**Did not receive the email?**\n• Check your spam/junk folder\n• Confirm you used the correct email address\n• Wait 2–3 minutes and try again\n\nThe reset link expires after 1 hour.`
    },
    {
        keywords: ['google login', 'google sign in', 'oauth', 'sign in with google'],
        answer: `**Sign in with Google:**\n\nNexus supports Google OAuth login for applicants.\n\n1. Click **"Continue with Google"** on the login or signup page\n2. Select your Google account\n3. You will be redirected to the **onboarding page** to complete your profile\n4. Enter your name, age, and phone number\n5. Your account is ready\n\nGoogle login is for **applicants only** — officers must use email/password with 2FA.`
    },
    {
        keywords: ['signup', 'register', 'create account', 'new account', 'sign up'],
        answer: `**Creating your Nexus account:**\n\n1. Go to **/signup** or click **"Get Started"**\n2. Sign up with email/password or **Google**\n3. Verify your email if prompted\n4. Complete **onboarding** — enter name, age, phone\n5. You will be taken to your **dashboard**\n\nPassword requirements:\n• Minimum 6 characters\n• Stronger with uppercase letters, numbers, and symbols`
    },
    {
        keywords: ['onboarding', 'profile setup', 'complete profile', 'name age phone'],
        answer: `**Onboarding (first-time setup):**\n\nAfter creating your account, complete onboarding:\n\n• **Full Name** — used in loan applications and agreements\n• **Age** — must be 18 or older\n• **Phone number** — optional but recommended\n\nThis data is saved to your profile and auto-fills loan forms.\n\nIf onboarding is incomplete, you will be redirected to it when accessing protected pages.`
    },
    {
        keywords: ['dashboard', 'home', 'main page', 'where to start'],
        answer: `**Your Nexus Dashboard:**\n\nThe dashboard displays:\n\n• **Quick actions** — Connect Bank, Credit Score, Apply Loan, Loan Status\n• **Stats** — Total applications, approved, pending, rejected\n• **Credit score banner** — your latest score and grade\n• **Recent applications** — last 5 with current status\n• **Live updates** — status changes appear in real-time\n\nUse the quick action cards or the navigation bar to move between sections.`
    },
    {
        keywords: ['stripe', 'payment', 'disbursement', 'how is money sent', 'funds transfer'],
        answer: `**How loan disbursement works:**\n\nNexus uses **Stripe** for loan disbursement:\n\n1. Officer approves the application\n2. A Stripe **PaymentIntent** is created automatically\n3. Funds are disbursed (simulated in sandbox mode)\n4. A Stripe Payment ID is saved to your application record\n\n**In production:** Real bank transfers would use Stripe Connect or NEFT/IMPS.\n\n**Current mode:** Sandbox — payments are simulated, no real money is transferred.`
    },
    {
        keywords: ['__fallback__'],
        answer: `I was unable to find a match for your query. Here are some topics I can assist with:\n\n• **Loan application** — how to apply, eligibility\n• **Credit score** — calculation, improving it\n• **EMI repayment** — paying EMIs, schedules\n• **Documents** — what to upload\n• **Security** — how your data is protected\n• **Account** — login, password reset\n\nPlease rephrase your question or select one of the suggestions below.`,
        followups: ['How do I apply for a loan?', 'How is credit score calculated?', 'How do I pay EMI?']
    }
]

// ── Chat Engine ───────────────────────────────────────────────

interface Message {
    id: number
    from: 'bot' | 'user'
    text: string
    followups?: string[]
    time: string
}

function findAnswer(input: string): QA {
    const q = input.toLowerCase().trim()
    let best: QA | null = null
    let bestScore = 0
    for (const qa of KB) {
        if (qa.keywords[0] === '__fallback__') continue
        let score = 0
        for (const kw of qa.keywords) {
            if (q.includes(kw)) score += kw.split(' ').length * 2
        }
        if (score > bestScore) { bestScore = score; best = qa }
    }
    return bestScore > 0 ? best! : KB[KB.length - 1]
}

function formatText(text: string): React.ReactNode[] {
    const lines = text.split('\n')
    return lines.map((line, i) => {
        if (line.startsWith('| ')) {
            const cells = line.split('|').filter(c => c.trim())
            return (
                <tr key={i} className={i === 0 ? 'bg-slate-100' : 'border-b border-slate-100'}>
                    {cells.map((c, j) => (
                        <td key={j} className="px-2 py-1 text-xs text-on-surface">{c.trim()}</td>
                    ))}
                </tr>
            )
        }
        if (line.startsWith('• ') || line.startsWith('* ')) {
            return <li key={i} className="ml-3 text-xs leading-relaxed text-on-surface-variant">{renderInline(line.slice(2))}</li>
        }
        if (line.match(/^\d\./)) {
            return <li key={i} className="ml-3 text-xs leading-relaxed list-decimal text-on-surface-variant">{renderInline(line.replace(/^\d\./, '').trim())}</li>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={i} className="font-bold text-xs text-primary mt-2">{line.replace(/\*\*/g, '')}</p>
        }
        if (line === '') return <div key={i} className="h-1" />
        return <p key={i} className="text-xs leading-relaxed text-on-surface">{renderInline(line)}</p>
    })
}

function renderInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>
            : part
    )
}

function now() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const QUICK_ACTIONS = [
    'How do I apply for a loan?',
    'How is credit score calculated?',
    'How do I pay EMI?',
    'What documents do I need?',
    'How does fraud detection work?',
]

let msgId = 0

// ── Component ─────────────────────────────────────────────────

export default function NexusChat() {
    const [open, setOpen]         = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: ++msgId,
            from: 'bot',
            text: `Welcome to Nexus. I can answer questions about loans, credit scores, EMI repayments, documents, and more.\n\nHow can I assist you today?`,
            followups: QUICK_ACTIONS.slice(0, 3),
            time: now()
        }
    ])
    const [input, setInput]   = useState('')
    const [typing, setTyping] = useState(false)
    const [unread, setUnread] = useState(0)
    const bottomRef           = useRef<HTMLDivElement>(null)
    const inputRef            = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setUnread(0)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, typing])

    const sendMessage = (text: string) => {
        if (!text.trim()) return
        const userMsg: Message = { id: ++msgId, from: 'user', text: text.trim(), time: now() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setTyping(true)
        setTimeout(() => {
            const qa = findAnswer(text)
            const botMsg: Message = { id: ++msgId, from: 'bot', text: qa.answer, followups: qa.followups, time: now() }
            setMessages(prev => [...prev, botMsg])
            setTyping(false)
            if (!open) setUnread(u => u + 1)
        }, 600 + Math.random() * 400)
    }

    const hasTables = (text: string) => text.includes('|')

    // ── Nexus logo mark (reused in header + bubble + bot avatar) ──
    const LogoMark = ({ size = 18, opacity2 = '0.5' }: { size?: number; opacity2?: string }) => (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
            <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity={opacity2} />
            <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity={opacity2} />
            <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
        </svg>
    )

    return (
        <>
            {/* ── Floating Bubble ── */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                    background: 'linear-gradient(135deg, #001736, #002b5b)',
                    boxShadow: '0 4px 20px rgba(0,23,54,0.45)'
                }}>
                {open ? (
                    <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                              stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                {unread > 0 && !open && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unread}
                    </span>
                )}
            </button>

            {/* ── Chat Window ── */}
            {open && (
                <div
                    className="fixed bottom-24 right-6 z-50 w-96 flex flex-col rounded-xl overflow-hidden"
                    style={{
                        height: '580px',
                        boxShadow: '0 8px 32px rgba(0,23,54,0.18), 0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(196,198,208,0.4)'
                    }}>

                    {/* ── Header (Stitch style) ── */}
                    <header
                        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                        style={{ background: 'rgba(247,249,251,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(196,198,208,0.3)' }}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                     style={{ background: '#001736' }}>
                                    <LogoMark size={18} opacity2="0.5" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="font-bold text-sm leading-none" style={{ color: '#001736' }}>Nexus AI</h1>
                                <span className="text-green-600 font-bold uppercase tracking-widest mt-1" style={{ fontSize: '10px' }}>Active</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
                            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                                <path d="M2 2l10 10M12 2L2 12" stroke="#747780" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>
                    </header>

                    {/* ── Messages ── */}
                    <div
                        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
                        style={{ background: '#f2f4f6', scrollbarWidth: 'thin' }}>

                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${msg.from === 'bot' ? 'flex gap-2.5' : ''}`}>

                                    {/* Bot avatar */}
                                    {msg.from === 'bot' && (
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                             style={{ background: '#001736' }}>
                                            <LogoMark size={14} opacity2="0.6" />
                                        </div>
                                    )}

                                    <div>
                                        {/* Bubble */}
                                        <div
                                            className={`rounded-xl px-4 py-3 ${
                                                msg.from === 'user'
                                                    ? 'rounded-tr-sm text-white'
                                                    : 'rounded-tl-sm'
                                            }`}
                                            style={msg.from === 'user'
                                                ? { background: '#001736', boxShadow: '0 1px 4px rgba(0,23,54,0.2)' }
                                                : { background: '#ffffff', border: '1px solid rgba(196,198,208,0.3)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
                                            }>
                                            {msg.from === 'user' ? (
                                                <p className="text-xs text-white leading-relaxed">{msg.text}</p>
                                            ) : (
                                                <div>
                                                    {hasTables(msg.text) ? (
                                                        <table className="w-full text-xs border-collapse">
                                                            <tbody>{formatText(msg.text)}</tbody>
                                                        </table>
                                                    ) : (
                                                        <div className="space-y-0.5">{formatText(msg.text)}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <p className="text-xs mt-1 px-1" style={{ color: '#c4c6d0' }}>{msg.time}</p>

                                        {/* Follow-up chips */}
                                        {msg.followups && msg.followups.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {msg.followups.map((f, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => sendMessage(f)}
                                                        className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors hover:opacity-80"
                                                        style={{ background: '#eceef0', border: '1px solid #c4c6d0', color: '#0060ac' }}>
                                                        {f}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {typing && (
                            <div className="flex justify-start">
                                <div className="flex gap-2.5">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                         style={{ background: '#001736' }}>
                                        <LogoMark size={14} opacity2="0.6" />
                                    </div>
                                    <div className="rounded-xl rounded-tl-sm px-4 py-3"
                                         style={{ background: '#ffffff', border: '1px solid rgba(196,198,208,0.3)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <div className="flex items-center gap-1.5 py-1">
                                            {[0, 150, 300].map(delay => (
                                                <div
                                                    key={delay}
                                                    className="w-2 h-2 rounded-full animate-bounce"
                                                    style={{ background: '#0060ac', animationDelay: `${delay}ms` }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* ── Quick Action Chips (Stitch style scrollable row) ── */}
                    <div
                        className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0"
                        style={{ background: '#ffffff', borderTop: '1px solid rgba(196,198,208,0.3)', scrollbarWidth: 'none' }}>
                        {QUICK_ACTIONS.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(q)}
                                className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0 transition-colors hover:opacity-80"
                                style={{ background: 'rgba(224,227,229,0.5)', border: '1px solid rgba(196,198,208,0.3)', color: '#43474f' }}>
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* ── Input Bar (Stitch style) ── */}
                    <div
                        className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
                        style={{ background: '#ffffff', borderTop: '1px solid rgba(196,198,208,0.3)' }}>
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                                placeholder="Message Nexus AI..."
                                className="w-full rounded-xl px-4 py-3 text-xs outline-none transition-all"
                                style={{
                                    background: '#eceef0',
                                    border: 'none',
                                    color: '#191c1e',
                                }}
                                onFocus={e => { e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                                onBlur={e => { e.target.style.boxShadow = 'none' }}
                            />
                        </div>
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim()}
                            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #001736, #002b5b)',
                                boxShadow: '0 2px 10px rgba(0,23,54,0.25)'
                            }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M12 7L2 2l2.5 5L2 12l10-5z" fill="white" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}