<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Payments</strong>

            <!-- Actions: Search (field + input) + Delete Selected + Add -->
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <!-- Search field dropdown -->


              <!-- Search input -->
              <CFormInput
                v-model="searchTerm"
                :placeholder="searchPlaceholder"
                :aria-label="searchPlaceholder"
                size="sm"
                style="min-width: 220px;"
              />

              <CFormSelect
                v-model="dateFilter"
                size="sm"
                style="min-width: 160px;"
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Past 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </CFormSelect>

              <!-- Bulk delete -->
              <CButton
                color="danger"
                size="sm"
                :disabled="selectedIds.length === 0"
                @click="openBulkDeleteConfirm"
              >
                Delete Selected ({{ selectedIds.length }})
              </CButton>

              <!-- Add Payment -->
              <CButton color="primary" size="sm" @click="openAddModal">
                Add Payment
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <p class="text-body-secondary small">Record and manage payments.</p>



          <!-- Loading -->
          <div class="d-flex align-items-center gap-2 mb-2" v-if="isLoading">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading payments…</span>
          </div>

          <!-- TABLE -->
          <!-- Remove <DocsExample> if you don't have this wrapper -->
          <DocsExample>
            <CTable hover responsive>
              <CTableHead>
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

                  <CTableHeaderCell scope="col" style="width: 60px;">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Student</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Class</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Term</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Academic Year</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Date</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end">Amount (GHS)</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end">NET BALANCE (GHS)</CTableHeaderCell>

                  <CTableHeaderCell scope="col" class="text-end" style="width: 160px;">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow v-for="(row, idx) in filteredPayments" :key="`${row.id}-${currentPage}`">


                  <CTableDataCell class="text-center">
                    <CFormCheck v-model="selectedIds" :value="row.id" aria-label="Select row" />
                  </CTableDataCell>

                  <CTableHeaderCell scope="row">{{ (currentPage - 1) * pageSize + idx + 1 }}</CTableHeaderCell>
                  <CTableDataCell>{{ row.student_fee_record?.student?.user?.full_name }}</CTableDataCell>
                  <CTableDataCell>{{ row.student_fee_record?.fee_structure?.grade_class?.name }}</CTableDataCell>
                  <CTableDataCell>{{ row.student_fee_record?.fee_structure?.term?.name }}</CTableDataCell>
                  <CTableDataCell>{{ row.student_fee_record?.fee_structure?.academic_year?.name }}</CTableDataCell>
                  <CTableDataCell>{{ row.date }}</CTableDataCell>





                  <CTableDataCell class="text-end">
                    {{ formatAmount( row.amount) }}
                  </CTableDataCell>

                  <CTableDataCell class="text-end">{{ formatAmount(row.student_fee_record?.balance) }}</CTableDataCell>



                  <CTableDataCell class="text-end">
                    <CButtonGroup size="sm">

                      <CButton color="danger" variant="outline" @click="openSingleDeleteConfirm(row)">
                        Delete
                      </CButton>
                    </CButtonGroup>
                  </CTableDataCell>
                </CTableRow>

                <!-- Empty -->
                <CTableRow v-if="!isLoading && filteredPayments.length === 0">
                  <CTableDataCell colspan="8" class="text-center text-body-secondary">
                    No payments found
                    <span v-if="searchTerm">
                      for “{{ searchTerm }}” in
                      {{
                        searchField === 'academic_year'
                          ? 'Academic Year'
                          : (searchField === 'term' ? 'Term' : (searchField === 'grade_class' ? 'Class' : 'Student'))
                      }}.
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

  <!-- Add/Edit Payment Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Payment' : 'Add Payment' }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-3">


        <CFormLabel for="sfr">Student / Class / Term / AY</CFormLabel>

        <CFormInput
        id ="sfr"
        v-model="recordSearch"
        placeholder="Search fee record ..."
        @input="filterRecords"
        autocomplete="off"
        />
           <!-- Dropdown for filtered students -->
      <div
        v-if="filteredStudentFeeRecords && filteredStudentFeeRecords.length > 0 && recordSearch"
        class="dropdown-menu show w-100"
        style="max-height: 200px; overflow-y: auto;"
      >
        <button
          class="dropdown-item"
          v-for="s in filteredStudentFeeRecords"
          :key="s.id"
          @click="selectRecord(s)"
        >
          {{ s.student.user.full_name }} /
          {{ s.fee_structure?.grade_class.name }} /
          {{ s.fee_structure?.term.name }} /
          {{ s.fee_structure?.academic_year.name }}
        </button>
      </div>
    </div>




      <div class="mb-3">
        <CFormLabel for="date">Date</CFormLabel>
        <CFormInput id="date" v-model="formPayment.date" type="date" />
        <div class="text-body-secondary small mt-1" v-if="!formPayment.date">Defaults to today if left blank.</div>
      </div>

      <div class="mb-0">
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
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">Cancel</CButton>
      <CButton color="primary" @click="submitForm" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
        {{ isEdit ? 'Update' : 'Save' }}
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Confirm Delete (Single) -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader><CModalTitle>Delete Payment</CModalTitle></CModalHeader>
    <CModalBody>
      Are you sure you want to delete the payment of
      <strong>GHS {{ formatAmount(deleteTarget?.amount) }}</strong>
      for
      <strong>{{ deleteTarget?.studentFeeRecord?.student?.full_name }}</strong>
      on {{ deleteTarget?.date }}? This action cannot be reversed.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeDeleteSingleModal" :disabled="isDeleting">
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDeleteSingle" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Confirm Delete (Bulk) -->
  <CModal :visible="showDeleteBulkModal" @close="closeBulkDeleteConfirm">
    <CModalHeader><CModalTitle>Delete Selected</CModalTitle></CModalHeader>
    <CModalBody>
      You are about to delete <strong>{{ selectedIds.length }}</strong> payment(s).
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
import { ref, computed, reactive, onMounted, watch } from 'vue'
const dateFilter = ref('')
import { get_payments, get_student_fee_record, create_payment, delete_payment } from '../../../services/api'
import { useToast } from 'vue-toastification'
import { CFormInput } from '@coreui/vue'
const toast = useToast()
import Pagination from '@/Pagination.vue'
const filteredStudentFeeRecords = ref([])

