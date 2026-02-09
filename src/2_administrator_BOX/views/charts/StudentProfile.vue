<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader class="bg-gradient-primary text-white">
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong style="color: black;" class="fs-5">Student Profiles</strong>

            <!-- Loading text -->
    <span v-if="loading" class="text-dark fw-bold ms-3">Loading data ...</span>



            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by name..."
                size="sm"
                class="shadow-sm border-primary"
                style="min-width: 260px;"
              />




              <CButton color="light" class="text-primary border-primary" size="sm" @click="openAddModal">
                <CIcon icon="cil-user-follow" class="me-1" /> Add Student
              </CButton>

              <!-- Bulk delete -->
              <CButton
                color="danger"
                size="sm"
                :disabled="selectedIds.length === 0"
                @click="openBulkDeleteConfirm"
              >
                Delete Selected ({{ selectedIds.length }})
              </CButton>


            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <div v-if="loading" class="text-center my-4">
            <CSpinner color="primary" class="me-2" /> Loading data ...
          </div>

          <CTable v-else hover responsive bordered class="shadow-sm">

            <CTableHead color="light">
              <CTableRow>

                  <!-- Select-all (applies to filtered rows) -->
                  <CTableHeaderCell scope="col" class="text-center" style="width: 48px;">
                    <CFormCheck
                      :checked="allSelected"
                      :indeterminate="someSelected"
                      @change="toggleSelectAll"
                      aria-label="Select all in current view"
                    />
                  </CTableHeaderCell>

                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>

                <CTableHeaderCell>Current Class</CTableHeaderCell>
                <CTableHeaderCell>Dad's Contact</CTableHeaderCell>
                <CTableHeaderCell>Mom's Contact</CTableHeaderCell>
                <CTableHeaderCell>Has Discount</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>


              </CTableRow>
            </CTableHead>

<CTableBody>

  <!-- Loading state -->
  <CTableRow v-if="loading">
    <CTableDataCell colspan="8" class="text-center py-4">
      <CSpinner color="primary" class="me-2" /> Loading data ...
    </CTableDataCell>
  </CTableRow>

  <!-- Empty state -->
  <CTableRow v-else-if="filteredStudents.length === 0">
    <CTableDataCell colspan="8" class="text-center text-muted py-4">
      No student records found.
    </CTableDataCell>
  </CTableRow>

  <!-- Data rows -->
  <CTableRow v-else v-for="(student, idx) in filteredStudents" :key="student.id">


    <CTableDataCell class="text-center">
                    <CFormCheck v-model="selectedIds" :value="Number(student.id)" aria-label="Select row" />
    </CTableDataCell>


    <CTableHeaderCell>{{ (currentPage - 1) * pageSize + idx + 1 }}</CTableHeaderCell>
    <CTableDataCell>{{ student.user.full_name }}</CTableDataCell>
    <CTableDataCell>{{ classValueToLabel(student.current_class) }}</CTableDataCell>
    <CTableDataCell>{{ student.contact_of_father }}</CTableDataCell>
    <CTableDataCell>{{ student.contact_of_mother }}</CTableDataCell>

    <CTableDataCell>
      <CBadge :color="student.is_discounted_student ? 'success' : 'secondary'">
        {{ student.is_discounted_student ? 'Yes' : 'No' }}
      </CBadge>
    </CTableDataCell>
    <CTableDataCell class="text-end">
      <CButtonGroup size="sm">
        <CButton color="secondary" variant="outline" @click="openEditModal(student)">Edit</CButton>
        <CButton color="danger" variant="outline" @click="deleteStudent(student)">Delete</CButton>
      </CButtonGroup>
    </CTableDataCell>
  </CTableRow>
</CTableBody>



          </CTable>

                      <!-- Pagination + Range -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-changed="onPageChanged"
            />
            <div style="font-size: 14px; color: #7f8c8d;">
              {{ showingRange }}
            </div>
          </div>


        </CCardBody>


      </CCard>
    </CCol>
  </CRow>

  <CModal :visible="showDeleteModal" @close="cancelDelete" size="md">
  <CModalHeader class="bg-danger text-white">
    <CModalTitle>Confirm Deletion</CModalTitle>
  </CModalHeader>
  <CModalBody>
    Are you sure you want to delete <strong>{{ studentToDelete?.user?.full_name }}</strong>? This action cannot be reversed.
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" variant="outline" @click="cancelDelete">Cancel</CButton>
    <CButton color="danger" @click="confirmDelete">Delete</CButton>
  </CModalFooter>
