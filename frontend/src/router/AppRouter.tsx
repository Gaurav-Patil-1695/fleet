import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import RoleGuard from '../components/layout/RoleGuard';
import AppShell from '../components/layout/AppShell';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import VehicleListPage from '../pages/VehicleListPage';
import VehicleDetailPage from '../pages/VehicleDetailPage';
import AddVehiclePage from '../pages/AddVehiclePage';
import EditVehiclePage from '../pages/EditVehiclePage';
import ManualOdometerPage from '../pages/ManualOdometerPage';
import WorkOrderListPage from '../pages/WorkOrderListPage';
import WorkOrderDetailPage from '../pages/WorkOrderDetailPage';
import CreateWorkOrderPage from '../pages/CreateWorkOrderPage';
import CloseWorkOrderPage from '../pages/CloseWorkOrderPage';
import MyWorkOrdersPage from '../pages/MyWorkOrdersPage';
import ScheduleListPage from '../pages/ScheduleListPage';
import ScheduleDetailPage from '../pages/ScheduleDetailPage';
import CreateSchedulePage from '../pages/CreateSchedulePage';
import EditSchedulePage from '../pages/EditSchedulePage';
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.Login} element={<LoginPage />} />
        <Route path={ROUTES.Unauthorized} element={<UnauthorizedPage />} />
        <Route path={ROUTES.NotFound} element={<NotFoundPage />} />

        {/* Protected routes inside AppShell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Dashboard — manager, technician */}
          <Route
            path={ROUTES.DepotDashboard}
            element={
              <RoleGuard roles={['manager', 'technician']}>
                <DashboardPage />
              </RoleGuard>
            }
          />

          {/* Vehicles — list: all roles; add/edit: administrator, manager */}
          <Route
            path={ROUTES.VehicleList}
            element={
              <RoleGuard roles={['administrator', 'manager', 'technician']}>
                <VehicleListPage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.AddVehicle}
            element={
              <RoleGuard roles={['administrator', 'manager']}>
                <AddVehiclePage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.VehicleDetail}
            element={
              <RoleGuard roles={['administrator', 'manager', 'technician']}>
                <VehicleDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.EditVehicle}
            element={
              <RoleGuard roles={['administrator', 'manager']}>
                <EditVehiclePage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.ManualOdometerEntry}
            element={
              <RoleGuard roles={['administrator', 'manager', 'technician']}>
                <ManualOdometerPage />
              </RoleGuard>
            }
          />

          {/* Work Orders */}
          <Route
            path={ROUTES.WorkOrderList}
            element={
              <RoleGuard roles={['manager', 'technician']}>
                <WorkOrderListPage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.CreateWorkOrder}
            element={
              <RoleGuard roles={['administrator', 'manager']}>
                <CreateWorkOrderPage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.WorkOrderDetail}
            element={
              <RoleGuard roles={['administrator', 'manager', 'technician']}>
                <WorkOrderDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.CloseWorkOrder}
            element={
              <RoleGuard roles={['technician']}>
                <CloseWorkOrderPage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.MyWorkOrders}
            element={
              <RoleGuard roles={['technician']}>
                <MyWorkOrdersPage />
              </RoleGuard>
            }
          />

          {/* Schedules — administrator, manager */}
          <Route
            path={ROUTES.ScheduleList}
            element={
              <RoleGuard roles={['administrator', 'manager']}>
                <ScheduleListPage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.CreateSchedule}
            element={
              <RoleGuard roles={['administrator']}>
                <CreateSchedulePage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.ScheduleDetail}
            element={
              <RoleGuard roles={['administrator', 'manager']}>
                <ScheduleDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.EditSchedule}
            element={
              <RoleGuard roles={['administrator']}>
                <EditSchedulePage />
              </RoleGuard>
            }
          />

          {/* Root redirect */}
          <Route
            path="/"
            element={<Navigate to={ROUTES.DepotDashboard} replace />}
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.NotFound} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
