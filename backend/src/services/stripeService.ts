import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16'
})

// Simulate loan payout using Stripe test transfer
export async function createLoanPayout(params: {
    amount: number        // in rupees
    applicantEmail: string
    loanApplicationId: string
    applicantName: string
}) {
    // In test mode we create a PaymentIntent to simulate payout
    const paymentIntent = await stripe.paymentIntents.create({
        amount: params.amount * 100, // convert to paise
        currency: 'inr',
        payment_method_types: ['card'],
        metadata: {
            loan_application_id: params.loanApplicationId,
            applicant_email: params.applicantEmail,
            applicant_name: params.applicantName,
            type: 'loan_disbursement'
        },
        description: `Loan disbursement for ${params.applicantName} - Application ${params.loanApplicationId}`,
    })

    return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: params.amount,
        status: paymentIntent.status
    }
}

export async function confirmTestPayment(paymentIntentId: string) {
    // Confirm with test card in sandbox
    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: 'pm_card_visa', // Stripe test card
    })
    return confirmed
}