</CModal>



  <!-- Confirm Delete (Bulk) -->
  <CModal :visible="showDeleteBulkModal" @close="closeBulkDeleteConfirm">
    <CModalHeader><CModalTitle>Delete Selected</CModalTitle></CModalHeader>
    <CModalBody>
      You are about to delete <strong>{{ selectedIds.length }}</strong> Student(s).
      This action cannot be undone. Continue?
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeBulkDeleteConfirm" :disabled="isDeleting">Cancel</CButton>
      <CButton color="danger" @click="confirmDeleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>




<!-- Modal -->


<!-- Redesigned Modal -->
<CModal :visible="showFormModal" @close="closeFormModal" size="xl" class="student-modal-premium">

  <!-- HEADER -->
  <CModalHeader class="modal-header-premium">
    <CModalTitle class="d-flex align-items-center gap-2">
      <CIcon icon="cil-education" size="lg" />
      {{ isEdit ? 'Edit Student Profile' : 'Add New Student' }}
    </CModalTitle>
  </CModalHeader>

  <CModalBody class="modal-body-premium">

    <!-- TABS -->
    <CTabs variant="pills" class="premium-tabs" :activeItemKey="'personal-info'">

      <!-- ================= STUDENT INFO ================= -->
      <CTab title="Student Info" itemKey="personal-info">
        <div class="card-premium">
          <div class="card-title-premium">
            <CIcon icon="cil-user" /> Student Information
          </div>

          <div class="row g-4">
            <div class="col-md-8">
              <CFormLabel>Full Name  <span class="text-danger">*</span> </CFormLabel>
              <CFormInput v-model="form.full_name" />
            </div>

            <div class="col-md-4">
              <CFormLabel>Gender <span class="text-danger">*</span> </CFormLabel>
              <CFormSelect v-model="form.gender">
                <option disabled selected>Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </CFormSelect>
            </div>

            <div class="col-md-6">
              <CFormLabel>Current Class <span class="text-danger">*</span> </CFormLabel>
              <CFormSelect v-model="form.current_class">
                <option disabled selected>Select class</option>
                <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
                  {{ cls.label }}
                </option>
              </CFormSelect>
            </div>

            <div class="col-md-6">
              <CFormLabel>Class Seeking Admission</CFormLabel>

              <CFormSelect v-model="form.class_seeking_admission_to">
                <option disabled selected>Select class</option>
                <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
                  {{ cls.label }}
                </option>
              </CFormSelect>
            </div>

            <div class="col-md-6">
              <CFormLabel>Date of Birth</CFormLabel>
              <CFormInput type="date" v-model="form.date_of_birth" />
            </div>

            <div class="col-md-6">
              <CFormLabel>Nationality</CFormLabel>
              <CFormInput v-model="form.nationality" />
            </div>
          </div>
        </div>
      </CTab>

      <!-- ================= PARENT INFO ================= -->
      <CTab title="Parent Info" itemKey="parental-info">
        <div class="card-premium">
          <div class="card-title-premium">
            <CIcon icon="cil-people" /> Father’s Information
          </div>

          <div class="row g-4 mb-4">
            <div class="col-md-6">
              <CFormLabel>Name</CFormLabel>
              <CFormInput v-model="form.name_of_father" />
            </div>
            <div class="col-md-6">
              <CFormLabel>Contact of Father <span class="text-danger">*</span> </CFormLabel>
              <CFormInput v-model="form.contact_of_father" />
            </div>
            <div class="col-md-6">
              <CFormLabel>Occupation</CFormLabel>
              <CFormInput v-model="form.occupation_of_father" />
            </div>
            <div class="col-md-6">
              <CFormLabel>Nationality</CFormLabel>
              <CFormInput v-model="form.nationality_of_father" />
            </div>
          </div>

          <div class="card-title-premium">
            <CIcon icon="cil-people" /> Mother’s Information
          </div>

          <div class="row g-4">
            <div class="col-md-6">
              <CFormLabel>Name</CFormLabel>
              <CFormInput v-model="form.name_of_mother" />
            </div>
            <div class="col-md-6">
              <CFormLabel>Contact of Mother <span class="text-danger">*</span></CFormLabel>
              <CFormInput v-model="form.contact_of_mother" />
            </div>
            <div class="col-md-6">
              <CFormLabel>Occupation</CFormLabel>
              <CFormInput v-model="form.occupation_of_mother" />
            </div>
            <div class="col-md-6">
              <CFormLabel>Nationality</CFormLabel>
              <CFormInput v-model="form.nationality_of_mother" />
            </div>
          </div>

          <div class="mt-4 card-switch-premium">
            <CFormSwitch
              v-model="form.is_discounted_student"
              label="Discounted Student"
              color="primary"
            />
          </div>
        </div>
      </CTab>

      <!-- ================= HEALTH INFO ================= -->
      <CTab title="Health Info" itemKey="health-info">
        <div class="card-premium">
          <div class="card-title-premium">
            <CIcon icon="cil-heart" /> Health Information
          </div>

          <div class="row g-4">
            <div class="col-md-4">
              <div class="card-switch-premium">
                <CFormSwitch v-model="form.is_immunized" label="Immunized" color="success" />
              </div>
            </div>

            <div class="col-md-4">
              <div class="card-switch-premium">
                <CFormSwitch v-model="form.has_allergies" label="Has Allergies" color="warning" />
              </div>
            </div>

           <!-- <div class="col-md-4">
              <div class="card-switch-premium">
                <CFormSwitch
                  v-model="form.has_peculiar_health_issues"
                  label="Special Health Issues"
                  color="danger"
                />
              </div>
            </div>
             -->

            <div class="col-12" v-if="form.has_allergies">
              <CFormLabel>Allergic Foods</CFormLabel>
              <CFormInput v-model="form.allergic_foods" />
            </div>

          <!---
            <div class="col-12" v-if="form.has_peculiar_health_issues">
              <CFormLabel>Health Notes</CFormLabel>
              <CFormTextarea v-model="form.health_issues" rows="3" />
            </div>

            -->
          </div>
        </div>
      </CTab>

      <!-- ================= OTHER INFO ================= -->
      <CTab title="Other Info" itemKey="other-info">
        <div class="card-premium">
          <div class="card-title-premium">
            <CIcon icon="cil-notes" /> Additional Information
          </div>

          <div class="row g-4">
            <div class="col-md-6">
              <CFormLabel>Last School Attended</CFormLabel>
              <CFormInput v-model="form.lastSchoolAttended" />
            </div>

            <div class="col-md-6">
              <CFormLabel>House Address</CFormLabel>
              <CFormInput v-model="form.houseNumber" />
            </div>

            <div class="col-12">
              <CFormLabel>Additional Info / Health Note</CFormLabel>
              <CFormTextarea v-model="form.otherRelatedInfo" rows="4" />
            </div>

            <div class="col-md-6 mt-3 d-flex gap-4">
              <CFormSwitch v-model="form.active" label="Active Student" />

            </div>

             <div class="col-12" v-if="form.active === false">
              <CFormLabel>Reason for Deactivating</CFormLabel>
              <CFormInput v-model="form.deactivation_reason" />
            </div>


          </div>
        </div>
      </CTab>

    </CTabs>

    <!-- FOOTER -->
    <div class="footer-premium text-end">
      <CButton color="light" class="me-3" @click="closeFormModal">Cancel</CButton>
      <CButton color="primary" @click="submitForm">
        <CIcon icon="cil-save" class="me-2" />
        {{ isEdit ? 'Update Student' : 'Create Student' }}
      </CButton>
    </div>

  </CModalBody>
