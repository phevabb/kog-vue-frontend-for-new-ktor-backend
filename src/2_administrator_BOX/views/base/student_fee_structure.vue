<template>


  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">

        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Fee Structures</strong>

            <!-- Actions: Search (field + input) + Delete Selected + Add -->
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <!-- NEW: Search field dropdown -->


              <!-- Search input -->
              <CFormInput
                v-model="searchTerm"
                :placeholder="searchPlaceholder"
                :aria-label="searchPlaceholder"
                size="sm"
                style="min-width: 220px;"
              />

              <!-- Bulk delete -->
              <CButton color="danger" size="sm"
                       :disabled="selectedIds.length === 0"
                       @click="openBulkDeleteConfirm">
                Delete Selected ({{ selectedIds.length }})
              </CButton>

              <!-- Add Fee Structure -->
              <CButton color="primary" size="sm" @click="openAddModal">
                Add Fee Structure
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <p class="text-body-secondary small">Fee Structures.</p>

          <!-- Error -->
          <CAlert color="danger" v-if="errorMessage" class="py-2">
            {{ errorMessage }}
          </CAlert>

          <!-- Loading -->
          <div class="d-flex align-items-center gap-2 mb-2" v-if="isLoading">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading fee structures…</span>
          </div>

          <DocsExample>
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <!-- Select-all (affects filtered rows only) -->
                  <CTableHeaderCell scope="col" class="text-center" style="width: 48px;">
                    <CFormCheck
                      :checked="allSelected"
                      :indeterminate="someSelected"
                      @change="toggleSelectAll"
                      aria-label="Select all in current view"
                    />
                  </CTableHeaderCell>

                  <CTableHeaderCell scope="col" style="width: 60px;">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Academic Year</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Class</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Term</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Has Discount</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end">Amount (GHS)</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end" style="width: 160px;">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow v-for="(row, idx) in filteredFeeStructures" :key="row.id">
                  <CTableDataCell class="text-center">
                    <CFormCheck v-model="selectedIds" :value="row.id" aria-label="Select row" />
                  </CTableDataCell>


                  <CTableHeaderCell scope="row">{{ (currentPage - 1) * pageSize + idx + 1 }}</CTableHeaderCell>
                  <CTableDataCell>{{ row.academic_year?.name }}</CTableDataCell>
                  <CTableDataCell>{{ row.grade_class?.name }}</CTableDataCell>
                  <CTableDataCell>{{ row.term?.name }}</CTableDataCell>

                  <CTableDataCell>
                    <CBadge :color="row.is_discounted ? 'success' : 'secondary'">
                      {{ row.is_discounted ? 'Yes' : 'No' }}
                    </CBadge>
                  </CTableDataCell>


                  <CTableDataCell class="text-end">
                    {{ formatAmount(row.amount) }}
                  </CTableDataCell>

                  <CTableDataCell class="text-end">
                    <CButtonGroup size="sm">
                      <CButton color="secondary" variant="outline" @click="openEditModal(row)">Edit</CButton>
                      <CButton color="danger" variant="outline" @click="openSingleDeleteConfirm(row)">Delete</CButton>
                    </CButtonGroup>
                  </CTableDataCell>
                </CTableRow>

                <!-- Empty -->
                <CTableRow v-if="!isLoading && filteredFeeStructures.length === 0">
                  <CTableDataCell colspan="7" class="text-center text-body-secondary">
                    No fee structures found
                    <span v-if="searchTerm">
                      for “{{ searchTerm }}”

                    </span>
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


          </DocsExample>
        </CCardBody>

      </CCard>
    </CCol>
  </CRow>

  <!-- Add/Edit Modal -->
 <CModal :visible="showFormModal" @close="closeFormModal" size="xl">




  <CModalHeader>
    <CModalTitle>{{ isEdit ? 'Edit Fee Structure' : 'Add Fee Structure' }}</CModalTitle>
  </CModalHeader>

  <CModalBody>
    <!-- Academic Year -->
    <div class="mb-3">
      <CFormLabel for="academic_year">Academic Year</CFormLabel>
      <CFormSelect id="academic_year" v-model="formFee.academicYearId">
        <option value="" disabled selected>Select Academic Year</option>
        <option v-for="ay in academicYears" :key="ay.id" :value="ay.id">{{ ay.name }}</option>
      </CFormSelect>
    </div>

    <!-- Grade/Class -->
       <div v-if="!formFee.is_discount" class="mb-3">

    <div class="mb-3">
      <CFormLabel for="grade_class">Class (Grade)</CFormLabel>
      <CFormSelect id="grade_class" v-model="formFee.gradeClassId">
        <option value="" disabled selected>Select Class</option>
        <option v-for="gc in gradeClasses" :key="gc.id" :value="gc.id">{{ gc.name }}</option>
      </CFormSelect>
    </div>
    </div>

    <!-- Term -->

    <div class="mb-3">
      <CFormLabel for="term">Term</CFormLabel>
      <CFormSelect id="term" v-model="formFee.termId">
        <option value="" disabled selected>Select Term</option>
        <option v-for="t in terms" :key="t.id" :value="t.id">{{ t.name }}</option>
      </CFormSelect>
    </div>


    <!-- Amount -->
    <div class="mb-3">
      <CFormLabel for="amount">Amount (GHS)</CFormLabel>
      <CFormInput
        id="amount"
        v-model="formFee.amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="e.g., 250.00"
      />
    </div>

    <!-- Discount Toggle -->
    <div class="mb-3 d-flex align-items-center">
      <CFormLabel class="me-3 mb-0">Discounted Fee</CFormLabel>
      <CFormSwitch
        v-model="formFee.is_discount"
        color="primary"
        label="Yes"
      />
    </div>

   <div v-if="formFee.is_discount" class="mb-3">
  <CFormLabel>Select Students for Discount</CFormLabel>
  <v-select
    v-model="formFee.discounted_student_ids"
    :options="studentOptionsForSelect"
    :multiple="true"
    :close-on-select="false"
    placeholder="Search and select students"
    :reduce="opt => opt.value"
  />
