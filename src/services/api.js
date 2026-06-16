
import axios from 'axios'


const api = axios.create({
       baseURL: 'http://127.0.0.1:8080/api/', // Ktor development serverserver

// baseURL: 'https://kog-ktor-backend-production.up.railway.app/api/', // RAILWAY production (default for production)





  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})




// Helper: normalize to a pathname we can test
function resolvePath(config) {
  try {
    // If config.url is relative, URL() will resolve with baseURL
    const url = new URL(config.url, config.baseURL || api.defaults.baseURL)
    // "/api/auth/login" -> "api/auth/login"
    return url.pathname.replace(/^\/+/, '')
  } catch (e) {
    // Fallback if URL constructor fails
    return (config.url || '').replace(/^\/+/, '')
  }
}

api.interceptors.request.use(
  (config) => {
    // Let the browser set multipart boundary if FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    const path = resolvePath(config)

    // ✅ Ktor public endpoints (match your backend routes)

    const publicPaths = [
      'api/auth/login',
      'api/auth/login/',
      // add later if you implement refresh:
      // 'api/auth/refresh',
      // 'api/auth/refresh/',
    ]

    const isPublic = publicPaths.some((p) => path.startsWith(p))

    if (!isPublic) {
      const token = localStorage.getItem('token')
      if (token) {
        // ✅ JWT Bearer (NOT "Token")
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error && error.response ? error.response.status : null

    if (status === 401) {
      // Token invalid/expired => logout client-side
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('family')
      localStorage.removeItem('staff')
      // Optionally redirect to login:
      // window.location.href = '/#/login'
    }

    return Promise.reject(error)
  }
)



export const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'

// Classes APIs
export const get_classes = () => api.get("student/classes");
export const get_classes_ktor = () => api.get("grade-class");

export const create_class = (payload) => api.post("student/classes/", payload);
export const create_class_ktor = (payload) => api.post("grade-class", payload);

export const update_class = (id, payload) => api.put(`student/classes/${id}/`, payload);
export const update_class_ktor = (id, payload) => api.patch(`grade-class/${id}`, payload);

export const delete_class = (id) => api.delete(`student/classes/${id}/`);
export const delete_class_ktor = (id) => api.delete(`grade-class/${id}`);

// academic year APIs
export const get_academic_years = () => api.get("student/academic-years");
export const get_academic_years_ktor = () => api.get("year");

export const create_academic_year = (payload) => api.post("student/academic-years/", payload);
export const create_academic_year_ktor = (payload) => api.post("year", payload);

export const update_academic_year = (id, payload) => api.put(`student/academic-years/${id}/`, payload);
export const update_academic_year_ktor = (id, payload) => api.patch(`year/${id}`, payload);

export const delete_academic_year = (id) => api.delete(`student/academic-years/${id}/`);
export const delete_academic_year_ktor = (id) => api.delete(`year/${id}`);

// term APIs
export const get_terms = () => api.get("student/terms");
export const get_terms_ktor = () => api.get("term");

export const create_term = (payload) => api.post("student/terms/", payload);
export const create_term_ktor = (payload) => api.post("term", payload);

export const delete_term = (id) => api.delete(`student/terms/${id}/`);
export const delete_term_ktor = (id) => api.delete(`term/${id}`);

export const update_term = (id, payload) => api.put(`student/terms/${id}/`, payload);
export const update_term_ktor = (id, payload) => api.patch(`term/${id}`, payload);

// fee structure APIs
export const get_raw_fee_structures_ktor = () => api.get("fee-structure");

export const get_raw_fee_structures_ktor_paginated = (page, limit, search) =>
  api.get("fee-structure/paginated", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {})
    }
  });

export const get_fee_structures = (params) => api.get("fees/fee-structures", { params }); // for pagination
export const get_fee_structures_ktor = (params) => api.get("fee-structures", { params }); // for pagination

export const create_fee_structure = (payload) => api.post("fees/fee-structures/", payload); // APPLIED
export const create_fee_structure_ktor = (payload) => api.post("fee-structure", payload); // APPLIED

export const update_fee_structure = (id, payload) => api.put(`fees/fee-structures/${id}/`, payload);  // APPLIED
export const update_fee_structure_ktor = (id, payload) => api.patch(`fee-structure/${id}`, payload);  // APPLIED

export const delete_fee_structure = (id) => api.delete(`fees/fee-structures/${id}/`);  // APPLIED
export const delete_fee_structure_ktor = (id) => api.delete(`fee-structure/${id}`);  // APPLIED

