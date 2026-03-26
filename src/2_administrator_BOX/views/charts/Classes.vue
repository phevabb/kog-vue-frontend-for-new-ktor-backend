<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader class="bg-warning text-dark">
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong class="fs-5">Grade Classes</strong>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search class..."
                size="sm"
                style="min-width: 260px;"
              />
              <CButton color="dark" class="text-warning border-warning" size="sm" @click="openAddModal">
                <CIcon icon="cil-school" class="me-1" /> Add Class
              </CButton>
            </div>
          </div>
        </CCardHeader>

<CCardBody>


  <CTable hover responsive bordered>
    <CTableHead color="light">
      <CTableRow>
        <CTableHeaderCell>#</CTableHeaderCell>
        <CTableHeaderCell>Class Name</CTableHeaderCell>
         <CTableHeaderCell>Staff</CTableHeaderCell>
        <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
      </CTableRow>
    </CTableHead>

    <CTableBody>
      <!-- Loading state -->
      <CTableRow v-if="loading">
        <CTableDataCell colspan="4" class="text-center py-4">
          <CSpinner color="primary" class="me-2" /> Loading data ...
        </CTableDataCell>
      </CTableRow>

      <!-- Empty state -->
      <CTableRow v-else-if="filteredClasses.length === 0">
        <CTableDataCell colspan="4" class="text-center text-muted py-4">
          No classes found<span v-if="searchTerm"> for “{{ searchTerm }}”.</span>
        </CTableDataCell>
      </CTableRow>

      <!-- Data rows -->
      <CTableRow v-else v-for="(cls, idx) in filteredClasses" :key="cls.id">
        <CTableHeaderCell>{{ idx + 1 }}</CTableHeaderCell>
        <CTableDataCell>{{ cls.name }}</CTableDataCell>
       <CTableDataCell>{{ cls.staff.user?.full_name || '—' }}</CTableDataCell>
        <CTableDataCell class="text-end">
          <CButtonGroup size="sm">
            <CButton color="secondary" variant="outline" @click="openEditModal(cls)">Edit</CButton>
            <CButton color="danger" variant="outline" @click="deleteClass(cls)">Delete</CButton>
          </CButtonGroup>
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
    Are you sure you want to delete <strong>{{ classToDelete?.name }}</strong>? This action cannot be reversed.
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" variant="outline" @click="cancelDelete">Cancel</CButton>
    <CButton color="danger" @click="confirmDelete">Delete</CButton>
  </CModalFooter>
</CModal>


  <!-- Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Class' : 'Add Class' }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CFormLabel>Class Name</CFormLabel>
      <CFormSelect v-model="form.name">
        <option disabled value="">Select Class</option>
        <option v-for="cls in classOptions" :key="cls" :value="cls">{{ cls }}</option>
      </CFormSelect>

      <CFormLabel class="mt-3">Staff</CFormLabel>
  <CFormSelect v-model="form.staff">
    <option value="">No Staff Assigned</option>
    <option v-for="staff in staff" :key="staff.id" :value="staff.id">
            {{ staff.full_name }}
    </option>
  </CFormSelect>

      <div class="text-end mt-4">

        <CButton
        color="primary"
        class="px-4"
        :disabled="loading"
        @click="submitForm"
      >
        <CIcon icon="cil-save" class="me-2" />
        <span v-if="loading">Processing...</span>
        <span v-else>{{ isEdit ? 'Update' : 'Create' }}</span>
      </CButton>


      </div>
    </CModalBody>
  </CModal>
</template>

<script setup>

import { useToast } from 'vue-toastification'
import { ref, computed, onMounted } from 'vue'
import {create_class, update_class, delete_class, get_classes, get_staff} from '../../../services/api.js'

const toast = useToast()
const staff = ref([])
const loading = ref(false)

const showDeleteModal = ref(false)
const classToDelete = ref(null)


