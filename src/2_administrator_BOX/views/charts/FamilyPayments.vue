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
                placeholder="Search Family Fee Record..."
                aria-label="Search Family Fee Record"
                size="sm"
                style="min-width: 260px;"
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

              <CButton
                color="danger"
                size="sm"
                :disabled="selectedIds.length === 0"
                @click="openBulkDeleteConfirm"
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
          <CAlert color="danger" v-if="errorMessage" class="py-2">
            {{ errorMessage }}
          </CAlert>

          <div class="d-flex align-items-center gap-2 mb-2" v-if="isLoading">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading payments…</span>
          </div>

          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell class="text-center" style="width: 48px;">
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
                <CTableHeaderCell class="text-end">NET BALANCE (GHS)</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(row, idx) in filteredPayments" :key="row.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="row.id" />
                </CTableDataCell>
                <CTableHeaderCell>{{ (currentPage - 1) * pageSize + idx + 1 }}</CTableHeaderCell>
                <CTableDataCell>
                  {{ row.family_fee_record?.family?.name }} - {{ row.family_fee_record?.term?.name }} - {{ row.family_fee_record?.academic_year?.name }}
                </CTableDataCell>
                <CTableDataCell>{{ row.date }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatAmount(row.amount) }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatAmount(row.family_fee_record?.balance) }}</CTableDataCell>

                <CTableDataCell class="text-end">


                  <CButtonGroup size="sm">
                    <CButton color="secondary" variant="outline" @click="openEditModal(row)">Edit</CButton>
                    <CButton color="danger" variant="outline" @click="openSingleDeleteConfirm(row)">Delete</CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && filteredPayments.length === 0">
                <CTableDataCell colspan="6" class="text-center text-body-secondary">
                  No payments found<span v-if="searchTerm"> for “{{ searchTerm }}”.</span>
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





  <!-- Modal -->

<CModal :visible="showFormModal" @close="closeFormModal">
  <CModalHeader>
    <CModalTitle>{{ isEdit ? 'Edit Payment' : 'Add Payment' }}</CModalTitle>
  </CModalHeader>


  <CModalBody>
    <!-- Family Fee Record -->
    <div class="mb-3">
      <CFormLabel for="familyFeeRecord">Family Fee Record</CFormLabel>
      <CFormSelect v-model="form.familyFeeRecordId">
        <option disabled value="" selected>Select Family</option>
        <option
          v-for="record in familyFeeRecords"
          :key="record.id"
          :value="record.id"
        >
          {{ record.family.name }} - {{ record.term.name }} - {{ record.academic_year.name }}
        </option>
      </CFormSelect>
    </div>

    <!-- Amount -->
    <div class="mb-3">
      <CFormLabel for="amount">Amount</CFormLabel>
      <CFormInput v-model="form.amount" type="number" step="0.01" />
    </div>

    <!-- Date -->
    <div class="mb-3">
      <CFormLabel for="date">Date</CFormLabel>
      <CFormInput v-model="form.date" type="date" />
    </div>

    <!-- Submit -->
    <CButton color="primary" @click="submitForm">
      {{ isEdit ? 'Update' : 'Create' }}
    </CButton>
  </CModalBody>
</CModal>



<CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
  <CModalHeader>
    <CModalTitle>Confirm Delete</CModalTitle>
  </CModalHeader>

  <CModalBody>
    Are you sure you want to delete this payment? This action cannot be reversed.
  </CModalBody>

  <div class="d-flex justify-content-end gap-2 p-3">
    <CButton color="secondary" @click="closeDeleteSingleModal">
      Cancel
    </CButton>

    <CButton color="danger" :disabled="isDeleting" @click="handleDeletePayment">
      <span v-if="!isDeleting">Delete</span>
      <span v-else>Deleting…</span>
    </CButton>
  </div>
</CModal>


<CModal :visible="showBulkDeleteModal" @close="closeBulkDeleteModal">
  <CModalHeader>
    <CModalTitle>Confirm Bulk Delete</CModalTitle>
  </CModalHeader>

  <CModalBody>
    You are about to delete {{ selectedIds.length }} payment(s).
    This action cannot be undone.
  </CModalBody>

  <div class="d-flex justify-content-end gap-2 p-3">
    <CButton color="secondary" @click="closeBulkDeleteModal">
      Cancel
    </CButton>

    <CButton color="danger" :disabled="isDeletingBulk" @click="handleBulkDelete">
      <span v-if="!isDeletingBulk">Delete All</span>
      <span v-else>Deleting…</span>
    </CButton>
  </div>
