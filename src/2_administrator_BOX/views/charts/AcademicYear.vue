<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader class="bg-info text-white">
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong class="fs-5">Academic Years</strong>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search academic year..."
                size="sm"
                style="min-width: 260px;"
              />
              <CButton color="light" class="text-info border-info" size="sm" @click="openAddModal">
                <CIcon icon="cil-calendar" class="me-1" /> Add Year
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <div v-if="loading" class="text-center my-4">
            <CSpinner color="primary" class="me-2" /> Loading academic years...
          </div>

          <CTable v-else hover responsive bordered>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="(year, idx) in filteredYears" :key="year.id">
                <CTableHeaderCell>{{ idx + 1 }}</CTableHeaderCell>
                <CTableDataCell>{{ year.name }}</CTableDataCell>
                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="secondary" variant="outline" @click="openEditModal(year)">Edit</CButton>
                    <CButton color="danger" variant="outline" @click="deleteYear(year)">Delete</CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>
              <CTableRow v-if="!loading && filteredYears.length === 0">
                <CTableDataCell colspan="3" class="text-center text-body-secondary">
                  No academic years found<span v-if="searchTerm"> for “{{ searchTerm }}”.</span>
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
    Are you sure you want to delete <strong>{{ yearToDelete?.name }}</strong>?This action cannot be reversed. All students will be demoted to the previous class.
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" variant="outline" @click="cancelDelete">Cancel</CButton>
    <CButton color="danger" @click="confirmDelete">Delete</CButton>
  </CModalFooter>
</CModal>


  <!-- Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Academic Year' : 'Add Academic Year. This will promote all students to the next class' }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CFormLabel>Name</CFormLabel>
      <CFormInput v-model="form.name" placeholder="e.g. 2024/2025" />
      <div class="text-end mt-3">
        <CButton
  color="primary"
  :disabled="loading"
  @click="submitForm"
  style="color: white;"
>
  <CSpinner v-if="loading" size="sm" class="me-2" />
  {{ isEdit ? 'Update' : 'Create' }}
</CButton>
      </div>
    </CModalBody>
  </CModal>
</template>

<script setup>
import { get_academic_years_ktor, create_academic_year_ktor, update_academic_year_ktor, delete_academic_year_ktor } from '../../../services/api'
import { ref, computed, onMounted, reactive } from 'vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const loading = ref(false)

const academicYears = ref([])

const searchTerm = ref('')
const showFormModal = ref(false)
const isEdit = ref(false)
const currentYear = ref(null)
const showDeleteModal = ref(false)
const yearToDelete = ref(null)

const form = reactive({ name: '' })



function resetForm() {
  form.name = ''
}


const filteredYears = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return term
    ? academicYears.value.filter(y => y.name.toLowerCase().includes(term))
    : academicYears.value
})

async function fetchYears() {
  loading.value = true
  try {
    const response = await get_academic_years_ktor()
    academicYears.value = response.data
  } catch (err) {

    if (err.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your internet connection.', { position: 'top-right' })
    } else if (err.response) {
      toast.error(err.response.data?.message || 'Failed to fetch academic year(s).', { position: 'top-right' })
    } else {
      toast.error('An unexpected error occurred while fetching academic year(s).', { position: 'top-right' })
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchYears()
})

const openAddModal = () => {
  isEdit.value = false
  currentYear.value = null
  resetForm()

  showFormModal.value = true
}

const openEditModal = (year) => {
  isEdit.value = true
  currentYear.value = year
  form.name = year.name
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  currentYear.value = null
}

const submitForm = async () => {
  if (!form.name.trim()) return

  loading.value = true
  try {
    if (isEdit.value && currentYear.value) {
      await update_academic_year_ktor(currentYear.value.id, form.name)
      toast.success('Academic year updated successfully')
    } else {
      await create_academic_year_ktor(form.name)
      toast.success('Academic year created successfully')
    }
    await fetchYears()
    closeFormModal()
  } catch (err) {

    toast.error('Failed to save academic year')
  } finally {
    loading.value = false
  }
}

const deleteYear = (year) => {
  yearToDelete.value = year
  showDeleteModal.value = true
}
const confirmDelete = async () => {
  if (!yearToDelete.value) return
  loading.value = true
  showDeleteModal.value = false

  // save data to use later
  const idToDelete = yearToDelete.value.id
  const nameToDelete = yearToDelete.value.name

  try {
    const response = await delete_academic_year_ktor(idToDelete)


    academicYears.value = academicYears.value.filter(y => y.id !== idToDelete)
    toast.success(`${nameToDelete} deleted successfully!`, { position: 'top-right' })
  } catch (error) {

    toast.error(
      'Cannot delete this academic year because it is linked to other records.',
      { position: 'top-right' }
    )
  } finally {
    loading.value = false
    yearToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  yearToDelete.value = null
}
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 {
    row-gap: 0.5rem;
  }
}
</style>
