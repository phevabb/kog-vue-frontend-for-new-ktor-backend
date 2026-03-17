<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Family Payments</strong>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by family / term / year..."
                size="sm"
                style="min-width: 260px;"
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
                :disabled="!selectedIds.length"
                @click="showBulkDeleteModal = true"
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
          <div v-if="isLoading" class="d-flex align-items-center gap-2 mb-3">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading payments…</span>
          </div>

          <div v-if="isLoading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading payments...</span>
          </div>

          <CTable v-else hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell class="text-center" style="width:48px">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="someSelected"
                    @change="toggleSelectAll"
                  />
                </CTableHeaderCell>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Family Fee Record</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Amount (GHS)</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Net Balance (GHS)</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(payment, idx) in displayedPayments" :key="payment.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="payment.id" />
                </CTableDataCell>
                <CTableHeaderCell scope="row">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableHeaderCell>
                <CTableDataCell>
                  {{ payment.family_fee_record?.family?.name || '—' }} —
                  {{ payment.family_fee_record?.term?.name || '—' }} —
                  {{ payment.family_fee_record?.academic_year?.name || '—' }}
                </CTableDataCell>
                <CTableDataCell>{{ formatDate(payment.date) }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatCurrency(payment.amount) }}</CTableDataCell>
                <CTableDataCell class="text-end">
                  {{ formatCurrency(payment.family_fee_record?.balance) }}
                </CTableDataCell>
                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="danger" variant="outline" @click="openDeleteConfirm(payment)">
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && !filteredPayments.length">
                <CTableDataCell colspan="7" class="text-center text-body-secondary py-4">
                  No payments found
                  <span v-if="searchTerm"> for “{{ searchTerm }}”</span>
                  <span v-if="dateFilter"> with date filter “{{ dateFilterLabel }}”</span>.
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <div class="d-flex justify-content-between align-items-center mt-3">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-changed="changePage"
            />
            <div style="font-size:14px; color:#7f8c8d;">
              {{ showingRange }}
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Add / Edit Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal" :backdrop="!isSubmitting">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Payment' : 'Add Payment' }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CFormSelect
        v-model="form.familyFeeRecordId"
        label="Family Fee Record"
        :disabled="isSubmitting || isLoadingRecords"
      >
        <option value="" disabled selected>Select Family</option>
        <option
          v-for="fr in feeRecordOptions"
          :key="fr.value"
          :value="fr.value"
        >
          {{ fr.label }}
        </option>
      </CFormSelect>

      <CFormInput
        v-model.number="form.amount"
        label="Amount (GHS)"
        type="number"
        step="0.01"
        min="0"
        :disabled="isSubmitting"
        class="mt-3"
      />

      <CFormInput
        v-model="form.date"
        label="Payment Date"
        type="date"
        :disabled="isSubmitting"
        class="mt-3"
      />

      <CAlert color="danger" v-if="formError" class="mt-3">
        {{ formError }}
      </CAlert>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">
        Cancel
      </CButton>
      <CButton color="primary" @click="savePayment" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-1" />
        {{ isEdit ? 'Update' : 'Save' }}
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Single Delete Confirm -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader>
      <CModalTitle>Confirm Delete</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Delete this payment of <strong>{{ formatCurrency(deleteTarget?.amount) }}</strong>?
      <div class="text-danger small mt-2">
        This action cannot be undone.
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeDeleteSingleModal" :disabled="isDeleting">
        Cancel
      </CButton>
      <CButton color="danger" @click="deleteSingle" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-1" />
        Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Bulk Delete Confirm -->
  <CModal :visible="showBulkDeleteModal" @close="showBulkDeleteModal = false">
    <CModalHeader>
      <CModalTitle>Delete {{ selectedIds.length }} Payments?</CModalTitle>
    </CModalHeader>
    <CModalBody>
      This action cannot be undone.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="showBulkDeleteModal = false" :disabled="isDeleting">
        Cancel
      </CButton>
      <CButton color="danger" @click="deleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-1" />
        Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import Pagination from '@/Pagination.vue'

import {
  get_family_payments,
  create_family_payment,
  delete_family_payment,
  get_raw_family_fee_rec,
} from '@/services/api'

const toast = useToast()

// Client pagination size
const pageSize = 10
// API batch size when loading all results
const API_PAGE_SIZE = 200