</CModal>



</template>

<script setup>
const searchTerm = ref('')
import { useToast } from 'vue-toastification'
const toast = useToast()
const loading = ref(false)

import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const showDeleteModal = ref(false)
const studentToDelete = ref(null)
const students = ref([])

import Pagination from '@/Pagination.vue'

const pageSize = 10
const currentPage = ref(1)
const totalPages = ref(1)


import {st} from '@/services/api'
import {create_student} from '@/services/api'
import {update_student} from '@/services/api'
import {delete_student} from '@/services/api'

const selectedIds = ref([])
const showDeleteBulkModal = ref(false)
const isDeleting = ref(false)

function openBulkDeleteConfirm() {
  showDeleteBulkModal.value = true
}
function closeBulkDeleteConfirm() {
  if (!isDeleting.value) {
    showDeleteBulkModal.value = false
  }
}




async function confirmDeleteBulk() {
  const ids = selectedIds.value.map(n => Number(n)) // 👈 normalize
  if (ids.length === 0) return

  isDeleting.value = true
  try {
    for (const id of ids) {
      await delete_student(id)
    }
    const toDelete = new Set(ids)
    students.value = students.value.filter(s => !toDelete.has(Number(s.id)))
    selectedIds.value = []
    showDeleteBulkModal.value = false
    toast.success('Selected students deleted successfully!')
  } catch (err) {
    toast.error('Failed to delete selected students.')
  } finally {
    isDeleting.value = false
  }
}

