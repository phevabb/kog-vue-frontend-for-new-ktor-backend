<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Family Fee Records</strong>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by family name..."
                size="sm"
                style="min-width: 260px;"
              />
              <CButton
                color="danger"
                size="sm"
                :disabled="!selectedIds.length"
                @click="showDeleteBulkModal = true"
              >
                Delete Selected ({{ selectedIds.length }})
              </CButton>
              <CButton color="primary" size="sm" @click="openAddModal">
                Add Family Fee Record
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <p class="text-body-secondary small mb-3">
            Manage family-level fee obligations and payments by term and academic year.
          </p>



          <div v-if="isLoading" class="d-flex align-items-center gap-2 mb-3">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading family fee records…</span>
          </div>


<div v-if="isLoading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading family fee records...</span>
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
                <CTableHeaderCell style="width:60px">#</CTableHeaderCell>
                <CTableHeaderCell>Family</CTableHeaderCell>
                <CTableHeaderCell>Term</CTableHeaderCell>
                <CTableHeaderCell>Academic Year</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Amount To Pay (GHS)</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Amount Paid (GHS)</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Balance (GHS)</CTableHeaderCell>
                <CTableHeaderCell>Fully Paid</CTableHeaderCell>
                <CTableHeaderCell>Created</CTableHeaderCell>
                <CTableHeaderCell class="text-end" style="width:140px">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(record, idx) in records" :key="record.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="record.id" />
                </CTableDataCell>
                <CTableHeaderCell scope="row">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableHeaderCell>
                <CTableDataCell>{{ record.family?.name || '—' }}</CTableDataCell>
                <CTableDataCell>{{ record.term?.name || '—' }}</CTableDataCell>
                <CTableDataCell>{{ record.academic_year?.name || '—' }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatCurrency(record.amount_to_pay) }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatCurrency(record.amount_paid) }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatCurrency(record.balance) }}</CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="record.is_fully_paid ? 'success' : 'warning'">
                    {{ record.is_fully_paid ? 'Yes' : 'No' }}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>{{ formatDate(record.date_created) }}</CTableDataCell>
                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="danger" variant="outline" @click="openDeleteConfirm(record)">
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && !records.length">
                <CTableDataCell colspan="11" class="text-center text-body-secondary py-4">
                  No family fee records found<span v-if="searchTerm"> for “{{ searchTerm }}”</span>.
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
      <CModalTitle>{{ isEdit ? 'Edit Family Fee Record' : 'Add Family Fee Record' }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CFormLabel for="family">Family</CFormLabel>
<CFormSelect id="family" v-model="form.familyId" :disabled="isSubmitting">
  <option value="" disabled selected>Select Family</option>
  <option v-for="f in familyOptions" :key="f.id" :value="f.id">
    {{ f.name }}
  </option>
</CFormSelect>

<CFormLabel for="term">Term</CFormLabel>
<CFormSelect id="term" v-model="form.termId" :disabled="isSubmitting" class="mt-3">
  <option value="" disabled selected>Select Term</option>
  <option v-for="t in termOptions" :key="t.id" :value="t.id">
    {{ t.name }}
  </option>
</CFormSelect>

<CFormLabel for="academic_year">Academic Year</CFormLabel>
<CFormSelect id="academic_year" v-model="form.academicYearId" :disabled="isSubmitting" class="mt-3">
  <option value="" disabled selected>Select Academic Year</option>
  <option v-for="ay in academicYearOptions" :key="ay.id" :value="ay.id">
    {{ ay.name }}
  </option>
</CFormSelect>



      <CFormInput
        v-model.number="form.amountToPay"
        label="Amount To Pay (GHS)"
        type="number"
        step="0.01"
        min="0"
        :disabled="isSubmitting"
        class="mt-3"
      />

      <div v-if="isEdit && form.createdAt" class="mt-3 text-body-secondary small">
        Created: {{ formatDate(form.createdAt) }}
      </div>

      <CAlert color="danger" v-if="formValidationMessage" class="mt-3">
  {{ formValidationMessage }}
</CAlert>


    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">
        Cancel
      </CButton>
      <CButton color="primary" @click="saveRecord" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-1" />
        {{ isEdit ? 'Update' : 'Create' }}
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Delete Confirm (Single) -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader>
      <CModalTitle>Confirm Delete</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Delete fee record for <strong>{{ deleteTarget?.family?.name || '—' }}</strong>
      ({{ deleteTarget?.term?.name || '—' }} / {{ deleteTarget?.academic_year?.name || '—' }})?
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

  <!-- Delete Confirm (Bulk) -->
  <CModal :visible="showDeleteBulkModal" @close="showDeleteBulkModal = false">
    <CModalHeader>
      <CModalTitle>Delete {{ selectedIds.length }} Records?</CModalTitle>
    </CModalHeader>
    <CModalBody>
      This action cannot be undone.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="showDeleteBulkModal = false" :disabled="isDeleting">
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
  get_family_fee_rec,
  create_family_fee_rec,
  delete_family_fee_rec,
  get_raw_families,
  get_terms,
  get_academic_years
} from '@/services/api'   // adjust path if needed