</div>



    <!-- Validation Message -->
    <div class="text-danger small mt-2" v-if="formValidationMessage">{{ formValidationMessage }}</div>
  </CModalBody>

  <CModalFooter>
    <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">
      Cancel
    </CButton>

    <CButton color="primary" @click="submitForm" :disabled="isSubmitting">
      <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
      {{ isEdit ? 'Update' : 'Save' }}
    </CButton>
  </CModalFooter>
</CModal>




  <!-- Confirm Delete (Single) -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader><CModalTitle>Delete Fee Structure</CModalTitle></CModalHeader>
    <CModalBody>
      Are you sure you want to delete
      <strong>{{ deleteTarget?.grade_class?.name }} / {{ deleteTarget?.term?.name }} / {{ deleteTarget?.academic_year?.name }}</strong>? This action cannot be reversed.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeDeleteSingleModal" :disabled="isDeleting">Cancel</CButton>
      <CButton color="danger" @click="confirmDeleteSingle" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Confirm Delete (Bulk) -->
  <CModal :visible="showDeleteBulkModal" @close="closeBulkDeleteConfirm">
    <CModalHeader><CModalTitle>Delete Selected</CModalTitle></CModalHeader>
    <CModalBody>
      You are about to delete <strong>{{ selectedIds.length }}</strong> fee structure(s). This action cannot be undone. Continue?
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeBulkDeleteConfirm" :disabled="isDeleting">Cancel</CButton>
      <CButton color="danger" @click="confirmDeleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import vSelect from "vue3-select";
import "vue3-select/dist/vue3-select.css";