function onPageChanged(page) {
  fetchUsers(page)
}


async function fetchUsers(page = 1) {
  loading.value = true

  try {
    const response = await st({
      page,
      search: searchTerm.value?.trim() || undefined,
    })

    const data = response.data

    students.value = data.results
    currentPage.value = page
    totalPages.value = Math.ceil(data.count / pageSize)

  } catch (err) {
    if (err.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your internet connection.', { position: 'top-right' })
    } else if (err.response) {
      toast.error(err.response.data?.message || 'Failed to fetch students.', { position: 'top-right' })
    } else {
      toast.error('An unexpected error occurred while fetching students.', { position: 'top-right' })
    }
  } finally {
    loading.value = false
  }
}

watch(searchTerm, () => {
  currentPage.value = 1
  fetchUsers(1)
})


onMounted(() => {
  fetchUsers();
});





const classOptions = [
  { label: 'Creche', value: 1 },
  { label: 'Nursery 1', value: 2 },
  { label: 'Nursery 2', value: 3 },
  { label: 'KG 1', value: 4 },
  { label: 'KG 2', value: 5 },
  { label: 'Class 1', value: 6 },
  { label: 'Class 2', value: 7 },
  { label: 'Class 3', value: 8 },
  { label: 'Class 4', value: 9 },
  { label: 'Class 5', value: 10 },
  { label: 'Class 6', value: 11 },
  { label: 'JHS 1', value: 12 },
  { label: 'JHS 2', value: 13 },
  { label: 'JHS 3', value: 14 },

]


const classValueToLabel = (value) => {
  if (!value) return ''
  const match = classOptions.find(c => c.value === Number(value))
  return match ? match.label : value
}



// Accepts: label string ("Class 2"), number (7), numeric string ("7"), or null/undefined.
// Returns the numeric value from classOptions or '' if not recognized.
const mapClassStringToValue = (input) => {
  if (input == null) return ''

  // If it's already a number, make sure it's a valid option
  if (typeof input === 'number') {
    return classOptions.some(c => c.value === input) ? input : ''
  }

  // If it's a numeric string like "7"
  if (typeof input === 'string' && /^\d+$/.test(input.trim())) {
    const num = Number(input.trim())
    return classOptions.some(c => c.value === num) ? num : ''
  }

  // If it's a label string like "Class 2"
  if (typeof input === 'string') {
    const normalized = input.trim().toLowerCase()
    const match = classOptions.find(cls => cls.label.toLowerCase() === normalized)
    return match ? match.value : ''
  }

  // Anything else (object, boolean, etc.)
  return ''
}

// Accepts: number (7) or numeric string ("7")
// Returns the label ("Class 2") or '' if not found
const toClassLabel = (value) => {
  if (value == null || value === '') return ''
  const num = Number(value)
  const match = classOptions.find(cls => cls.value === num)
  return match ? match.label : ''
}






