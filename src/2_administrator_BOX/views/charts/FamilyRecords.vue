<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Family Fee Records</strong>

            <!-- Actions: Search (Family) + Delete Selected + Add -->
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by family name..."
                aria-label="Search by family name"
                size="sm"
                style="min-width: 260px;"
              />



              <CButton
                color="danger"
                size="sm"
                :disabled="selectedIds.length === 0"
                @click="openBulkDeleteConfirm"
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
          <p class="text-body-secondary small">
            Manage family-level fee obligations and payments by term and academic year.
          </p>

          <CAlert color="danger" v-if="errorMessage" class="py-2">
            {{ errorMessage }}
          </CAlert>

          <div class="d-flex align-items-center gap-2 mb-2" v-if="isLoading">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading family fee records…</span>
          </div>

          <!-- Remove <DocsExample> if not used in your project -->
          <DocsExample>
            <CTable hover responsive>
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
                  <CTableHeaderCell scope="col">Family</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Term</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Academic Year</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end">Amount To Pay (GHS)</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end">Amount Paid (GHS)</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end">Balance (GHS)</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Fully Paid</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Created</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end" style="width: 170px;">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow v-for="(row, idx) in filteredRecords" :key="row.id">
                  <CTableDataCell class="text-center">
                    <CFormCheck v-model="selectedIds" :value="row.id" aria-label="Select row" />
                  </CTableDataCell>


                  <CTableHeaderCell scope="row">{{ (currentPage - 1) * pageSize + idx + 1 }}</CTableHeaderCell>
                  <CTableDataCell>{{ row.family?.name }}</CTableDataCell>
                  <CTableDataCell>{{ row.term?.name }}</CTableDataCell>
                  <CTableDataCell>{{ row.academic_year?.name}}</CTableDataCell>
                  <CTableDataCell class="text-end">{{ formatAmount(row.amount_to_pay) }}</CTableDataCell>
                  <CTableDataCell class="text-end">{{ formatAmount(row.amount_paid) }}</CTableDataCell>
                  <CTableDataCell class="text-end">{{ formatAmount(row.balance) }}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge :color="row.is_fully_paid? 'success' : 'warning'">
                      {{ row.is_fully_paid? 'Yes' : 'No' }}
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

                <CTableRow v-if="!isLoading && filteredRecords.length === 0">
                  <CTableDataCell colspan="10" class="text-center text-body-secondary">
                    No family fee records found
                    <span v-if="searchTerm"> for “{{ searchTerm }}”.</span>
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
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Family Fee Record' : 'Add Family Fee Record' }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-3">
        <CFormLabel for="family">Family</CFormLabel>
        <CFormSelect id="family" v-model="form.familyId">
          <option value="" disabled selected>Select Family</option>
          <option v-for="f in families" :key="f.id" :value="f.id">{{ f.name }}</option>
        </CFormSelect>
      </div>

      <div class="mb-3">
        <CFormLabel for="term">Term</CFormLabel>
        <CFormSelect id="term" v-model="form.termId">
          <option value="" disabled selected>Select Term</option>
          <option v-for="t in terms" :key="t.id" :value="t.id">{{ t.name }}</option>
        </CFormSelect>
      </div>

      <div class="mb-3">
        <CFormLabel for="ay">Academic Year</CFormLabel>
        <CFormSelect id="ay" v-model="form.academicYearId">
          <option value="" disabled selected>Select Academic Year</option>
          <option v-for="ay in academicYears" :key="ay.id" :value="ay.id">{{ ay.name }}</option>
        </CFormSelect>
      </div>

      <div class="mb-3">
        <CFormLabel for="amountToPay">Amount To Pay (GHS)</CFormLabel>
        <CFormInput
          id="amountToPay"
          v-model="form.amountToPay"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          @input="recalcDerived"
        />
      </div>






      <!-- created date (read-only on edit) -->
      <div class="mt-2 text-body-secondary small" v-if="isEdit && viewCreated">
        Created: {{ formatDateTime(viewCreated) }}
      </div>

      <div class="text-danger small mt-2" v-if="formValidationMessage">
        {{ formValidationMessage }}
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">Cancel</CButton>
      <CButton color="primary" @click="submitForm" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
        {{ isEdit ? 'Update' : 'Save' }}
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Confirm Delete (Single) -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader><CModalTitle>Delete Family Fee Record</CModalTitle></CModalHeader>
    <CModalBody>
      Delete the record for family
      <strong>{{ deleteTarget?.family?.name }}</strong>
      — {{ deleteTarget?.term?.name }} / {{ deleteTarget?.academicYear?.name }}?
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
      You are about to delete <strong>{{ selectedIds.length }}</strong> record(s).
      This action cannot be undone. Continue?
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeBulkDeleteConfirm" :disabled="isDeleting">Cancel</CButton>
      <CButton color="danger" @click="confirmDeleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Optional: Success toasts -->
  <CToaster placement="top-end">
    <CToast v-for="t in toasts" :key="t.id" :visible="t.visible" :color="t.color" class="text-white mb-2">
      <CToastBody>{{ t.message }}</CToastBody>
    </CToast>
  </CToaster>