// ── State ────────────────────────────────────────
const isLoading        = ref(false)
const isLoadingRecords = ref(false) // <-- fix: was referenced in template
const isSubmitting     = ref(false)
const isDeleting       = ref(false)
const errorMessage     = ref('')

// Store the full dataset; compute filtered/paged views from it
const allPayments      = ref([])

const familyFeeRecords = ref([])

const searchTerm       = ref('')
const dateFilter       = ref('')     // '', 'today', '7days', 'month', 'year'
const currentPage      = ref(1)

const selectedIds      = ref([])

const showFormModal          = ref(false)
const isEdit                 = ref(false)
const form = reactive({
  familyFeeRecordId: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
})
const formError        = ref('')

const showDeleteSingleModal = ref(false)
const deleteTarget          = ref(null)
const showBulkDeleteModal   = ref(false)

// ── Helpers ──────────────────────────────────────
const formatCurrency = (val) => {
  const num = Number(val)
  return Number.isNaN(num) ? '—' : num.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const dateFilterLabel = computed(() => {
  switch (dateFilter.value) {
    case 'today':  return 'Today'
    case '7days':  return 'Past 7 Days'
    case 'month':  return 'This Month'
    case 'year':   return 'This Year'
    default:       return 'All Dates'
  }
})

// Returns [startDate, endDate] for the preset (inclusive, in local time)
function getDateRange(preset) {
  if (!preset) return [null, null]
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  let start
  switch (preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      break
    case '7days': {
      const s = new Date(now)
      s.setDate(s.getDate() - 6) // include today → last 7 calendar days
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0)
      break
    }
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      break
    default:
      return [null, null]
  }
  return [start, end]
}

function isWithinRange(dateStr, start, end) {
  if (!start || !end) return true
  if (!dateStr) return false
  const d = new Date(dateStr) // assuming ISO or yyyy-mm-dd
  return d >= start && d <= end
}

// ── Lookups for modal select ─────────────────────
const feeRecordOptions = computed(() =>
  familyFeeRecords.value.map(r => ({
    value: r.id,
    label: `${r.family_name || '—'} - ${r.term_name || '—'} - ${r.academic_year_name || '—'} - ${r.balance || '—'}`
  }))
)

async function loadFamilyFeeRecords() {
  try {
    isLoadingRecords.value = true
    const res = await get_raw_family_fee_rec()

    familyFeeRecords.value = res.data || []
  } catch {
    toast.error('Failed to load family fee records for selection')
  } finally {
    isLoadingRecords.value = false
  }
}

// ── Client filtering & pagination ────────────────
const filteredPayments = computed(() => {
  const q = (searchTerm.value || '').trim().toLowerCase()
  const [start, end] = getDateRange(dateFilter.value)

  return allPayments.value.filter(p => {
    // Text filter over family / term / academic year
    const family = (p.family_fee_record?.family?.name || '').toLowerCase()
    const term   = (p.family_fee_record?.term?.name || '').toLowerCase()
    const ay     = (p.family_fee_record?.academic_year?.name || '').toLowerCase()
    const textOK = !q || family.includes(q) || term.includes(q) || ay.includes(q)

    // Date filter over payment.date (not created)
    const dateOK = isWithinRange(p.date, start, end)

    return textOK && dateOK
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPayments.value.length / pageSize)))

const displayedPayments = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPayments.value.slice(start, start + pageSize)
})

const showingRange = computed(() => {
  const total = filteredPayments.value.length
  if (!total) return 'Showing 0 payments'
  const start = (currentPage.value - 1) * pageSize + 1
  const end   = Math.min(start + displayedPayments.value.length - 1, total)
  return `Showing ${start}–${end} of ${total}`
})

const allSelected = computed(() =>
  displayedPayments.value.length > 0 &&
  displayedPayments.value.every(p => selectedIds.value.includes(p.id))
)

const someSelected = computed(() =>
  !allSelected.value &&
  displayedPayments.value.some(p => selectedIds.value.includes(p.id))
)

function ensureValidPage() {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  if (currentPage.value < 1) currentPage.value = 1
}