import { ref, computed, reactive,  watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import Pagination from '@/Pagination.vue'

const pageSize = 10
const currentPage = ref(1)
const totalPages = ref(1)

const toast = useToast()



import {rawst, get_academic_years, get_classes, get_terms, create_fee_structure, get_fee_structures, update_fee_structure, delete_fee_structure } from '@/services/api.js'

const feeStructureApi = {
  async listAcademicYears() {
    const res = await get_academic_years()
    return res?.data || []
  },

  async listTerms() {
    const res = await get_terms()
    return res?.data || []
  },

  async listGradeClasses() {
    const res = await get_classes()

    return res?.data || []
  },



  async listFeeStructures(params = {}) {
  const res = await get_fee_structures(params)
  return res?.data
}
,

  async createFeeStructure(payload) {

    const res = await create_fee_structure(payload)
    return res?.data
  },

  async updateFeeStructure(id, payload) {

    const res = await update_fee_structure(id, payload)



    return res?.data


  },

  async deleteFeeStructure(id) {
    const res = await delete_fee_structure(id)
    return res?.data
  },
}

function onPageChanged(page) {
  loadFeeStructures(page)
}

/* ---------- State ---------- */
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')

const feeStructures = ref([])
const academicYears = ref([])
const gradeClasses = ref([])
const terms = ref([])

async function confirmDeleteBulk() {
  if (selectedIds.value.length === 0) return

  isDeleting.value = true

  // Keep track of successful deletes
  const failedDeletes = []

  // Use Promise.allSettled for parallel deletion
  const results = await Promise.allSettled(
    selectedIds.value.map(id => feeStructureApi.deleteFeeStructure(id))
  )

  results.forEach((result, index) => {
    const id = selectedIds.value[index]
    if (result.status === 'fulfilled') {
      // Remove from feeStructures
      feeStructures.value = feeStructures.value.filter(r => r.id !== id)
    } else {
      failedDeletes.push({
        id,
        error: result.reason
      })
    }
  })

  // Show errors for failed deletes
  failedDeletes.forEach(f => {
    const associatedRecordName =
      f.error.response?.data?.associatedRecordName ||
      "a linked student's fee record"

    let message =
      f.error.response?.data?.message ||
      f.error.response?.data?.error ||
      f.error.response?.data?.detail ||
      f.error.message ||
      `Cannot delete fee structure ID ${f.id} because it is linked to ${associatedRecordName}.`

    if (message.includes('violates foreign key constraint')) {
      message = `Cannot delete fee structure ID ${f.id} because it is linked to ${associatedRecordName}. Please delete the associated record first.`
    }

    toast.error(message, { position: 'top-right' })
  })

  // Clear selection only for successfully deleted IDs
  const successfulIds = selectedIds.value.filter(
    id => !failedDeletes.some(f => f.id === id)
  )
  selectedIds.value = selectedIds.value.filter(id => failedDeletes.some(f => f.id === id))

  showDeleteBulkModal.value = false

  if (successfulIds.length > 0) {
    toast.success(`Deleted ${successfulIds.length} fee structure(s) successfully.`, {
      position: 'top-right'
    })
  }

  isDeleting.value = false
}



/* NEW: search field */
const searchField = ref('grade_class') // 'class' | 'academicYear' | 'term'
const searchTerm = ref('')

const selectedIds = ref([])

/* ---------- Form (Add/Edit) ---------- */
const showFormModal = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const formFee = reactive({
  academicYearId: '',
  gradeClassId: '',
  termId: '',
  amount: '',
  is_discount: false,
  filtereddiscounted_student_ids: [], // array of student IDs
})
const formValidationMessage = ref('')

/* ---------- Delete Confirmation State ---------- */
const showDeleteSingleModal = ref(false)
const deleteTarget = ref(null)
const showDeleteBulkModal = ref(false)

/* ---------- Computed ---------- */
const searchPlaceholder = computed(() => {
  switch (searchField.value) {
    case 'academic_year': return 'Search academic year...'
    case 'term': return 'Search term...'
    default: return 'Search Fee Structure'
  }
})

const filteredFeeStructures = computed(() => feeStructures.value)


const filteredIds = computed(() => filteredFeeStructures.value.map(r => r.id))
const allSelected = computed(() =>
  filteredIds.value.length > 0 &&
  filteredIds.value.every(id => selectedIds.value.includes(id)),
)
const someSelected = computed(() =>
  filteredIds.value.length > 0 &&
  !allSelected.value &&
  filteredIds.value.some(id => selectedIds.value.includes(id)),
)

/* ---------- Helpers ---------- */
function formatAmount(v) {
  const n = Number(v)
  if (Number.isNaN(n)) return v
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}



function resetForm() {
  formFee.academicYearId = ''
  formFee.gradeClassId = ''
  formFee.termId = ''
  formFee.amount = ''
  formFee.is_discount = false
  formFee.discounted_student_ids = []
  formValidationMessage.value = ''
  editingId.value = null
}
function validateForm() {
  if (!formFee.academicYearId || !formFee.termId) {
    formValidationMessage.value = 'Academic Year and Term are required.'
    return false
  }

  if (formFee.is_discount && !formFee.gradeClassId) {
    formFee.gradeClassId = CRECHE_CLASS_ID
  }

  if (!formFee.is_discount && !formFee.gradeClassId) {
    formValidationMessage.value = 'Class is required for non-discounted fees.'
    return false
  }

  if (formFee.is_discount && formFee.discounted_student_ids.length === 0) {
  formValidationMessage.value = 'Please select at least one discounted student.'
  return false
}


  if (formFee.amount === '' || formFee.amount === null) {
  formValidationMessage.value = 'Amount is required.'
  return false
}

if (Number(formFee.amount) < 0) {
  formValidationMessage.value = 'Amount cannot be negative.'
  return false
}


  formValidationMessage.value = ''
  return true
}

const CRECHE_CLASS_ID = 1


/* ---------- Select All for current filtered view ---------- */
function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !filteredIds.value.includes(id))
  } else {
    const set = new Set(selectedIds.value)
    filteredIds.value.forEach(id => set.add(id))
    selectedIds.value = Array.from(set)
  }
}

