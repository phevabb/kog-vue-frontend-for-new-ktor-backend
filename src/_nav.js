export default [
  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: '/dashboard',
    icon: 'cil-speedometer',
    badge: {
      color: 'primary',
      text: 'NEW',
    },
    role: ['administrator', 'principal'],
  },
  {
    component: 'CNavTitle',
    name: 'Student Fees',
  },
  {
    component: 'CNavItem',
    name: 'Fee Structure',
    role: ['administrator'],
    to: '/fees/student-fee-structure',  /* CHANGE HERE */
    icon: 'cil-pencil',
  },
  {
    component: 'CNavItem',
    name: 'Payments',       /* CHANGE HERE */
    role: ['administrator'],
    to: '/fees/student-fee-payments',
    icon: 'cil-pencil',
  },
  {
    component: 'CNavItem',
    name: 'Student Fee Records',
    role: ['administrator'],
    to: '/fees/student-fee-records ',
    icon: 'cil-pencil',
  },
  {
    component: 'CNavTitle',
    name: 'Family Fees',
  },

  {
    component: 'CNavItem',
    name: 'Families',
    to: '/fees/family',
    role: ['administrator'],
    icon: 'cil-chart-pie',
  },
  {
    component: 'CNavItem',
    name: 'Family Fee Records',
    to: '/fees/family-fee-records',
    icon: 'cil-chart-pie',
  },
  {
    component: 'CNavItem',
    name: 'Family Payments',
    to: '/fees/family-fee-payments',
    icon: 'cil-chart-pie',
  },

  {
    component: 'CNavTitle',
    name: 'Staff / Student',
  },
   {
    component: 'CNavItem',
    name: 'Staff Profiles',
    to: '/staff',
    role: ['administrator'],
    icon: 'cil-chart-pie',
  },
  {
    component: 'CNavItem',
    name: 'Student Profiles',
    to: '/student',
    icon: 'cil-chart-pie',
  },


  {
    component: 'CNavTitle',
    name: 'Activation',
  },
   {
    component: 'CNavItem',
    name: 'Deactivated Students',
    to: '/staff',
    role: ['administrator'],
    icon: 'cil-chart-pie',
  },
  {
    component: 'CNavItem',
    name: 'Deactivated Families',
    to: '/student',
    role: ['administrator'],
    icon: 'cil-chart-pie',
  },



  {
    component: 'CNavTitle',
    name: 'Others',
  },
  {
    component: 'CNavItem',
    name: 'Academic Years',
    to: '/academic-years',
    icon: 'cil-chart-pie',
  },
  {
    component: 'CNavItem',
    name: 'Classes',
    to: '/classes',
    icon: 'cil-chart-pie',
  },
  {
    component: 'CNavItem',
    name: 'Terms',
    to: '/terms',
    icon: 'cil-chart-pie',
  },



]