</template>

<script setup>

import Pagination from '@/Pagination.vue'
import { ref, computed, reactive, onMounted } from 'vue'
import {useToast} from 'vue-toastification'
const toast = useToast()
import {
  get_family_fee_rec,
  create_family_fee_rec,
  delete_family_fee_rec,
  get_raw_families,
  get_terms,
  get_academic_years
} from '../../../services/api'


import {  watch } from 'vue'

const pageSize = 10
const currentPage = ref(1)
const totalPages = ref(1)


const ffrApi = (() => {
  let AY = []
  let TM = []
  let FAMILIES = []
  let _data = []

  const clone = (x) => JSON.parse(JSON.stringify(x))



  // LOAD INITIAL DATA
  const loadStaticData = async () => {
    try {
      const [years, terms, families, records] = await Promise.all([
        get_academic_years(),
        get_terms(),
        get_raw_families (),
        get_family_fee_rec()
      ])



      AY = years.data || []
      TM = terms.data || []
      FAMILIES = families.data || []
      _data = records.data || []

    } catch (err) {
      toast.error('Failed to load initial fee records data.', { position: 'top-right' })
    }
  }

  loadStaticData()



  return {

    async listRecords(params= {}) {
      try {
        const res = await get_family_fee_rec(params)
        _data = res.data || []
        return clone(_data)
      } catch (err) {
        toast.error('Failed to fetch family fee records.', { position: 'top-right' })
        return clone(_data)
      }
    },

    async listFamilies() {
      try {
        const res = await get_raw_families()
        FAMILIES = res.data || []
        return clone(FAMILIES)
      } catch (err) {
        toast.error('Failed to fetch families.', { position: 'top-right' })
        return clone(FAMILIES)
      }
    },

    async listTerms() {
      try {
        const res = await get_terms()
        TM = res.data || []
        return clone(TM)
      } catch (err) {
        toast.error('Failed to fetch terms.', { position: 'top-right' })
        return clone(TM)
      }
    },

    async listAcademicYears() {
      try {
        const res = await get_academic_years()
        AY = res.data || []
        return clone(AY)
      } catch (err) {
        toast.error('Failed to fetch academic years.', { position: 'top-right' })
        return clone(AY)
      }
    },



    // CREATE
    async createRecord(payload) {
      try {

        const res = await create_family_fee_rec(payload)
        return clone(res.data)
      } catch (err) {

        const msg = err.response?.data?.message || 'Failed to create record.'
        toast.error(msg, { position: 'top-right' })
        throw err
      }
    },



    // UPDATE (TEMPORARY – uses create API because no update API imported)
    async updateRecord(id, payload) {
      try {
        // If backend expects create_family_fee_rec(payload) only,
        // OR create_family_fee_rec(id, payload)
        const res = await create_family_fee_rec(id, payload)
        return clone(res.data)
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to update record.'
        toast.error(msg, { position: 'top-right' })
        throw err
      }
    },



    // DELETE one
    async deleteRecord(id) {
  try {
    await delete_family_fee_rec(id)
    return { success: true }
  } catch (err) {
    const backendMsg = err.response?.data?.message?.toLowerCase() || ''

    let msg = 'Failed to delete record.'

    if (backendMsg.includes('constraint') || backendMsg.includes('foreign')) {
      msg = 'This record is linked to other data and cannot be deleted.'
    }

    toast.error(msg, { position: 'top-right' })
    throw err
  }
},




    // DELETE multiple
    async deleteRecords(ids) {
      try {
        for (const id of ids) await delete_family_fee_rec(id)
        return { success: true, deleted: ids.length }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to delete selected records.'
        toast.error(msg, { position: 'top-right' })
        throw err
      }
    }

  }
})()