/* ---------- Loaders ---------- */
function loadReferenceData() {
  return Promise.all([
    feeStructureApi.listAcademicYears().then(x => (academicYears.value = x)),
    feeStructureApi.listGradeClasses().then(x => (gradeClasses.value = x)),
    feeStructureApi.listTerms().then(x => (terms.value = x)),
  ])
}

const studentOptions = ref([])  // For discounted students selector

const studentOptionsForSelect = computed(() =>
  studentOptions.value
    .filter(s => s.is_discounted_student) // only include discounted students
    .map(s => ({
      label: s.user?.full_name ?? s.full_name ?? s.name ?? `ID ${s.id}`,
      value: s.id,
    }))
)



async function fetchUsers() {
  try {
    const response = await rawst();
    studentOptions.value = response.data;


  }  catch (err) {
    if (err.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your internet connection.', { position: 'top-right' });
    } else if (err.response) {
      // API returned an error response
      toast.error(err.response.data?.message || 'Failed to fetch students.', { position: 'top-right' });
    } else {
      // Unknown error
      toast.error('An unexpected error occurred while fetching students.', { position: 'top-right' });
    }
  }
}




async function loadFeeStructures(page = 1) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await feeStructureApi.listFeeStructures({
      page,
      search: searchTerm.value?.trim() || undefined,
    })

    const data = response


    feeStructures.value = data.results
    currentPage.value = page
    totalPages.value = Math.ceil(data.count / pageSize)

  } catch (err) {
    errorMessage.value =
      err?.response?.data?.message ||
      err?.message ||
      'Failed to load fee structures.'
  } finally {
    isLoading.value = false
  }
}