// Student APIs
export const student_profile = (id) => api.get(`student/student-profile/${id}/`);
export const st = (params) => api.get("student/students", { params });

export const rawst = () => api.get("student/rawstudents");


export const rawst_ktor = (search) =>
  api.get("student/raw", {
    params: search?.trim() ? { search: search.trim() } : {}
  })

export const rawst_ktor_paginated = (page, limit, search) =>
  api.get("student/paginated", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {})
    }
  })



export const get_num_of_students_insignt_ktor = () => api.get("student/number");




export const get_students_grouped_by_class_insignt = () => api.get("student/students/per_class/");
export const get_students_grouped_by_class_insignt_ktor = () => api.get("student/per-class");

export const create_student = (payload) => api.post("student/create/", payload);
export const create_student_ktor = (payload) => api.post("student", payload);

export const update_student = (id, payload) => api.put(`student/create/${id}/`, payload);
export const update_student_ktor = (id, payload) => api.patch(`student/${id}`, payload);

export const delete_student = (id) => api.delete(`student/students/${id}/`);
export const delete_student_ktor = (id) => api.delete(`student/${id}`);

// student fee records APIs
export const get_raw_student_fee_records = () => api.get("fees/raw-student-fee-records");
export const get_raw_student_fee_records_ktor = () => api.get("fee-records");

export const get_student_payment_list_per_term = (id) => api.get(`fees/student-payment-records/${id}/`);
export const get_regular_payments = (id) => api.get(`fees/regular-payments/${id}/`);

export const get_student_fee_record = (params) => api.get("fees/student-fee-records", { params });

export const get_student_fee_record_ktor = () => api.get("fee-records");

// services/api.js
export const get_student_fee_records_ktor_paginated = (
  page,
  limit,
  search,
  fee_structure_id,
  is_fully_paid
) =>
  api.get("fee-records/paginated", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(fee_structure_id ? { fee_structure_id } : {}),
      ...(is_fully_paid != null && is_fully_paid !== "" ? { is_fully_paid } : {}),
    },
  });


export const create_student_fee_record = (payload) => api.post("fees/student-fee-records/", payload);
export const create_student_fee_record_ktor = (payload) => api.post("fee-records", payload);

export const delete_student_fee_record = (id) => api.delete(`fees/student-fee-records/${id}/`);
export const delete_student_fee_record_ktor = (id) => api.delete(`fee-records/${id}`);

// PAYMENTS APIs
export const get_payments = (params) => api.get("fees/payments", { params });
export const get_payments_ktor = () => api.get("payment");





export const get_payments_ktor_paginated = (page, limit, search, date_filter) =>
  api.get("payment/paginated", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(date_filter?.trim() ? { date_filter: date_filter.trim() } : {}),
    }
  });




export const delete_payment = (id) => api.delete(`fees/payments/${id}/`);
export const delete_payment_ktor = (id) => api.delete(`payment/${id}`);

export const create_payment = (payload) => api.post("fees/payments/", payload);
export const create_payment_ktor = (payload) => api.post("payment", payload);

// FAMILY APIs
export const get_raw_families = () => api.get("family-fees/raw-families");
export const get_raw_families_ktor = () => api.get("family");

export const create_family = (payload) => api.post("family-fees/families/", payload);
export const create_family_ktor = (payload) => api.post("family", payload);

export const delete_family = (id) => api.delete(`family-fees/families/${id}/`);
export const delete_family_ktor = (id) => api.delete(`family/${id}`);

export const get_families = (params) => api.get("family-fees/families", { params });

export const get_families_paginated = (page, limit, search) =>
  api.get("family/paginated", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {})
    }
  });


export const update_family = (id, payload) => api.put(`family-fees/families/${id}/`, payload);
export const update_family_ktor = (id, payload) =>  api.patch(`family/${id}`, payload);

// FAMILY FEES RECS APIs ///
export const get_raw_family_fee_rec = () => api.get("family-fees/raw-family-fee-records");
export const get_raw_family_fee_rec_ktor = () => api.get("family-fee-record");

export const get_family_fee_records_paginated = (page, limit, search) =>
  api.get("family-fee-record/paginated", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {})
    }
  });

export const create_family_fee_rec = (payload) => api.post("family-fees/family-fee-records/", payload);
export const create_family_fee_rec_ktor = (payload) => api.post("family-fee-record", payload);



export const delete_family_fee_rec = (id) => api.delete(`family-fees/family-fee-records/${id}/`);
export const delete_family_fee_rec_ktor = (id) => api.delete(`family-fee-record/${id}`);