const showFormModal = ref(false)
const isEdit = ref(false)
const currentStudent = ref(null)




const form = ref({
  // nested user object used throughout the modal
    id:'',
    full_name: '',
    gender: '',            // 'male' | 'female'
    nationality: '',
    date_of_birth: '',     // 'YYYY-MM-DD' string for <input type="date">

  // class selections (strings to satisfy CFormSelect)
  current_class: '',            // e.g., 'jhs 1'

class_seeking_admission_to: '', // e.g., 'jhs 1'

  // other top-level fields
  familyId: '',
  is_discounted_student: '',
  deactivation_reason: '',
  is_immunized: '',
  has_allergies: '',
  allergic_foods: '',
  has_peculiar_health_issues: '',
  health_issues: '',
  name_of_father: '',
  occupation_of_father: '',
  contact_of_father: '',
  nationality_of_father: '',
  name_of_mother: '',
  occupation_of_mother: '',
  contact_of_mother: '',
  nationality_of_mother: '',
  lastSchoolAttended: '',
  houseNumber: '',
  otherRelatedInfo: '',
  active: '',


  staff: false,

  role: 'STUDENT',
});


/*all refs above*/

const filteredStudents = computed(() =>
  students.value.filter(s => s?.user?.is_active !== false)
)


// Keep IDs normalized to numbers so selection/deletion logic is robust
const filteredIds = computed(() => filteredStudents.value.map(s => Number(s.id)))

const allSelected = computed(() =>
  filteredIds.value.length > 0 && filteredIds.value.every(id => selectedIds.value.includes(id))
)

const someSelected = computed(() =>
  filteredIds.value.length > 0 &&
  !allSelected.value &&
  filteredIds.value.some(id => selectedIds.value.includes(id))
)

function toggleSelectAll() {
  if (allSelected.value) {
    // unselect all visible
    selectedIds.value = selectedIds.value.filter(id => !filteredIds.value.includes(id))
  } else {
    // select all visible
    selectedIds.value = [...new Set([...selectedIds.value, ...filteredIds.value])]
  }
}

const openAddModal = () => {
  isEdit.value = false
  currentStudent.value = null
  form.value = { ...form.value,  is_immunized: false,
  has_allergies: false,
  allergic_foods: '',
  has_peculiar_health_issues: false,
  health_issues: '',
  name_of_father: '',
  occupation_of_father: '',
  nationality_of_father: '',
  name_of_mother: '',
  occupation_of_mother: '',
  contact_of_mother: '',
  nationality_of_mother: '',
  lastSchoolAttended: '',
  houseNumber: '',
  otherRelatedInfo: '',
  active: true,

class_seeking_admission_to: '', full_name: '', is_discounted_student:false, contact_of_mother:'', contact_of_father:'', gender: '', nationality: '', date_of_birth: '', current_class: '', familyId: '' }
  showFormModal.value = true
}

const mapClassValueToString = (value) => {
  const match = classOptions.find(
    cls => cls.value === Number(value)
  )
  return match ? match.label.toLowerCase() : ''
}


const openEditModal = (student) => {
  isEdit.value = true;
  currentStudent.value = student;

  form.value = {
    id: student.user.id,
    full_name: student.user.full_name || '',
    gender: student.user.gender || '',
    nationality: student.user.nationality || '',
    date_of_birth: student.user.date_of_birth || '',
    active: student.user.is_active,

    current_class: mapClassStringToValue(student.current_class),
    class_seeking_admission_to: mapClassStringToValue(
      student.class_seeking_admission_to
    ),

    familyId: '',

    is_immunized: Boolean(student.is_immunized),
    has_allergies: Boolean(student.has_allergies),
    has_peculiar_health_issues: Boolean(student.has_peculiar_health_issues),
    is_discounted_student: Boolean(student?.is_discounted_student),

    allergic_foods: student.allergic_foods || '',

    health_issues: student.health_issues || '',

    name_of_father: student.name_of_father || '',
    occupation_of_father: student.occupation_of_father || '',
    contact_of_father: student.contact_of_father || '',
    nationality_of_father: student.nationality_of_father || '',

    name_of_mother: student.name_of_mother || '',
    occupation_of_mother: student.occupation_of_mother || '',
    contact_of_mother: student.contact_of_mother || '',
    nationality_of_mother: student.nationality_of_mother || '',

    lastSchoolAttended: student.last_school_attended || '',
    houseNumber: student.house_number || '',
    otherRelatedInfo: student.other_related_info || '',



    staff: false,
    role: student.user.role?.toUpperCase() || 'STUDENT',
  };

  // Fix class dropdown value
  if (typeof student.current_class === 'string') {
    const classOption = classOptions.find(
      opt => opt.label.toLowerCase() === student.current_class.toLowerCase()
    );
    form.value.current_class = classOption ? classOption.value : '';
  }

  showFormModal.value = true;
};



