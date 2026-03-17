// src/router/index.js
import { h, resolveComponent } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { adminRoutes } from '@/2_administrator_BOX/routes'
import { principalRoutes } from '@/1_principal_BOX/routes'
import { studentRoutes } from '@/3_student_BOX/routes'
import { staffRoutes } from '@/4_staff_BOX/routes'
const ResetPassword = () => import('@/registration/ResetPassword.vue')
const ResetPasswordDone = () => import('@/registration/ResetPasswordDone.vue')
const ResetPasswordConfirm = () => import('@/registration/ResetPasswordConfirm.vue')
const ResetPasswordSuccess = () => import('@/registration/ResetPasswordSuccess.vue')
const ChangePasswordComplete = () => import('@/registration/ChangePasswordComplete.vue')


import Login from '@/registration/Login.vue'

// Storage helpers
function getTokenFromStorage() {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Role-based landing page
function roleHome(user) {
  if (!user) return { name: 'Login' }
  if (user.role === 'administrator') return { name: 'student_fee_records_admin'}
  if (user.role === 'principal') return { name: 'PrincipalDashboard' }
  if (user.role === 'student') return { name: 'StudentDashboard' }
  if (user.role === 'staff') return { name: 'StaffDashboard' }
  return { name: 'Login' } // fallback
}

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/login', name: 'Login', component: Login },

  adminRoutes,
  principalRoutes,
  studentRoutes,
  staffRoutes,

  // Optional generic landing that decides based on role
  {
    path: '/app',
    name: 'AppLanding',
    redirect: () => roleHome(getUserFromStorage()),
  },

// Request password reset (public)
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword },
  { path: '/password-reset-done', name: 'ResetPasswordDone', component: ResetPasswordDone },

  {
  path: '/reset-password-confirm/:uid/:token',
  name: 'ResetPasswordConfirm',
  component: ResetPasswordConfirm
},
{
  path: '/password-reset-success',
  name: 'ResetPasswordSuccess',
  component: ResetPasswordSuccess
},
{
  path: '/change-password-complete',
  name: 'ChangePasswordComplete',
  component: ChangePasswordComplete
},








  {
    path: '/pages',
    redirect: '/pages/404',
    name: 'Pages',
    component: { render() { return h(resolveComponent('router-view')) } },
    children: [
      { path: '404', name: 'Page404', component: () => import('@/registration/Login.vue') },
      { path: '500', name: 'Page500', component: () => import('@/registration/Login.vue') },
      { path: 'login', name: 'PagesLogin', component: () => import('@/registration/Login.vue') },
      { path: 'register', name: 'Register', component: () => import('@/registration/Login.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() { return { top: 0 } },
})

// Auth + role guard
router.beforeEach((to, from, next) => {
  const token = getTokenFromStorage()
  const user = getUserFromStorage()

  const requiresAuth = to.matched.some((r) => r.meta && r.meta.requiresAuth)
  if (requiresAuth && !token) {
    return next({ name: 'Login', query: { redirect: to.name } })
  }

  // Role-based authorization
  const allowedRoles = to.matched
    .map((r) => (r.meta && r.meta.roles ? r.meta.roles : []))
    .flat()

  if (allowedRoles.length && user && !allowedRoles.includes(user.role)) {
    return next(roleHome(user))
  }

  next()
})

export default router