</CModal>



</template>

<script setup>
const searchTerm = ref('')
import Pagination from '@/Pagination.vue'

import { ref, computed, onMounted } from 'vue'


import {  watch } from 'vue'

const pageSize = 10
const currentPage = ref(1)
const totalPages = ref(1)


function onPageChanged(page) {
  fetchPayments(page)
}


import {
  get_family_payments,
  create_family_payment,
  delete_family_payment,
  get_raw_family_fee_rec,
} from '@/services/api'

import { useToast } from 'vue-toastification'
const toast = useToast()
const showBulkDeleteModal = ref(false)
const isDeletingBulk = ref(false)

watch(searchTerm, () => {
  currentPage.value = 1
  fetchPayments(1)
})
const isDeleting = ref(false)

const handleDeletePayment = async () => {
  if (!deleteTarget.value) return

  isDeleting.value = true
  try {
    await deletePayment(deleteTarget.value.id)  // API call & local update
    closeDeleteSingleModal()                     // close the modal
  } catch (err) {
    // error is already handled in deletePayment
  } finally {
    isDeleting.value = false
  }
}




// REAL Family Fee Records
const familyFeeRecords = ref([])

// Load Family Fee Records from API
const fetchFamilyFeeRecords = async () => {
  try {
    const res = await get_raw_family_fee_rec()
    familyFeeRecords.value = res.data || []
  } catch (err) {
    toast.error('Failed to load family fee records.', { position: 'top-right' })
  }
}

// REAL Payments Store
const listPayments = async (params = {}) => {
  try {
    const res = await get_family_payments(params)

    return res.data || []
  } catch (err) {
    toast.error('Failed to fetch payments.', { position: 'top-right' })
    return []
  }
}

const createPayment = async (data) => {
  try {
    const today = new Date().toISOString().split("T")[0]

    // Normalize the date into yyyy-mm-dd
    const formattedDate = data.date
      ? data.date.split("T")[0]
      : today

    const payload = {
      family_fee_record_id: data.familyFeeRecordId,
      date: formattedDate,
      amount: data.amount,
    }

    const res = await create_family_payment(payload)
    toast.success('Payment added.', { position: 'top-right' })
    return res.data

  } catch (err) {
  const data = err.response?.data || {}

  let msg = 'Failed to add payment.'

  // 1️⃣ DRF field validation (highest priority)
  if (Array.isArray(data.amount) && data.amount.length) {
    msg = data.amount[0]
  }
  // 2️⃣ Generic DRF non-field errors
  else if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    msg = data.non_field_errors[0]
  }
  // 3️⃣ Custom backend message
  else if (typeof data.message === 'string') {
    const backendMsg = data.message.toLowerCase()

    if (backendMsg.includes('constraint') || backendMsg.includes('foreign')) {
      msg = 'Cannot add payment because it is linked to missing or invalid records.'
    } else {
      msg = data.message
    }
  }

  toast.error(msg, { position: 'top-right' })
  throw err
}

}


const updatePayment = async (id, data) => {
  try {
    const res = await create_family_payment(id, data) // If you have PUT/PATCH, update here
    toast.success('Payment updated.', { position: 'top-right' })
    return res.data
  } catch (err) {
    const backendMsg = err.response?.data?.message?.toLowerCase() || ''
    let msg = 'Failed to update payment.'

    if (backendMsg.includes('constraint') || backendMsg.includes('foreign')) {
      msg = 'This payment is linked to another record and cannot be updated.'
    }

    toast.error(msg, { position: 'top-right' })
    throw err
  }
}

const deletePayment = async (id) => {

  try {
    await delete_family_payment(id)
    // Remove from local payments array
    payments.value = payments.value.filter(p => p.id !== id)

    // Also remove from selectedIds if it was selected
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)

    toast.success('Payment deleted.', { position: 'top-right' })
    return true
  } catch (err) {
    const backendMsg = err.response?.data?.message?.toLowerCase() || ''
    let msg = 'Failed to delete payment.'

    if (backendMsg.includes('constraint') || backendMsg.includes('foreign')) {
      msg = 'This payment cannot be deleted because it is linked to other records.'
    }

    toast.error(msg, { position: 'top-right' })
    throw err
  }
}


