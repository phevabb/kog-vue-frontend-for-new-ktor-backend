<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader class="d-flex flex-column flex-lg-row justify-content-lg-between align-items-lg-center gap-3">
          <strong>Student Fee Records</strong>

          <div class="d-flex flex-wrap gap-2 align-items-center">
            <!-- Fee Structure Filter -->
            <CFormSelect
              v-model="selectedFeeStructureId"
              size="sm"
              style="max-width: 380px; min-width: 240px;"
            >
              <option :value="null">All Fee Structures</option>
              <option v-for="fs in feeStructures" :key="fs.id" :value="fs.id">
                {{ fs.academic_year?.name }} – {{ fs.term?.name }} – {{ fs.grade_class?.name }}
                (GH₵ {{ formatAmount(fs.amount) }})
              </option>
            </CFormSelect>

            <!-- Search Field Selector -->
            <CFormSelect v-model="searchField" size="sm" style="width: 200px;">
              <option value="student">Student Name</option>
              <option value="class">Current Class</option>
              <option value="fully_paid">Fully Paid</option>
            </CFormSelect>

            <!-- Conditional Input / Select -->
            <div v-if="searchField === 'fully_paid'">
              <CFormSelect v-model="fullyPaidFilter" size="sm" style="width: 170px;">
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </CFormSelect>
            </div>
            <CFormInput
              v-else
              v-model="searchTerm"
              :placeholder="searchPlaceholder"
              size="sm"
              style="width: 260px;"
            />

            <!-- Actions -->
            <CButton color="primary" size="sm" @click="openAddModal">
              Add Record
            </CButton>
            <CButton
              color="danger"
              size="sm"
              :disabled="selectedIds.length === 0"
              @click="openBulkDeleteConfirm"
            >
              Delete ({{ selectedIds.length }})
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          <p class="text-body-secondary small mb-3">
            Track student balances, payment status, and fee records per structure.
          </p>

          <CAlert color="danger" v-if="errorMessage" class="py-2 mb-3">
            {{ errorMessage }}
          </CAlert>

          <div v-if="isLoading" class="d-flex align-items-center gap-2 mb-3">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading records…</span>
          </div>

          <div v-if="isLoading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading records...</span>
          </div>

          <CTable v-else hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell class="text-center" style="width:48px;">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="someSelected"
                    @change="toggleSelectAll"
                  />
                </CTableHeaderCell>
                <CTableHeaderCell style="width:60px;">#</CTableHeaderCell>
                <CTableHeaderCell>Student</CTableHeaderCell>
                <CTableHeaderCell>Class</CTableHeaderCell>
                <CTableHeaderCell>Term</CTableHeaderCell>
                <CTableHeaderCell>Academic Year</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Amount Paid</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Balance</CTableHeaderCell>
                <CTableHeaderCell>Fully Paid</CTableHeaderCell>
                <CTableHeaderCell>Created</CTableHeaderCell>
                <CTableHeaderCell class="text-end" style="width:140px;">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="(row, idx) in records" :key="row.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="row.id" />
                </CTableDataCell>
                <CTableHeaderCell scope="row">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableHeaderCell>
                <CTableDataCell>{{ row.student?.user?.full_name || '—' }}</CTableDataCell>
                <CTableDataCell>{{ row.fee_structure?.grade_class?.name || '—' }}</CTableDataCell>
                <CTableDataCell>{{ row.fee_structure?.term?.name || '—' }}</CTableDataCell>
                <CTableDataCell>{{ row.fee_structure?.academic_year?.name || '—' }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatAmount(row.amount_paid) }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatAmount(row.balance) }}</CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="Number(row.balance) === 0 ? 'success' : 'warning'">
                    {{ Number(row.balance) === 0 ? 'Yes' : 'No' }}
                  </CBadge>

                </CTableDataCell>
                <CTableDataCell>{{ formatDateTime(row.date_created) }}</CTableDataCell>
                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="danger" variant="outline" @click="openSingleDeleteConfirm(row)">
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && records.length === 0">
                <CTableDataCell colspan="11" class="text-center text-body-secondary py-4">
                  No fee records found.
                  <div v-if="selectedFeeStructureId || searchTerm || fullyPaidFilter !== ''" class="mt-1 small">
                    Try adjusting the filters above.
                  </div>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <div class="d-flex justify-content-between align-items-center mt-3">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-changed="onPageChanged"
            />
            <div class="text-muted small">
              {{ showingRange }}
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Add Record Modal (no edit – usually immutable or recreated) -->
  <CModal :visible="showFormModal" @close="closeFormModal" size="lg">
    <CModalHeader>
      <CModalTitle>Add Fee Record</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-3 position-relative">
        <CFormLabel>Student</CFormLabel>
        <CFormInput
          v-model="studentSearch"
          placeholder="Search student by name..."
          @input="filterStudents"
        />
        <div
          v-if="filteredStudents.length > 0 && studentSearch"
          class="dropdown-menu show w-100 shadow"
          style="max-height: 240px; overflow-y: auto; z-index: 1050;"
        >
          <button
            v-for="s in filteredStudents"
            :key="s.id"
            class="dropdown-item"
            @click="selectStudent(s)"
          >
            {{ s.user?.full_name || '—' }}
          </button>
        </div>
      </div>

      <div class="mb-3">
        <CFormLabel>Fee Structure</CFormLabel>
        <CFormSelect v-model="formRecord.feeStructureId">
          <option value="" disabled selected>Select Fee Structure</option>
          <option v-for="fs in feeStructures" :key="fs.id" :value="fs.id">
            {{ fs.grade_class?.name }} / {{ fs.term?.name }} / {{ fs.academic_year?.name }}
            – GH₵ {{ formatAmount(fs.amount) }}
          </option>
        </CFormSelect>
      </div>

      <div class="text-danger small mt-2" v-if="formValidationMessage">
        {{ formValidationMessage }}
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">
        Cancel
      </CButton>
      <CButton color="primary" @click="submitForm" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
        Save Record
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Delete Confirmation Modals -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader><CModalTitle>Delete Fee Record</CModalTitle></CModalHeader>
    <CModalBody>
      Delete record for
      <strong>{{ deleteTarget?.student?.user?.full_name || '—' }}</strong> →
      <strong>{{ deleteTarget?.fee_structure?.grade_class?.name || '—' }}</strong> /
      {{ deleteTarget?.fee_structure?.term?.name || '—' }} /
      {{ deleteTarget?.fee_structure?.academic_year?.name || '—' }} ?
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeDeleteSingleModal" :disabled="isDeleting">
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDeleteSingle" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />
        Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <CModal :visible="showDeleteBulkModal" @close="closeBulkDeleteConfirm">
    <CModalHeader><CModalTitle>Delete Selected Records</CModalTitle></CModalHeader>
    <CModalBody>
      Delete <strong>{{ selectedIds.length }}</strong> record(s)? This cannot be undone.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeBulkDeleteConfirm" :disabled="isDeleting">
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDeleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />
        Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import Pagination from '@/Pagination.vue'