// ── Data Loading (load ALL once) ─────────────────
async function loadAllPayments() {
  isLoading.value = true
  errorMessage.value = ''

  try {

    // First page
    const first = await get_family_payments({ page: 1, page_size: API_PAGE_SIZE })

    const firstData = first.data || {}
    const firstResults = firstData.results || []
    const count = Number(firstData.count || firstResults.length)
    const pages = Math.max(1, Math.ceil(count / API_PAGE_SIZE))

    const all = [...firstResults]
    // Remaining pages (sequential to avoid hammering)
    for (let p = 2; p <= pages; p++) {
      const res = await get_family_payments({ page: p, page_size: API_PAGE_SIZE })
      all.push(...(res.data?.results || []))
    }

    allPayments.value = all
    ensureValidPage()
    selectedIds.value = [] // reset selections when dataset changes
  } catch (err) {

    errorMessage.value = err?.response?.data?.detail || 'Failed to load payments'
    toast.error(err)
  } finally {
    isLoading.value = false
  }
}

// ── Watchers ─────────────────────────────────────
watch([searchTerm, dateFilter], () => {
  currentPage.value = 1
  // no server call; pure client filtering
})

// ── Methods ──────────────────────────────────────
function changePage(page) {
  currentPage.value = page
}

function openAddModal() {
  isEdit.value = false
  Object.assign(form, {
    familyFeeRecordId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  })
  formError.value = ''
  showFormModal.value = true
}

function closeFormModal() {
  if (isSubmitting.value) return
  showFormModal.value = false
}

function openDeleteConfirm(payment) {
  deleteTarget.value = payment
  showDeleteSingleModal.value = true
}

function closeDeleteSingleModal() {
  if (isDeleting.value) return
  showDeleteSingleModal.value = false
  deleteTarget.value = null
}

async function savePayment() {
  if (!form.familyFeeRecordId) {
    formError.value = 'Please select a family fee record'
    return
  }
  if (!form.amount || form.amount <= 0) {
    formError.value = 'Amount must be greater than 0'
    return
  }
  if (!form.date) {
    formError.value = 'Payment date is required'
    return
  }

  isSubmitting.value = true
  formError.value = ''

  const payload = {
    family_fee_record_id: Number(form.familyFeeRecordId),
    amount: Number(form.amount),
    date: form.date,
  }

  try {
    // Create only (no edit endpoint in this view)
    const res = await create_family_payment(payload)
    // Add to the dataset and reflect immediately
    allPayments.value.unshift(res.data)
    ensureValidPage()
    toast.success('Payment recorded')
    closeFormModal()
  } catch (err) {
    const data = err?.response?.data || {}
    formError.value = data.amount?.[0] || data.non_field_errors?.[0] || data.message || 'Failed to save payment'
    toast.error(formError.value)
  } finally {
    isSubmitting.value = false
    closeFormModal()
  }
}

async function deleteSingle() {
  if (!deleteTarget.value?.id) return
  isDeleting.value = true

  try {
    await delete_family_payment(deleteTarget.value.id)
    allPayments.value = allPayments.value.filter(p => p.id !== deleteTarget.value.id)
    selectedIds.value = selectedIds.value.filter(id => id !== deleteTarget.value.id)
    ensureValidPage()
    toast.success('Payment deleted')
    closeDeleteSingleModal()
  } catch (err) {
    const msg = err?.response?.data?.detail || 'Delete failed'
    toast.error(msg.includes('constraint') ? 'Cannot delete – linked to other data' : msg)
  } finally {
    isDeleting.value = false
    closeDeleteSingleModal()
  }
}

async function deleteBulk() {
  if (!selectedIds.value.length) return
  isDeleting.value = true
  const ids = [...selectedIds.value]

  try {
    await Promise.allSettled(ids.map(id => delete_family_payment(id)))
    allPayments.value = allPayments.value.filter(p => !ids.includes(p.id))
    selectedIds.value = []
    ensureValidPage()
    toast.success(`Deleted ${ids.length} payments`)
  } catch {
    toast.error('Some deletions failed')
  } finally {
    isDeleting.value = false
    showBulkDeleteModal.value = false
  }
}

function toggleSelectAll() {
  const currentPageIds = displayedPayments.value.map(p => p.id)
  if (allSelected.value) {
    // unselect only those on the current page
    selectedIds.value = selectedIds.value.filter(id => !currentPageIds.includes(id))
  } else {
    // select all on the current page
    const s = new Set(selectedIds.value)
    currentPageIds.forEach(id => s.add(id))
    selectedIds.value = Array.from(s)
  }
}

// ── Init ─────────────────────────────────────────
onMounted(async () => {
  await loadFamilyFeeRecords()
  await loadAllPayments()
})
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
