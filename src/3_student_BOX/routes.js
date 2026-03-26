
import DefaultLayout from '@/layouts/DefaultLayout.vue'

export const studentRoutes = {
  path: '/student',
  component: DefaultLayout,
  meta: { requiresAuth: true, roles: ['student'] },
  redirect: { name: 'StudentDashboard' },
  children: [

    {
      path: 'dashboard',
      name: 'StudentDashboard',
      component: () =>
        import('@/3_student_BOX/views/Dashboard.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'academicrecords',
      name: 'AcademicRecords',
      component: () =>
        import('@/3_student_BOX/views/AcademicRecords.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'paymenthistory',
      name: 'StudentPaymentHistory',
      component: () =>
        import('@/3_student_BOX/views/PaymentHistory.vue'),
      meta: { roles: ['student'] },
    },

    {
      path: 'onlinepayment',
      name: 'StudentOnlinePayment',
      component: () =>
        import('@/3_student_BOX/views/PaymentOnline.vue'),
      meta: { roles: ['student'] },
    },

    {
      path: 'performance',
      name: 'PerformanceAnalysis',
      component: () =>
        import('@/3_student_BOX/views/PerformanceAnalysis.vue'),
      meta: { roles: ['student'] },
    },

    {
      path: 'bills',
      name: 'Bills',
      component: () =>
        import('@/3_student_BOX/views/Bills.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'booklist',
      name: 'Booklist',
      component: () =>
        import('@/3_student_BOX/views/Booklist.vue'),
      meta: { roles: ['student'] },
    },




  ],
}
