<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Payments</strong>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by student, receipt..."
                aria-label="Search payments"
                size="sm"
                style="min-width: 220px;"
              />

              <CFormSelect v-model="dateFilter" size="sm" style="min-width: 160px;">
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Past 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </CFormSelect>

              <CButton
                color="danger"
                size="sm"
                :disabled="selectedIds.length === 0"
                @click="openBulkDeleteConfirm"
              >
                Delete Selected ({{ selectedIds.length }})
              </CButton>

              <CButton class="text-white" color="primary" size="sm" @click="openAddModal">
                Add Payment
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <p class="text-body-secondary small">Record and manage payments.</p>

          <CAlert color="danger" v-if="errorMessage" class="py-2">
            {{ errorMessage }}
          </CAlert>

          <div class="d-flex align-items-center gap-2 mb-2" v-if="isLoading">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading payments…</span>
          </div>

          <DocsExample>

            <div v-if="isLoading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading payments...</span>
          </div>


            <CTable v-else  hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col" class="text-center" style="width: 48px;">
                    <CFormCheck
                      :checked="allSelected"
                      :indeterminate="someSelected"
                      @change="toggleSelectAll"
                      aria-label="Select all in current view"
                    />
                  </CTableHeaderCell>
                  <CTableHeaderCell scope="col" style="width: 60px;">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Student</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Class</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Term</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Academic Year</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Date</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end">Amount (GHS)</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end">Balance (GHS)</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end" style="width: 160px;">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow v-for="(row, idx) in payments" :key="row.id">
                  <CTableDataCell class="text-center">
                    <CFormCheck v-model="selectedIds" :value="row.id" aria-label="Select row" />
                  </CTableDataCell>
                  <CTableHeaderCell scope="row">{{ (currentPage - 1) * pageSize + idx + 1 }}</CTableHeaderCell>
                  <CTableDataCell>{{ row.student_fee_record?.student?.user?.full_name || '—' }}</CTableDataCell>
                  <CTableDataCell>{{ row.student_fee_record?.fee_structure?.grade_class?.name || '—' }}</CTableDataCell>
                  <CTableDataCell>{{ row.student_fee_record?.fee_structure?.term?.name || '—' }}</CTableDataCell>
                  <CTableDataCell>{{ row.student_fee_record?.fee_structure?.academic_year?.name || '—' }}</CTableDataCell>
                  <CTableDataCell>{{ row.date || '—' }}</CTableDataCell>
                  <CTableDataCell class="text-end">{{ formatAmount(row.amount) }}</CTableDataCell>
                  <CTableDataCell class="text-end">{{ formatAmount(row.student_fee_record?.balance) }}</CTableDataCell>
                  <CTableDataCell class="text-end">
                    <CButtonGroup size="sm">
                      <CButton color="danger" variant="outline" @click="openSingleDeleteConfirm(row)">
                        Delete
                      </CButton>
                    </CButtonGroup>
                  </CTableDataCell>
                </CTableRow>

                <CTableRow v-if="!isLoading && payments.length === 0">
                  <CTableDataCell colspan="9" class="text-center text-body-secondary">
                    No payments found<span v-if="searchTerm"> for “{{ searchTerm }}”</span>.
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
              <div style="font-size: 14px; color: #7f8c8d;">
                {{ showingRange }}
              </div>
            </div>
          </DocsExample>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Add Payment Modal (no edit for now – payments usually immutable) -->
  <CModal :visible="showFormModal" @close="closeFormModal" size="lg">
    <CModalHeader>
      <CModalTitle>Add Payment</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-3 position-relative">
        <CFormLabel for="sfr">Student / Class / Term / AY</CFormLabel>
        <CFormInput
          id="sfr"
          v-model="recordSearch"
          placeholder="Search fee record..."
          @input="filterRecords"
          autocomplete="off"
        />
        <div
          v-if="filteredStudentFeeRecords.length > 0 && recordSearch"
          class="dropdown-menu show w-100 shadow"
          style="max-height: 240px; overflow-y: auto; z-index: 1050;"
        >
          <button
            v-for="rec in filteredStudentFeeRecords"
            :key="rec.id"
            class="dropdown-item text-truncate"
            @click="selectRecord(rec)"
          >
            {{ rec.student?.user?.full_name }} /
            {{ rec.fee_structure?.grade_class?.name }} /
            {{ rec.fee_structure?.term?.name }} /
            {{ rec.fee_structure?.academic_year?.name }} /
            {{ rec.balance }}
          </button>
        </div>
      </div>

      <div class="mb-3">
        <CFormLabel for="date">Date</CFormLabel>
        <CFormInput id="date" v-model="formPayment.date" type="date" />
        <div class="text-body-secondary small mt-1" v-if="!formPayment.date">
          Defaults to today if left blank.
        </div>
      </div>

      <div class="mb-3">
        <CFormLabel for="amount">Amount (GHS)</CFormLabel>
        <CFormInput
          id="amount"
          v-model="formPayment.amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g., 150.00"
        />
      </div>

      <div class="text-danger small mt-2" v-if="formValidationMessage">
        {{ formValidationMessage }}
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">
        Cancel
      </CButton>
      <CButton class="text-white" color="primary" @click="submitForm" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
        Save Payment
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Delete Confirmations -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader><CModalTitle>Delete Payment</CModalTitle></CModalHeader>
    <CModalBody>
      Delete payment of <strong>GHS {{ formatAmount(deleteTarget?.amount) }}</strong>
      for <strong>{{ deleteTarget?.student_fee_record?.student?.user?.full_name || '—' }}</strong>
      on {{ deleteTarget?.date }}?<br />
      This action cannot be undone.
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
    <CModalHeader><CModalTitle>Delete Selected Payments</CModalTitle></CModalHeader>
    <CModalBody>
      Delete <strong>{{ selectedIds.length }}</strong> payment(s)? This cannot be undone.
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
import {
  get_payments,
  get_raw_student_fee_records,
  create_payment,
  delete_payment
} from '@/services/api' // adjust path
import Pagination from '@/Pagination.vue'

