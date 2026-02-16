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
              <CButton color="primary" size="sm" @click="openAddModal">
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
              <CTableRow v-for="(payment, idx) in payments" :key="payment.id">
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

              <CTableRow v-if="!isLoading && !payments.length">
                <CTableDataCell colspan="7" class="text-center text-body-secondary py-4">
                  No payments found<span v-if="searchTerm"> for “{{ searchTerm }}”</span>.
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
const pageSize = 10

// ── State ────────────────────────────────────────
const isLoading       = ref(false)
const isSubmitting    = ref(false)
const isDeleting      = ref(false)
const errorMessage    = ref('')

const payments        = ref([])
const familyFeeRecords = ref([])

const searchTerm      = ref('')
const dateFilter      = ref('')   // consider moving to backend later
const currentPage     = ref(1)
const totalPages      = ref(1)
const totalCount      = ref(0)

const selectedIds     = ref([])

const showFormModal         = ref(false)
const isEdit                = ref(false)
const form = reactive({
  familyFeeRecordId: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
})

const formError       = ref('')

const showDeleteSingleModal = ref(false)
const deleteTarget          = ref(null)
const showBulkDeleteModal   = ref(false)

// ── Cache ────────────────────────────────────────
const pageCache = ref(new Map()) // key: "page|search" → { results, count }

// ── Computed ─────────────────────────────────────
const showingRange = computed(() => {
  if (!payments.value.length) return 'Showing 0 payments'
  const start = (currentPage.value - 1) * pageSize + 1
  const end = start + payments.value.length - 1
  return `Showing ${start}–${end} of ${totalCount.value}`
})

const feeRecordOptions = computed(() =>
  familyFeeRecords.value.map(r => ({
    value: r.id,
    label: `${r.family?.name || '—'} - ${r.term?.name || '—'} - ${r.academic_year?.name || '—'}`
  }))
)

const allSelected = computed(() =>
  payments.value.length > 0 && payments.value.every(p => selectedIds.value.includes(p.id))
)

const someSelected = computed(() =>
  !allSelected.value && payments.value.some(p => selectedIds.value.includes(p.id))
)

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

// ── Watchers ─────────────────────────────────────
watch(searchTerm, () => {
  currentPage.value = 1
  loadPayments()
})

watch(dateFilter, () => {
  // For now: client-side (slow for large pages)
  // Ideal: add backend params like created_after / created_before
  // currentPage.value = 1
  // loadPayments()
})

// ── Methods ──────────────────────────────────────
function changePage(page) {
  currentPage.value = page
  loadPayments()
}

async function loadPayments() {
  const page = currentPage.value
  const search = searchTerm.value.trim() || undefined
  const date_preset = dateFilter.value || undefined   // send '' as undefined → backend ignores

  const cacheKey = `${page}|${search || ''}|${date_preset || ''}`

  if (pageCache.value.has(cacheKey)) {
    const cached = pageCache.value.get(cacheKey)
    payments.value = cached.results
    totalCount.value = cached.count
    totalPages.value = Math.ceil(cached.count / pageSize)
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const params = { page, page_size: pageSize }
    if (search) params.search = search
    if (date_preset) params.date_preset = date_preset   // ← this is the key change

    const res = await get_family_payments(params)
    const data = res.data || {}

    const results = data.results || []
    const count = Number(data.count) || 0

    pageCache.value.set(cacheKey, { results, count })

    payments.value = results
    totalCount.value = count
    totalPages.value = Math.ceil(count / pageSize)
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to load payments'
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}
async function loadFamilyFeeRecords() {
  try {
    const res = await get_raw_family_fee_rec()
    familyFeeRecords.value = res.data || []
  } catch {
    toast.error('Failed to load family fee records for selection')
  }
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

function openEditModal(payment) {
  isEdit.value = true
  Object.assign(form, {
    familyFeeRecordId: payment.family_fee_record?.id || '',
    amount: Number(payment.amount) || 0,
    date: payment.date?.split('T')[0] || '',
  })
  formError.value = ''
  showFormModal.value = true
}

function closeFormModal() {
  if (isSubmitting.value) return
  showFormModal.value = false
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
    if (isEdit.value) {
      // Note: using create with ID as update – replace with real update if available
      await create_family_payment(deleteTarget.value.id, payload) // adjust API
      payments.value = payments.value.map(p =>
        p.id === deleteTarget.value.id ? { ...p, ...payload } : p
      )
      toast.success('Payment updated')
    } else {
      const results = await create_family_payment(payload)

      payments.value.unshift(results.data)
      totalCount.value += 1
      toast.success('Payment recorded')
    }

    // Refresh current page
    await loadPayments()
    closeFormModal()
  } catch (err) {

    const data = err.response?.data || {}
    formError.value = data.amount?.[0] || data.non_field_errors?.[0] || data.message || 'Failed to save payment'
    toast.error(formError.value)
  } finally {
    isSubmitting.value = false
    closeFormModal()
  }
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

async function deleteSingle() {
  if (!deleteTarget.value?.id) return
  isDeleting.value = true

  try {
    await delete_family_payment(deleteTarget.value.id)
    payments.value = payments.value.filter(p => p.id !== deleteTarget.value.id)
    selectedIds.value = selectedIds.value.filter(id => id !== deleteTarget.value.id)
    totalCount.value = Math.max(0, totalCount.value - 1)
    toast.success('Payment deleted')
    closeDeleteSingleModal()
  } catch (err) {
    const msg = err.response?.data?.detail || 'Delete failed'
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
    payments.value = payments.value.filter(p => !ids.includes(p.id))
    selectedIds.value = []
    totalCount.value = Math.max(0, totalCount.value - ids.length)
    toast.success(`Deleted ${ids.length} payments`)
  } catch {
    toast.error('Some deletions failed')
  } finally {
    isDeleting.value = false
    showBulkDeleteModal.value = false
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = payments.value.map(p => p.id)
  }
}

// ── Init ─────────────────────────────────────────
onMounted(async () => {
  await loadFamilyFeeRecords()
  await loadPayments()
})
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