async function fetchClasses() {
  loading.value = true;
  try {
    const response = await get_classes();


    const response_for_staff = await get_staff();



    staff.value = response_for_staff.data.map(item => item.user);


    gradeClasses.value = response.data;
  } catch (err) {


    if (err.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your internet connection.', { position: 'top-right' });
    } else if (err.response) {
      // API returned an error response
      toast.error(err.response.data?.message || 'Failed to fetch classes.', { position: 'top-right' });
    } else {
      // Unknown error
      toast.error('An unexpected error occurred while fetching classes.', { position: 'top-right' });
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchClasses();
});


const gradeClasses = ref([])



const classOptions = [
  'Creche',
  'Nursery 1',
  'Nursery 2',
  'KG 1',
  'KG 2',
  'class 1',
  'class 2',
  'class 3',
  'class 4',
  'class 5',
  'class 6',
  'jhs 1',
  'jhs 2',
  'jhs 3'
  ]


const searchTerm = ref('')
const showFormModal = ref(false)
const isEdit = ref(false)
const currentClass = ref(null)

const form = ref({ name: '', staff: '' })

const filteredClasses = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return term
    ? gradeClasses.value.filter(c => c.name.toLowerCase().includes(term))
    : gradeClasses.value
})

const openAddModal = () => {
  isEdit.value = false
  currentClass.value = null
  form.value = { name: '',staff: '' }
  showFormModal.value = true
}

const openEditModal = (cls) => {

  isEdit.value = true
  currentClass.value = cls
  form.value = {
    name: cls.name,
    staff: cls.staff.user.id || ' '
  }
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  currentClass.value = null
}

const submitForm = async () => {
  loading.value = true;

  form.value.name = form.value.name || 'creche';

  try {
    // ✅ Validate required field: Class Name
    if (!form.value.name || form.value.name.trim() === '') {
      toast.error('Class Name is required', { position: 'top-right' });
      loading.value = false;
      return;
    }

    // ✅ Validate class name against allowed options
    const validClasses = [
  'Creche',
  'Nursery 1',
  'Nursery 2',
  'KG 1',
  'KG 2',
  'class 1',
  'class 2',
  'class 3',
  'class 4',
  'class 5',
  'class 6',
  'jhs 1',
  'jhs 2',
  'jhs 3'
  ];
    if (!validClasses.includes(form.value.name)) {
      toast.error('Invalid class name selected', { position: 'top-right' });
      loading.value = false;
      return;
    }



    const cleanedForm2 = {
  name: form.value.name.trim(),
  user_id: Number(form.value.staff)

};

let response;

// ✅ Do not touch currentClass.value.id unless you know you're in edit mode
if (isEdit.value && currentClass.value?.id) {

  const idtoedit = currentClass.value.id;
  const thename = currentClass.value.name;

  response = await update_class(currentClass.value.id, cleanedForm2);


  const index = gradeClasses.value.findIndex(c => c.id === idtoedit);
  if (index !== -1) {
    const updatedClass = response.data;

    if (updatedClass.staff?.id) {
      const matchedStaff = staff.value.find(s => s.id === updatedClass.staff.id);
      if (matchedStaff) updatedClass.staff = matchedStaff;
    }

    gradeClasses.value[index] = updatedClass;
  }


  toast.success(`${thename} updated successfully!`, { position: 'top-right' })
} else {

  response = await create_class(cleanedForm2);

  gradeClasses.value.push(response.data);
  toast.success('Class created successfully!', { position: 'top-right' });
}

    closeFormModal();

  } catch (err) {



    const backendMessage = err.response?.data?.message || 'Failed to submit form.';
    toast.error(backendMessage, { position: 'top-right' });
  } finally {
    loading.value = false;
  }
};


const deleteClass = (cs) => {
  classToDelete.value = cs
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!classToDelete.value) return
  loading.value = true
  showDeleteModal.value = false

  const theid = classToDelete.value.id;
  const thename = classToDelete.value.name;

  try {
    await delete_class(classToDelete.value.id)
    gradeClasses.value = gradeClasses.value.filter(s => s.id !== theid)
    toast.success(`${thename} deleted successfully!`, { position: 'top-right' })
  } catch (error) {

    toast.error('Failed to delete class. Please try again.', { position: 'top-right' })
  } finally {
    loading.value = false
    classToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  classToDelete.value = null
}

</script>

<style scoped>
/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