const toast = useToast()
const pageSize = 10

// ── State ────────────────────────────────────────
const isLoading       = ref(false)
const isSubmitting    = ref(false)
const isDeleting      = ref(false)
const errorMessage    = ref('')

const records         = ref([])
const families        = ref([])
const terms           = ref([])
const academicYears   = ref([])

const searchTerm      = ref('')
const currentPage     = ref(1)
const totalPages      = ref(1)
const totalCount      = ref(0)

const selectedIds     = ref([])

const showFormModal         = ref(false)
const isEdit                = ref(false)
const editingId             = ref(null)

const form = reactive({
  familyId: '',
  termId: '',
  academicYearId: '',
  amountToPay: 0,
  createdAt: null,
})

const formValidationMessage = ref('')

const showDeleteSingleModal = ref(false)
const deleteTarget          = ref(null)
const showDeleteBulkModal   = ref(false)

// ── Cache ────────────────────────────────────────
const pageCache = ref(new Map()) // "page|search" → { results, count }

// ── Computed ─────────────────────────────────────
const showingRange = computed(() => {
  if (!records.value.length) return 'Showing 0 records'
  const start = (currentPage.value - 1) * pageSize + 1
  const end   = start + records.value.length - 1
  return `Showing ${start}–${end} of ${totalCount.value}`
})

const familyOptions = computed(() =>
  families.value.map(f => ({ id: f.id, name: f.name }))
)

const termOptions = computed(() =>
  terms.value.map(t => ({ id: t.id, name: t.name }))
)

const academicYearOptions = computed(() =>
  academicYears.value.map(ay => ({ id: ay.id, name: ay.name }))
)


const allSelected = computed(() =>
  records.value.length > 0 && records.value.every(r => selectedIds.value.includes(r.id))
)

const someSelected = computed(() =>
  !allSelected.value && records.value.some(r => selectedIds.value.includes(r.id))
)

