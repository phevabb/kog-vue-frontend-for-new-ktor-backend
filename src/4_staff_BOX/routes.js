
import DefaultLayout from '@/layouts/DefaultLayout.vue'

export const staffRoutes = {
  path: '/staff',
  component: DefaultLayout,
  meta: { requiresAuth: true, roles: ['staff'] },
  redirect: { name: 'StaffDashboard' },
  children: [

    {
      path: 'dashboard',
      name: 'StaffDashboard',
      component: () =>
        import('@/4_staff_BOX/views/Dashboard.vue'),
      meta: { roles: ['staff'] },
    },
    {
      path: 'classanalysis',
      name: 'ClassAnalysis',
      component: () =>
        import('@/4_staff_BOX/views/ClassAnalysis.vue'),
      meta: { roles: ['staff'] },
    },

    {
      path: 'attendance',
      name: 'Attendance',
      component: () =>
        import('@/4_staff_BOX/views/Attendance.vue'),
      meta: { roles: ['staff'] },
    },

  ],
}
