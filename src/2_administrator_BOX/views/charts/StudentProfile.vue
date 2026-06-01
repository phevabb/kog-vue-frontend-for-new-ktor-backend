



<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4 shadow">
        <CCardHeader
          class="bg-gradient-primary text-white d-flex justify-content-between align-items-center flex-wrap gap-3"
        >
          <strong class="fs-5 text-dark">Student Profiles</strong>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <!-- ✅ SEARCH (cursor no longer disappears) -->
            <div class="position-relative" style="min-width: 260px">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by name, class, or contacts..."
                size="sm"
                class="shadow-sm border-primary pe-5"
                :disabled="loading"
              />
              <span
                v-if="listLoading"
                class="position-absolute top-50 end-0 translate-middle-y me-2"
              >
                <CSpinner size="sm" color="primary" />
              </span>
            </div>

            <CButton
              color="light"
              class="text-primary border-primary"
              size="sm"
              @click="openAddModal"
              :disabled="loading"
            >
              <CIcon icon="cil-user-follow" class="me-1" />
              Add Student
            </CButton>

            <CButton
              color="danger"
              size="sm"
              :disabled="!selectedIds.length || loading"
              @click="showDeleteBulkModal = true"
            >
              Delete Selected ({{ selectedIds.length }})
            </CButton>

            <CDropdown variant="btn-group" size="sm">
              <CDropdownToggle color="success" :disabled="loading || !filteredStudents.length">
                Export
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem @click="exportToCSV">CSV</CDropdownItem>
                <CDropdownItem @click="exportToPDF">PDF</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
        </CCardHeader>

        <CCardBody>
          <div v-if="listLoading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading students...</span>
          </div>

          <CTable v-else hover responsive bordered class="shadow-sm">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell class="text-center" style="width: 48px">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="hasSomeSelected && !allSelected"
                    @change="toggleSelectAll"
                    :disabled="loading || !displayedStudents.length"
                  />
                </CTableHeaderCell>

                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Current Class</CTableHeaderCell>
                <CTableHeaderCell>Dad's Contact</CTableHeaderCell>
                <CTableHeaderCell>Mom's Contact</CTableHeaderCell>
                <CTableHeaderCell>Discounted</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(student, idx) in displayedStudents" :key="student.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="Number(student.id)" />
                </CTableDataCell>

                <CTableHeaderCell scope="row">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableHeaderCell>

                <CTableDataCell>
  <div class="d-flex align-items-center gap-2">
    <img v-if="student.user.profilePictureUrl" :src="student.user.profilePictureUrl" alt="Profile Picture" class="student-table-avatar" />
    <div v-else class="student-table-avatar placeholder-avatar">—</div>
    <span>{{ student.user?.fullName || '—' }}</span>
  </div>
