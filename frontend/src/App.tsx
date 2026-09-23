import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AdminRoute, GuestRoute, ProtectedRoute } from '@/components/auth/AuthRoutes'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { PondDetailPage } from '@/pages/PondDetailPage'
import { PondFormPage } from '@/pages/PondFormPage'
import { PondListPage } from '@/pages/PondListPage'
import { UserFormPage } from '@/pages/UserFormPage'
import { UserListPage } from '@/pages/UserListPage'
import { WaterQualityFormPage } from '@/pages/WaterQualityFormPage'
import { WaterQualityListPage } from '@/pages/WaterQualityListPage'
import { WaterQualityReportPage } from '@/pages/WaterQualityReportPage'
import { WaterQualityConfigPage } from '@/pages/WaterQualityConfigPage'
import { FinancePage } from '@/pages/FinancePage'
import { OtherExpenseFormPage } from '@/pages/OtherExpenseFormPage'
import { PurchaseDetailPage } from '@/pages/PurchaseDetailPage'
import { PurchaseFormPage } from '@/pages/PurchaseFormPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="ponds" element={<PondListPage />} />
              <Route path="ponds/new" element={<PondFormPage />} />
              <Route path="ponds/:id/edit" element={<PondFormPage />} />
              <Route path="ponds/:id" element={<PondDetailPage />} />
              <Route path="water-quality" element={<WaterQualityListPage />} />
              <Route path="water-quality/report" element={<WaterQualityReportPage />} />
              <Route path="water-quality/new" element={<WaterQualityFormPage />} />
              <Route path="water-quality/:id/edit" element={<WaterQualityFormPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="finance/purchases/new" element={<PurchaseFormPage />} />
              <Route path="finance/purchases/:id" element={<PurchaseDetailPage />} />
              <Route path="finance/expenses/new" element={<OtherExpenseFormPage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={<AppLayout />}>
                <Route path="users" element={<UserListPage />} />
                <Route path="users/new" element={<UserFormPage />} />
                <Route path="users/:id/edit" element={<UserFormPage />} />
                <Route path="settings/water-quality" element={<WaterQualityConfigPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