watch(searchTerm, () => {
  currentPage.value = 1
  loadFeeStructures(1)
})

/* ---------- Modal handlers ---------- */
function openAddModal() {
  isEdit.value = false
  resetForm()
  showFormModal.value = true
}
function openEditModal(row) {
  isEdit.value = true
  editingId.value = row.id
  formFee.academicYearId = row.academic_year?.id ?? ''
  formFee.gradeClassId = row.grade_class?.id ?? ''
  formFee.termId = row.term?.id ?? ''
  formFee.amount = row.amount ?? ''
  formValidationMessage.value = ''
  showFormModal.value = true
}
function closeFormModal() {
  if (!isSubmitting.value) {
    showFormModal.value = false
    resetForm()
  }
}

function openSingleDeleteConfirm(row) {
  deleteTarget.value = row
  showDeleteSingleModal.value = true
}
function closeDeleteSingleModal() {
  showDeleteSingleModal.value = false
  deleteTarget.value = null
}

function openBulkDeleteConfirm() {
  showDeleteBulkModal.value = true
}
function closeBulkDeleteConfirm() {
  if (!isDeleting.value) {
    showDeleteBulkModal.value = false
  }
}

/* ---------- Submit ---------- */
function submitForm() {
  if (!validateForm()) return
  isSubmitting.value = true
  const payload = {
    academic_year_id: formFee.academicYearId,
    grade_class_id: formFee.gradeClassId,
    term_id: formFee.termId,
    amount: formFee.amount,
    discounted_student_ids: formFee.is_discount ? formFee.discounted_student_ids : [],
    is_discounted: formFee.is_discount,
  }

  const done = () => (isSubmitting.value = false)

  if (isEdit.value && editingId.value != null) {
    feeStructureApi
      .updateFeeStructure(editingId.value, payload)
      .then((updated) => {
        feeStructures.value = feeStructures.value.map(r => (r.id === updated.id ? updated : r))
        showFormModal.value = false
        resetForm()
        toast.success('Fee structure updated successfully.', { position: 'top-right' })
      })
      .catch((err) => (formValidationMessage.value = err?.message || 'Failed to update fee structure.'))
      .finally(done)
  } else {
    feeStructureApi.createFeeStructure(payload)
      .then((created) => {

        feeStructures.value = [...feeStructures.value, created]


        showFormModal.value = false
        toast.success('Fee structure added successfully.', { position: 'top-right' })

        resetForm()
      })
      .catch((err) => (formValidationMessage.value = err?.message || 'Failed to add fee structure.'))
      .finally(done)
  }
}

/* ---------- Delete ---------- */
async function confirmDeleteSingle() {
  if (!deleteTarget.value) return

  isDeleting.value = true
  const recordName = deleteTarget.value.name || `ID ${deleteTarget.value.id}`

  try {
    const id = deleteTarget.value.id
    await feeStructureApi.deleteFeeStructure(id)

    feeStructures.value = feeStructures.value.filter(r => r.id !== id)
    selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id)
    closeDeleteSingleModal()

    toast.success(`Fee structure deleted successfully.`, {
      position: 'top-right',
    })
  } catch (error) {


    // Extract associated record name if backend provides it
    const associatedRecordName =
      error.response?.data?.associatedRecordName ||
      "a linked student's fee record"

    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      `Cannot delete this structure because it is linked to ${associatedRecordName}. Please delete the associated record first.`

    // Override for FK constraint errors
    if (message.includes('violates foreign key constraint')) {
      message = `Cannot delete this structure because it is linked to ${associatedRecordName}. Please delete the associated record first.`
    }

    toast.error(message, { position: 'top-right' })
  } finally {
    isDeleting.value = false
  }
}




/* ---------- Init ---------- */
onMounted(async () => {
  try {
    isLoading.value = true
    await loadReferenceData()
    await loadFeeStructures()
    await fetchUsers()
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
