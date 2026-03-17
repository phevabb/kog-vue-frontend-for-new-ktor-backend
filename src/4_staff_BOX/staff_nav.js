
// staff_nav.js
import { cilCreditCard, cilLibrary, cilSchool, cilCalendar, cilAddressBook, cilPeople, cilList, cilSpreadsheet, cilCalculator, cilMoney } from '@coreui/icons'


export default [

  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: { name: 'StaffDashboard' },
    icon: cilPeople,
  },




  { component: 'CNavTitle', name: 'My class' },



  {
    component: 'CNavItem',
    name: 'Online Payment',
    to: { name: 'StudentOnlinePayment' },
    icon: cilSpreadsheet,
  },

  { component: 'CNavTitle', name: 'Attendance' },


  {
    component: 'CNavItem',
    name: 'Academic Calendar',
    to: { name: 'StaffDashboard' },
    icon: cilCalculator,
  },


  { component: 'CNavTitle', name: 'Performance Analysis' },

  {
    component: 'CNavItem',
    name: 'Staff Profiles',
    to: { name: 'StudentDashboard' },
    icon: cilAddressBook,
  },




  // Deactivation Section









]
