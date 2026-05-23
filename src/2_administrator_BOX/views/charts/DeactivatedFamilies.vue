<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Deactivated Families</strong>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by name..."
                aria-label="Search by name"
                size="sm"
                style="min-width: 260px;"
              />



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
                <!-- <CTableHeaderCell>Members</CTableHeaderCell> -->

                <CTableHeaderCell>Reason</CTableHeaderCell>


                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(row, idx) in filteredStaff" :key="row.id">

                <CTableHeaderCell>{{ idx + 1 }}</CTableHeaderCell>
                <CTableDataCell>{{ row.family.name }}</CTableDataCell>
                <!-- <CTableDataCell>
  <span
    v-for="(member, index) in row.family.members"
    :key="member.id"
  >
    {{ member.full_name }}<span v-if="index < row.family.members.length - 1">, </span>
  </span>
</CTableDataCell> -->

                <CTableDataCell>{{ row.deactivation_reason }}</CTableDataCell>


                <CTableDataCell>{{ row.date_deactivated }}</CTableDataCell>


                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="primary" variant="outline" @click="activateStudent(row)">Activate</CButton>

                    <CButton color="secondary" variant="outline" @click="openEditModal(row)">Edit</CButton>
                    <CButton color="danger" variant="outline" @click="deleteStaff(row)">Delete</CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && filteredStaff.length === 0">
                <CTableDataCell colspan="9" class="text-center text-body-secondary">
                  No student found<span v-if="searchTerm"> for “{{ searchTerm }}”.</span>
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
    Are you sure you want to delete <strong>{{ staffToDelete.family.name }}</strong>? This action cannot be reversed.
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" variant="outline" @click="cancelDelete">Cancel</CButton>
    <CButton color="danger" @click="confirmDelete">Delete</CButton>
  </CModalFooter>
</CModal>


   <CModal :visible="showActivateModal" @close="cancelActivate" size="md">
  <CModalHeader class="bg-success text-white">
    <CModalTitle>Confirm Activation</CModalTitle>
  </CModalHeader>
  <CModalBody>
    Are you sure you want to activate <strong>{{ studentToDelete?.family.name }}</strong>? This action will restore family's history.
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" variant="outline" @click="cancelActivate">Cancel</CButton>
    <CButton color="danger" @click="confirmActivate">Activate</CButton>
  </CModalFooter>
</CModal>



  <!-- Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle> Edit Reason </CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-3">
        <CFormLabel>Edit Reason</CFormLabel>
        <CFormInput v-model="form.deactivation_reason" />
      </div>

      <div class="mb-3">


    </div>





      <CButton color="primary" @click="submitForm">
        {{ isEdit ? 'Update' : 'Create' }}
      </CButton>
    </CModalBody>
  </CModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  get_deactivated_families,
  activate_deactivated_family,
  get_staff,
  create_staff_ktor,
  update_deactivated_family,
  delete_deactivated_family,
} from '@/services/api'

const loading = ref(false)
const errorMessage = ref('')
const staff = ref([])

import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'



const router = useRouter()
const showDeleteModal = ref(false)
const showActivateModal = ref(false)

const staffToDelete = ref(null)
const studentToDelete = ref(null)

const toast = useToast()


const confirmDelete = async () => {
  if (!staffToDelete.value) return
  loading.value = true
  showDeleteModal.value = false

  try {

    const idtodelete = staffToDelete.value.id
    const thename = staffToDelete.value.family.name

    await delete_deactivated_family(staffToDelete.value.id)
    staff.value = staff.value.filter(s => s.id !== idtodelete)



    toast.success(`${thename} deleted successfully!`, { position: 'top-right' })
  } catch (error) {

    toast.error('Failed to delete staff. Please try again.', { position: 'top-right' })
  } finally {
    loading.value = false
    staffToDelete.value = null
  }
}