</CTableDataCell>

                <CTableDataCell>
                  {{ student.currentNewGradeClass?.name || '—' }}
                </CTableDataCell>

                <CTableDataCell>
                  {{ student.contactOfFather || '—' }}
                </CTableDataCell>

                <CTableDataCell>
                  {{ student.contactOfMother || '—' }}
                </CTableDataCell>

                <CTableDataCell>
                  <CBadge :color="student.isDiscountedStudent ? 'success' : 'secondary'">
                    {{ student.isDiscountedStudent ? 'Yes' : 'No' }}
                  </CBadge>
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton
                      color="secondary"
                      variant="outline"
                      @click="openEditModal(student)"
                      :disabled="loading"
                    >
                      Edit
                    </CButton>
                    <CButton
                      color="danger"
                      variant="outline"
                      @click="deleteStudent(student)"
                      :disabled="loading"
                    >
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!listLoading && !filteredStudents.length">
                <CTableDataCell colspan="8" class="text-center text-muted py-5">
                  No students found<span v-if="searchTerm"> for “{{ searchTerm }}”</span>.
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <div class="d-flex justify-content-between align-items-center mt-4">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              :disabled="loading || listLoading"
              @page-changed="changePage"
            />

            <div style="font-size: 14px; color: #6c757d">
              Showing
              {{ showingFrom }}
              -
              {{ showingTo }}
              of {{ totalItems }}
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Single Delete Confirm -->
  <CModal :visible="showDeleteModal" @close="cancelDelete" size="md">
    <CModalHeader class="bg-danger text-white">
      <CModalTitle>Confirm Deletion</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Delete <strong>{{ studentToDelete?.user?.fullName || 'this student' }}</strong>?
      <div class="text-danger small mt-2">This cannot be undone.</div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="cancelDelete" :disabled="loading">
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDelete" :disabled="loading">
        <CSpinner size="sm" v-if="loading" class="me-1" />
        Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Bulk Delete Confirm -->
  <CModal :visible="showDeleteBulkModal" @close="showDeleteBulkModal = false">
    <CModalHeader class="bg-danger text-white">
      <CModalTitle>Delete {{ selectedIds.length }} Students?</CModalTitle>
    </CModalHeader>
    <CModalBody>This action cannot be undone.</CModalBody>
    <CModalFooter>
      <CButton
        color="secondary"
        variant="outline"
        @click="showDeleteBulkModal = false"
        :disabled="isDeleting"
      >
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDeleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-1" />
        Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Student Form Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal" size="xl" class="student-modal-premium">
    <CModalHeader class="modal-header-premium">
      <CModalTitle class="d-flex align-items-center gap-2">
        <CIcon icon="cil-education" size="lg" />
        {{ isEdit ? 'Edit Student Profile' : 'Add New Student' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody class="modal-body-premium">
      <CTabs variant="pills" class="premium-tabs" :activeItemKey="'student-info'">
        <!-- Student Info -->
        <!-- Student Info -->
<CTab title="Student Info" itemKey="student-info">
  <div class="card-premium">
    <div class="card-title-premium">
      <CIcon icon="cil-user" /> Student Information
    </div>

    <!-- ✅ Profile Picture Section -->
    <div class="card-premium mb-4">
      <div class="card-title-premium">
        <CIcon icon="cil-image" /> Profile Picture
      </div>

      <div class="d-flex flex-column flex-md-row gap-4 align-items-start">
        <!-- Preview -->
        <div class="profile-picture-box">
          profilePreviewUrl
            ? <img :src="profilePreviewUrl" alt="Profile Preview" class="profile-picture-preview" />
            : <div class="profile-picture-placeholder">No Picture</div>
        </div>

        <!-- Upload / Delete Controls -->
        <div class="flex-grow-1 w-100">
          <CFormLabel>Select Image</CFormLabel>
          <CFormInput
            type="file"
            accept="image/png,image/jpeg,image/webp"
            @change="onProfilePictureSelected"
            :disabled="loading || pictureLoading"
          />

          <div class="small text-muted mt-2">
            <template v-if="isEdit">
              You can upload immediately, or simply save the form with the selected image.
            </template>
            <template v-else>
              Select an image now — it will upload automatically after the student is created.
            </template>
          </div>

          <div class="d-flex gap-2 mt-3 flex-wrap">
            <CButton
              color="primary"
              variant="outline"
              @click="uploadCurrentProfilePicture(form.id)"
              :disabled="!isEdit || !form.id || !selectedProfileFile || loading || pictureLoading"
            >
              <CSpinner size="sm" v-if="pictureLoading" class="me-1" />
              Upload Now
            </CButton>

            <CButton
              color="danger"
              variant="outline"
              @click="removeCurrentProfilePicture(form.id)"
              :disabled="!isEdit || !form.id || !profilePreviewUrl || loading || pictureLoading"
            >
              <CSpinner size="sm" v-if="pictureLoading" class="me-1" />
              Remove Picture
            </CButton>

            <CButton
              color="secondary"
              variant="outline"
              @click="clearProfileSelection"
              :disabled="!selectedProfileFile || loading || pictureLoading"
            >
              Clear Selection
            </CButton>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ Existing Student Fields -->
    <div class="row g-4">
      <div class="col-md-8">
        <CFormLabel>Full Name <span class="text-danger">*</span></CFormLabel>
        <CFormInput v-model="form.fullName" :invalid="!form.fullName" />
      </div>

      <div class="col-md-4">
        <CFormLabel>Gender <span class="text-danger">*</span></CFormLabel>
        <CFormSelect v-model="form.gender" :invalid="!form.gender">
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </CFormSelect>
      </div>

      <div class="col-md-6">
        <CFormLabel>Current Class <span class="text-danger">*</span></CFormLabel>
        <CFormSelect v-model="form.currentNewGradeClassId" :invalid="!form.currentNewGradeClassId">
          <option :value="null">Select class</option>
          <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
            {{ cls.label }}
          </option>
        </CFormSelect>
      </div>

      <div class="col-md-6">
        <CFormLabel>Family (Optional)</CFormLabel>
        <CFormSelect v-model="form.family">
          <option value="">No Family</option>
          <option
            v-for="f in familyOptions"
            :key="f.value"
            :value="String(f.value)"
          >
            {{ f.label }}
          </option>
        </CFormSelect>
      </div>

      <div class="col-md-6">
        <CFormLabel>Date of Birth</CFormLabel>
        <CFormInput type="date" v-model="form.dateOfBirth" />
      </div>

      <div class="col-md-6">
        <CFormLabel>Nationality</CFormLabel>
        <CFormInput v-model="form.nationality" />
      </div>

      <div class="col-md-6">
        <CFormLabel>Class Seeking Admission To</CFormLabel>
        <CFormInput v-model="form.classSeekingAdmissionTo" placeholder="Optional" />
      </div>
    </div>
  </div>
</CTab>

        <!-- Parent Info -->
        <CTab title="Parent Info" itemKey="parent-info">
          <div class="card-premium">
            <div class="card-title-premium">
              <CIcon icon="cil-people" /> Father’s Information
            </div>

            <div class="row g-4 mb-4">
              <div class="col-md-6">
                <CFormLabel>Name</CFormLabel>
                <CFormInput v-model="form.nameOfFather" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Contact of Father <span class="text-danger">*</span></CFormLabel>
                <CFormInput v-model="form.contactOfFather" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Occupation</CFormLabel>
                <CFormInput v-model="form.occupationOfFather" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Nationality</CFormLabel>
                <CFormInput v-model="form.nationalityOfFather" />
              </div>
            </div>

            <div class="card-title-premium">
              <CIcon icon="cil-people" /> Mother’s Information
            </div>

            <div class="row g-4">
              <div class="col-md-6">
                <CFormLabel>Name</CFormLabel>
                <CFormInput v-model="form.nameOfMother" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Contact of Mother <span class="text-danger">*</span></CFormLabel>
                <CFormInput v-model="form.contactOfMother" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Occupation</CFormLabel>
                <CFormInput v-model="form.occupationOfMother" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Nationality</CFormLabel>
                <CFormInput v-model="form.nationalityOfMother" />
              </div>
            </div>

            <div class="mt-4 card-switch-premium">
              <CFormSwitch
                v-model="form.isDiscountedStudent"
                label="Discounted Student"
                color="primary"
              />
            </div>
          </div>
        </CTab>

        <!-- Health Info -->
        <CTab title="Health Info" itemKey="health-info">
          <div class="card-premium">
            <div class="card-title-premium">
              <CIcon icon="cil-heart" /> Health Information
            </div>

            <div class="row g-4">
              <div class="col-md-4">
                <CFormSwitch v-model="form.isImmunized" label="Immunized" color="success" />
              </div>

              <div class="col-md-4">
                <CFormSwitch v-model="form.hasAllergies" label="Has Allergies" color="warning" />
              </div>

              <div class="col-12" v-if="form.hasAllergies">
                <CFormLabel>Allergic Foods</CFormLabel>
                <CFormInput v-model="form.allergicFoods" />
              </div>
            </div>
          </div>
        </CTab>

        <!-- Other Info -->
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

              <div class="col-12" v-if="!form.active">
                <CFormLabel>Reason for Deactivating</CFormLabel>
                <CFormInput v-model="form.deactivationReason" />
              </div>
            </div>
          </div>
        </CTab>
      </CTabs>
    </CModalBody>

    <CModalFooter class="footer-premium">
      <CButton color="light" class="me-3" @click="closeFormModal" :disabled="loading">
        Cancel
      </CButton>
      <CButton color="primary" class="text-white" @click="submitForm" :disabled="loading">
        <CIcon icon="cil-save" class="me-2 text-white" />
        {{ isEdit ? 'Update Student' : 'Create Student' }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useToast } from 'vue-toastification'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import Pagination from '@/Pagination.vue'
import {

upload_account_profile_picture_ktor,
  delete_account_profile_picture_ktor,

  rawst_ktor_paginated,
  get_raw_families_ktor,
  create_student_ktor,
  update_student_ktor,
  delete_student_ktor,
  get_classes_ktor
} from '@/services/api'

const toast = useToast()
const pictureLoading = ref(false)
const selectedProfileFile = ref(null)
const profilePreviewUrl = ref("")

// ─────────────────────────────────────────────────────────────
// Pagination state
// ─────────────────────────────────────────────────────────────
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const pageSize = 10

// ─────────────────────────────────────────────────────────────
// Loading state
// loading = mutations (create/update/delete)
// listLoading = table fetch (pagination/search)
// This prevents search cursor from disappearing.
// ─────────────────────────────────────────────────────────────
const loading = ref(false)
const listLoading = ref(false)
const errorMessage = ref('')

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────
const allStudents = ref([])
const searchTerm = ref('')

const classOptions = ref([])
const familyOptions = ref([])

const selectedIds = ref([])
const showDeleteModal = ref(false)
const studentToDelete = ref(null)
const showDeleteBulkModal = ref(false)
const isDeleting = ref(false)

const showFormModal = ref(false)
const isEdit = ref(false)
const currentStudent = ref(null)

// ─────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────
const form = reactive({
  id: null, // user.id
  fullName: '',
  gender: '',
  nationality: 'Ghanaian',
  dateOfBirth: '',

  currentNewGradeClassId: null,
  family: '',

  classSeekingAdmissionTo: '',
  isDiscountedStudent: false,
  isImmunized: false,

  hasAllergies: false,
  allergicFoods: '',
  lastSchoolAttended: '',
  houseNumber: '',
  otherRelatedInfo: '',

  nameOfFather: '',
  occupationOfFather: '',
  contactOfFather: '',
  nationalityOfFather: '',

  nameOfMother: '',
  occupationOfMother: '',
  contactOfMother: '',
  nationalityOfMother: '',

  active: true,
  deactivationReason: ''
})

function resetForm() {
  form.id = null
  selectedProfileFile.value = null
profilePreviewUrl.value = ""
  form.fullName = ''
  form.gender = ''
  form.nationality = 'Ghanaian'
  form.dateOfBirth = ''

  form.currentNewGradeClassId = null
  form.family = null

  form.classSeekingAdmissionTo = ''
  form.isDiscountedStudent = false
  form.isImmunized = false

  form.hasAllergies = false
  form.allergicFoods = ''
  form.lastSchoolAttended = ''
  form.houseNumber = ''
  form.otherRelatedInfo = ''

  form.nameOfFather = ''
  form.occupationOfFather = ''
  form.contactOfFather = ''
  form.nationalityOfFather = ''

  form.nameOfMother = ''
  form.occupationOfMother = ''
  form.contactOfMother = ''
  form.nationalityOfMother = ''

  form.active = true
  form.deactivationReason = ''
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function ensureValidPage() {
  const pages = totalPages.value || 1
  if (currentPage.value > pages) currentPage.value = pages
  if (currentPage.value < 1) currentPage.value = 1
}

function normalizeStudent(s) {
  if (!s) return s

  const user = s.user || {}
  const fullName = user.fullName ?? user.full_name ?? ''
  const dateOfBirth = user.dateOfBirth ?? user.date_of_birth ?? null
  const nationality = user.nationality ?? null
  const gender = user.gender ?? null
  const isActive = user.isActive ?? user.is_active ?? true
  const userId = user.userId ?? user.user_id ?? null

  // ✅ important for profile picture
  const profilePictureUrl =
    user.profilePictureUrl ??
    user.profile_picture_url ??
    user.profilePicture ??
    null

  const cls = s.currentNewGradeClass ?? s.current_new_grade_class ?? null

  return {
    ...s,
    user: {
      ...user,
      fullName,
      dateOfBirth,
      nationality,
      gender,
      isActive,
      userId,
      profilePictureUrl
    },
    currentNewGradeClass: cls
  }
}
// ─────────────────────────────────────────────────────────────
// Fetch classes/families
// ─────────────────────────────────────────────────────────────

function clearProfileSelection() {
  selectedProfileFile.value = null
  profilePreviewUrl.value = currentStudent.value?.user?.profilePictureUrl || ""
}

function onProfilePictureSelected(event) {
  const file = event.target.files?.[0]
  if (!file) {
    selectedProfileFile.value = null
    profilePreviewUrl.value = currentStudent.value?.user?.profilePictureUrl || ""
    return
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.type)) {
    toast.error("Only JPG, PNG and WEBP images are allowed.")
    selectedProfileFile.value = null
    profilePreviewUrl.value = currentStudent.value?.user?.profilePictureUrl || ""
    return
  }

  const maxBytes = 5 * 1024 * 1024 // 5MB
  if (file.size > maxBytes) {
    toast.error("Image size must not exceed 5MB.")
    selectedProfileFile.value = null
    profilePreviewUrl.value = currentStudent.value?.user?.profilePictureUrl || ""
    return
  }

  selectedProfileFile.value = file
  profilePreviewUrl.value = URL.createObjectURL(file)
}

function updateStudentPictureLocally(accountId, url) {
  // update current student
  if (currentStudent.value?.user?.id === accountId) {
    currentStudent.value.user.profilePictureUrl = url
  }

  // update table data
  allStudents.value = allStudents.value.map((s) => {
    if (s.user?.id === accountId) {
      return {
        ...s,
        user: {
          ...s.user,
          profilePictureUrl: url
        }
      }
    }
    return s
  })
}

async function uploadCurrentProfilePicture(accountId, { silent = false } = {}) {
  if (!accountId) {
    if (!silent) toast.error("Student account ID is missing.")
    return null
  }

  if (!selectedProfileFile.value) {
    if (!silent) toast.error("Please select an image first.")
    return null
  }

  pictureLoading.value = true
  try {
    const fd = new FormData()
    fd.append("file", selectedProfileFile.value)

    const res = await upload_account_profile_picture_ktor(accountId, fd)

    const url =
      res?.data?.profilePictureUrl ||
      res?.data?.profile_picture_url ||
      ""

    updateStudentPictureLocally(accountId, url)
    profilePreviewUrl.value = url
    selectedProfileFile.value = null

    if (!silent) toast.success("Profile picture uploaded successfully ✅")
    return res.data
  } catch (err) {

    if (!silent) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Failed to upload profile picture."
      )
    }
    return null
  } finally {
    pictureLoading.value = false
  }
}