export const get_family_fee_rec = (params) => api.get("family-fees/family-fee-records", { params });

// FAMILY PAYMENTS APIs
export const get_family_payments = (params) => api.get("family-fees/family-payments", { params });
export const get_family_payments_ktor = () => api.get("family-payment");


export const create_family_payment = (payload) => api.post("family-fees/family-payments/", payload);
export const create_family_payment_ktor = (payload) => api.post("family-payment", payload);

export const delete_family_payment = (id) => api.delete(`family-fees/family-payments/${id}/`);

export const delete_family_payment_ktor = (id) => api.delete(`family-payment/${id}`);


export const get_expected_fees_insight = () => api.get("fees/student-fee-records/expected_fees/");

export const get_expected_fees_insight_ktor = () => api.get("principal/fees/expected_fees");


export const get_collected_vs_pending_insight = () => api.get("fees/student-fee-records/collection_summary/");
export const get_collected_vs_pending_insight_ktor = () => api.get("principal/collection-summary");

export const percentage_paid_by_class_insight = () => api.get("fees/student-fee-records/unpaid_percentage_by_class/");
export const students_with_balance_insight = () => api.get("fees/student-fee-records/students_with_balance/");
export const update_student_fee_record = (id, payload) => api.put(`fees/student-fee-records/${id}/`, payload);



// term APIs
export const get_terms_with_year = () => api.get("student/current-term");

export const get_administrators = () => api.get("administrators/");
export const get_administrators_ktor = () => api.get("admin/raw");


export const get_administrators_count = () => api.get("administrators/count/");
export const get_administrators_count_ktor = () => api.get("principal/admin-number");

export const create_administrator = (payload) => api.post("administrators/", payload);


export const create_administrator_ktor = (payload) => api.post("admin", payload);


export const update_administrator = (id, payload) => api.put(`administrators/${id}/`, payload);
export const update_administrator_ktor = (id, payload) => api.patch(`admin/${id}`, payload);


export const delete_administrator = (id) => api.delete(`administrators/${id}/`);
export const delete_administrator_ktor = (id) => api.delete(`admin/${id}`);

// AUTH APIs

export const login_ktor = (payload) => api.post('auth/login', payload)





export const logout = () => api.post('auth/logout')
export const changepassword = (data) => api.post('change-password/', data);
export const resetpassword = (data) => api.post('password-reset/', data);
export const resetpasswordconfirm = (data) => api.post('confirm/', data);

// original ktor apis //
// SUBJECTS API

export const ktor_getSubjects = () => api.get("subjects");

export const ktor_postSubjects = (payload) => api.post("subjects", payload);
export const ktor_patchSubjects = (id, payload) => api.patch(`subjects/${id}`, payload);

export const ktor_deleteSubjects = (id) => api.delete(`subjects/${id}`);











// paystack stuff
export const create_online_transaction = (payload) => api.post("fees/paystack/create/", payload);
export const verify_payment = (payload) => api.post("fees/paystack/verify/", payload);


// family fee records api

export const get_family_payment_list_per_term = (id) => api.get(`family-fees/family-payment-records/${id}/`);
export const get_family_payment_list_regular = (id) => api.get(`family-fees/family-regular-payments/${id}/`);




// ///////////////////////////////////////////////////////////////........







// staff APIs

export const get_staff = () => api.get("staff/raw");

export const get_staff_ktor = () => api.get("staff/raw");

export const create_staff_ktor= (payload) => api.post("staff", payload);

export const update_staff_ktor = (id, payload) => api.patch(`staff/${id}`, payload);

export const delete_staff_ktor = (id) => api.delete(`staff/${id}`);

export const num_of_staff_insight = () => api.get("staff/staff-profiles/total_teachers");
export const num_of_staff_insight_ktor = () => api.get("principal/staff-number");

export const get_teacher_student = () => api.get("staff/teacher-students");

export const assigned_class_ktor = (id) => api.get(`staff/assigned-class/${id}`);

export const create_subject_score_ktor = ( payload) => api.post("subject-scores/by-staff", payload);

export const create_subject_score = (payload) =>    api.post("academic-records/new-subject-scores/subject-scores/", payload);

// promotion apis

export const get_promotions_ktor=  () => api.get("promotion");

export const post_promotions_ktor=  (payload) => api.post("promotion", payload);

export const delete_promotions_ktor=  (id) => api.delete(`promotion/${id}`);

