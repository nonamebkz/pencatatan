import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { PondDetailPage } from '@/pages/PondDetailPage'
import { PondListPage } from '@/pages/PondListPage'
import { WaterQualityFormPage } from '@/pages/WaterQualityFormPage'
import { WaterQualityListPage } from '@/pages/WaterQualityListPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="ponds" element={<PondListPage />} />
          <Route path="ponds/:id" element={<PondDetailPage />} />
          <Route path="water-quality" element={<WaterQualityListPage />} />
          <Route path="water-quality/new" element={<WaterQualityFormPage />} />
          <Route path="water-quality/:id/edit" element={<WaterQualityFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
