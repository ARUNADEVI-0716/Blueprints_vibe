export function SkeletonBox({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-purple-100 rounded-2xl ${className}`} />
    )
}

export function SkeletonText({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-purple-100 rounded-lg ${className}`} />
    )
}

// ── Officer Dashboard Skeleton ────────────────────────────────
export function OfficerDashboardSkeleton() {
    return (
        <div className="page-wrapper">
            {/* Navbar */}
            <div className="bg-white border-b border-purple-100 sticky top-0 z-10" style={{ height: '72px' }} />

            <main className="max-w-7xl mx-auto px-10 py-14">
                {/* Header */}
                <div className="mb-12">
                    <SkeletonText className="h-4 w-32 mb-3" />
                    <SkeletonText className="h-14 w-96 mb-3" />
                    <SkeletonText className="h-5 w-80" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl p-8 border border-purple-100">
                            <div className="flex items-center justify-between mb-4">
                                <SkeletonText className="h-8 w-20" />
                                <SkeletonBox className="h-8 w-8 rounded-full" />
                            </div>
                            <SkeletonText className="h-14 w-16" />
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
                    <div className="px-10 py-5 border-b border-purple-50">
                        <SkeletonText className="h-4 w-full" />
                    </div>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="px-10 py-6 border-b border-purple-50 flex items-center gap-6">
                            <SkeletonBox className="w-11 h-11 flex-shrink-0" />
                            <SkeletonText className="h-4 flex-1" />
                            <SkeletonText className="h-4 w-24" />
                            <SkeletonText className="h-4 w-20" />
                            <SkeletonText className="h-4 w-16" />
                            <SkeletonBox className="h-8 w-20 rounded-xl" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}

// ── Applicant Dashboard Skeleton ──────────────────────────────
export function ApplicantDashboardSkeleton() {
    return (
        <div className="page-wrapper">
            <div className="bg-white border-b border-purple-100 sticky top-0 z-10" style={{ height: '72px' }} />

            <main className="max-w-4xl mx-auto px-8 py-14">
                {/* Header */}
                <div className="mb-10">
                    <SkeletonText className="h-4 w-28 mb-3" />
                    <SkeletonText className="h-14 w-80 mb-3" />
                    <SkeletonText className="h-5 w-64" />
                </div>

                {/* Steps */}
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-purple-100 p-8 mb-4 flex items-center gap-6">
                        <SkeletonBox className="w-14 h-14 flex-shrink-0" />
                        <div className="flex-1">
                            <SkeletonText className="h-5 w-48 mb-2" />
                            <SkeletonText className="h-4 w-72" />
                        </div>
                        <SkeletonBox className="w-24 h-10 rounded-xl flex-shrink-0" />
                    </div>
                ))}
            </main>
        </div>
    )
}

// ── Credit Score Page Skeleton ────────────────────────────────
export function CreditScorePageSkeleton() {
    return (
        <div className="page-wrapper">
            <div className="bg-white border-b border-purple-100 sticky top-0 z-10" style={{ height: '72px' }} />

            <main className="max-w-4xl mx-auto px-8 py-14">
                {/* Score circle */}
                <div className="bg-white rounded-3xl border border-purple-100 p-10 mb-6 flex flex-col items-center">
                    <SkeletonText className="h-4 w-32 mb-6" />
                    <SkeletonBox className="w-48 h-48 rounded-full mb-6" />
                    <SkeletonText className="h-6 w-40 mb-2" />
                    <SkeletonText className="h-4 w-64" />
                </div>

                {/* Factor bars */}
                <div className="bg-white rounded-3xl border border-purple-100 p-8">
                    <SkeletonText className="h-6 w-48 mb-6" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="mb-5">
                            <div className="flex justify-between mb-2">
                                <SkeletonText className="h-4 w-40" />
                                <SkeletonText className="h-4 w-12" />
                            </div>
                            <SkeletonBox className="h-3 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}

// ── Loan Status Page Skeleton ─────────────────────────────────
export function LoanStatusPageSkeleton() {
    return (
        <div className="page-wrapper">
            <div className="bg-white border-b border-purple-100 sticky top-0 z-10" style={{ height: '72px' }} />

            <main className="max-w-4xl mx-auto px-8 py-14">
                {/* Status card */}
                <div className="bg-white rounded-3xl border border-purple-100 p-10 mb-6">
                    <div className="flex items-center gap-6 mb-8">
                        <SkeletonBox className="w-16 h-16 flex-shrink-0" />
                        <div className="flex-1">
                            <SkeletonText className="h-6 w-48 mb-2" />
                            <SkeletonText className="h-4 w-64" />
                        </div>
                        <SkeletonBox className="w-28 h-10 rounded-full flex-shrink-0" />
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-purple-50 rounded-2xl p-5">
                                <SkeletonText className="h-3 w-24 mb-2" />
                                <SkeletonText className="h-6 w-32" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-3xl border border-purple-100 p-8">
                    <SkeletonText className="h-6 w-32 mb-6" />
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-4 mb-6">
                            <SkeletonBox className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                                <SkeletonText className="h-4 w-40 mb-2" />
                                <SkeletonText className="h-3 w-56" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}