export default function AuthPanel() {
    return (
        <div className="hidden lg:flex flex-col relative overflow-hidden rounded-3xl"
             style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #4f46e5 100%)', minHeight: '100%' }}>

            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="relative z-10 flex flex-col justify-center h-full p-10">
                <div className="flex flex-col items-center text-center gap-8 py-8">
                    <div className="space-y-2">
                        <h1 className="text-white font-display font-bold text-5xl leading-tight tracking-tight">
                            Welcome to<br />Nexus
                        </h1>
                        <p className="text-purple-200 text-sm leading-relaxed max-w-xl mx-auto">
                            Smart lending starts here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}