async function removeCurrentProfilePicture(accountId) {
  if (!accountId) {
    toast.error("Student account ID is missing.")
    return
  }

  pictureLoading.value = true
  try {
    const k = await delete_account_profile_picture_ktor(accountId)


    updateStudentPictureLocally(accountId, "")
    profilePreviewUrl.value = ""
    selectedProfileFile.value = null

    toast.success("Profile picture removed successfully ✅")
  } catch (err) {

    toast.error(
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      "Failed to remove profile picture."
    )
  } finally {
    pictureLoading.value = false
  }
}


async function fetchClasses() {
  try {
    const res = await get_classes_ktor()

    classOptions.value = (res.data || []).map(c => ({
      label: c.name,
      value: c.id
    }))
  } catch {
    toast.error('Failed to fetch classes', { position: 'top-right' })
  }
}

async function fetchFamilies() {
  try {
    const res = await get_raw_families_ktor()
    familyOptions.value = (res.data || []).map(f => ({
      label: f.name,
      value: f.id
    }))
  } catch {
    toast.error('Failed to fetch families', { position: 'top-right' })
  }
}

// ─────────────────────────────────────────────────────────────
// Students fetch (backend pagination + backend search)
// IMPORTANT: rawst_ktor(page, limit, search)
// ─────────────────────────────────────────────────────────────
async function loadAllStudents() {
  listLoading.value = true
  errorMessage.value = ''

  try {
    const res = await rawst_ktor_paginated(currentPage.value, pageSize, searchTerm.value)


    const list = res.data?.data || []





    allStudents.value = list.map(normalizeStudent)

    totalPages.value = res.data?.meta?.totalPages || 1
    totalItems.value = res.data?.meta?.total || 0

    ensureValidPage()
  } catch (err) {

    errorMessage.value = 'Failed to load students'
    toast.error(errorMessage.value, { position: 'top-right' })
  } finally {
    listLoading.value = false
  }
}

