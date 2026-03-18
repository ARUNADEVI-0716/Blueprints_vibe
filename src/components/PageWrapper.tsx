import { useEffect, useRef } from 'react'

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        ref.current?.classList.add('page-enter')
    }, [])

    return (
        <div ref={ref} className="page-wrapper">
            {children}
        </div>
    )
}