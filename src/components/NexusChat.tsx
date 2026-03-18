import { useState, useRef, useEffect } from 'react'

// ── Knowledge Base ────────────────────────────────────────────
interface QA {
    keywords: string[]
    answer: string
    followups?: string[]
}

const KB: QA[] = [
    // ── Getting Started ──
    {
        keywords: ['hello', 'hi', 'hey', 'start', 'help', 'what can you do', 'nexus'],
        answer: `👋 Hi! I'm the Nexus assistant. I can help you with:\n\n• **Loan applications** — how to apply, eligibility, status\n• **Credit score** — how it's calculated, improving it\n• **EMI repayments** — paying EMIs, schedules, interest\n• **Documents** — what to upload, PAN, Aadhaar\n• **Guarantor & OTP** — verification process\n• **Loan agreement** — digital signing\n• **Fraud & security** — how we protect you\n\nWhat would you like to know?`,
        followups: ['How do I apply for a loan?', 'What is my credit score?', 'How do I pay EMI?']
    },

    // ── Loan Application ──
    {
        keywords: ['apply', 'loan', 'application', 'how to apply', 'new loan', 'apply loan'],
        answer: `📋 **How to apply for a loan on Nexus:**\n\n1. **Connect your bank** via Plaid (secure, read-only)\n2. **Get your credit score** — AI analyzes your bank data\n3. **Fill the loan form** — amount, purpose, employment, PAN\n4. **Sign the agreement** — digital signature via OTP\n5. **Upload documents** — Aadhaar, PAN card, salary slip, etc.\n6. **Officer reviews** — decision within 24 hours\n7. **Funds disbursed** — via Stripe on approval\n\nYou can start by clicking **Apply for Loan** on your dashboard.`,
        followups: ['What documents do I need?', 'How long does approval take?', 'What is the loan limit?']
    },
    {
        keywords: ['how long', 'approval time', 'when will', 'decision', 'how many days'],
        answer: `⏱️ **Loan approval timeline:**\n\n• AI credit analysis: **instant** (seconds)\n• Officer review: **within 24 hours**\n• Funds disbursed: **immediately** after approval via Stripe\n\nYou'll see real-time status updates on the Loan Status page. The page updates live — no need to refresh.`,
        followups: ['How do I check my loan status?', 'What if my loan is rejected?']
    },
    {
        keywords: ['status', 'check status', 'my loan', 'application status', 'pending', 'approved', 'rejected'],
        answer: `📊 **Checking your loan status:**\n\nGo to **Loan Status** from your dashboard. You'll see:\n\n• **⏳ Pending** — officer is reviewing\n• **✅ Approved** — loan disbursed, start paying EMIs\n• **❌ Rejected** — see officer notes for reason\n• **🏆 Repaid** — loan fully paid off\n\nUpdates happen in real-time via live subscriptions.`,
        followups: ['Why was my loan rejected?', 'How do I pay EMI?']
    },
    {
        keywords: ['rejected', 'rejection', 'not approved', 'why rejected', 'declined'],
        answer: `❌ **If your loan was rejected:**\n\nCheck the officer notes on your Loan Status page — they explain the reason.\n\nCommon reasons:\n• Low credit score (below 500)\n• Income too low for requested amount\n• Incomplete documents\n• Fraud risk flags detected\n• Guarantor OTP not verified\n\n**What to do:** Improve your credit score, ensure all documents are uploaded, and try again. You can apply for a smaller amount too.`,
        followups: ['How do I improve my credit score?', 'What documents are required?']
    },

    // ── Loan Amount & Limits ──
    {
        keywords: ['limit', 'maximum', 'how much', 'loan amount', 'eligible', 'eligibility', 'how much can i borrow'],
        answer: `💰 **Loan limits based on your credit grade:**\n\n| Grade | Score | Max Loan |\n|-------|-------|----------|\n| Excellent | 800+ | ₹10,00,000 |\n| Very Good | 700–799 | ₹5,00,000 |\n| Good | 600–699 | ₹3,00,000 |\n| Fair | 500–599 | ₹1,50,000 |\n| Poor | Below 500 | Not eligible |\n\nYour limit is shown dynamically on the loan application form based on your latest credit score.`,
        followups: ['How is credit score calculated?', 'How do I improve my score?']
    },
    {
        keywords: ['interest', 'interest rate', 'rate', 'how much interest', 'annual rate'],
        answer: `📈 **Interest rates on Nexus (reducing balance):**\n\n| Credit Grade | Annual Rate |\n|--------------|-------------|\n| Excellent | 10.5% p.a. |\n| Very Good | 11.5% p.a. |\n| Good | 13.5% p.a. |\n| Fair | 16.0% p.a. |\n| Poor | 18.5% p.a. |\n\nInterest is calculated on a **reducing balance** basis — meaning each month you pay less interest as your principal decreases.`,
        followups: ['How is EMI calculated?', 'Can I repay early?']
    },
    {
        keywords: ['purpose', 'loan type', 'personal', 'home loan', 'education', 'business loan', 'medical', 'vehicle'],
        answer: `🎯 **Loan purposes available on Nexus:**\n\n• 👤 **Personal** — any personal expense\n• 🏠 **Home** — home improvement or purchase\n• 🎓 **Education** — tuition, courses, study abroad\n• 💼 **Business** — business expansion or startup\n• 🏥 **Medical** — healthcare, surgery, treatment\n• 🚗 **Vehicle** — two-wheeler or four-wheeler\n\nSelect your purpose during the loan application.`
    },

    // ── Credit Score ──
    {
        keywords: ['credit score', 'score', 'cibil', 'how is score', 'credit rating', 'my score'],
        answer: `📊 **How your Nexus credit score works:**\n\nScore range: **300 – 950**\n\n**For first-time users (Cold Start):**\n• Transaction regularity (30%)\n• Account balance stability (25%)\n• Income signals from bank data (25%)\n• Spending health (20%)\nMax score: **750**\n\n**For returning users:**\n• Repayment track record (30%)\n• Prior repayment history (15%)\n• Transaction regularity (20%)\n• Balance stability (15%)\n• Income signals (12%)\n• Spending health (8%)\nMax score: **950**\n\nGo to **Credit Score** page for your full breakdown.`,
        followups: ['How do I improve my score?', 'What is cold start?', 'What is repayment bonus?']
    },
    {
        keywords: ['improve', 'increase score', 'boost score', 'better score', 'higher score'],
        answer: `🚀 **How to improve your credit score:**\n\n1. **Repay loans on time** — biggest boost (+20 to +50 points)\n2. **Maintain bank balance** — keep ₹25,000+ average\n3. **Regular transactions** — active account shows stability\n4. **Healthy spending** — keep discretionary spending under 20%\n5. **Consistent income** — regular salary credits\n6. **Pay EMIs on time** — late payments hurt your score\n\n💡 **Pro tip:** Fully repay your current loan on time to unlock a **+20 to +50 point bonus** on your next application!`,
        followups: ['What is the repayment bonus?', 'How do I pay EMI?']
    },
    {
        keywords: ['cold start', 'first time', 'no credit history', 'new user', 'cold start profile'],
        answer: `🌟 **Cold Start — First-time borrowers:**\n\nIf you have no previous loans with Nexus, you are a **Cold Start** user.\n\n• Your score is calculated purely from your **bank data** via Plaid\n• Max score is capped at **750** (vs 950 for returning borrowers)\n• You're still eligible for loans up to ₹5,00,000 with a strong score\n\n**Once you repay your first loan**, you become a **returning borrower** — your cap increases to 950 and you get repayment bonus points.`,
        followups: ['How is credit score calculated?', 'What is the repayment bonus?']
    },
    {
        keywords: ['repayment bonus', 'score boost', 'returning borrower', 'bonus points', 'paid loan'],
        answer: `🏆 **Repayment bonus for returning borrowers:**\n\nWhen you fully repay a loan, you get bonus points on your next credit score calculation:\n\n| Loans Repaid | Bonus Points |\n|--------------|---------------|\n| 1 loan | +20 points |\n| 2 loans | +35 points |\n| 3+ loans | +50 points |\n\nYour score cap also increases from 750 to **950**. Repaying on time gives you the full bonus. Late repayment still counts but with a lower weight.`,
        followups: ['How do I pay EMI?', 'How is credit score calculated?']
    },

    // ── EMI & Repayment ──
    {
        keywords: ['emi', 'pay emi', 'monthly payment', 'repay', 'repayment', 'installment', 'monthly instalment'],
        answer: `💳 **Paying your EMI on Nexus:**\n\n1. Go to **Loan Status** page\n2. Click **"Pay EMI →"** on your approved loan\n3. You'll see your full EMI schedule\n4. Click **"Pay ₹X"** to pay the next EMI\n\n**Each EMI includes:**\n• Principal (reduces your loan balance)\n• Interest (based on remaining balance)\n\nAs you pay more EMIs, your interest portion decreases each month (reducing balance method).`,
        followups: ['What happens if I miss an EMI?', 'How is EMI calculated?', 'Can I pay early?']
    },
    {
        keywords: ['emi calculation', 'how is emi', 'calculate emi', 'emi formula', 'how much emi'],
        answer: `🧮 **EMI Calculation:**\n\nNexus uses the standard **reducing balance EMI formula:**\n\nEMI = P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)\n\nWhere:\n• **P** = Principal loan amount\n• **r** = Monthly interest rate (annual rate ÷ 12 ÷ 100)\n• **n** = Tenure in months\n\n**Example:** ₹1,00,000 loan at 13.5% for 12 months\n→ Monthly rate = 1.125%\n→ EMI = **₹8,934/month**\n→ Total payable = ₹1,07,208`,
        followups: ['What is the interest rate?', 'How do I pay EMI?']
    },
    {
        keywords: ['miss emi', 'late payment', 'overdue', 'missed payment', 'default', 'skip emi'],
        answer: `⚠️ **If you miss or pay late:**\n\n• The EMI is marked as **"⚠️ Late"** in your schedule\n• It affects your **repaid_on_time** status\n• When the loan is fully repaid, late payments mean you won't get the full "on time" credit boost\n• Overdue EMIs show a **🚨 red warning** on your repayment page\n\n**Advice:** Always pay on or before the due date to maximize your credit score boost.`,
        followups: ['How do I pay overdue EMI?', 'How does this affect my credit score?']
    },
    {
        keywords: ['fully paid', 'complete repayment', 'finish loan', 'all emis paid', 'loan complete'],
        answer: `🏆 **When your loan is fully repaid:**\n\n1. Loan status changes to **"REPAID"** automatically\n2. You get a **🏆 trophy banner** on your Loan Status page\n3. Officer sees the repaid status in their dashboard\n4. Your **credit score gets boosted** on next calculation\n5. You can apply for a **new loan immediately** — no longer a cold start user\n\nYou'll also see a button: **"Apply for Next Loan →"**`,
        followups: ['What is the repayment bonus?', 'How do I apply for a new loan?']
    },
    {
        keywords: ['early repay', 'prepay', 'pay full', 'close loan', 'foreclose'],
        answer: `💡 **Early repayment / prepayment:**\n\nCurrently Nexus processes EMIs one at a time monthly. To fully close a loan early, you can pay EMIs consecutively in quick succession.\n\nEach payment reduces your outstanding balance. The interest portion of subsequent EMIs will be lower due to the reducing balance method.\n\n**Tip:** Contact your officer if you want to arrange a bulk settlement.`
    },

    // ── Bank Connection ──
    {
        keywords: ['connect bank', 'plaid', 'bank account', 'link bank', 'bank connection', 'bank data'],
        answer: `🏦 **Connecting your bank via Plaid:**\n\n1. Go to **Connect Bank** from your dashboard\n2. Click "Connect Bank Account"\n3. Select your bank from Plaid's list\n4. Enter your bank credentials (secure, encrypted)\n5. Plaid fetches your accounts and last 90 days of transactions\n\n**Is it safe?** Yes — Plaid uses bank-grade 256-bit encryption. Nexus gets **read-only** access — we cannot move money.\n\nYour bank data is used solely for credit score calculation.`,
        followups: ['Is my data safe?', 'How is credit score calculated?']
    },
    {
        keywords: ['safe', 'secure', 'privacy', 'data safe', 'bank credentials', 'encrypted', 'security'],
        answer: `🔒 **Your data is completely safe on Nexus:**\n\n• **Bank data** — Read-only via Plaid, AES-256 encrypted\n• **Documents** — Stored in private Supabase storage vault\n• **OTPs** — Never shown on screen, sent to registered mobile only\n• **Passwords** — Hashed, never stored in plain text\n• **Officer login** — Protected with 2FA (TOTP authenticator)\n• **Agreements** — Digitally signed with OTP + IP logged\n\nAll connections use HTTPS/TLS encryption.`
    },

    // ── Documents ──
    {
        keywords: ['document', 'documents', 'upload', 'what documents', 'required documents', 'papers'],
        answer: `📄 **Required documents for loan application:**\n\n**Identity (mandatory):**\n• 🪪 Aadhaar Card (front + back)\n• 💳 PAN Card\n\n**Income (mandatory):**\n• 💰 Salary slips (last 3 months)\n• 🏦 Bank statement (last 6 months)\n\n**Address (mandatory):**\n• 🏠 Utility bill / rental agreement / passport\n\n**Photo:**\n• 📷 Recent passport size photo\n\n**Optional:**\n• 📊 ITR / Form 16 (strengthens application)\n\nMax file size: **5 MB** per document. Accepted: images or PDF.`,
        followups: ['What is PAN number?', 'What is Aadhaar?', 'How to upload documents?']
    },
    {
        keywords: ['pan', 'pan number', 'pan card', 'pan format', 'permanent account'],
        answer: `🔢 **PAN Number on Nexus:**\n\n**Format:** AAAAA9999A (5 letters + 4 digits + 1 letter)\n**Example:** ABCDE1234F\n\nYour PAN is required in **two places:**\n1. **Loan application form** — employment verification (optional here)\n2. **Document upload page** — mandatory, must be valid format\n\nYou also need to upload your **PAN card photo** as a document.\n\n⚠️ Make sure your PAN matches the name on your application to avoid fraud flags.`
    },
    {
        keywords: ['aadhaar', 'aadhar', 'aadhaar number', '12 digit', 'uid'],
        answer: `🪪 **Aadhaar Number on Nexus:**\n\n**Format:** 12 digits (e.g., 1234 5678 9012)\n\nRequired in the **Document Upload** page.\n\n**How we display it:** For your privacy, the officer only sees the **last 4 digits** (e.g., XXXX XXXX 3453).\n\nYou also need to upload both **front and back** of your Aadhaar card as documents.`
    },
    {
        keywords: ['document verified', 'verification status', 'doc rejected', 'document rejected', 'reupload'],
        answer: `✅ **Document verification process:**\n\nAfter uploading, your documents go through **officer verification:**\n\n• **✅ Verified** — document accepted\n• **❌ Rejected** — officer gives a reason (e.g., "blurry image")\n\nIf a document is rejected, you need to re-upload a clearer version.\n\nStatus is shown in the Officer Review panel. You can track whether your documents are verified on the Loan Status page.`
    },

    // ── Guarantor & OTP ──
    {
        keywords: ['guarantor', 'guarantee', 'who is guarantor', 'guarantor required', 'guarantor otp'],
        answer: `👥 **Guarantor on Nexus:**\n\nA guarantor is a **person who vouches for your loan** — they are contacted for verification.\n\n**Required information:**\n• Full name\n• 10-digit mobile number\n• Relationship (Parent, Spouse, Friend, etc.)\n\n**Verification:** Their mobile number is verified via **OTP** before you can submit your documents. This OTP is sent to the guarantor's phone — ask them to share the 6-digit code.\n\n⚠️ If guarantor OTP is not verified, the officer sees a warning and may not approve the loan.`,
        followups: ['How does guarantor OTP work?', 'What if guarantor does not receive OTP?']
    },
    {
        keywords: ['guarantor otp', 'otp not received', 'otp expired', 'resend otp', 'otp verification'],
        answer: `📱 **Guarantor OTP verification:**\n\n1. Enter guarantor name + 10-digit mobile on Document Upload page\n2. Click **"Send OTP"** — OTP is sent to the guarantor's phone\n3. Ask your guarantor to share the 6-digit code\n4. Enter it and click **"✅ Verify"**\n\n**OTP not received?**\n• Wait 60 seconds and click **"Resend"**\n• Check the mobile number is correct\n• Make sure guarantor has network coverage\n\n**OTP expires in 10 minutes** — request a new one if expired.`
    },

    // ── Loan Agreement ──
    {
        keywords: ['agreement', 'loan agreement', 'digital signature', 'sign', 'otp sign', 'agreement otp'],
        answer: `✍️ **Digital Loan Agreement:**\n\nBefore your application is submitted, you must **digitally sign** the loan agreement.\n\n**Process:**\n1. After reviewing loan details, click **"Generate Loan Agreement →"**\n2. A full loan agreement PDF is generated with your details, EMI schedule, interest rate, and terms\n3. An OTP is sent to your registered email\n4. Enter the OTP to **digitally sign** the agreement\n5. Application status changes from "draft" to "pending"\n\n**The agreement includes:**\n• Loan amount, tenure, EMI, interest rate\n• Your PAN, guarantor details\n• All terms and conditions\n• Your digital signature timestamp + IP`,
        followups: ['What does the agreement contain?', 'Is the signature legally binding?']
    },
    {
        keywords: ['legally binding', 'legal', 'is it valid', 'agreement valid'],
        answer: `⚖️ **Is the digital agreement legally valid?**\n\nYes. By entering the OTP, you confirm you have read and agreed to all terms. The system records:\n• **Timestamp** of signing\n• **IP address** of the device\n• **OTP verification** as proof of consent\n\nThis constitutes a legally binding digital signature under applicable e-signature regulations.`
    },

    // ── Officer / Admin ──
    {
        keywords: ['officer', 'loan officer', 'officer login', 'officer dashboard', 'admin'],
        answer: `👨‍💼 **Officer portal on Nexus:**\n\nOfficers access the system via **/officer/login** with:\n• Email + password (set in .env)\n• **2FA TOTP** — Google Authenticator or similar app\n\n**What officers can do:**\n• View all loan applications\n• Review credit scores, bank transactions, fraud reports\n• See PAN, Aadhaar, guarantor details\n• Approve or reject applications (triggers Stripe payout)\n• Mark loans as repaid (triggers credit score boost)\n• Verify/reject uploaded documents\n\n⚠️ Officer portal is for staff only — not accessible to applicants.`
    },
    {
        keywords: ['2fa', 'two factor', 'authenticator', 'totp', 'setup 2fa', 'google authenticator'],
        answer: `🔐 **Officer 2FA (Two-Factor Authentication):**\n\nOfficers must set up 2FA to access the dashboard:\n\n1. Go to **/officer/setup-2fa**\n2. Scan the QR code with **Google Authenticator** or **Authy**\n3. Enter the 6-digit code to verify setup\n\nEvery login requires:\n1. Email + password\n2. 6-digit TOTP code from your authenticator app\n\nCodes refresh every 30 seconds. If you lose access, go to **/officer/setup-2fa** to re-configure.`
    },

    // ── Fraud Detection ──
    {
        keywords: ['fraud', 'fraud detection', 'flagged', 'fraud risk', 'blocked', 'suspicious'],
        answer: `🔍 **Fraud Detection on Nexus:**\n\nNexus automatically checks every application for fraud signals:\n\n**What gets checked:**\n• PAN format validity\n• Duplicate PAN/Aadhaar across applications\n• Name mismatches on same PAN\n• Income declared vs bank credits mismatch\n• Round-number transaction patterns (fabricated data)\n• Sudden large deposits before application\n• Inactive accounts (no debit activity)\n\n**Risk levels:** Clean → Low → Medium → High → Critical\n\nApplications scoring 80+ are **blocked** pending investigation. Officers see the full fraud report in the 🔍 Fraud tab.`
    },

    // ── Account & Auth ──
    {
        keywords: ['forgot password', 'reset password', 'password reset', 'cant login', 'login issue'],
        answer: `🔑 **Forgot your password?**\n\n1. Go to the **Login page**\n2. Click **"Forgot password?"**\n3. Enter your registered email\n4. Check your inbox for a reset link\n5. Click the link and set a new password\n\n**Didn't receive the email?**\n• Check your spam/junk folder\n• Make sure you used the correct email\n• Wait 2–3 minutes and try again\n\nThe reset link expires after 1 hour.`
    },
    {
        keywords: ['google login', 'google sign in', 'oauth', 'sign in with google'],
        answer: `🔵 **Sign in with Google:**\n\nNexus supports Google OAuth login for applicants.\n\n1. Click **"Continue with Google"** on the login or signup page\n2. Select your Google account\n3. You'll be redirected to the **onboarding page** to complete your profile\n4. Enter your name, age, and phone number\n5. You're ready to use Nexus!\n\n⚠️ Google login is for **applicants only** — officers must use email/password with 2FA.`
    },
    {
        keywords: ['signup', 'register', 'create account', 'new account', 'sign up'],
        answer: `✨ **Creating your Nexus account:**\n\n1. Go to **/signup** or click **"Get Started"**\n2. Choose **"Applicant"** role\n3. Sign up with email/password or **Google**\n4. Verify your email if required\n5. Complete **onboarding** — enter name, age, phone\n6. You'll be taken to your **dashboard**\n\nPassword requirements:\n• Minimum 6 characters\n• Stronger with uppercase, numbers, symbols`
    },
    {
        keywords: ['onboarding', 'profile setup', 'complete profile', 'name age phone'],
        answer: `👤 **Onboarding (first-time setup):**\n\nAfter creating your account, you must complete onboarding:\n\n• **Full Name** — used in loan applications and agreements\n• **Age** — must be 18 or older\n• **Phone number** — optional but recommended\n\nThis data is saved to your profile and auto-fills loan forms.\n\nIf you skip onboarding, you'll be redirected back to it whenever you try to access protected pages.`
    },

    // ── Dashboard ──
    {
        keywords: ['dashboard', 'home', 'main page', 'where to start'],
        answer: `🏠 **Your Nexus Dashboard:**\n\nThe dashboard shows:\n\n• **Quick actions** — Connect Bank, Credit Score, Apply Loan, Loan Status\n• **Stats** — Total applications, approved, pending, rejected\n• **Credit score banner** — your latest score and grade\n• **Recent applications** — last 5 with status\n• **Live updates** — status changes appear in real-time\n\nNavigate using the quick action cards or the buttons in the navbar.`
    },
    {
        keywords: ['stripe', 'payment', 'disbursement', 'how is money sent', 'funds transfer'],
        answer: `💸 **How loan disbursement works:**\n\nNexus uses **Stripe** for loan disbursement:\n\n1. Officer approves application\n2. Stripe **PaymentIntent** is created automatically\n3. Funds are "disbursed" (simulated in sandbox mode)\n4. A **Stripe Payment ID** is saved to your application\n\n**In production:** Real bank transfers would be used via Stripe Connect or NEFT/IMPS.\n\n**Current mode:** Sandbox — payments are simulated, no real money moves.`
    },

    // ── Fallback ──
    {
        keywords: ['__fallback__'],
        answer: `🤔 I didn't quite catch that. Here are some things I can help with:\n\n• **Loan application** — how to apply, eligibility\n• **Credit score** — calculation, improving it\n• **EMI repayment** — paying EMIs, schedules\n• **Documents** — what to upload\n• **Security** — how your data is protected\n• **Account** — login, password reset\n\nTry rephrasing your question or pick one of the suggestions below.`,
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
            // Table row
            const cells = line.split('|').filter(c => c.trim())
            return (
                <tr key={i} className={i === 0 ? 'bg-purple-100/50' : 'border-b border-purple-100/30'}>
                    {cells.map((c, j) => (
                        <td key={j} className="px-2 py-1 text-xs">{c.trim()}</td>
                    ))}
                </tr>
            )
        }
        if (line.startsWith('• ') || line.startsWith('* ')) {
            return <li key={i} className="ml-3 text-xs leading-relaxed">{renderInline(line.slice(2))}</li>
        }
        if (line.match(/^\d\./)) {
            return <li key={i} className="ml-3 text-xs leading-relaxed list-decimal">{renderInline(line.replace(/^\d\./, '').trim())}</li>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={i} className="font-bold text-xs text-purple-800 mt-2">{line.replace(/\*\*/g, '')}</p>
        }
        if (line === '') return <div key={i} className="h-1" />
        return <p key={i} className="text-xs leading-relaxed">{renderInline(line)}</p>
    })
}

function renderInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-semibold text-purple-900">{part.slice(2, -2)}</strong>
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
    const [open, setOpen]       = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: ++msgId,
            from: 'bot',
            text: `👋 Hi! I'm the **Nexus Assistant**. I can answer any questions about loans, credit scores, EMI repayments, documents, and more.\n\nHow can I help you today?`,
            followups: QUICK_ACTIONS.slice(0, 3),
            time: now()
        }
    ])
    const [input, setInput]     = useState('')
    const [typing, setTyping]   = useState(false)
    const [unread, setUnread]   = useState(0)
    const bottomRef             = useRef<HTMLDivElement>(null)
    const inputRef              = useRef<HTMLInputElement>(null)

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
            const botMsg: Message = {
                id: ++msgId,
                from: 'bot',
                text: qa.answer,
                followups: qa.followups,
                time: now()
            }
            setMessages(prev => [...prev, botMsg])
            setTyping(false)
            if (!open) setUnread(u => u + 1)
        }, 600 + Math.random() * 400)
    }

    const hasTables = (text: string) => text.includes('|')

    return (
        <>
            {/* Floating bubble */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-all duration-200 hover:scale-110"
                style={{ boxShadow: '0 4px 20px rgba(109,40,217,0.5)' }}>
                {open ? (
                    <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                )}
                {unread > 0 && !open && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unread}
                    </span>
                )}
            </button>

            {/* Chat window */}
            {open && (
                <div
                    className="fixed bottom-24 right-6 z-50 w-96 flex flex-col rounded-2xl overflow-hidden"
                    style={{
                        height: '560px',
                        boxShadow: '0 8px 40px rgba(109,40,217,0.25), 0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(109,40,217,0.2)'
                    }}>

                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
                                <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
                                <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
                                <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm">Nexus Assistant</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                <p className="text-purple-200 text-xs">Always online</p>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)}
                                className="text-white/60 hover:text-white transition-colors flex-shrink-0">
                            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50"
                         style={{ scrollbarWidth: 'thin' }}>

                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] ${msg.from === 'user' ? '' : 'flex gap-2.5'}`}>

                                    {msg.from === 'bot' && (
                                        <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                                                <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
                                                <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
                                                <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
                                                <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
                                            </svg>
                                        </div>
                                    )}

                                    <div>
                                        <div className={`rounded-2xl px-4 py-3 ${
                                            msg.from === 'user'
                                                ? 'bg-purple-600 text-white rounded-tr-sm'
                                                : 'bg-white border border-purple-100 text-gray-700 rounded-tl-sm'
                                        }`}
                                             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

                                            {msg.from === 'user' ? (
                                                <p className="text-xs text-white leading-relaxed">{msg.text}</p>
                                            ) : (
                                                <div className="text-gray-700">
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
                                        <p className="text-gray-300 text-xs mt-1 px-1">{msg.time}</p>

                                        {/* Follow-up suggestions */}
                                        {msg.followups && msg.followups.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {msg.followups.map((f, i) => (
                                                    <button key={i} onClick={() => sendMessage(f)}
                                                            className="text-xs bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors font-medium">
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
                                    <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                                            <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
                                            <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
                                            <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
                                            <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
                                        </svg>
                                    </div>
                                    <div className="bg-white border border-purple-100 rounded-2xl rounded-tl-sm px-4 py-3"
                                         style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                        <div className="flex items-center gap-1.5 py-1">
                                            {[0, 150, 300].map(delay => (
                                                <div key={delay}
                                                     className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                                                     style={{ animationDelay: `${delay}ms` }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick actions */}
                    <div className="bg-white border-t border-purple-50 px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0"
                         style={{ scrollbarWidth: 'none' }}>
                        {QUICK_ACTIONS.map((q, i) => (
                            <button key={i} onClick={() => sendMessage(q)}
                                    className="text-xs bg-purple-50 border border-purple-100 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors whitespace-nowrap font-medium flex-shrink-0">
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="bg-white border-t border-purple-100 px-4 py-3 flex gap-3 items-center flex-shrink-0">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                            placeholder="Ask anything about Nexus…"
                            className="flex-1 bg-gray-50 border border-purple-100 rounded-xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-purple-400 placeholder:text-gray-300 transition-colors"
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim()}
                            className="w-9 h-9 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M12 7L2 2l2.5 5L2 12l10-5z" fill="white"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}


// import { useState, useRef, useEffect } from 'react'
//
// //  Knowledge Base
// interface QA {
//     keywords: string[]
//     answer: string
//     followups?: string[]
// }
//
// const KB: QA[] = [
//     //  Getting Started
//     {
//         keywords: ['hello', 'hi', 'hey', 'start', 'help', 'what can you do', 'nexus'],
//         answer: ` Hi! I'm the Nexus assistant. I can help you with:\n\n• **Loan applications** — how to apply, eligibility, status\n• **Credit score** — how it's calculated, improving it\n• **EMI repayments** — paying EMIs, schedules, interest\n• **Documents** — what to upload, PAN, Aadhaar\n• **Guarantor & OTP** — verification process\n• **Loan agreement** — digital signing\n• **Fraud & security** — how we protect you\n\nWhat would you like to know?`,
//         followups: ['How do I apply for a loan?', 'What is my credit score?', 'How do I pay EMI?']
//     },
//
//     //  Loan Application
//     {
//         keywords: ['apply', 'loan', 'application', 'how to apply', 'new loan', 'apply loan'],
//         answer: ` **How to apply for a loan on Nexus:**\n\n1. **Connect your bank** via Plaid (secure, read-only)\n2. **Get your credit score** — AI analyzes your bank data\n3. **Fill the loan form** — amount, purpose, employment, PAN\n4. **Sign the agreement** — digital signature via OTP\n5. **Upload documents** — Aadhaar, PAN card, salary slip, etc.\n6. **Officer reviews** — decision within 24 hours\n7. **Funds disbursed** — via Stripe on approval\n\nYou can start by clicking **Apply for Loan** on your dashboard.`,
//         followups: ['What documents do I need?', 'How long does approval take?', 'What is the loan limit?']
//     },
//     {
//         keywords: ['how long', 'approval time', 'when will', 'decision', 'how many days'],
//         answer: `⏱ **Loan approval timeline:**\n\n• AI credit analysis: **instant** (seconds)\n• Officer review: **within 24 hours**\n• Funds disbursed: **immediately** after approval via Stripe\n\nYou'll see real-time status updates on the Loan Status page. The page updates live — no need to refresh.`,
//         followups: ['How do I check my loan status?', 'What if my loan is rejected?']
//     },
//     {
//         keywords: ['status', 'check status', 'my loan', 'application status', 'pending', 'approved', 'rejected'],
//         answer: ` **Checking your loan status:**\n\nGo to **Loan Status** from your dashboard. You'll see:\n\n• **⏳ Pending** — officer is reviewing\n• ** Approved** — loan disbursed, start paying EMIs\n• ** Rejected** — see officer notes for reason\n• ** Repaid** — loan fully paid off\n\nUpdates happen in real-time via live subscriptions.`,
//         followups: ['Why was my loan rejected?', 'How do I pay EMI?']
//     },
//     {
//         keywords: ['rejected', 'rejection', 'not approved', 'why rejected', 'declined'],
//         answer: ` **If your loan was rejected:**\n\nCheck the officer notes on your Loan Status page — they explain the reason.\n\nCommon reasons:\n• Low credit score (below 500)\n• Income too low for requested amount\n• Incomplete documents\n• Fraud risk flags detected\n• Guarantor OTP not verified\n\n**What to do:** Improve your credit score, ensure all documents are uploaded, and try again. You can apply for a smaller amount too.`,
//         followups: ['How do I improve my credit score?', 'What documents are required?']
//     },
//
//     //  Loan Amount & Limits
//     {
//         keywords: ['limit', 'maximum', 'how much', 'loan amount', 'eligible', 'eligibility', 'how much can i borrow'],
//         answer: ` **Loan limits based on your credit grade:**\n\n| Grade | Score | Max Loan |\n|-------|-------|----------|\n| Excellent | 800+ | ₹10,00,000 |\n| Very Good | 700–799 | ₹5,00,000 |\n| Good | 600–699 | ₹3,00,000 |\n| Fair | 500–599 | ₹1,50,000 |\n| Poor | Below 500 | Not eligible |\n\nYour limit is shown dynamically on the loan application form based on your latest credit score.`,
//         followups: ['How is credit score calculated?', 'How do I improve my score?']
//     },
//     {
//         keywords: ['interest', 'interest rate', 'rate', 'how much interest', 'annual rate'],
//         answer: ` **Interest rates on Nexus (reducing balance):**\n\n| Credit Grade | Annual Rate |\n|--------------|-------------|\n| Excellent | 10.5% p.a. |\n| Very Good | 11.5% p.a. |\n| Good | 13.5% p.a. |\n| Fair | 16.0% p.a. |\n| Poor | 18.5% p.a. |\n\nInterest is calculated on a **reducing balance** basis — meaning each month you pay less interest as your principal decreases.`,
//         followups: ['How is EMI calculated?', 'Can I repay early?']
//     },
//     {
//         keywords: ['purpose', 'loan type', 'personal', 'home loan', 'education', 'business loan', 'medical', 'vehicle'],
//         answer: ` **Loan purposes available on Nexus:**\n\n•  **Personal** — any personal expense\n•  **Home** — home improvement or purchase\n•  **Education** — tuition, courses, study abroad\n•  **Business** — business expansion or startup\n•  **Medical** — healthcare, surgery, treatment\n•  **Vehicle** — two-wheeler or four-wheeler\n\nSelect your purpose during the loan application.`
//     },
//
//     //  Credit Score
//     {
//         keywords: ['credit score', 'score', 'cibil', 'how is score', 'credit rating', 'my score'],
//         answer: ` **How your Nexus credit score works:**\n\nScore range: **300 – 950**\n\n**For first-time users (Cold Start):**\n• Transaction regularity (30%)\n• Account balance stability (25%)\n• Income signals from bank data (25%)\n• Spending health (20%)\nMax score: **750**\n\n**For returning users:**\n• Repayment track record (30%)\n• Prior repayment history (15%)\n• Transaction regularity (20%)\n• Balance stability (15%)\n• Income signals (12%)\n• Spending health (8%)\nMax score: **950**\n\nGo to **Credit Score** page for your full breakdown.`,
//         followups: ['How do I improve my score?', 'What is cold start?', 'What is repayment bonus?']
//     },
//     {
//         keywords: ['improve', 'increase score', 'boost score', 'better score', 'higher score'],
//         answer: ` **How to improve your credit score:**\n\n1. **Repay loans on time** — biggest boost (+20 to +50 points)\n2. **Maintain bank balance** — keep ₹25,000+ average\n3. **Regular transactions** — active account shows stability\n4. **Healthy spending** — keep discretionary spending under 20%\n5. **Consistent income** — regular salary credits\n6. **Pay EMIs on time** — late payments hurt your score\n\n **Pro tip:** Fully repay your current loan on time to unlock a **+20 to +50 point bonus** on your next application!`,
//         followups: ['What is the repayment bonus?', 'How do I pay EMI?']
//     },
//     {
//         keywords: ['cold start', 'first time', 'no credit history', 'new user', 'cold start profile'],
//         answer: ` **Cold Start — First-time borrowers:**\n\nIf you have no previous loans with Nexus, you are a **Cold Start** user.\n\n• Your score is calculated purely from your **bank data** via Plaid\n• Max score is capped at **750** (vs 950 for returning borrowers)\n• You're still eligible for loans up to ₹5,00,000 with a strong score\n\n**Once you repay your first loan**, you become a **returning borrower** — your cap increases to 950 and you get repayment bonus points.`,
//         followups: ['How is credit score calculated?', 'What is the repayment bonus?']
//     },
//     {
//         keywords: ['repayment bonus', 'score boost', 'returning borrower', 'bonus points', 'paid loan'],
//         answer: ` **Repayment bonus for returning borrowers:**\n\nWhen you fully repay a loan, you get bonus points on your next credit score calculation:\n\n| Loans Repaid | Bonus Points |\n|--------------|---------------|\n| 1 loan | +20 points |\n| 2 loans | +35 points |\n| 3+ loans | +50 points |\n\nYour score cap also increases from 750 to **950**. Repaying on time gives you the full bonus. Late repayment still counts but with a lower weight.`,
//         followups: ['How do I pay EMI?', 'How is credit score calculated?']
//     },
//
//     //  EMI & Repayment
//     {
//         keywords: ['emi', 'pay emi', 'monthly payment', 'repay', 'repayment', 'installment', 'monthly instalment'],
//         answer: ` **Paying your EMI on Nexus:**\n\n1. Go to **Loan Status** page\n2. Click **"Pay EMI →"** on your approved loan\n3. You'll see your full EMI schedule\n4. Click **"Pay ₹X"** to pay the next EMI\n\n**Each EMI includes:**\n• Principal (reduces your loan balance)\n• Interest (based on remaining balance)\n\nAs you pay more EMIs, your interest portion decreases each month (reducing balance method).`,
//         followups: ['What happens if I miss an EMI?', 'How is EMI calculated?', 'Can I pay early?']
//     },
//     {
//         keywords: ['emi calculation', 'how is emi', 'calculate emi', 'emi formula', 'how much emi'],
//         answer: ` **EMI Calculation:**\n\nNexus uses the standard **reducing balance EMI formula:**\n\nEMI = P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)\n\nWhere:\n• **P** = Principal loan amount\n• **r** = Monthly interest rate (annual rate ÷ 12 ÷ 100)\n• **n** = Tenure in months\n\n**Example:** ₹1,00,000 loan at 13.5% for 12 months\n→ Monthly rate = 1.125%\n→ EMI = **₹8,934/month**\n→ Total payable = ₹1,07,208`,
//         followups: ['What is the interest rate?', 'How do I pay EMI?']
//     },
//     {
//         keywords: ['miss emi', 'late payment', 'overdue', 'missed payment', 'default', 'skip emi'],
//         answer: ` **If you miss or pay late:**\n\n• The EMI is marked as **" Late"** in your schedule\n• It affects your **repaid_on_time** status\n• When the loan is fully repaid, late payments mean you won't get the full "on time" credit boost\n• Overdue EMIs show a ** red warning** on your repayment page\n\n**Advice:** Always pay on or before the due date to maximize your credit score boost.`,
//         followups: ['How do I pay overdue EMI?', 'How does this affect my credit score?']
//     },
//     {
//         keywords: ['fully paid', 'complete repayment', 'finish loan', 'all emis paid', 'loan complete'],
//         answer: ` **When your loan is fully repaid:**\n\n1. Loan status changes to **"REPAID"** automatically\n2. You get a ** trophy banner** on your Loan Status page\n3. Officer sees the repaid status in their dashboard\n4. Your **credit score gets boosted** on next calculation\n5. You can apply for a **new loan immediately** — no longer a cold start user\n\nYou'll also see a button: **"Apply for Next Loan →"**`,
//         followups: ['What is the repayment bonus?', 'How do I apply for a new loan?']
//     },
//     {
//         keywords: ['early repay', 'prepay', 'pay full', 'close loan', 'foreclose'],
//         answer: ` **Early repayment / prepayment:**\n\nCurrently Nexus processes EMIs one at a time monthly. To fully close a loan early, you can pay EMIs consecutively in quick succession.\n\nEach payment reduces your outstanding balance. The interest portion of subsequent EMIs will be lower due to the reducing balance method.\n\n**Tip:** Contact your officer if you want to arrange a bulk settlement.`
//     },
//
//     //  Bank Connection
//     {
//         keywords: ['connect bank', 'plaid', 'bank account', 'link bank', 'bank connection', 'bank data'],
//         answer: ` **Connecting your bank via Plaid:**\n\n1. Go to **Connect Bank** from your dashboard\n2. Click "Connect Bank Account"\n3. Select your bank from Plaid's list\n4. Enter your bank credentials (secure, encrypted)\n5. Plaid fetches your accounts and last 90 days of transactions\n\n**Is it safe?** Yes — Plaid uses bank-grade 256-bit encryption. Nexus gets **read-only** access — we cannot move money.\n\nYour bank data is used solely for credit score calculation.`,
//         followups: ['Is my data safe?', 'How is credit score calculated?']
//     },
//     {
//         keywords: ['safe', 'secure', 'privacy', 'data safe', 'bank credentials', 'encrypted', 'security'],
//         answer: ` **Your data is completely safe on Nexus:**\n\n• **Bank data** — Read-only via Plaid, AES-256 encrypted\n• **Documents** — Stored in private Supabase storage vault\n• **OTPs** — Never shown on screen, sent to registered mobile only\n• **Passwords** — Hashed, never stored in plain text\n• **Officer login** — Protected with 2FA (TOTP authenticator)\n• **Agreements** — Digitally signed with OTP + IP logged\n\nAll connections use HTTPS/TLS encryption.`
//     },
//
//     //  Documents
//     {
//         keywords: ['document', 'documents', 'upload', 'what documents', 'required documents', 'papers'],
//         answer: ` **Required documents for loan application:**\n\n**Identity (mandatory):**\n•  Aadhaar Card (front + back)\n•  PAN Card\n\n**Income (mandatory):**\n•  Salary slips (last 3 months)\n•  Bank statement (last 6 months)\n\n**Address (mandatory):**\n•  Utility bill / rental agreement / passport\n\n**Photo:**\n•  Recent passport size photo\n\n**Optional:**\n•  ITR / Form 16 (strengthens application)\n\nMax file size: **5 MB** per document. Accepted: images or PDF.`,
//         followups: ['What is PAN number?', 'What is Aadhaar?', 'How to upload documents?']
//     },
//     {
//         keywords: ['pan', 'pan number', 'pan card', 'pan format', 'permanent account'],
//         answer: ` **PAN Number on Nexus:**\n\n**Format:** AAAAA9999A (5 letters + 4 digits + 1 letter)\n**Example:** ABCDE1234F\n\nYour PAN is required in **two places:**\n1. **Loan application form** — employment verification (optional here)\n2. **Document upload page** — mandatory, must be valid format\n\nYou also need to upload your **PAN card photo** as a document.\n\n Make sure your PAN matches the name on your application to avoid fraud flags.`
//     },
//     {
//         keywords: ['aadhaar', 'aadhar', 'aadhaar number', '12 digit', 'uid'],
//         answer: ` **Aadhaar Number on Nexus:**\n\n**Format:** 12 digits (e.g., 1234 5678 9012)\n\nRequired in the **Document Upload** page.\n\n**How we display it:** For your privacy, the officer only sees the **last 4 digits** (e.g., XXXX XXXX 3453).\n\nYou also need to upload both **front and back** of your Aadhaar card as documents.`
//     },
//     {
//         keywords: ['document verified', 'verification status', 'doc rejected', 'document rejected', 'reupload'],
//         answer: ` **Document verification process:**\n\nAfter uploading, your documents go through **officer verification:**\n\n• ** Verified** — document accepted\n• ** Rejected** — officer gives a reason (e.g., "blurry image")\n\nIf a document is rejected, you need to re-upload a clearer version.\n\nStatus is shown in the Officer Review panel. You can track whether your documents are verified on the Loan Status page.`
//     },
//
//     //  Guarantor & OTP
//     {
//         keywords: ['guarantor', 'guarantee', 'who is guarantor', 'guarantor required', 'guarantor otp'],
//         answer: ` **Guarantor on Nexus:**\n\nA guarantor is a **person who vouches for your loan** — they are contacted for verification.\n\n**Required information:**\n• Full name\n• 10-digit mobile number\n• Relationship (Parent, Spouse, Friend, etc.)\n\n**Verification:** Their mobile number is verified via **OTP** before you can submit your documents. This OTP is sent to the guarantor's phone — ask them to share the 6-digit code.\n\n If guarantor OTP is not verified, the officer sees a warning and may not approve the loan.`,
//         followups: ['How does guarantor OTP work?', 'What if guarantor does not receive OTP?']
//     },
//     {
//         keywords: ['guarantor otp', 'otp not received', 'otp expired', 'resend otp', 'otp verification'],
//         answer: ` **Guarantor OTP verification:**\n\n1. Enter guarantor name + 10-digit mobile on Document Upload page\n2. Click **"Send OTP"** — OTP is sent to the guarantor's phone\n3. Ask your guarantor to share the 6-digit code\n4. Enter it and click **" Verify"**\n\n**OTP not received?**\n• Wait 60 seconds and click **"Resend"**\n• Check the mobile number is correct\n• Make sure guarantor has network coverage\n\n**OTP expires in 10 minutes** — request a new one if expired.`
//     },
//
//     //  Loan Agreement
//     {
//         keywords: ['agreement', 'loan agreement', 'digital signature', 'sign', 'otp sign', 'agreement otp'],
//         answer: ` **Digital Loan Agreement:**\n\nBefore your application is submitted, you must **digitally sign** the loan agreement.\n\n**Process:**\n1. After reviewing loan details, click **"Generate Loan Agreement →"**\n2. A full loan agreement PDF is generated with your details, EMI schedule, interest rate, and terms\n3. An OTP is sent to your registered email\n4. Enter the OTP to **digitally sign** the agreement\n5. Application status changes from "draft" to "pending"\n\n**The agreement includes:**\n• Loan amount, tenure, EMI, interest rate\n• Your PAN, guarantor details\n• All terms and conditions\n• Your digital signature timestamp + IP`,
//         followups: ['What does the agreement contain?', 'Is the signature legally binding?']
//     },
//     {
//         keywords: ['legally binding', 'legal', 'is it valid', 'agreement valid'],
//         answer: ` **Is the digital agreement legally valid?**\n\nYes. By entering the OTP, you confirm you have read and agreed to all terms. The system records:\n• **Timestamp** of signing\n• **IP address** of the device\n• **OTP verification** as proof of consent\n\nThis constitutes a legally binding digital signature under applicable e-signature regulations.`
//     },
//
//     //  Officer / Admin
//     {
//         keywords: ['officer', 'loan officer', 'officer login', 'officer dashboard', 'admin'],
//         answer: ` **Officer portal on Nexus:**\n\nOfficers access the system via **/officer/login** with:\n• Email + password (set in .env)\n• **2FA TOTP** — Google Authenticator or similar app\n\n**What officers can do:**\n• View all loan applications\n• Review credit scores, bank transactions, fraud reports\n• See PAN, Aadhaar, guarantor details\n• Approve or reject applications (triggers Stripe payout)\n• Mark loans as repaid (triggers credit score boost)\n• Verify/reject uploaded documents\n\n Officer portal is for staff only — not accessible to applicants.`
//     },
//     {
//         keywords: ['2fa', 'two factor', 'authenticator', 'totp', 'setup 2fa', 'google authenticator'],
//         answer: ` **Officer 2FA (Two-Factor Authentication):**\n\nOfficers must set up 2FA to access the dashboard:\n\n1. Go to **/officer/setup-2fa**\n2. Scan the QR code with **Google Authenticator** or **Authy**\n3. Enter the 6-digit code to verify setup\n\nEvery login requires:\n1. Email + password\n2. 6-digit TOTP code from your authenticator app\n\nCodes refresh every 30 seconds. If you lose access, go to **/officer/setup-2fa** to re-configure.`
//     },
//
//     //  Fraud Detection
//     {
//         keywords: ['fraud', 'fraud detection', 'flagged', 'fraud risk', 'blocked', 'suspicious'],
//         answer: ` **Fraud Detection on Nexus:**\n\nNexus automatically checks every application for fraud signals:\n\n**What gets checked:**\n• PAN format validity\n• Duplicate PAN/Aadhaar across applications\n• Name mismatches on same PAN\n• Income declared vs bank credits mismatch\n• Round-number transaction patterns (fabricated data)\n• Sudden large deposits before application\n• Inactive accounts (no debit activity)\n\n**Risk levels:** Clean → Low → Medium → High → Critical\n\nApplications scoring 80+ are **blocked** pending investigation. Officers see the full fraud report in the  Fraud tab.`
//     },
//
//     //  Account & Auth
//     {
//         keywords: ['forgot password', 'reset password', 'password reset', 'cant login', 'login issue'],
//         answer: ` **Forgot your password?**\n\n1. Go to the **Login page**\n2. Click **"Forgot password?"**\n3. Enter your registered email\n4. Check your inbox for a reset link\n5. Click the link and set a new password\n\n**Didn't receive the email?**\n• Check your spam/junk folder\n• Make sure you used the correct email\n• Wait 2–3 minutes and try again\n\nThe reset link expires after 1 hour.`
//     },
//     {
//         keywords: ['google login', 'google sign in', 'oauth', 'sign in with google'],
//         answer: ` **Sign in with Google:**\n\nNexus supports Google OAuth login for applicants.\n\n1. Click **"Continue with Google"** on the login or signup page\n2. Select your Google account\n3. You'll be redirected to the **onboarding page** to complete your profile\n4. Enter your name, age, and phone number\n5. You're ready to use Nexus!\n\n Google login is for **applicants only** — officers must use email/password with 2FA.`
//     },
//     {
//         keywords: ['signup', 'register', 'create account', 'new account', 'sign up'],
//         answer: ` **Creating your Nexus account:**\n\n1. Go to **/signup** or click **"Get Started"**\n2. Choose **"Applicant"** role\n3. Sign up with email/password or **Google**\n4. Verify your email if required\n5. Complete **onboarding** — enter name, age, phone\n6. You'll be taken to your **dashboard**\n\nPassword requirements:\n• Minimum 6 characters\n• Stronger with uppercase, numbers, symbols`
//     },
//     {
//         keywords: ['onboarding', 'profile setup', 'complete profile', 'name age phone'],
//         answer: ` **Onboarding (first-time setup):**\n\nAfter creating your account, you must complete onboarding:\n\n• **Full Name** — used in loan applications and agreements\n• **Age** — must be 18 or older\n• **Phone number** — optional but recommended\n\nThis data is saved to your profile and auto-fills loan forms.\n\nIf you skip onboarding, you'll be redirected back to it whenever you try to access protected pages.`
//     },
//
//     //  Dashboard
//     {
//         keywords: ['dashboard', 'home', 'main page', 'where to start'],
//         answer: ` **Your Nexus Dashboard:**\n\nThe dashboard shows:\n\n• **Quick actions** — Connect Bank, Credit Score, Apply Loan, Loan Status\n• **Stats** — Total applications, approved, pending, rejected\n• **Credit score banner** — your latest score and grade\n• **Recent applications** — last 5 with status\n• **Live updates** — status changes appear in real-time\n\nNavigate using the quick action cards or the buttons in the navbar.`
//     },
//     {
//         keywords: ['stripe', 'payment', 'disbursement', 'how is money sent', 'funds transfer'],
//         answer: ` **How loan disbursement works:**\n\nNexus uses **Stripe** for loan disbursement:\n\n1. Officer approves application\n2. Stripe **PaymentIntent** is created automatically\n3. Funds are "disbursed" (simulated in sandbox mode)\n4. A **Stripe Payment ID** is saved to your application\n\n**In production:** Real bank transfers would be used via Stripe Connect or NEFT/IMPS.\n\n**Current mode:** Sandbox — payments are simulated, no real money moves.`
//     },
//
//     //  Fallback
//     {
//         keywords: ['__fallback__'],
//         answer: ` I didn't quite catch that. Here are some things I can help with:\n\n• **Loan application** — how to apply, eligibility\n• **Credit score** — calculation, improving it\n• **EMI repayment** — paying EMIs, schedules\n• **Documents** — what to upload\n• **Security** — how your data is protected\n• **Account** — login, password reset\n\nTry rephrasing your question or pick one of the suggestions below.`,
//         followups: ['How do I apply for a loan?', 'How is credit score calculated?', 'How do I pay EMI?']
//     }
// ]
//
// //  Chat Engine
//
// interface Message {
//     id: number
//     from: 'bot' | 'user'
//     text: string
//     followups?: string[]
//     time: string
// }
//
// function findAnswer(input: string): QA {
//     const q = input.toLowerCase().trim()
//     let best: QA | null = null
//     let bestScore = 0
//
//     for (const qa of KB) {
//         if (qa.keywords[0] === '__fallback__') continue
//         let score = 0
//         for (const kw of qa.keywords) {
//             if (q.includes(kw)) score += kw.split('').length * 2
//         }
//         if (score > bestScore) { bestScore = score; best = qa }
//     }
//
//     return bestScore > 0 ? best! : KB[KB.length - 1]
// }
//
// function formatText(text: string): React.ReactNode[] {
//     const lines = text.split('\n')
//     return lines.map((line, i) => {
//         if (line.startsWith('| ')) {
//             // Table row
//             const cells = line.split('|').filter(c => c.trim())
//             return ( <tr key={i} className={i === 0 ? 'bg-brand-50/50' : 'border-b border-surface-200/30'}> {cells.map((c, j) => ( <td key={j} className="px-2 py-1 text-xs">{c.trim()}</td> ))} </tr> )
//         }
//         if (line.startsWith('• ') || line.startsWith('* ')) {
//             return <li key={i} className="ml-3 text-xs leading-relaxed">{renderInline(line.slice(2))}</li> }
//         if (line.match(/^\d\./)) {
//             return <li key={i} className="ml-3 text-xs leading-relaxed list-decimal">{renderInline(line.replace(/^\d\./, '').trim())}</li> }
//         if (line.startsWith('**') && line.endsWith('**')) {
//             return <p key={i} className="font-bold text-xs text-surface-800 mt-2">{line.replace(/\*\*/g, '')}</p> }
//         if (line === '') return <div key={i} className="h-1" /> return <p key={i} className="text-xs leading-relaxed">{renderInline(line)}</p> })
// }
//
// function renderInline(text: string): React.ReactNode {
//     const parts = text.split(/(\*\*[^*]+\*\*)/)
//     return parts.map((part, i) => part.startsWith('**') && part.endsWith('**')
//         ? <strong key={i} className="font-semibold text-surface-900">{part.slice(2, -2)}</strong> : part
//     )
// }
//
// function now() {
//     return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
// }
//
// const QUICK_ACTIONS = [
//     'How do I apply for a loan?',
//     'How is credit score calculated?',
//     'How do I pay EMI?',
//     'What documents do I need?',
//     'How does fraud detection work?',
// ]
//
// let msgId = 0
//
// //  Component
//
// export default function NexusChat() {
//     const [open, setOpen]       = useState(false)
//     const [messages, setMessages] = useState<Message[]>([
//         {
//             id: ++msgId,
//             from: 'bot',
//             text: ` Hi! I'm the **Nexus Assistant**. I can answer any questions about loans, credit scores, EMI repayments, documents, and more.\n\nHow can I help you today?`,
//             followups: QUICK_ACTIONS.slice(0, 3),
//             time: now()
//         }
//     ])
//     const [input, setInput]     = useState('')
//     const [typing, setTyping]   = useState(false)
//     const [unread, setUnread]   = useState(0)
//     const bottomRef             = useRef<HTMLDivElement>(null)
//     const inputRef              = useRef<HTMLInputElement>(null)
//
//     useEffect(() => {
//         if (open) {
//             setUnread(0)
//             setTimeout(() => inputRef.current?.focus(), 100)
//         }
//     }, [open])
//
//     useEffect(() => {
//         bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
//     }, [messages, typing])
//
//     const sendMessage = (text: string) => {
//         if (!text.trim()) return
//         const userMsg: Message = { id: ++msgId, from: 'user', text: text.trim(), time: now() }
//         setMessages(prev => [...prev, userMsg])
//         setInput('')
//         setTyping(true)
//
//         setTimeout(() => {
//             const qa = findAnswer(text)
//             const botMsg: Message = {
//                 id: ++msgId,
//                 from: 'bot',
//                 text: qa.answer,
//                 followups: qa.followups,
//                 time: now()
//             }
//             setMessages(prev => [...prev, botMsg])
//             setTyping(false)
//             if (!open) setUnread(u => u + 1)
//         }, 600 + Math.random() * 400)
//     }
//
//     const hasTables = (text: string) => text.includes('|')
//
//     return ( <> {/* Floating bubble */} <button
//         onClick={() => setOpen(o => !o)}
//         className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 flex items-center justify-center transition-all duration-200 hover:scale-110"
//         style={{ boxShadow: '0 4px 20px rgba(79,70,229,0.5)' }}> {open ? ( <svg width="22" height="22" viewBox="0 0 14 14" fill="none"> <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/> </svg> ) : ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none"> <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/> </svg> )}
//         {unread > 0 && !open && ( <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"> {unread} </span> )} </button> {/* Chat window */}
//         {open && ( <div
//             className="fixed bottom-24 right-6 z-50 w-96 flex flex-col rounded-2xl overflow-hidden"
//             style={{
//                 height: '560px',
//                 boxShadow: '0 8px 40px rgba(79,70,229,0.25), 0 2px 8px rgba(0,0,0,0.1)',
//                 border: '1px solid rgba(79,70,229,0.2)'
//             }}> {/* Header */} <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
//                                     style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }}> <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"> <svg width="18" height="18" viewBox="0 0 20 20" fill="none"> <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/> <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5"/> <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5"/> <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/> </svg> </div> <div className="flex-1 min-w-0"> <p className="text-white font-bold text-sm">Nexus Assistant</p> <div className="flex items-center gap-1.5"> <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> <p className="text-brand-200 text-xs">Always online</p> </div> </div> <button onClick={() => setOpen(false)}
//                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                className="text-white/60 hover:text-white transition-colors flex-shrink-0"> <svg width="16" height="16" viewBox="0 0 14 14" fill="none"> <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/> </svg> </button> </div> {/* Messages */} <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-surface-50"
//                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      style={{ scrollbarWidth: 'thin' }}> {messages.map(msg => ( <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}> <div className={`max-w-[85%] ${msg.from === 'user' ? '' : 'flex gap-2.5'}`}> {msg.from === 'bot' && ( <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"> <svg width="12" height="12" viewBox="0 0 20 20" fill="none"> <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/> <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.6"/> <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.6"/> <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/> </svg> </div> )} <div> <div className={`rounded-2xl px-4 py-3 ${
//             msg.from === 'user'
//                 ? 'bg-brand-600 text-white rounded-tr-sm'
//                 : 'bg-white border border-surface-200 text-surface-700 rounded-tl-sm'
//         }`}
//                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}> {msg.from === 'user' ? ( <p className="text-xs text-white leading-relaxed">{msg.text}</p> ) : ( <div className="text-surface-700"> {hasTables(msg.text) ? ( <table className="w-full text-xs border-collapse"> <tbody>{formatText(msg.text)}</tbody> </table> ) : ( <div className="space-y-0.5">{formatText(msg.text)}</div> )} </div> )} </div> <p className="text-surface-300 text-xs mt-1 px-1">{msg.time}</p> {/* Follow-up suggestions */}
//             {msg.followups && msg.followups.length > 0 && ( <div className="flex flex-wrap gap-1.5 mt-2"> {msg.followups.map((f, i) => ( <button key={i} onClick={() => sendMessage(f)}
//                                                                                                                                                  className="text-xs bg-surface-100 border border-brand-200 text-brand-700 px-3 py-1.5 rounded-full hover:bg-brand-50 transition-colors font-medium"> {f} </button> ))} </div> )} </div> </div> </div> ))}
//
//             {/* Typing indicator */}
//             {typing && ( <div className="flex justify-start"> <div className="flex gap-2.5"> <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0"> <svg width="12" height="12" viewBox="0 0 20 20" fill="none"> <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/> <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.6"/> <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.6"/> <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/> </svg> </div> <div className="bg-white border border-surface-200 rounded-2xl rounded-tl-sm px-4 py-3"
//                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}> <div className="flex items-center gap-1.5 py-1"> {[0, 150, 300].map(delay => ( <div key={delay}
//                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
//                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            style={{ animationDelay: `${delay}ms` }} /> ))} </div> </div> </div> </div> )} <div ref={bottomRef} /> </div> {/* Quick actions */} <div className="bg-white border-t border-surface-200 px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0"
//                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     style={{ scrollbarWidth: 'none' }}> {QUICK_ACTIONS.map((q, i) => ( <button key={i} onClick={() => sendMessage(q)}
//                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                className="text-xs bg-surface-100 border border-surface-200 text-brand-600 px-3 py-1.5 rounded-full hover:bg-brand-50 transition-colors whitespace-nowrap font-medium flex-shrink-0"> {q} </button> ))} </div> {/* Input */} <div className="bg-white border-t border-surface-200 px-4 py-3 flex gap-3 items-center flex-shrink-0"> <input
//             ref={inputRef}
//             value={input}
//             onChange={e => setInput(e.target.value)}
//             onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
//             placeholder="Ask anything about Nexus…"
//             className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-xs text-surface-800 outline-none focus:border-brand-400 placeholder:text-surface-300 transition-colors"
//         /> <button
//             onClick={() => sendMessage(input)}
//             disabled={!input.trim()}
//             className="w-9 h-9 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all flex-shrink-0"> <svg width="14" height="14" viewBox="0 0 14 14" fill="none"> <path d="M12 7L2 2l2.5 5L2 12l10-5z" fill="white"/> </svg> </button> </div> </div> )} </> )
//}