const toast = useToast()
const pageSize = 10

// ────────────────────────────────────────────────
const isLoading      = ref(false)
const isSubmitting   = ref(false)
const isDeleting     = ref(false)
const errorMessage   = ref('')

const payments       = ref([])
const currentPage    = ref(1)
const totalPages     = ref(1)
const totalCount     = ref(0)
const pageCache      = ref(new Map())
const currentSearch  = ref('')
const currentDateFilter = ref('')

const searchTerm     = ref('')
const dateFilter     = ref('')
const selectedIds    = ref([])

// Form
const showFormModal       = ref(false)
const formPayment         = reactive({
  studentFeeRecordId: '',
  date: '',
  amount: ''
})
const recordSearch        = ref('')
const studentFeeRecords   = ref([])
const filteredStudentFeeRecords = ref([])
const formValidationMessage = ref('')

// Delete
const showDeleteSingleModal = ref(false)
const deleteTarget          = ref(null)
const showDeleteBulkModal   = ref(false)

// ──────────────────────────────────────────────── Computed

const showingRange = computed(() => {
  if (totalCount.value === 0) return 'Showing 0–0 of 0'
  const start = (currentPage.value - 1) * pageSize + 1
  const end = Math.min(start + pageSize - 1, totalCount.value)
  return `Showing ${start}–${end} of ${totalCount.value}`
})

const allSelected = computed(() =>
  payments.value.length > 0 &&
  payments.value.every(p => selectedIds.value.includes(p.id))
)

const someSelected = computed(() =>
  payments.value.some(p => selectedIds.value.includes(p.id)) && !allSelected.value
)

// ──────────────────────────────────────────────── Helpers

function formatAmount(v) {
  const n = Number(v)
  return Number.isNaN(n) ? '—' : n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function resetForm() {
  formPayment.studentFeeRecordId = ''
  formPayment.date  = ''
  formPayment.amount = ''
  recordSearch.value = ''
  filteredStudentFeeRecords.value = []
  formValidationMessage.value = ''
}

function validateForm() {
  if (!formPayment.studentFeeRecordId) {
    formValidationMessage.value = 'Please select a student fee record.'
    return false
  }
  if (!formPayment.amount || Number(formPayment.amount) <= 0) {
    formValidationMessage.value = 'Amount must be greater than zero.'
    return false
  }
  formValidationMessage.value = ''
  return true
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(id =>
      !payments.value.some(p => p.id === id)
    )
  } else {
    const set = new Set(selectedIds.value)
    payments.value.forEach(p => set.add(p.id))
    selectedIds.value = [...set]
  }
}

// ──────────────────────────────────────────────── Data Loading

async function loadStudentFeeRecords() {
  try {
    const res = await get_raw_student_fee_records()

    studentFeeRecords.value = res.data || []
  } catch (err) {
    toast.error('Failed to load student fee records.')
  }
}