const closeFormModal = () => {
  showFormModal.value = false
  currentStudent.value = null
}



const prepareStudentPayload = (payload) => {
  return {
    user: {
      id:payload.id,
      full_name: payload.full_name,
      role: "student",
      gender: payload.gender,
      nationality: payload.nationality,
      is_active: payload.active,
      is_staff: false,
      date_of_birth: payload.date_of_birth
    },
    current_class: payload.current_class,
    house_number: payload.houseNumber,
    is_discounted_student: payload.is_discounted_student,


    last_school_attended: payload.lastSchoolAttended,
    class_seeking_admission_to: mapClassValueToString(payload.class_seeking_admission_to),
    is_immunized: payload.is_immunized ? "true" : "false",
    has_allergies: payload.has_allergies ? "true" : "false",

    allergic_foods: payload.allergic_foods,

    has_peculiar_health_issues: payload.has_peculiar_health_issues ? "true" : "false",

    contact_of_father: payload.contact_of_father,
    contact_of_mother: payload.contact_of_mother,
    occupation_of_father: payload.occupation_of_father,
    occupation_of_mother: payload.occupation_of_mother,

    name_of_father: payload.name_of_father,
    name_of_mother: payload.name_of_mother,

    nationality_of_father: payload.nationalityOfFather,
    nationality_of_mother: payload.nationalityOfMother,

    deactivation_reason: payload.deactivation_reason,
    peculiar_health_issues: payload.healthIssues,
    other_related_info: payload.otherRelatedInfo
  };
};


function formatBackendErrors(errData) {
  if (!errData) return null;

  const parts = [];

  function walk(obj, prefix = "") {
    if (Array.isArray(obj)) {
      // leaf: array of messages
      const msgs = obj.map(m => String(m)).join("; ");
      parts.push(`${prefix}: ${msgs}`);
      return;
    }

    if (typeof obj === "string") {
      parts.push(`${prefix}: ${obj}`);
      return;
    }

    if (obj && typeof obj === "object") {
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        walk(value, nextPrefix);
      }
      return;
    }

    // other types
    parts.push(`${prefix}: ${String(obj)}`);
  }

  // If the server returned an array at the root, show those.
  if (Array.isArray(errData)) {
    return errData.map(x => String(x)).join(" / ");
  }

  // walk object
  walk(errData);

  // produce a single string
  return parts.length ? parts.join(" | ") : null;
}