// ── Helpers ──────────────────────────────────────
const formatCurrency = (val) => {
  const num = Number(val)
  return Number.isNaN(num) ? '—' : num.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ── Watchers ─────────────────────────────────────
watch(searchTerm, () => {
  currentPage.value = 1
  loadRecords()
})

// ── Methods ──────────────────────────────────────
function changePage(page) {
  currentPage.value = page
  loadRecords()
}

async function loadRecords() {
  const page = currentPage.value
  const search = searchTerm.value.trim() || undefined
  const cacheKey = `${page}|${search || ''}`

  if (pageCache.value.has(cacheKey)) {
    const cached = pageCache.value.get(cacheKey)
    records.value = cached.results
    totalCount.value = cached.count
    totalPages.value = Math.ceil(cached.count / pageSize)
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const params = { page, page_size: pageSize }
    if (search) params.search = search

    const res = await get_family_fee_rec(params)
    const data = res.data || {}

    const results = data.results || []
    const count  = Number(data.count) || 0

    pageCache.value.set(cacheKey, { results, count })

    records.value = results
    totalCount.value = count
    totalPages.value = Math.ceil(count / pageSize)
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to load records'
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

async function loadLookups() {
  try {
    const [famRes, termRes, ayRes] = await Promise.all([
      get_raw_families(),
      get_terms(),
      get_academic_years()
    ])


    families.value      = famRes.data  || []
    terms.value         = termRes.data || []
    academicYears.value = ayRes.data   || []


  } catch (err) {
    toast.error('Failed to load dropdown data')
  }
}

function openAddModal() {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, {
    familyId: '',
    termId: '',
    academicYearId: '',
    amountToPay: 0,
    createdAt: null
  })
  formValidationMessage.value = ''
  showFormModal.value = true
}

function openDeleteConfirm(record) {
  deleteTarget.value = record
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
    await delete_family_fee_rec(deleteTarget.value.id)
    records.value = records.value.filter(r => r.id !== deleteTarget.value.id)
    selectedIds.value = selectedIds.value.filter(id => id !== deleteTarget.value.id)
    totalCount.value = Math.max(0, totalCount.value - 1)
    toast.success('Record deleted')
    closeDeleteSingleModal()
  } catch (err) {
    const msg = err.response?.data?.detail || 'Delete failed'
    if (msg.toLowerCase().includes('constraint') || msg.toLowerCase().includes('foreign')) {
      toast.error('Cannot delete – record is linked to other data')
    } else {
      toast.error(msg)
    }
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
    await Promise.allSettled(ids.map(id => delete_family_fee_rec(id)))
    records.value = records.value.filter(r => !ids.includes(r.id))
    selectedIds.value = []
    totalCount.value = Math.max(0, totalCount.value - ids.length)
    toast.success(`Deleted ${ids.length} records`)
  } catch {
    toast.error('Some deletions failed')
  } finally {
    isDeleting.value = false
    showDeleteBulkModal.value = false
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(id =>
      !records.value.some(r => r.id === id)
    )
  } else {
    const set = new Set(selectedIds.value)
    records.value.forEach(r => set.add(r.id))
    selectedIds.value = [...set]
  }
}

async function saveRecord() {
  if (!form.familyId) {
    formValidationMessage.value = 'Family is required'
    return
  }
  if (!form.termId) {
    formValidationMessage.value = 'Term is required'
    return
  }
  if (!form.academicYearId) {
    formValidationMessage.value = 'Academic Year is required'
    return
  }
  if (!form.amountToPay || form.amountToPay <= 0) {
    formValidationMessage.value = 'Amount must be more than 0.00'
    return
  }

  isSubmitting.value = true
  formValidationMessage.value = ''

  const payload = {
    family_id: Number(form.familyId),
    term_id: Number(form.termId),
    academic_year_id: Number(form.academicYearId),
    amount_to_pay: Number(form.amountToPay),
  }

  try {
    let result
    if (isEdit.value && editingId.value) {
      // Note: your backend has no separate update endpoint → using create with ID?
      // If backend supports PUT/PATCH, change to proper update call
      result = await create_family_fee_rec(editingId.value, payload) // adjust if needed
      records.value = records.value.map(r =>
        r.id === result.id ? { ...r, ...result } : r
      )
      toast.success('Record updated')
    } else {
      result = await create_family_fee_rec(payload)
      records.value.unshift(result.data)
      totalCount.value += 1
      toast.success('Record created')
    }
    showFormModal.value = false
  } catch (err) {
    formValidationMessage.value = err.response?.data?.detail || 'Save failed'
    toast.error(formValidationMessage.value)
  } finally {
    isSubmitting.value = false
  }
}

// ── Init ─────────────────────────────────────────
onMounted(async () => {
  await loadLookups()
  await loadRecords()
})
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