async function loadPayments(page = 1, force = false) {
  const search = searchTerm.value?.trim() || ''
  const dateF = dateFilter.value

  // Reset cache when search or date filter changes
  if (currentSearch.value !== search || currentDateFilter.value !== dateF) {
    currentSearch.value = search
    currentDateFilter.value = dateF
    pageCache.value.clear()
    currentPage.value = 1
    page = 1
  }

  const cacheKey = `${page}|${search}|${dateF}`

  if (!force && pageCache.value.has(cacheKey)) {
    const cached = pageCache.value.get(cacheKey)
    payments.value = cached.results
    totalCount.value = cached.count
    totalPages.value = Math.ceil(cached.count / pageSize)
    currentPage.value = page
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const params = { page, page_size: pageSize }
    if (search) params.search = search
    if (dateF) params.date_filter = dateF   // ← ideally backend supports this

    const res = await get_payments(params)
    const data = res.data

    pageCache.value.set(cacheKey, { results: data.results, count: data.count })

    payments.value   = data.results || []
    totalCount.value = data.count || 0
    totalPages.value = Math.ceil(totalCount.value / pageSize)
    currentPage.value = page
  } catch (err) {
    errorMessage.value = 'Failed to load payments.'
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

// ──────────────────────────────────────────────── Record Search (client-side)

function filterRecords() {
  const q = recordSearch.value.toLowerCase().trim()
  if (!q) {
    filteredStudentFeeRecords.value = []
    return
  }

  filteredStudentFeeRecords.value = studentFeeRecords.value

    .filter(r => {
      const name  = r.student?.user?.full_name?.toLowerCase() || ''
      const cls   = r.fee_structure?.grade_class?.name?.toLowerCase() || ''
      const term  = r.fee_structure?.term?.name?.toLowerCase() || ''
      const year  = r.fee_structure?.academic_year?.name?.toLowerCase() || ''
      const balance = r.balance
      return name.includes(q) || cls.includes(q) || term.includes(q) || year.includes(q) || balance.includes(q)
    })
    .slice(0, 15) // limit dropdown results
}

function selectRecord(record) {
  formPayment.studentFeeRecordId = record.id
  recordSearch.value = `${record.student?.user?.full_name || '?'} / ${record.fee_structure?.grade_class?.name || '?'} / ${record.fee_structure?.term?.name || '?'} / ${record.fee_structure?.academic_year?.name || '?'} / ${record.balance || '?'} `
  filteredStudentFeeRecords.value = []
}

// ──────────────────────────────────────────────── Actions

function openAddModal() {
  resetForm()
  showFormModal.value = true
}

function closeFormModal() {
  if (isSubmitting.value) return
  showFormModal.value = false
  resetForm()
}

async function submitForm() {
  if (!validateForm()) return
  isSubmitting.value = true

  const today = new Date().toISOString().split('T')[0]
  const payload = {
    student_fee_record_id: formPayment.studentFeeRecordId,
    date: formPayment.date || today,
    amount: formPayment.amount
  }

  try {
    const res = await create_payment(payload)
    const created = res.data

    // Auto-download receipt if present
    if (created?.receipt_url) {
      const link = document.createElement('a')
      link.href = created.receipt_url
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    toast.success('Payment recorded successfully.')
    showFormModal.value = false
    resetForm()
    loadPayments(currentPage.value, true) // refresh
  } catch (err) {

    formValidationMessage.value = err.response?.data?.amount?.[0] || 'Failed to record payment.'
    toast.error(formValidationMessage.value)
  } finally {
    isSubmitting.value = false
  }
}

// ─── Delete ───────────────────────────────────────

function openSingleDeleteConfirm(row) {
  deleteTarget.value = row
  showDeleteSingleModal.value = true
}

function closeDeleteSingleModal() {
  if (isDeleting.value) return
  showDeleteSingleModal.value = false
  deleteTarget.value = null
}

async function confirmDeleteSingle() {
  if (!deleteTarget.value?.id) return
  isDeleting.value = true

  try {
    await delete_payment(deleteTarget.value.id)
    toast.success('Payment deleted.')
    payments.value = payments.value.filter(p => p.id !== deleteTarget.value.id)
    selectedIds.value = selectedIds.value.filter(id => id !== deleteTarget.value.id)
    closeDeleteSingleModal()
  } catch (err) {
    toast.error('Failed to delete payment.')
  } finally {
    isDeleting.value = false
    closeDeleteSingleModal()
  }
}

function openBulkDeleteConfirm() {
  if (selectedIds.value.length === 0) return
  showDeleteBulkModal.value = true
}

function closeBulkDeleteConfirm() {
  if (isDeleting.value) return
  showDeleteBulkModal.value = false
}

async function confirmDeleteBulk() {
  if (selectedIds.value.length === 0) return
  isDeleting.value = true

  const ids = [...selectedIds.value]

  try {
    await Promise.all(ids.map(id => delete_payment(id)))
    payments.value = payments.value.filter(p => !ids.includes(p.id))
    selectedIds.value = []
    toast.success(`Deleted ${ids.length} payment(s).`)
    closeBulkDeleteConfirm()
  } catch (err) {
    toast.error('Some deletions failed.')
  } finally {
    isDeleting.value = false
    closeBulkDeleteConfirm()
  }
}

// ──────────────────────────────────────────────── Events & Watch

function onPageChanged(page) {
  loadPayments(page)
}

watch([searchTerm, dateFilter], () => {
  loadPayments(1)
})

// ──────────────────────────────────────────────── Init

onMounted(async () => {
  isLoading.value = true
  await Promise.all([
    loadStudentFeeRecords(),
    loadPayments(1)
  ])
  isLoading.value = false
})
</script>

<style scoped>
.dropdown-menu .dropdown-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
