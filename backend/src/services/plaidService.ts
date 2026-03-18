import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

const config = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
            'PLAID-SECRET': process.env.PLAID_SECRET!,
        }
    }
})

export const plaidClient = new PlaidApi(config)

// Create link token for frontend Plaid Link
export async function createLinkToken(userId: string) {
    const response = await plaidClient.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: 'Nexus Credit',
        products: [Products.Transactions, Products.Auth],
        country_codes: [CountryCode.Us],
        language: 'en',
    })
    return response.data.link_token
}

// Exchange public token for access token
export async function exchangePublicToken(publicToken: string) {
    const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken
    })
    return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id
    }
}

// Fetch accounts
export async function getAccounts(accessToken: string) {
    const response = await plaidClient.accountsGet({ access_token: accessToken })
    return response.data.accounts
}

// Fetch transactions (last 90 days)
export async function getTransactions(accessToken: string) {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
    })
    return response.data.transactions
}

// Get institution info
export async function getInstitution(institutionId: string) {
    const response = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us]
    })
    return response.data.institution
}