/* ---------- State ---------- */
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')

const records = ref([])
const families = ref([])
const terms = ref([])
const academicYears = ref([])

/* Search */
const searchTerm = ref('')
const dateFilter = ref('')


/* Selection */
const selectedIds = ref([])

/* Form (Add/Edit) */
const showFormModal = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const viewCreated = ref('')
const form = reactive({
  familyId: '',
  termId: '',
  academicYearId: '',
  amountToPay: '',
  amountPaid: '',
})
const formDerived = reactive({
  balance: '0.00',
  isFullyPaid: false,
})
const formValidationMessage = ref('')

/* Delete confirmations */
const showDeleteSingleModal = ref(false)
const deleteTarget = ref(null)
const showDeleteBulkModal = ref(false)

/* Toasts (optional) */
const toasts = ref([])
function addToast({ message, color = 'success', delay = 2200 }) {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, color, visible: true })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, delay)
}

/* ---------- Computed ---------- */
const filteredRecords = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  const now = new Date()

  return records.value.filter(row => {
    // FAMILY NAME SEARCH
    const familyName = String(row?.family?.name || '').toLowerCase()
    const matchesSearch = !q || familyName.includes(q)

    // DATE FILTER
    if (!dateFilter.value) return matchesSearch

    const recordDate = new Date(row.created_at)
    let matchesDate = true

    if (dateFilter.value === 'today') {
      matchesDate =
        recordDate.toDateString() === now.toDateString()
    }

    if (dateFilter.value === '7days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 7)
      matchesDate = recordDate >= sevenDaysAgo
    }

    if (dateFilter.value === 'month') {
      matchesDate =
        recordDate.getMonth() === now.getMonth() &&
        recordDate.getFullYear() === now.getFullYear()
    }

    if (dateFilter.value === 'year') {
      matchesDate =
        recordDate.getFullYear() === now.getFullYear()
    }

    return matchesSearch && matchesDate
  })
})







const filteredIds = computed(() => filteredRecords.value.map(r => r.id))
const allSelected = computed(() =>
  filteredIds.value.length > 0 && filteredIds.value.every(id => selectedIds.value.includes(id)),
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
function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}
function resetForm() {
  form.familyId = ''
  form.termId = ''
  form.academicYearId = ''
  form.amountToPay = ''
  form.amountPaid = ''
  formDerived.balance = '0.00'
  formDerived.isFullyPaid = false
  viewCreated.value = ''
  formValidationMessage.value = ''
  editingId.value = null
}
function recalcDerived() {
  const toPay = Math.max(0, Number(form.amountToPay) || 0)
  const paid = Math.max(0, Number(form.amountPaid) || 0)
  const bal = Math.max(0, toPay - paid)
  formDerived.balance = bal.toFixed(2)
  formDerived.isFullyPaid = bal === 0
}
function validateForm() {
  if (!form.familyId) {
    formValidationMessage.value = 'Family is required.'
    return false
  }
  if (!form.termId) {
    formValidationMessage.value = 'Term is required.'
    return false
  }
  if (!form.academicYearId) {
    formValidationMessage.value = 'Academic Year is required.'
    return false
  }
  if (form.amountToPay === '' || Number(form.amountToPay) < 0) {
    formValidationMessage.value = 'Amount To Pay must be a non-negative number.'
    return false
  }

  formValidationMessage.value = ''
  return true
}

