
import axios from 'axios'







const api = axios.create({
 // baseURL: 'http://127.0.0.1:8000/api/',


  baseURL: 'https://feessystem-aidooemmanuelkwame1416-zluuv6f0.leapcell.dev/api/',


  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Helper: normalize to a pathname we can test
function resolvePath(config) {
  try {
    const url = new URL(config.url, config.baseURL)
    // e.g. "/api/login/" -> "api/login/"
    return url.pathname.replace(/^\/+/, '')
  } catch {
    // Fallback if URL constructor fails (rare)
    return (config.url || '').replace(/^\/+/, '')
  }
}

api.interceptors.request.use(
  (config) => {
    // Let the browser set multipart boundary if FormData
    if (config.data instanceof FormData) {
      // Axios will remove Content-Type so the browser can set a boundary
      delete config.headers['Content-Type']
    }

    // Determine if request is public
    const path = resolvePath(config)          // e.g. "api/login/"
    const publicPaths = [
      'api/login/',                 // login
      'api/password-reset/',        // request password reset
      'api/password-reset/confirm/' // confirm password reset
    ]
    const isPublic = publicPaths.some(p => path.startsWith(p))

    if (!isPublic) {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`

  } else {
    // No token found, optionally handle this case (e.g., redirect to login)

  }
}


    return config
  },
  (error) => Promise.reject(error)
)

// Optional: central 401/403 handling (logout or redirect)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {

      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Optionally: window.location.hash = '#/login'
    }
    return Promise.reject(error)
  }
)

export const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'



export const get_administrators = () => api.get("administrators/");
export const get_administrators_count = () => api.get("administrators/count/");
export const create_administrator = (payload) => api.post("administrators/", payload);
export const update_administrator = (id, payload) => api.put(`administrators/${id}/`, payload);
export const delete_administrator = (id) => api.delete(`administrators/${id}/`);

// AUTH APIs

export const login = (payload) => api.post('login/', payload)
export const logout = () => api.post('logout/')
export const changepassword = (data) => api.post('change-password/', data);
export const resetpassword = (data) => api.post('password-reset/', data);
export const resetpasswordconfirm = (data) => api.post('confirm/', data);


// fee structure APIs

export const get_raw_fee_structures = () => api.get("fees/raw-fee-structures");
export const get_fee_structures = (params) => api.get("fees/fee-structures", { params }); // APPLIED
export const create_fee_structure = (payload) => api.post("fees/fee-structures/", payload); // APPLIED
export const update_fee_structure = (id, payload) => api.put(`fees/fee-structures/${id}/`, payload);  // APPLIED
export const delete_fee_structure = (id) => api.delete(`fees/fee-structures/${id}/`);  // APPLIED

// PAYMENTS APIs
export const get_payments = (params) => api.get("fees/payments", { params });
export const create_payment = (payload) => api.post("fees/payments/", payload);
export const delete_payment = (id) => api.delete(`fees/payments/${id}/`);

// Student APIs
export const st = (params) => api.get("student/students", { params });
export const rawst = () => api.get("student/rawstudents");


export const get_num_of_students_insignt = () => api.get("student/students/total/");
export const get_students_grouped_by_class_insignt = () => api.get("student/students/per_class/");

export const create_student = (payload) => api.post("student/create/", payload);
export const update_student = (id, payload) => api.put(`student/create/${id}/`, payload);
export const delete_student = (id) => api.delete(`student/students/${id}/`);



// student fee records APIs//////////////////////// HERE /

export const get_raw_student_fee_records = () => api.get("fees/raw-student-fee-records");
export const get_student_fee_record = (params) => api.get("fees/student-fee-records", { params });
export const get_expected_fees_insight = () => api.get("fees/student-fee-records/expected_fees/");
export const get_collected_vs_pending_insight = () => api.get("fees/student-fee-records/collection_summary/");
export const percentage_paid_by_class_insight = () => api.get("fees/student-fee-records/unpaid_percentage_by_class/");
export const students_with_balance_insight = () => api.get("fees/student-fee-records/students_with_balance/");
export const create_student_fee_record = (payload) => api.post("fees/student-fee-records/", payload);
export const update_student_fee_record = (id, payload) => api.put(`fees/student-fee-records/${id}/`, payload);
export const delete_student_fee_record = (id) => api.delete(`fees/student-fee-records/${id}/`);

// FAMILY APIs

export const get_raw_families = () => api.get("family-fees/raw-families");
export const get_families = (params) => api.get("family-fees/families", { params });
export const create_family = (payload) => api.post("family-fees/families/", payload);
export const update_family = (id, payload) => api.put(`family-fees/families/${id}/`, payload);
export const delete_family = (id) => api.delete(`family-fees/families/${id}/`);

// FAMILY FEES RECS APIs /////////////////////////////
export const get_raw_family_fee_rec = () => api.get("family-fees/raw-family-fee-records");
export const get_family_fee_rec = (params) => api.get("family-fees/family-fee-records", { params });
export const create_family_fee_rec = (payload) => api.post("family-fees/family-fee-records/", payload);
export const delete_family_fee_rec = (id) => api.delete(`family-fees/family-fee-records/${id}/`);

// FAMILY PAYMENTS APIs
export const get_family_payments = (params) => api.get("family-fees/family-payments", { params });
export const create_family_payment = (payload) => api.post("family-fees/family-payments/", payload);
export const delete_family_payment = (id) => api.delete(`family-fees/family-payments/${id}/`);
// Classes APIs
export const get_classes = () => api.get("student/classes");
export const create_class = (payload) => api.post("student/classes/", payload);
export const update_class = (id, payload) => api.put(`student/classes/${id}/`, payload);
export const delete_class = (id) => api.delete(`student/classes/${id}/`);
// staff APIs
export const get_staff = () => api.get("staff/staff-profiles");
export const num_of_staff_insight = () => api.get("staff/staff-profiles/total_teachers");
export const create_staff = (payload) => api.post("staff/staff-profiles/", payload);
export const update_staff = (id, payload) => api.patch(`staff/staff-profiles/${id}/`, payload);
export const delete_staff = (id) => api.delete(`staff/staff-profiles/${id}/`);
// academic year APIs
export const get_academic_years = () => api.get("student/academic-years");
export const create_academic_year = (payload) => api.post("student/academic-years/", payload);
export const update_academic_year = (id, payload) => api.put(`student/academic-years/${id}/`, payload);
export const delete_academic_year = (id) => api.delete(`student/academic-years/${id}/`);
// term APIs
export const get_terms = () => api.get("student/terms");
export const create_term = (payload) => api.post("student/terms/", payload);
export const update_term = (id, payload) => api.put(`student/terms/${id}/`, payload);
export const delete_term = (id) => api.delete(`student/terms/${id}/`);
// DEACTIVATION COUNT
export const get_student_deactivation_count = () => api.get("deactivated-students/count/");
//  STUDENT DEACTIVATED APIS
export const get_deactivated_students = () => api.get("student/deactivated-students/");
export const activate_deactivated_student = (id) => api.post(`student/deactivated-students/${id}/activate/`);
export const update_deactivated_student = (id, payload) => api.put(`student/deactivated-students/${id}/`, payload);
export const delete_deactivated_student = (id) => api.delete(`student/deactivated-students/${id}/`);
// FAMILY DEACTIVATED APIS
export const get_deactivated_families = () => api.get("family-fees/deactivated-families/");
export const activate_deactivated_family = (id) => api.post(`family-fees/deactivated-families/${id}/activate/`);
export const update_deactivated_family = (id, payload) => api.put(`family-fees/deactivated-families/${id}/`, payload);
export const delete_deactivated_family = (id) => api.delete(`family-fees/deactivated-families/${id}/`);















export default api;
