import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, RoleGuard } from './ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Lazy-loaded pages
const Login = lazy(() => import('@/pages/Login'))
const Forbidden = lazy(() => import('@/pages/Forbidden'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const VehicleList = lazy(() => import('@/pages/Vehicles/VehicleList'))
const VehicleDetail = lazy(() => import('@/pages/Vehicles/VehicleDetail'))
const DriverList = lazy(() => import('@/pages/Drivers/DriverList'))
const DriverDetail = lazy(() => import('@/pages/Drivers/DriverDetail'))
const TripList = lazy(() => import('@/pages/Trips/TripList'))
const TripDetail = lazy(() => import('@/pages/Trips/TripDetail'))
const MaintenanceList = lazy(() => import('@/pages/Maintenance/MaintenanceList'))
const FuelExpenses = lazy(() => import('@/pages/FuelExpenses/FuelExpenses'))
const Reports = lazy(() => import('@/pages/Reports/Reports'))
const UserManagement = lazy(() => import('@/pages/Admin/UserManagement'))

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center">
    <LoadingSpinner size="lg" label="Loading page…" />
  </div>
)

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />

          {/* Protected routes — wrapped in AppLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Fleet Manager, Safety Officer, Financial Analyst can see vehicles */}
            <Route path="vehicles">
              <Route
                index
                element={
                  <RoleGuard allowedRoles={['fleet_manager', 'safety_officer', 'financial_analyst']}>
                    <VehicleList />
                  </RoleGuard>
                }
              />
              <Route
                path=":id"
                element={
                  <RoleGuard allowedRoles={['fleet_manager', 'safety_officer', 'financial_analyst']}>
                    <VehicleDetail />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Fleet Manager, Safety Officer can manage drivers */}
            <Route path="drivers">
              <Route
                index
                element={
                  <RoleGuard allowedRoles={['fleet_manager', 'safety_officer', 'driver']}>
                    <DriverList />
                  </RoleGuard>
                }
              />
              <Route
                path=":id"
                element={
                  <RoleGuard allowedRoles={['fleet_manager', 'safety_officer', 'driver']}>
                    <DriverDetail />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Trips — Fleet Manager and Driver */}
            <Route path="trips">
              <Route
                index
                element={
                  <RoleGuard allowedRoles={['fleet_manager', 'driver', 'safety_officer']}>
                    <TripList />
                  </RoleGuard>
                }
              />
              <Route
                path=":id"
                element={
                  <RoleGuard allowedRoles={['fleet_manager', 'driver', 'safety_officer']}>
                    <TripDetail />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Maintenance — Fleet Manager only */}
            <Route
              path="maintenance"
              element={
                <RoleGuard allowedRoles={['fleet_manager']}>
                  <MaintenanceList />
                </RoleGuard>
              }
            />

            {/* Fuel & Expenses — Fleet Manager + Driver (own) + Financial Analyst (read) */}
            <Route
              path="fuel-expenses"
              element={
                <RoleGuard allowedRoles={['fleet_manager', 'driver', 'financial_analyst']}>
                  <FuelExpenses />
                </RoleGuard>
              }
            />

            {/* Reports — Fleet Manager + Financial Analyst */}
            <Route
              path="reports"
              element={
                <RoleGuard allowedRoles={['fleet_manager', 'financial_analyst']}>
                  <Reports />
                </RoleGuard>
              }
            />

            {/* Admin — Fleet Manager only */}
            <Route
              path="admin/users"
              element={
                <RoleGuard allowedRoles={['fleet_manager']}>
                  <UserManagement />
                </RoleGuard>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