/* ---------- Select All ---------- */
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
function loadLookups() {
  return Promise.all([
    ffrApi.listFamilies().then(x => (families.value = x)),
    ffrApi.listTerms().then(x => (terms.value = x)),
    ffrApi.listAcademicYears().then(x => (academicYears.value = x)),
  ])
}
async function loadRecords(page = 1) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    try {
      const rows = await ffrApi.listRecords({
      page,
      search: searchTerm.value?.trim() || undefined,
    })


      records.value = Array.isArray(rows?.results) ? rows.results : []
    currentPage.value = page
    totalPages.value = Math.ceil((rows?.count ?? 0) / pageSize)

    } catch (err) {
      errorMessage.value = err?.message || 'Failed to load family fee records.'

    }
  } finally {
    isLoading.value = false
  }
}



/* ---------- Modal handlers ---------- */
function openAddModal() {
  isEdit.value = false
  resetForm()
  showFormModal.value = true
}
function openEditModal(row) {
  isEdit.value = true
  editingId.value = row.id
  form.familyId = row?.family?.id ?? ''
  form.termId = row?.term?.id ?? ''
  form.academicYearId = row?.academicYear?.id ?? ''
  form.amountToPay = row?.amountToPay ?? ''
  form.amountPaid = row?.amountPaid ?? ''
  recalcDerived()
  viewCreated.value = row?.dateCreated || ''
  showFormModal.value = true
}
function closeFormModal() {
  if (!isSubmitting.value) {
    showFormModal.value = false
    resetForm()
  }
}

/* ---------- Delete modals ---------- */
function openSingleDeleteConfirm(row) {
  deleteTarget.value = row
  showDeleteSingleModal.value = true
}
function closeDeleteSingleModal() {
  if (!isDeleting.value) {
    showDeleteSingleModal.value = false
    deleteTarget.value = null
  }
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
    family_id: form.familyId,
    term_id: form.termId,
    academic_year_id: form.academicYearId,
    amount_to_pay: form.amountToPay

  }

  const done = () => (isSubmitting.value = false)

  if (isEdit.value && editingId.value != null) {
    ffrApi
      .updateRecord(editingId.value, payload)
      .then((updated) => {
        records.value = records.value.map(r => (r.id === updated.id ? updated : r))
        showFormModal.value = false
        resetForm()
        toast.success('Family fee record updated successfully.', { position: 'top-right' })

      })
      .catch((err) => (formValidationMessage.value = err?.message || 'Failed to update record.'))
      .finally(done)
  } else {
    ffrApi
      .createRecord(payload)
      .then((created) => {
        records.value = [...records.value, created]
        showFormModal.value = false
        resetForm()
        toast.success('Family fee record created successfully.', { position: 'top-right' })

      })
      .catch((err) => (formValidationMessage.value = err?.message || 'Failed to add record.'))
      .finally(done)
  }
}

/* ---------- Delete ---------- */
function confirmDeleteSingle() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  ffrApi
    .deleteRecord(deleteTarget.value.id)
    .then(() => {
      records.value = records.value.filter(r => r.id !== deleteTarget.value.id)
      selectedIds.value = selectedIds.value.filter(id => id !== deleteTarget.value.id)

      // close immediately
      showDeleteSingleModal.value = false
      deleteTarget.value = null
      toast.success('Family fee record deleted successfully.', { position: 'top-right' })


    })
    .finally(() => (isDeleting.value = false))
}

function confirmDeleteBulk() {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return
  isDeleting.value = true
  ffrApi
    .deleteRecords(ids)
    .then(() => {
      const set = new Set(ids)
      records.value = records.value.filter(r => !set.has(r.id))
      selectedIds.value = []

      // close immediately
      showDeleteBulkModal.value = false
      toast.success('Selected family fee records deleted successfully.', { position: 'top-right' })


    })
    .finally(() => (isDeleting.value = false))
}

function onPageChanged(page) {
  loadRecords(page)
}

watch(searchTerm, () => {
  currentPage.value = 1
  loadRecords(1)
})
/* ---------- Init ---------- */
onMounted(async () => {
  try {
    isLoading.value = true
    await loadLookups()
    await loadRecords()

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