const bulkDeletePayments = async (ids) => {
  try {
    await Promise.all(ids.map(id => delete_family_payment(id)))
    toast.success('Selected payments deleted.', { position: 'top-right' })
    return true
  } catch (err) {
    const backendMsg = err.response?.data?.message?.toLowerCase() || ''
    let msg = 'Failed to delete some selected payments.'

    if (backendMsg.includes('constraint') || backendMsg.includes('foreign')) {
      msg = 'Some payments are linked to other records and cannot be deleted.'
    }

    toast.error(msg, { position: 'top-right' })
    throw err
  }
}

const deleteTarget = ref(null)


function closeDeleteSingleModal() {
  showDeleteSingleModal.value = false
  deleteTarget.value = null
}

// Component State
const payments = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const dateFilter = ref('')
const selectedIds = ref([])
const showFormModal = ref(false)
const isEdit = ref(false)
const currentPayment = ref(null)

const form = ref({
  amount: '',
  date: '',
  familyFeeRecordId: '',
})

const fetchPayments = async (page = 1) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await listPayments({
      page,
      search: searchTerm.value?.trim() || undefined,
    })


    const rows = response


    payments.value = Array.isArray(rows?.results) ? rows.results : []
    currentPage.value = page
    totalPages.value = Math.ceil((rows?.count ?? 0) / pageSize)




  } catch (err) {
    errorMessage.value = 'Failed to load payments.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await fetchFamilyFeeRecords()
  await fetchPayments()
})

const filteredPayments = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  const now = new Date()



  return payments.value.filter(p => {
    const family =
      p.family_fee_record?.family?.name?.toLowerCase() || ''
    const termName =
      p.family_fee_record?.term?.name?.toLowerCase() || ''
    const ay =
      p.family_fee_record?.academic_year?.name?.toLowerCase() || ''

    const matchesSearch =
      !term ||
      family.includes(term) ||
      termName.includes(term) ||
      ay.includes(term)



    if (!dateFilter.value) {

      return matchesSearch
    }


    const paymentDate = new Date(p.date)
    let matchesDate = true



    if (dateFilter.value === 'today') {
      matchesDate =
        paymentDate.toDateString() === now.toDateString()
    }

    if (dateFilter.value === '7days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 7)
      matchesDate = paymentDate >= sevenDaysAgo
    }

    if (dateFilter.value === 'month') {
      matchesDate =
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear()
    }

    if (dateFilter.value === 'year') {
      matchesDate =
        paymentDate.getFullYear() === now.getFullYear()
    }


    return matchesSearch && matchesDate
  })
})


const allSelected = computed(() => selectedIds.value.length === filteredPayments.value.length && filteredPayments.value.length > 0)
const someSelected = computed(() => selectedIds.value.length > 0 && selectedIds.value.length < filteredPayments.value.length)

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredPayments.value.map(p => p.id)
  }
}

const formatAmount = (amount) => parseFloat(amount).toFixed(2)

const openAddModal = () => {
  isEdit.value = false
  currentPayment.value = null
  form.value = { amount: '', date: '', familyFeeRecordId: '' }
  showFormModal.value = true
}

const openEditModal = (payment) => {
  isEdit.value = true
  currentPayment.value = payment
  form.value = {
    amount: payment.amount,
    date: payment.date,
    familyFeeRecordId: payment.family_fee_record?.id || '',

  }
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  currentPayment.value = null
}

const submitForm = async () => {
  try {
    if (isEdit.value && currentPayment.value) {
      await updatePayment(currentPayment.value.id, form.value)
    } else {
      await createPayment(form.value)
    }
    await fetchPayments()
    closeFormModal()
  } catch (err) {


    errorMessage.value = 'Failed to save payment.'
  }
}

const showDeleteSingleModal = ref(false)

const openSingleDeleteConfirm = async (payment) => {
  deleteTarget.value = payment
  showDeleteSingleModal.value = true

}


const openBulkDeleteConfirm = () => {
  if (selectedIds.value.length === 0) return
  showBulkDeleteModal.value = true
}
const closeBulkDeleteModal = () => {
  showBulkDeleteModal.value = false
}

const handleBulkDelete = async () => {
  if (selectedIds.value.length === 0) return

  isDeletingBulk.value = true
  try {
    await bulkDeletePayments(selectedIds.value)
    selectedIds.value = []
    await fetchPayments()
    closeBulkDeleteModal()
  } catch (err) {
    // error is already handled in bulkDeletePayments
  } finally {
    isDeletingBulk.value = false
  }
}

</script>

<style scoped>
/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
