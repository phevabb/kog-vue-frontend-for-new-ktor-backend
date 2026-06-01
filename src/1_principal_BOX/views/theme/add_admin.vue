<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Administrators</strong>

            <div class="d-flex align-items-center gap-2 flex-wrap">




              <CButton class="text-white" color="primary" size="sm" @click="openAddModal">
                Add Administrator
              </CButton>

            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <div v-if="loading" class="text-center my-4">
            <CSpinner color="primary" class="me-2" /> Loading data ...
          </div>

          <CTable v-else hover responsive bordered class="shadow-sm">
            <CTableHead>
              <CTableRow>

                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>

                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>pin</CTableHeaderCell>



                <!-- <CTableHeaderCell>Status</CTableHeaderCell> -->
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(row, idx) in  staff" :key="row.id">

                <CTableHeaderCell>{{ idx + 1 }}</CTableHeaderCell>
                <CTableDataCell>{{ row.user.fullName }}</CTableDataCell>

                <CTableDataCell>{{ row.user.userId }}</CTableDataCell>

                <CTableDataCell>{{ row.user.pin }}</CTableDataCell>



                <!-- <CTableDataCell>
                  <CBadge :color="row.is_active ? 'success' : 'secondary'">
                    {{ row.is_active ? 'Active' : 'Inactive' }}
                  </CBadge>
                </CTableDataCell> -->

                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="secondary" variant="outline" @click="openEditModal(row)">Edit</CButton>
                    <CButton color="danger" variant="outline" @click="deleteStaff(row)">Delete</CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && filteredStaff.length === 0">
                <CTableDataCell colspan="9" class="text-center text-body-secondary">
                  No staff found<span v-if="searchTerm"> for “{{ searchTerm }}”.</span>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

   <CModal :visible="showDeleteModal" @close="cancelDelete" size="md">
  <CModalHeader class="bg-danger text-white">
    <CModalTitle>Confirm Deletion</CModalTitle>
  </CModalHeader>
  <CModalBody>
    Are you sure you want to delete <strong>{{ staffToDelete?.full_name }}</strong>?
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" variant="outline" @click="cancelDelete">Cancel</CButton>
    <CButton color="danger" @click="confirmDelete">Delete</CButton>
  </CModalFooter>
</CModal>



  <!-- Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Administrator' : 'Add Administrator' }}</CModalTitle>

    </CModalHeader>
    <CModalBody>
      <div class="mb-3">
        <CFormLabel>Full Name</CFormLabel>
        <CFormInput v-model="form.user.fullName" />
      </div>

      <!-- <div class="mb-3">
        <CFormLabel>Email</CFormLabel>
        <CFormInput v-model="form.email" />
      </div> -->

      <!-- <div class="mb-3">
      <CFormLabel>Gender</CFormLabel>
      <CFormSelect v-model="form.gender">
        <option disabled value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </CFormSelect>
    </div> -->





      <CButton class="text-white" color="primary" @click="submitForm">
        {{ isEdit ? 'Update' : 'Create' }}
      </CButton>
    </CModalBody>
  </CModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  get_administrators_ktor,
  create_administrator_ktor,
  update_administrator_ktor,
  delete_administrator_ktor
} from '@/services/api'


const loading = ref(false)
const errorMessage = ref('')
const staff = ref([])

import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

import {
  CFormCheck, CFormInput, CButton, CButtonGroup, CModal, CModalHeader, CModalTitle, CModalBody,
  CAlert, CSpinner, CFormLabel, CFormSelect, CBadge, CRow, CCol, CCard, CCardHeader, CCardBody,
  CTable, CTableHead, CTableBody, CTableRow, CTableHeaderCell, CTableDataCell
} from '@coreui/vue'


const router = useRouter()
const showDeleteModal = ref(false)
const staffToDelete = ref(null)
const toast = useToast()


const confirmDelete = async () => {
  if (!staffToDelete.value) return
  loading.value = true
  showDeleteModal.value = false

  try {
    const idtodelete = staffToDelete.value.id
    const fullNameToDelete = staffToDelete.value.fullName


    const res = await delete_administrator_ktor(staffToDelete.value.id)


    staff.value = staff.value.filter(s => s.id !== idtodelete)



    toast.success(`Administrator deleted successfully!`, { position: 'top-right' })
  } catch (error) {

    toast.error('Failed to delete administrator. Please try again.', { position: 'top-right' })
  } finally {
    loading.value = false
    staffToDelete.value = null
  }
}



async function fetchAdministrators() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await get_administrators_ktor()


    staff.value = response.data
  } catch (err) {

    if(err.code === 'ERR_NETWORK'){
      toast.error('Network error. Please check you internet connection.', {position: 'top-right'});

    }else if (err.response) {
      // API returned an error response
      toast.error(err.response.data?.message || 'Failed to fetch staff.', { position: 'top-right' });
    } else {
      // Unknown error
      toast.error('An unexpected error occurred while fetching staff.', { position: 'top-right' });
    }
  } finally {
    loading.value = false
  }

}


onMounted (()=>{
  fetchAdministrators();
})


// Component state

const isLoading = ref(false)

const searchTerm = ref('')
const selectedIds = ref([])
const showFormModal = ref(false)
const isEdit = ref(false)
const currentStaff = ref(null)

const form = ref({
  user: {
    fullName: '',
    gender: '',
    dateOfBirth: '',
    role: 'administrator',
    isStaff: true,
    isActive: true
  }
})

const deleteStaff = (staff) => {
  staffToDelete.value = staff
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  staffToDelete.value = null
}



const filteredStaff = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return staff.value
  return staff.value.filter(s => s.full_name.toLowerCase().includes(term))
})



const openAddModal = () => {
  isEdit.value = false
  currentStaff.value = null

  form.value = {
    user: {
      fullName: '',
      gender: '',
      dateOfBirth: '',
      role: 'administrator',
      isStaff: true,
      isActive: true
    }
  }

  showFormModal.value = true
}

const openEditModal = (staffMember) => {
  isEdit.value = true
  currentStaff.value = staffMember

  const user = staffMember?.user || staffMember || {}

  form.value = {
    user: {
      fullName: user.fullName || '',
      gender: user.gender ? user.gender.toLowerCase() : '',
      dateOfBirth: user.dateOfBirth || '',
      role: user.role || 'administrator',
      isStaff: user.isStaff ?? true,
      isActive: user.isActive ?? true
    }
  }

  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  currentStaff.value = null
}


const submitForm = async () => {
  loading.value = true

  try {
    const payload = {
      user: {
        fullName: form.value.user.fullName.trim(),
        gender: (form.value.user.gender || 'male').toLowerCase(),
        dateOfBirth: form.value.user.dateOfBirth || '2002-02-02',
        role: 'administrator',
        isStaff: true,
        isActive: true
      }
    }



    if (isEdit.value && currentStaff.value) {
      const t =await update_administrator_ktor(currentStaff.value.id, payload)


      toast.success("Administrator updated!")
    } else {
      const response = await create_administrator_ktor(payload)

      toast.success("Administrator created!")
    }

    closeFormModal()
    fetchAdministrators()
  } catch (error) {

    toast.error("Failed to save administrator.")
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>