// ─────────────────────────────────────────────────────────────
// Debounced search (prevents cursor issues + API spam)
// ─────────────────────────────────────────────────────────────
function debounce(fn, delay = 400) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

const debouncedSearchReload = debounce(() => {
  currentPage.value = 1
  loadAllStudents()
}, 400)

watch(searchTerm, () => {
  debouncedSearchReload()
})

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────
async function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  await loadAllStudents()
}

// ─────────────────────────────────────────────────────────────
// Display + (keep your old names)
// filteredStudents now equals displayedStudents because server does filtering.
// This keeps your template intact.
// ─────────────────────────────────────────────────────────────
const displayedStudents = computed(() => allStudents.value)
const filteredStudents = computed(() => displayedStudents.value)

// ─────────────────────────────────────────────────────────────
// Selection
// ─────────────────────────────────────────────────────────────
const allSelected = computed(() =>
  displayedStudents.value.length > 0 &&
  displayedStudents.value.every(s => selectedIds.value.includes(Number(s.id)))
)

const hasSomeSelected = computed(() =>
  displayedStudents.value.some(s => selectedIds.value.includes(Number(s.id)))
)

function toggleSelectAll() {
  const pageIds = displayedStudents.value.map(s => Number(s.id))
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
  } else {
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...pageIds]))
  }
}

