import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendApprovalEmail(applicantEmail: string, applicantName: string, amount: number) {
    await resend.emails.send({
        from: 'Nexus <no-reply@yourdomain.com>',
        to: applicantEmail,
        subject: '🎉 Your Loan Has Been Approved — Nexus',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #7c3aed; padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Nexus</h1>
                </div>
                <div style="background: #ffffff; padding: 40px; border: 1px solid #ede9fe; border-radius: 0 0 16px 16px;">
                    <h2 style="color: #1e1b4b;">Hi ${applicantName},</h2>
                    <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                        Great news! Your loan application for 
                        <strong style="color: #7c3aed;">₹${Number(amount).toLocaleString('en-IN')}</strong> 
                        has been <strong style="color: #16a34a;">approved</strong>.
                    </p>
                    <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                        Please log in to your Nexus dashboard to sign your loan agreement and 
                        complete the disbursement process.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${process.env.FRONTEND_URL}/dashboard"
                           style="background: #7c3aed; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            Go to Dashboard →
                        </a>
                    </div>
                    <p style="color: #9ca3af; font-size: 14px;">
                        If you have any questions, please contact our support team.
                    </p>
                </div>
            </div>
        `
    })
}

export async function sendRejectionEmail(applicantEmail: string, applicantName: string, reason?: string) {
    await resend.emails.send({
        from: 'Nexus <no-reply@yourdomain.com>',
        to: applicantEmail,
        subject: 'Update on Your Loan Application — Nexus',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #7c3aed; padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Nexus</h1>
                </div>
                <div style="background: #ffffff; padding: 40px; border: 1px solid #ede9fe; border-radius: 0 0 16px 16px;">
                    <h2 style="color: #1e1b4b;">Hi ${applicantName},</h2>
                    <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                        Thank you for applying for a loan with Nexus. After careful review, 
                        we are unable to approve your application at this time.
                    </p>
                    ${reason ? `
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0;">
                        <p style="color: #dc2626; margin: 0; font-size: 15px;">
                            <strong>Reason:</strong> ${reason}
                        </p>
                    </div>` : ''}
                    <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                        You are welcome to reapply in the future. Building your credit score 
                        by connecting your bank account and maintaining good financial habits 
                        can improve your chances.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${process.env.FRONTEND_URL}/dashboard"
                           style="background: #7c3aed; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            View Dashboard →
                        </a>
                    </div>
                </div>
            </div>
        `
    })
}