import {
  rawst,
  get_student_fee_record,
  create_student_fee_record,
  delete_student_fee_record,
  get_raw_fee_structures,
} from '@/services/api' // adjust path

const toast = useToast()
const pageSize = 10

// ────────────────────────────────────── State
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')

const records = ref([])
const feeStructures = ref([])
const students = ref([])

const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const pageCache = ref(new Map())
const currentFilters = ref('')

const searchField = ref('student')
const searchTerm = ref('')
const fullyPaidFilter = ref('')
const selectedFeeStructureId = ref(null)

const selectedIds = ref([])

// Form
const showFormModal = ref(false)
const formRecord = reactive({
  studentId: '',
  feeStructureId: '',
})
const studentSearch = ref('')
const filteredStudents = ref([])
const formValidationMessage = ref('')

// Delete
const showDeleteSingleModal = ref(false)
const deleteTarget = ref(null)
const showDeleteBulkModal = ref(false)

// ────────────────────────────────────── Computed

const searchPlaceholder = computed(() => {
  if (searchField.value === 'student') return 'Search student name...'
  if (searchField.value === 'class') return 'Search class name...'
  return 'Filter records...'
})

const showingRange = computed(() => {
  if (!totalCount.value) return '0–0 of 0'
  const start = (currentPage.value - 1) * pageSize + 1
  const end = Math.min(start + pageSize - 1, totalCount.value)
  return `Showing ${start}–${end} of ${totalCount.value}`
})

const allSelected = computed(() =>
  records.value.length > 0 && records.value.every(r => selectedIds.value.includes(r.id))
)

const someSelected = computed(() =>
  records.value.some(r => selectedIds.value.includes(r.id)) && !allSelected.value
)

// ────────────────────────────────────── Helpers

function formatAmount(v) {
  const n = Number(v)
  return isNaN(n) ? '—' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '')
}

function resetForm() {

  formRecord.studentId = ''
  formRecord.feeStructureId = ''
  studentSearch.value = ''
  filteredStudents.value = []
  formValidationMessage.value = ''
}

function validateForm() {
  if (!formRecord.studentId) {
    formValidationMessage.value = 'Student is required.'
    return false
  }
  if (!formRecord.feeStructureId) {
    formValidationMessage.value = 'Fee Structure is required.'
    return false
  }
  formValidationMessage.value = ''
  return true
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !records.value.some(r => r.id === id))
  } else {
    const set = new Set(selectedIds.value)
    records.value.forEach(r => set.add(r.id))
    selectedIds.value = [...set]
  }
}

// ────────────────────────────────────── Data Loading

async function loadLookups() {
  try {
    const [studentsRes, fsRes] = await Promise.all([
      rawst(),
      get_raw_fee_structures(),
    ])
    students.value = studentsRes.data || []
    feeStructures.value = fsRes.data || []
  } catch (err) {
    toast.error('Failed to load students or fee structures.')
  }
}

