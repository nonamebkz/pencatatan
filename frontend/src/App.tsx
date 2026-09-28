import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { GuestRoute, PermissionRoute, ProtectedRoute } from '@/components/auth/AuthRoutes'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'
import { WorkspaceShell } from '@/layouts/WorkspaceShell'
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
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { RoleFormPage } from '@/pages/RoleFormPage'
import { RoleListPage } from '@/pages/RoleListPage'
import {
  PermCashAccountCreate,
  PermCashAccountRead,
  PermCashAccountUpdate,
  PermRoleCreate,
  PermRoleRead,
  PermUserRead,
  PermWaterQualityCfgUp,
  PermWorkspaceRead,
} from '@/lib/permissions'
import { OtherExpenseFormPage } from '@/pages/OtherExpenseFormPage'
import { PurchaseDetailPage } from '@/pages/PurchaseDetailPage'
import { TransactionDetailPage } from '@/pages/TransactionDetailPage'
import { WaterQualityDetailPage } from '@/pages/WaterQualityDetailPage'
import { PurchaseFormPage } from '@/pages/PurchaseFormPage'
import { CashAccountListPage } from '@/pages/CashAccountListPage'
import { CashAccountFormPage } from '@/pages/CashAccountFormPage'
import { RentDetailPage } from '@/pages/RentDetailPage'
import { RentFormPage } from '@/pages/RentFormPage'
import { RentListPage } from '@/pages/RentListPage'
import { ReportsHubPage } from '@/pages/ReportsHubPage'
import { PurchaseReportPage } from '@/pages/PurchaseReportPage'
import { PriceHistoryReportPage } from '@/pages/PriceHistoryReportPage'
import { RentReportPage } from '@/pages/RentReportPage'
import { OperationalSummaryReportPage } from '@/pages/OperationalSummaryReportPage'
import { ConsolidatedSummaryReportPage } from '@/pages/ConsolidatedSummaryReportPage'
import { WorkspaceListPage } from '@/pages/WorkspaceListPage'
import { WorkspaceFormPage } from '@/pages/WorkspaceFormPage'
import { OperationalUnitListPage } from '@/pages/OperationalUnitListPage'
import { OperationalUnitFormPage } from '@/pages/OperationalUnitFormPage'
import { OperationalUnitDetailPage } from '@/pages/OperationalUnitDetailPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<WorkspaceShell />}>
              <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="ponds" element={<PondListPage />} />
              <Route path="ponds/new" element={<PondFormPage />} />
              <Route path="ponds/:id/edit" element={<PondFormPage />} />
              <Route path="ponds/:id" element={<PondDetailPage />} />
              <Route path="operational-units" element={<OperationalUnitListPage />} />
              <Route path="operational-units/new" element={<OperationalUnitFormPage />} />
              <Route path="operational-units/:id/edit" element={<OperationalUnitFormPage />} />
              <Route path="operational-units/:id" element={<OperationalUnitDetailPage />} />
              <Route path="water-quality" element={<WaterQualityListPage />} />
              <Route path="water-quality/report" element={<WaterQualityReportPage />} />
              <Route path="water-quality/new" element={<WaterQualityFormPage />} />
              <Route path="water-quality/:id/edit" element={<WaterQualityFormPage />} />
              <Route path="water-quality/:id" element={<WaterQualityDetailPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route element={<PermissionRoute permission="finance.read" />}>
                <Route path="finance/reports" element={<ReportsHubPage />} />
                <Route path="finance/reports/purchases" element={<PurchaseReportPage />} />
                <Route path="finance/reports/price-history" element={<PriceHistoryReportPage />} />
                <Route path="finance/reports/summary" element={<OperationalSummaryReportPage />} />
                <Route path="finance/reports/consolidated-summary" element={<ConsolidatedSummaryReportPage />} />
              </Route>
              <Route element={<PermissionRoute permission="finance.rent.read" />}>
                <Route path="finance/reports/rent" element={<RentReportPage />} />
              </Route>
              <Route path="finance/purchases/new" element={<PurchaseFormPage />} />
              <Route path="finance/purchases/:id/edit" element={<PurchaseFormPage />} />
              <Route path="finance/purchases/:id" element={<PurchaseDetailPage />} />
              <Route path="finance/transactions/:id" element={<TransactionDetailPage />} />
              <Route path="finance/expenses/new" element={<OtherExpenseFormPage />} />
              <Route path="finance/expenses/:id/edit" element={<OtherExpenseFormPage />} />

              <Route element={<PermissionRoute permission="finance.rent.read" />}>
                <Route path="finance/rent" element={<RentListPage />} />
                <Route path="finance/rent/:id" element={<RentDetailPage />} />
              </Route>
              <Route element={<PermissionRoute permission="finance.rent.create" />}>
                <Route path="finance/rent/new" element={<RentFormPage />} />
              </Route>

              <Route element={<PermissionRoute permission={PermCashAccountRead} />}>
                <Route path="finance/cash-accounts" element={<CashAccountListPage />} />
              </Route>
              <Route element={<PermissionRoute permission={PermCashAccountCreate} />}>
                <Route path="finance/cash-accounts/new" element={<CashAccountFormPage />} />
              </Route>
              <Route element={<PermissionRoute permission={PermCashAccountUpdate} />}>
                <Route path="finance/cash-accounts/:id/edit" element={<CashAccountFormPage />} />
              </Route>

              <Route element={<PermissionRoute permission={PermUserRead} />}>
                <Route path="users" element={<UserListPage />} />
                <Route path="users/new" element={<UserFormPage />} />
                <Route path="users/:id/edit" element={<UserFormPage />} />
              </Route>

              <Route element={<PermissionRoute permission={PermRoleRead} />}>
                <Route path="roles" element={<RoleListPage />} />
                <Route path="roles/:id/edit" element={<RoleFormPage />} />
              </Route>

              <Route element={<PermissionRoute permission={PermRoleCreate} />}>
                <Route path="roles/new" element={<RoleFormPage />} />
              </Route>

              <Route element={<PermissionRoute permission={PermWaterQualityCfgUp} />}>
                <Route path="settings/water-quality" element={<WaterQualityConfigPage />} />
              </Route>

              <Route element={<PermissionRoute permission={PermWorkspaceRead} />}>
                <Route path="settings/workspaces" element={<WorkspaceListPage />} />
                <Route path="settings/workspaces/new" element={<WorkspaceFormPage />} />
                <Route path="settings/workspaces/:id/edit" element={<WorkspaceFormPage />} />
              </Route>

              <Route path="forbidden" element={<ForbiddenPage />} />
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
