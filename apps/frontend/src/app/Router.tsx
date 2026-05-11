import { Route, Routes, Navigate } from 'react-router-dom'

import { ProtectedRoute } from '@/app/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { UserDashboard } from '@/features/app/UserDashboard'
import { AppShell } from '@/layouts/AppShell'
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage'
import { AdminInstancesPage } from '@/features/admin/pages/AdminInstancesPage'
import { AdminContactsPage } from '@/features/admin/pages/AdminContactsPage'
import { AdminMediaPage } from '@/features/admin/pages/AdminMediaPage'
import { AdminTemplatesPage } from '@/features/admin/pages/AdminTemplatesPage'
import { AdminCampaignsPage } from '@/features/admin/pages/AdminCampaignsPage'
import { AdminInboxPage } from '@/features/admin/pages/AdminInboxPage'
import { AdminLogsPage } from '@/features/admin/pages/AdminLogsPage'
import { AdminSettingsPage } from '@/features/admin/pages/AdminSettingsPage'
import { AdminContentGroupsPage } from '@/features/admin/pages/AdminContentGroupsPage'
import { UserInstancesPage } from '@/features/user/pages/UserInstancesPage'
import { UserInboxPage } from '@/features/user/pages/UserInboxPage'
import { UserLogsPage } from '@/features/user/pages/UserLogsPage'
import { UserProfilePage } from '@/features/user/pages/UserProfilePage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="ADMIN">
            <AppShell variant="admin">
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="instances" element={<AdminInstancesPage />} />
                <Route path="contacts" element={<AdminContactsPage />} />
                <Route path="media" element={<AdminMediaPage />} />
                <Route path="templates" element={<AdminTemplatesPage />} />
                <Route path="content-groups" element={<AdminContentGroupsPage />} />
                <Route path="campaigns" element={<AdminCampaignsPage />} />
                <Route path="inbox" element={<AdminInboxPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/*"
        element={
          <ProtectedRoute role="USER">
            <AppShell variant="user">
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="instances" element={<UserInstancesPage />} />
                <Route path="inbox" element={<UserInboxPage />} />
                <Route path="logs" element={<UserLogsPage />} />
                <Route path="profile" element={<UserProfilePage />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