const confirmActivate = async () => {
  if (!studentToDelete.value) return
  loading.value = true
  showActivateModal.value = false

  try {
    const idtoactivate = studentToDelete.value.id



    const UserIdToActivate = idToAactivate.value

    const thename = studentToDelete.value.family.name

    await activate_deactivated_family(idtoactivate)

    staff.value = staff.value.filter(s => s.id !== idtoactivate)

    toast.success(`${thename} activated successfully!`, {
      position: 'top-right'
    })
  } catch (error) {
    toast.error('Failed to activate student. Please try again.', {
      position: 'top-right'
    })
  } finally {
    loading.value = false
    studentToDelete.value = null
  }
}


async function fetchStaff() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await get_deactivated_families()



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
  fetchStaff();
})





const bulkDeleteStaff = async (ids) => {
  staffStore = staffStore.filter(s => !ids.includes(s.id))
  return new Promise(resolve => setTimeout(() => resolve(true), 300))
}

// Component state

const isLoading = ref(false)

const searchTerm = ref('')
const selectedIds = ref([])
const showFormModal = ref(false)
const idToAactivate = ref(null)
const isEdit = ref(false)
const currentStaff = ref(null)

const form = ref({
  user: {

    gender: '',            // 'male' | 'female'

    date_of_birth: '',     // 'YYYY-MM-DD' string for <input type="date">
    role: "staff"
  },
  deactivation_reason: ''
})


const deleteStaff = (staff) => {
  staffToDelete.value = staff
  showDeleteModal.value = true
}


const activateStudent = (staff) => {
  studentToDelete.value = staff
  idToAactivate.value = staff.family.id
  showActivateModal.value = true
}



const cancelDelete = () => {
  showDeleteModal.value = false
  staffToDelete.value = null
}

const cancelActivate = () => {
  showActivateModal.value = false
  studentToDelete.value = null
}



const filteredStaff = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return staff.value
  return staff.value.filter(s => s.family.full_name.toLowerCase().includes(term))
})

const allSelected = computed(() => selectedIds.value.length === filteredStaff.value.length && filteredStaff.value.length > 0)
const someSelected = computed(() => selectedIds.value.length > 0 && selectedIds.value.length < filteredStaff.value.length)

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredStaff.value.map(s => s.id)
  }
}




const openEditModal = (staffMember) => {
  isEdit.value = true;
  currentStaff.value = staffMember;

  const user = staffMember.user || {}; // safe check

  form.value = {
    user: {
      full_name: user.full_name || '',
      id: user.id || '',

      role: user.role || 'staff'
    },
    deactivation_reason: staffMember.deactivation_reason || 'Not specified'
  };

  showFormModal.value = true;
};



const closeFormModal = () => {
  showFormModal.value = false
  currentStaff.value = null
}

const submitForm = async () => {
  loading.value = true;

  try {

    function deepClean(obj) {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
          if (typeof value === "string") {
            const trimmed = value.trim();
            return [key, trimmed === "" ? null : trimmed];
          } else if (value && typeof value === "object") {
            return [key, deepClean(value)];
          }
          return [key, value];
        })
      );
    }

    const cleaned = deepClean(form.value);

    // Ensure lowercase gender




    if (isEdit.value && currentStaff.value) {


      const response = await update_deactivated_family(currentStaff.value.id, cleaned);

      toast.success("Reason updated!");
    } else {
      let finalPayload = JSON.parse(JSON.stringify(cleaned));

      // ensure gender exists
      if (!finalPayload.user.gender) {
        finalPayload.user.gender = "male";
      }

      // ensure date_of_birth exists
      if (!finalPayload.user.date_of_birth) {
        finalPayload.user.date_of_birth = "2002-02-02";
      }



const response = await create_staff_ktor(finalPayload);


      toast.success("Staff created!");
    }

    closeFormModal();
    fetchStaff();

  } catch (error) {

    toast.error("Failed to save staff.");
  } finally {
    loading.value = false;
  }
};



const openBulkDeleteConfirm = async () => {
  if (confirm(`Delete ${selectedIds.value.length} selected staff members?`)) {
    await bulkDeleteStaff(selectedIds.value)
    selectedIds.value = []
    await fetchStaff()
  }
}
</script>

<style scoped>
/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>

