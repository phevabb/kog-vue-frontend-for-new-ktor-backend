
import DefaultLayout from '@/layouts/DefaultLayout.vue'

export const adminRoutes = {
  path: '/administrator',
  component: DefaultLayout,
  meta: { requiresAuth: true, roles: ['administrator'] },
  redirect: { name: 'Dashboard' },
  children: [
    {
      path: 'dashboard',
      name: 'Dashboard',
      component: () =>
        import('@/2_administrator_BOX/views/dashboard/Dashboard.vue'),
      meta: { roles: ['administrator'] },
    },
    {
      path: 'fees/student-fee-structure',
      name: 'student_fee_structure',
      component: () =>
        import('@/2_administrator_BOX/views/base/student_fee_structure.vue'),
      meta: { roles: ['administrator'] },
    },






    {
      path: 'fees/student-fee-payments',
      name: 'student_fee_payments',
      component: () =>
        import('@/2_administrator_BOX/views/theme/student_fee_payments.vue'),
      meta: { roles: ['administrator'] },
    },
    {
      path: 'fees/student-fee-records',
      name: 'student_fee_records_admin',
      component: () =>
        import('@/2_administrator_BOX/views/theme/student_fee_records.vue'),
      meta: { roles: ['administrator'] },
    },
    {
      path: 'fees/family',
      name: 'families',
      component: () => import('@/2_administrator_BOX/views/charts/Family.vue'),
      meta: { roles: ['administrator'] },
    },
    {
      path: 'fees/family-fee-records',
      name: 'family_fee_records',
      component: () =>
        import('@/2_administrator_BOX/views/charts/FamilyRecords.vue'),
      meta: { roles: ['administrator'] },
    },
    {
      path: 'fees/family-fee-payments',
      name: 'family_fee_payments',
      component: () =>
        import('@/2_administrator_BOX/views/charts/FamilyPayments.vue'),
      meta: { roles: ['administrator'] },
    },
    {
      path: 'staff',
      name: 'staffProfile',
      component: () =>
        import('@/2_administrator_BOX/views/charts/StaffProfile.vue'),
      meta: { roles: ['administrator'] },
    },



    // Deactivated Students Route
    {
      path: 'deactivatedStudents',
      name: 'deactivatedStudents',
      component: () =>
        import('@/2_administrator_BOX/views/charts/DeactivatedStudents.vue'),
      meta: { roles: ['administrator'] },
    },

    // Deactivated Families Route
    {
      path: 'deactivatedFamilies',
      name: 'deactivatedFamilies',
      component: () =>
        import('@/2_administrator_BOX/views/charts/StaffProfile.vue'),
      meta: { roles: ['administrator'] },
    },


    {
      path: 'student',
      name: 'studentProfile',
      component: () =>
        import('@/2_administrator_BOX/views/charts/StudentProfile.vue'),
      meta: { roles: ['administrator'] },
    },
    {
      path: 'academic-years',
      name: 'academicYears',
      component: () =>
        import('@/2_administrator_BOX/views/charts/AcademicYear.vue'),
      meta: { roles: ['administrator'] },
    },

    {
      path: 'deactivated-families',
      name: 'deactivatedFamilies',
      component: () =>
        import('@/2_administrator_BOX/views/charts/DeactivatedFamilies.vue'),
      meta: { roles: ['administrator'] },
    },

    {
      path: 'admin_change_password',
      name: 'admin_change_password',
      component: () =>
        import('@/registration/AdminPasswordChange.vue'),
      meta: { roles: ['administrator'] },
    },


    {
      path: 'classes',
      name: 'classes',
      component: () => import('@/2_administrator_BOX/views/charts/Classes.vue'),
      meta: { roles: ['administrator'] },
    },
    {
      path: 'terms',
      name: 'terms',
      component: () => import('@/2_administrator_BOX/views/charts/Terms.vue'),
      meta: { roles: ['administrator'] },
    },
    {
      path: 'widgets',
      name: 'widgets',
      component: () => import('@/2_administrator_BOX/views/widgets/Widgets.vue'),
      meta: { roles: ['administrator'] },
    },


  ],
}
