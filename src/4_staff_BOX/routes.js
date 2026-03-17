
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
      path: 'paymenthistory',
      name: 'StaffPaymentHistory',
      component: () =>
        import('@/4_staff_BOX/views/PaymentHistory.vue'),
      meta: { roles: ['staff'] },
    },

    {
      path: 'onlinepayment',
      name: 'StaffOnlinePayment',
      component: () =>
        import('@/4_staff_BOX/views/PaymentOnline.vue'),
      meta: { roles: ['staff'] },
    },

  ],
}