// ─────────────────────────────────────────────────────────────
// Footer "Showing X-Y of total"
// ─────────────────────────────────────────────────────────────
const showingFrom = computed(() => {
  if (!totalItems.value || !displayedStudents.value.length) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const showingTo = computed(() => {
  if (!totalItems.value) return 0
  return (currentPage.value - 1) * pageSize + displayedStudents.value.length
})

// ─────────────────────────────────────────────────────────────
// Export (exports current page results)
// If you want "export ALL filtered results", that must be done server-side.
// ─────────────────────────────────────────────────────────────
function exportToCSV() {
  if (!filteredStudents.value.length) return toast.info('No data to export')

  const headers = ['#', 'Name', 'Current Class', "Dad's Contact", "Mom's Contact", 'Discounted']
  const rows = filteredStudents.value.map((s, i) => [
    i + 1,
    s.user?.fullName || '',
    s.currentNewGradeClass?.name || '',
    s.contactOfFather || '',
    s.contactOfMother || '',
    s.isDiscountedStudent ? 'Yes' : 'No'
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `students-${new Date().toISOString().split('T')[0]}.csv`
  link.click()

  URL.revokeObjectURL(url)
  toast.success('Exported to CSV', { position: 'top-right' })
}

async function exportToPDF() {
  if (!filteredStudents.value.length) {
    toast.info('No data to export')
    return
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  doc.setFontSize(16)
  doc.text('Student Profiles', 40, 40)

  const head = [['#', 'Name', 'Class', "Dad's Contact", "Mom's Contact", 'Discounted']]
  const body = filteredStudents.value.map((s, i) => [
    i + 1,
    s.user?.fullName || '',
    s.currentNewGradeClass?.name || '',
    s.contactOfFather || '',
    s.contactOfMother || '',
    s.isDiscountedStudent ? 'Yes' : 'No'
  ])

  autoTable(doc, {
    head,
    body,
    startY: 60,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6, valign: 'middle' },
    headStyles: { fillColor: [78, 115, 223], textColor: 255, fontStyle: 'bold' }
  })

  doc.save(`students-${new Date().toISOString().split('T')[0]}.pdf`)
  toast.success('Exported to PDF', { position: 'top-right' })
}

// ─────────────────────────────────────────────────────────────
// Modal handlers
// ─────────────────────────────────────────────────────────────
function openAddModal() {
  isEdit.value = false
  currentStudent.value = null
  resetForm()
  showFormModal.value = true
}

function openEditModal(student) {
  isEdit.value = true
  currentStudent.value = student
  resetForm()

  form.id = student.user?.id ?? null
  form.fullName = student.user?.fullName ?? ''
  form.gender = student.user?.gender ?? ''
  form.nationality = student.user?.nationality ?? 'Ghanaian'
  form.dateOfBirth = student.user?.dateOfBirth ?? ''

  form.currentNewGradeClassId = student.currentNewGradeClass?.id ?? null
  form.family = student.family?.id
  ? String(student.family.id)
  : ''

  form.isDiscountedStudent = !!student.isDiscountedStudent
  form.isImmunized = !!student.isImmunized

  form.hasAllergies = !!student.hasAllergies
  form.allergicFoods = student.allergicFoods ?? ''

  form.lastSchoolAttended = student.lastSchoolAttended ?? ''
  form.houseNumber = student.houseNumber ?? ''
  form.otherRelatedInfo = student.otherRelatedInfo ?? ''

  form.nameOfFather = student.nameOfFather ?? ''
  form.occupationOfFather = student.occupationOfFather ?? ''
  form.contactOfFather = student.contactOfFather ?? ''
  form.nationalityOfFather = student.nationalityOfFather ?? ''

  form.nameOfMother = student.nameOfMother ?? ''
  form.occupationOfMother = student.occupationOfMother ?? ''
  form.contactOfMother = student.contactOfMother ?? ''
  form.nationalityOfMother = student.nationalityOfMother ?? ''

  form.active = !!student.user?.isActive
  form.deactivationReason = student.deactivationReason ?? ''

  selectedProfileFile.value = null
profilePreviewUrl.value = student.user?.profilePictureUrl || ""

  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  currentStudent.value = null
}

// ─────────────────────────────────────────────────────────────
// Submit (Create / Update)
// ─────────────────────────────────────────────────────────────
async function submitForm() {
  loading.value = true

  try {
    if (!form.fullName.trim()) return toast.error('Full Name is required')
    if (!form.gender) return toast.error('Gender is required')
    if (!form.contactOfFather.trim() && !form.contactOfMother.trim()) {
      return toast.error('At least one parent contact is required')
    }
    if (!form.currentNewGradeClassId) return toast.error('Current class is required')

    const payload = {
      user: {
        id: form.id ?? undefined,
        fullName: form.fullName.trim(),
        gender: form.gender,
        nationality: form.nationality.trim() || 'Ghanaian',
        dateOfBirth: form.dateOfBirth || null,
        isActive: form.active,
        role: 'student',
        isStaff: false
      },
      currentNewGradeClassId: Number(form.currentNewGradeClassId) || null,
      family: form.family === '' ? null : Number(form.family),

      classSeekingAdmissionTo: form.classSeekingAdmissionTo || '',
      isDiscountedStudent: !!form.isDiscountedStudent,
      isImmunized: !!form.isImmunized,


      allergicFoods: form.allergicFoods.trim() || null,

      lastSchoolAttended: form.lastSchoolAttended.trim() || null,
      houseNumber: form.houseNumber.trim() || null,
      otherRelatedInfo: form.otherRelatedInfo.trim() || null,

      nameOfFather: form.nameOfFather.trim() || null,
      occupationOfFather: form.occupationOfFather.trim() || null,
      nationalityOfFather: form.nationalityOfFather.trim() || null,
      contactOfFather: form.contactOfFather.trim() || null,

      nameOfMother: form.nameOfMother.trim() || null,
      occupationOfMother: form.occupationOfMother.trim() || null,
      nationalityOfMother: form.nationalityOfMother.trim() || null,
      contactOfMother: form.contactOfMother.trim() || null,

      deactivationReason: !form.active
        ? (form.deactivationReason.trim() || 'Not specified')
        : null
    }


    let savedStudent = null

if (isEdit.value && currentStudent.value) {
  const res = await update_student_ktor(currentStudent.value.id, JSON.parse(JSON.stringify(payload)))
  savedStudent = normalizeStudent(res?.data || currentStudent.value)
  toast.success('Student updated successfully!')
} else {
  const res = await create_student_ktor(payload)
  savedStudent = normalizeStudent(res?.data)
  toast.success('Student created successfully!')
  currentPage.value = 1
}

// ✅ If a picture was selected, upload it after save
const accountId = savedStudent?.user?.id || form.id
if (selectedProfileFile.value && accountId) {
  await uploadCurrentProfilePicture(accountId, { silent: true })
}

closeFormModal()
await loadAllStudents()
  } catch (err) {
    const serverMsg = err?.response?.data
    toast.error(formatBackendErrors(serverMsg) || 'Failed to save student', { position: 'top-right' })
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────────────────────
// Delete (Single + Bulk)
// ─────────────────────────────────────────────────────────────
function deleteStudent(student) {
  studentToDelete.value = student
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!studentToDelete.value) return

  loading.value = true
  showDeleteModal.value = false

  try {
    const id = Number(studentToDelete.value.id)
    await delete_student_ktor(id)

    toast.success('Student deleted successfully!')
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)

    await loadAllStudents()
    ensureValidPage()
  } catch {
    toast.error('Failed to delete student')
  } finally {
    loading.value = false
    studentToDelete.value = null
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  studentToDelete.value = null
}

async function confirmDeleteBulk() {
  const ids = selectedIds.value.map(Number)
  if (!ids.length) return

  isDeleting.value = true
  try {
    await Promise.all(ids.map(id => delete_student_ktor(id)))
    selectedIds.value = []
    toast.success('Selected students deleted successfully!')
    await loadAllStudents()
    ensureValidPage()
  } catch {
    toast.error('Failed to delete some students')
  } finally {
    isDeleting.value = false
    showDeleteBulkModal.value = false
  }
}

// ─────────────────────────────────────────────────────────────
// Error formatting
// ─────────────────────────────────────────────────────────────
function formatBackendErrors(errData) {
  if (!errData) return null
  const parts = []
  const walk = (obj, prefix = '') => {
    if (Array.isArray(obj)) {
      parts.push(`${prefix}: ${obj.map(m => String(m)).join('; ')}`)
      return
    }
    if (typeof obj === 'string') {
      parts.push(`${prefix}: ${obj}`)
      return
    }
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        walk(obj[key], prefix ? `${prefix}.${key}` : key)
      }
    }
  }
  walk(errData)
  return parts.join(' | ') || null
}

// ─────────────────────────────────────────────────────────────
// Mount
// ─────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchClasses()
  await fetchFamilies()
  await loadAllStudents()
})
</script>


<style scoped>
.bg-gradient-primary {
  background: linear-gradient(90deg, #4e73df, #224abe);
}

.profile-picture-box {
  width: 140px;
  flex-shrink: 0;
}

.profile-picture-preview {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  object-fit: cover;
  border: 1px solid #dbe3ef;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.profile-picture-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.student-table-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid #dbe3ef;
}

.placeholder-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #94a3b8;
}
</style>