const submitForm = async () => {
  loading.value = true;

  try {


    // ✅ Apply defaults BEFORE validation


    form.value.nationality = form.value.nationality || 'Ghanaian';
    form.value.date_of_birth = form.value.date_of_birth || '2002-02-02';
    form.value.deactivation_reason = form.value.deactivation_reason || 'Not specified';

    // ✅ Required field validation


    // ✅ Clean up form: trim strings and convert empty strings to null
    function deepClean(obj) {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
          if (typeof value === "string") {
            const trimmed = value.trim();
            return [key, trimmed === "" ? null : trimmed];
          } else if (value && typeof value === "object") {
            return [key, deepClean(value)];
          }
          return [key, value];
        })
      );
    }

    const cleaned = deepClean(form.value);


      if (isEdit.value && currentStudent.value) {
      // ✅ Update existing student
      const payload = prepareStudentPayload(cleaned);


      const response = await update_student(currentStudent.value.id, payload);





      // Update table immediately
      const index = students.value.findIndex(s => s.id === currentStudent.value.id);
      if (index !== -1) {
      const existing = students.value[index];

      // Update top-level fields
      Object.assign(existing, response.data);

      // If user is nested and needs update:
      if (response.data.user) {
        Object.assign(existing.user, response.data.user);
      }

  // Force Vue to notice (sometimes needed for nested)
  // existing._updated = Date.now(); // dummy property trick if still stuck
}
      closeFormModal();

      toast.success('Student updated successfully!', { position: 'top-right' });
      } else {
    // ✅ Call API and wait for response

    const payload = prepareStudentPayload(cleaned);



    const requiredFields = [
      { field: 'full_name', label: 'Full Name' },
      { field: 'contact_of_father', label: 'Contact of Father' },
      { field: 'contact_of_mother', label: 'Contact of Mother' },
      { field: 'current_class', label: 'Current Class' },
      { field: 'gender', label: 'Gender' },
    ];

    for (const { field, label } of requiredFields) {
      if (!form.value[field] || form.value[field].toString().trim() === '') {
        toast.error(`${label} is required`, { position: 'top-right' });
        loading.value = false;
        return;
      }
    }

    const response = await create_student(payload);




    if (response && response.data) {


      // ✅ Update the table immediately with the new student record

      students.value.push(response.data);

      toast.success('Student created successfully!', { position: 'top-right' });

      // ✅ Close modal after success
      closeFormModal();

      // ✅ OPTIONAL: Delay navigation slightly to ensure UI update
      setTimeout(() => {
        router.push({ path: '/administrator/student' });
      }, 500);
    } else {
      throw new Error('No response data from the server.');
    }}

  } catch (err) {




  const serverData = err?.e?.response

;
  const formatted = formatBackendErrors(serverData);

  const message = formatted || err?.message || "Failed to create student. Please check your input and try again.";
  // show first line only in the toast if you want brevity:
  const firstLine = message.split(" | ")[0];

  toast.error(firstLine, { position: "top-right" });
  // optionally show full errors in console or another UI element

} finally {
    loading.value = false;
  }
};

const deleteStudent = (student) => {
  studentToDelete.value = student
  showDeleteModal.value = true
}


// Single delete
const confirmDelete = async () => {
  if (!studentToDelete.value) return
  loading.value = true
  showDeleteModal.value = false

  const studentId = Number(studentToDelete.value.id)   // 👈 normalize
  const studentName = studentToDelete.value.user.full_name

  try {
    await delete_student(studentId)

    // Normalize ids on both sides to be safe
    students.value = students.value.filter(s => Number(s.id) !== studentId)

    toast.success(`${studentName} deleted successfully!`, { position: 'top-right' })
  } catch (error) {
    toast.error('Failed to delete student. Please try again.', { position: 'top-right' })
  } finally {
    loading.value = false
    studentToDelete.value = null
  }
}


const cancelDelete = () => {
  showDeleteModal.value = false
  studentToDelete.value = null
}
</script>

<style scoped>



.student-modal-premium .modal-header-premium {
  background: linear-gradient(to right, #4e73df, #224abe);
  color: white;
  padding: 1.2rem 1.5rem;
  border-bottom: none;
}

.modal-body-premium {
  background: #f3f5f7;
  padding: 2rem;
}

.premium-tabs .nav-link {
  font-weight: 600;
  border-radius: 8px;
  padding: 10px 18px;
}

.card-premium {
  background: #ffffff;
  border-radius: 14px;
  padding: 1.8rem;
  border: 1px solid #e6e9ef;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.8rem;
}

.card-title-premium {
  font-size: 1rem;
  font-weight: 700;
  color: #3c4046;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e6e9ef;
  margin-bottom: 1.5rem;
}

.card-switch-premium {
  background: #ffffff;
  border: 1px solid #e9ecef;
  padding: 1rem 1.2rem;
  border-radius: 10px;
  box-shadow: 0 6px 14px rgba(0,0,0,0.04);
}

.footer-premium {
  border-top: 1px solid #dcdfe3;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}



/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>


