import ProtectedRoute from '@/components/ProtectedRoute'
import Navigation from '@/components/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <Navigation>
        {children}
      </Navigation>
    </ProtectedRoute>
  )
}