const pageSize = 10
const currentPage = ref(1)
const totalPages = ref(1)


function selectRecord(record){
  formPayment.studentFeeRecordId = record.id
  recordSearch.value = `${record.student.user.full_name} / ${record.fee_structure.grade_class.name} / ${record.fee_structure.term.name} / ${record.fee_structure.academic_year.name}`
  filteredStudentFeeRecords.value = []
}

const recordSearch = ref('')
/**
 * Simulated API aligned with Payment:
 * Payment { id, studentFeeRecord, date: 'YYYY-MM-DD', amount }
 * StudentFeeRecord contains: { id, student: { id, fullName }, feeStructure: { academicYear, gradeClass, term } }
 */
const paymentApi = (() => {
  // Utility
  const today = () => new Date().toISOString().slice(0, 10)

  return {
async listPayments(params = {}) {
  try {
    const response = await get_payments(params)



    // MUST return the paginated object
    return response.data
  } catch (error) {
    throw error
  }
}
,

    async listStudentFeeRecords() {



      try {
        const response = await get_student_fee_record()

        return response.data || []
      } catch (error) {

        throw error
      }
    },


async createPayment(payload) {
  try {
    // payload: { studentFeeRecordId, date?, amount, payment_method? }
    const response = await create_payment(payload)




    // Axios response: receipt_url is in response.data
    const data = response?.data ?? response

    if (data?.receipt_url) {
      // ✅ Auto-download via an anchor click; server sets the filename
      const link = document.createElement('a')
      link.href = data.receipt_url
      link.download = '' // optional: leave blank to use server filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    // Return the data for any further UI updates
    return data
  } catch (error) {

    toast.error(error.response?.data?.amount[0] || 'Failed to create payment.')

    // Bubble up for global handler/toast
    throw error
  }
}
,


    async deletePayment(id) {
      try {
        const response = await delete_payment(id)

        toast.success('Payment deleted successfully.')
        return response.data || response
      } catch (error) {

        throw error
      }
    },

    async deletePayments(ids) {
      try {
        const results = await Promise.all(ids.map(id => delete_payment(id)))
        return { success: true, deleted: results.length }
      } catch (error) {

        throw error
      }
    },
  }
})()


function filterRecords() {
  const query = recordSearch.value.toLowerCase();


  filteredStudentFeeRecords.value = studentFeeRecords.value.filter(record => {
    const studentName = record.student?.user.full_name?.toLowerCase() || '';
    const className = record.fee_structure?.grade_class?.name?.toLowerCase() || '';
    const termName = record.fee_structure?.term?.name?.toLowerCase() || '';
    const academicYearName = record.fee_structure?.academic_year?.name?.toLowerCase() || '';

    return (
      studentName.includes(query) ||
      className.includes(query) ||
      termName.includes(query) ||
      academicYearName.includes(query)
    );
  });

}



/* ---------- State ---------- */
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')

const payments = ref([])
const studentFeeRecords = ref([])

/* Search controls */
const searchField = ref('student') // 'student' | 'class' | 'term' | 'academicYear'
const searchTerm = ref('')

/* Selection */
const selectedIds = ref([])

/* Form (Add/Edit) */
const showFormModal = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const formPayment = reactive({
  studentFeeRecordId: '',
  date: '',
  amount: '',
})
const formValidationMessage = ref('')

/* Delete confirmations */
const showDeleteSingleModal = ref(false)
const deleteTarget = ref(null)
const showDeleteBulkModal = ref(false)


/* ---------- Computed ---------- */
const searchPlaceholder = computed(() => {
  switch (searchField.value) {


    default: return 'Search Payment...'
  }
})

const filteredPayments = computed(() => payments.value || [])

const filteredIds = computed(() => filteredPayments.value.map(r => r.id))
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


function resetForm() {
  formPayment.studentFeeRecordId = ''
  formPayment.date = ''
  formPayment.amount = ''
  recordSearch.value = ''
  filteredStudentFeeRecords.value = []
  formValidationMessage.value = ''
  editingId.value = null
}

function validateForm() {
  if (!formPayment.studentFeeRecordId) {
    formValidationMessage.value = 'Student Fee Record is required.'
    return false
  }
  if (formPayment.amount === '' || Number(formPayment.amount) < 0) {
    formValidationMessage.value = 'Amount must be a non-negative number.'
    return false
  }
  formValidationMessage.value = ''
  return true
}

/* ---------- Select All (current filtered view) ---------- */
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
async function loadStudentFeeRecords() {
  const x = await paymentApi.listStudentFeeRecords()

  return (studentFeeRecords.value = x)
}


async function loadPayments(page = 1) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const params = {
      page,
      search: searchTerm.value?.trim() || undefined,
    }



    const rows = await paymentApi.listPayments(params)



    payments.value = rows.results
    totalPages.value = Math.ceil(rows.count / pageSize)
    currentPage.value = page



  } catch (err) {
    console.error(err)
    errorMessage.value = 'Failed to load payments.'
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
  formPayment.studentFeeRecordId = row?.studentFeeRecord?.id ?? ''
  formPayment.date = row?.date ?? ''
  formPayment.amount = row?.amount ?? ''
  formValidationMessage.value = ''
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

/* ---------- Submit (Create/Update) ---------- */
function submitForm() {
  if (!validateForm()) return
  isSubmitting.value = true

  const today = new Date().toISOString().split("T")[0];

const payload = {
  student_fee_record_id: formPayment.studentFeeRecordId,
  date: formPayment.date
    ? formPayment.date.split("T")[0]
    : today,       // use today's date if undefined
  amount: formPayment.amount,
};


  const done = () => (isSubmitting.value = false)

  if (isEdit.value && editingId.value != null) {
    paymentApi
      .updatePayment(editingId.value, payload)
      .then((updated) => {
        payments.value = payments.value.map(r => (r.id === updated.id ? updated : r))
        showFormModal.value = false
        resetForm()
        toast.success('Payment updated successfully.')

      })
      .catch((err) => (formValidationMessage.value = err?.message || 'Failed to update payment.'))
      .finally(done)
  } else {
    paymentApi
      .createPayment(payload)
      .then((created) => {
        payments.value = [...payments.value, created]
        showFormModal.value = false
        resetForm()
        toast.success('Payment added successfully.')

      })
      .catch((err) => (formValidationMessage.value = err?.response?.data?.amount[0] || 'Failed to add payment.'))
      .finally(done)
  }
}

/* ---------- Delete (Single/Bulk) ---------- */
function confirmDeleteSingle() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  paymentApi
    .deletePayment(deleteTarget.value.id)
    .then(() => {
      // update table
      payments.value = payments.value.filter(r => r.id !== deleteTarget.value.id)
      // remove from selection, if needed
      selectedIds.value = selectedIds.value.filter(id => id !== deleteTarget.value.id)

      // ✅ close modal immediately
      showDeleteSingleModal.value = false
      deleteTarget.value = null
      toasts.success('Payment deleted.  ')

    })
    .finally(() => (isDeleting.value = false))
}

function onPageChanged(page) {
  loadPayments(page)
}


watch(searchTerm, () => {
  currentPage.value = 1
  loadPayments(1)
})

function confirmDeleteBulk() {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return
  isDeleting.value = true
  paymentApi
    .deletePayments(ids)
    .then(() => {
      const toDelete = new Set(ids)
      payments.value = payments.value.filter(r => !toDelete.has(r.id))

      // clear selection
      selectedIds.value = []

      // ✅ close modal immediately
      showDeleteBulkModal.value = false
      toast.success('Payments deleted successfully.')


    })
    .finally(() => (isDeleting.value = false))
}

/* ---------- Init ---------- */
onMounted(async () => {
  try {
    isLoading.value = true
    const a = await get_student_fee_record()

    studentFeeRecords.value = a.data

    await loadPayments()
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 {
    row-gap: 0.5rem;
  }
}
</style>
