
// student_nav.js
import { cilCreditCard, cilLibrary, cilSchool, cilCalendar, cilAddressBook, cilPeople, cilList, cilSpreadsheet, cilCalculator, cilMoney } from '@coreui/icons'


export default [

  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: { name: 'StudentDashboard' },
    icon: cilPeople,
  },




  { component: 'CNavTitle', name: 'Student Fees' },

  {
    component: 'CNavItem',
    name: 'Payment History',
    to: { name: 'StudentPaymentHistory' },
    icon: cilList,
  },

  {
    component: 'CNavItem',
    name: 'Online Payment',
    to: { name: 'StudentOnlinePayment' },
    icon: cilSpreadsheet,
  },

  { component: 'CNavTitle', name: 'Academic Records' },

  {
    component: 'CNavItem',
    name: 'Exams Records',
    to: { name: 'AcademicRecords' },
    icon: cilPeople,
  },
  {
    component: 'CNavItem',
    name: 'Performance Analysis',
    to: { name: 'PerformanceAnalysis' },
    icon: cilCalculator,
  },


  { component: 'CNavTitle', name: 'Bills / Book lists' },

  {
    component: 'CNavItem',
    name: 'Bills',
    to: { name: 'Bills' },
    icon: cilAddressBook,
  },
  {
    component: 'CNavItem',
    name: 'Book List',
    to: { name: 'Booklist' },
    icon: 'cil-user',
  },






  // Deactivation Section









]