export const patch_promotions_ktor=  (id, payload) => api.patch(`promotion/${id}`, payload);

// grading system APIs

export const get_grading_system_ktor = () => api.get("grades");

export const create_grading_system_ktor = (payload) => api.post("grades", payload);

export const update_grading_system_ktor = (id, payload) => api.patch(`grades/${id}`, payload);

export const delete_grading_system_ktor = (id) => api.delete(`grades/${id}`);

// current term and year APIs

export const get_terms_with_year_ktor = () => api.get("term/current");

// remarks

export const get_subject_scores_context_ktor = (classId, termId, yearId, subject) =>  api.get('/subject-scores/context', {    params: { classId, termId, yearId, subject }  });

export const get_academic_records_by_class_ktor = (classId) => api.get(`academic-records/class/${classId}/current`);

export const patch_academic_remarks = (id, payload) => api.patch(`academic-records/${id}/remarks`, payload);

// report card

export const getReportCardByUser_ktor = (userId) =>  api.get(`student-academic-report-cards/user/${userId}`);  // → /api/report-card/user/<id>/

// performance chart

export const getPerformanceChart = (studentId, year, term) =>
   api.get(    `performance-charts/`,    { params: {student: studentId, year: year,
        term: term
      }
    }
  );

// IMPORTANT: student param is AccountTable.id (your backend now resolves student_profile)
export const getPerformanceChart_ktor = (accountId, yearId, termId) =>
  api.get('performance-charts', { params: { student: accountId, year: yearId, term: termId } })

// all terms

export const get_all_years_ktor = () => api.get("year/all-years")

export const get_all_terms_ktor = () => api.get("term/all-terms")

// all academic records

export const get_all_academic_records_ktor = () => api.get("academic-records")

export const delete_academic_record_ktor = (id) => api.delete(`academic-records/${id}`);

// receipt printing

export const receipt_print = (id) =>  api.get(`receipts/${id}/pdf`, { responseType: "blob" })

export const family_receipt_pdf = (id) =>  api.get(`family-receipt/${id}/pdf`, { responseType: "blob" })

// profile picture

export const upload_account_profile_picture_ktor = (accountId, formData) =>
  api.post(`/profile-picture/${accountId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });




export const delete_account_profile_picture_ktor = (accountId) =>  api.delete(`/profile-picture/${accountId}`)







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
// academic records


// new
export const subject_scores = () => api.get("academic-records/new-subject-scores/subject-scores/");



// academic comments
export const get_academic_comments = (className) =>  api.get(`academic-records/report-comments/report-comments/?class_name=${encodeURIComponent(className)}`
  )


// services/api.js

export const create_academic_comment = (id, payload) =>api.patch(`academic-records/report-comments/report-comments/${id}/`,   payload  )


//  academic summary for students
export const getClassAnalysis = (year, term, gradeclass) =>
  api.get("academic-records/teacher/analysis/class/", {
    params: {
      year,
      term,
      gradeclass,   // ✅ correct and defined
    },
  });

export const academic_records = (payload) =>  api.post("academic-records/student-academic-records/submit-subject/", payload);

// Report card: all terms for one student
export const getReportCardByStudent = (studentId) =>  api.get(`academic-records/report/report-card/student/${studentId}/`); // → /api/report-card/student/<id>/


// line chart on parent dashbord



  // Report card: single record by id
export const getReportRecord = (recordId) =>  api.get(`academic-records/report/report-card/record/${recordId}/`); // → /api/report-card/record/<id>/






// profile picture


export const get_profile_picture = (userId) => api.get(`student/profile-picture/${userId}`);


// news

// --- Subject Ranking APIs ---
// --- Ranking APIs ---
export const publish_subject = (payload) =>
  api.post("academic-records/new-subject-scores/subject-scores/publish-subject/", payload);

export const publish_overall = (payload) =>
  api.post("academic-records/new-subject-scores/subject-scores/publish-overall/", payload);

// ✅ Fetch all categories (category → classes)
export const getCategories = () =>  api.get("academic-records/new-categories/categories");
export const getCategories_ktor = () =>  api.get("categories");

export const createCategory_ktor = (payload) =>  api.post("categories", payload);
export const updateCategory_ktor = (id, payload) =>  api.put(`categories/${id}`, payload);

export const deleteCategory_ktor = (id) =>  api.delete(`categories/${id}`);

export const getCategoriesSubject = () =>  api.get("academic-records/new-subject-categories/subject-categories");

// ✅ Fetch single category

export default api;