async function loadRecords(page = 1, force = false) {
  const filtersKey = `${searchField.value}|${searchTerm.value?.trim() || ''}|${fullyPaidFilter.value}|${selectedFeeStructureId.value || ''}`

  if (currentFilters.value !== filtersKey) {
    currentFilters.value = filtersKey
    pageCache.value.clear()
    currentPage.value = 1
    page = 1
  }

  const cacheKey = `${page}|${filtersKey}`

  if (!force && pageCache.value.has(cacheKey)) {
    const cached = pageCache.value.get(cacheKey)
    records.value = cached.results
    totalCount.value = cached.count
    totalPages.value = Math.ceil(cached.count / pageSize)
    currentPage.value = page
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const params = {
      page,
      page_size: pageSize,
    }

    if (searchTerm.value?.trim()) {
      params.search = searchTerm.value.trim()
    }

    if (selectedFeeStructureId.value) {
      params.fee_structure = selectedFeeStructureId.value
    }

    if (fullyPaidFilter.value) {
      params.is_fully_paid = fullyPaidFilter.value
    }

    const res = await get_student_fee_record(params)

    const data = res.data || {}

    pageCache.value.set(cacheKey, { results: data.results || [], count: data.count || 0 })

    records.value = data.results || []
    totalCount.value = data.count || 0
    totalPages.value = Math.ceil(totalCount.value / pageSize)
    currentPage.value = page
  } catch (err) {
    errorMessage.value = 'Failed to load fee records.'
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

// ────────────────────────────────────── Student Search (modal)

function filterStudents() {
  const q = studentSearch.value.toLowerCase().trim()
  if (!q) {
    filteredStudents.value = []
    return
  }
  filteredStudents.value = students.value
    .filter(s => s.user?.full_name?.toLowerCase().includes(q))
    .slice(0, 20)
}

function selectStudent(student) {
  formRecord.studentId = student.id
  studentSearch.value = student.user?.full_name || ''
  filteredStudents.value = []
}

// ────────────────────────────────────── Actions

function openAddModal() {
  resetForm()
  showFormModal.value = true
}


function closeDeleteSingleModal() {
  if (isDeleting.value) return
  showDeleteSingleModal.value = false
  deleteTarget.value = null
}
function closeBulkDeleteConfirm() {
  if (isDeleting.value) return
  showDeleteBulkModal.value = false
}
function closeFormModal() {
  if (isSubmitting.value) return
  showFormModal.value = false
  resetForm()
}

async function submitForm() {
  if (!validateForm()) return
  isSubmitting.value = true

  const payload = {


    student_id: formRecord.studentId,
    fee_structure_id: formRecord.feeStructureId,
  }

  try {

    const res = await create_student_fee_record(payload)

    toast.success('Fee record created.')
    showFormModal.value = false
    resetForm()
    loadRecords(currentPage.value, true)
  } catch (err) {

    formValidationMessage.value = err.response?.data?.detail || 'Failed to create record.'
    toast.error(formValidationMessage.value)
  } finally {
    isSubmitting.value = false
  }
}

function openSingleDeleteConfirm(row) {
  deleteTarget.value = row
  showDeleteSingleModal.value = true
}

async function confirmDeleteSingle() {
  if (!deleteTarget.value?.id) return
  isDeleting.value = true

  try {
    await delete_student_fee_record(deleteTarget.value.id)
    toast.success('Record deleted.')
    records.value = records.value.filter(r => r.id !== deleteTarget.value.id)
    selectedIds.value = selectedIds.value.filter(id => id !== deleteTarget.value.id)
    closeDeleteSingleModal()
  } catch (err) {
    toast.error('Failed to delete record.')
  } finally {
    isDeleting.value = false
    closeDeleteSingleModal()
  }
}

function openBulkDeleteConfirm() {
  if (!selectedIds.value.length) return
  showDeleteBulkModal.value = true
}

async function confirmDeleteBulk() {
  isDeleting.value = true
  const ids = [...selectedIds.value]

  try {
    await Promise.all(ids.map(id => delete_student_fee_record(id)))
    records.value = records.value.filter(r => !ids.includes(r.id))
    selectedIds.value = []
    toast.success(`Deleted ${ids.length} record(s).`)
    closeBulkDeleteConfirm()
  } catch (err) {
    toast.error('Some deletions failed.')
  } finally {
    isDeleting.value = false
    closeBulkDeleteConfirm()
  }
}

// ────────────────────────────────────── Watchers & Events

watch([searchTerm, searchField, fullyPaidFilter, selectedFeeStructureId], () => {
  currentPage.value = 1
  loadRecords(1)
})

function onPageChanged(page) {
  loadRecords(page)
}

// ────────────────────────────────────── Init

onMounted(async () => {
  isLoading.value = true
  await loadLookups()
  await loadRecords(1)
  isLoading.value = false
})
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
