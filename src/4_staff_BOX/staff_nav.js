
// staff_nav.js
import { cilCreditCard, cilLibrary, cilSchool, cilCalendar, cilAddressBook, cilPeople, cilList, cilSpreadsheet, cilCalculator, cilMoney } from '@coreui/icons'


export default [

  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: { name: 'StaffDashboard' },
    icon: cilPeople,
  },




  // { component: 'CNavTitle', name: 'My class' },



  // {
  //   component: 'CNavItem',
  //   name: 'Class Analysis',
  //   to: { name: 'ClassAnalysis' },
  //   icon: cilSpreadsheet,
  // },

  // { component: 'CNavTitle', name: 'Attendance' },


  // {
  //   component: 'CNavItem',
  //   name: 'Class Attendance',
  //   to: { name: 'Attendance' },
  //   icon: cilCalculator,
  // },


  { component: 'CNavTitle', name: 'Remarks' },


  {
    component: 'CNavItem',
    name: 'Class Remarks',
    to: { name: 'Remarks' },
    icon: cilCalculator,
  },




]
