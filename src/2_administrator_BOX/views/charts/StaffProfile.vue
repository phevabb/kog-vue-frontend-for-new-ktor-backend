<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Staff Members</strong>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by name..."
                aria-label="Search by name"
                size="sm"
                style="min-width: 260px;"
              />

              <CButton class="text-white" color="primary" size="sm" @click="openAddModal">
                Add Staff
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
                <CTableHeaderCell>Class</CTableHeaderCell>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Pin</CTableHeaderCell>
                <CTableHeaderCell>Gender</CTableHeaderCell>
                <CTableHeaderCell>Contact</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow
                v-for="(row, idx) in filteredStaff"
                :key="row.id"
              >
                <CTableHeaderCell>{{ idx + 1 }}</CTableHeaderCell>
                <CTableDataCell>{{ row.user.full_name }}</CTableDataCell>
                <CTableDataCell>{{ row.assignedClass }}</CTableDataCell>
                <CTableDataCell>{{ row.user.user_id }}</CTableDataCell>
                <CTableDataCell>{{ row.user.pin }}</CTableDataCell>
                <CTableDataCell>{{ row.user.gender }}</CTableDataCell>
                <CTableDataCell>{{ row.tell }}</CTableDataCell>

                <CTableDataCell>
                  <CBadge :color="row.user.is_active ? 'success' : 'secondary'">
                    {{ row.user.is_active ? 'Active' : 'Inactive' }}
                  </CBadge>
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="secondary" variant="outline" @click="openEditModal(row)">Edit</CButton>
                    <CButton color="danger" variant="outline" @click="prepareDelete(row)">Delete</CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!loading && filteredStaff.length === 0">
                <CTableDataCell colspan="9" class="text-center text-body-secondary">
                  No staff found <span v-if="searchTerm">for “{{ searchTerm }}”.</span>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- DELETE MODAL -->
  <CModal :visible="showDeleteModal" @close="cancelDelete" size="md">
    <CModalHeader class="bg-danger text-white">
      <CModalTitle>Confirm Deletion</CModalTitle>
    </CModalHeader>

    <CModalBody>
      Are you sure you want to delete
      <strong>{{ staffToDelete?.user?.full_name }}</strong>? This action cannot be reversed.
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="cancelDelete">Cancel</CButton>
      <CButton color="danger" @click="confirmDelete">Delete</CButton>
    </CModalFooter>
  </CModal>

  <!-- CREATE/EDIT MODAL -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Staff' : 'Add Staff' }}</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <div class="mb-3">
        <CFormLabel>Full Name</CFormLabel>
        <CFormInput v-model="form.user.full_name" />
      </div>

      <div class="mb-3">
        <CFormLabel>Contact</CFormLabel>
        <CFormInput v-model="form.tell" />
      </div>

      <div class="mb-3">
        <CFormLabel>Gender</CFormLabel>
        <CFormSelect v-model="form.user.gender">
          <option disabled value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </CFormSelect>
      </div>

      <div class="mb-3">
        <CFormLabel>Class</CFormLabel>
        <CFormSelect v-model="form.assignedClass">
          <option disabled value="" >Select Class</option>
          <option v-for="c in classes" :key="c" :value="c">
            {{ c }}
          </option>
        </CFormSelect>
      </div>

      <CButton color="primary" @click="submitForm">
        {{ isEdit ? 'Update' : 'Create' }}
      </CButton>
    </CModalBody>
  </CModal>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import {
  get_staff,
  create_staff,
  update_staff,
  delete_staff,
} from "@/services/api";

const toast = useToast();

// =========================
// STATE
// =========================
const loading = ref(false);
const staff = ref([]);
const searchTerm = ref("");

const showDeleteModal = ref(false);
const staffToDelete = ref(null);

const showFormModal = ref(false);
const isEdit = ref(false);
const currentStaff = ref(null);

// Form State
const form = ref({
  user: {
    full_name: "",
    gender: "",
    date_of_birth: "",
    role: "staff",
  },
  assignedClass: "",
  tell: "",
});

// CLASS OPTIONS
const classes = [
  "creche",
  "nursery 1",
  "nursery 2",
  "kg 1",
  "kg 2",
  "class 1",
  "class 2",
  "class 3",
  "class 4",
  "class 5",
  "class 6",
  "jhs 1",
  "jhs 2",
  "jhs 3",
];

// =========================
// LOAD STAFF
// =========================
async function fetchStaff() {
  loading.value = true;

  try {
    const response = await get_staff();
    staff.value = response.data;
  } catch (err) {
    toast.error("Failed to fetch staff.");
  } finally {
    loading.value = false;
  }
}

onMounted(fetchStaff);

// =========================
// FILTERING
// =========================
const filteredStaff = computed(() => {
  const t = searchTerm.value.toLowerCase().trim();
  if (!t) return staff.value;

  return staff.value.filter((s) =>
    s.user.full_name.toLowerCase().includes(t)
  );
});

// =========================
// DELETE STAFF
// =========================
const prepareDelete = (row) => {
  staffToDelete.value = row;
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  staffToDelete.value = null;
};

const confirmDelete = async () => {
  if (!staffToDelete.value) return;

  try {
    await delete_staff(staffToDelete.value.id);

    staff.value = staff.value.filter(
      (s) => s.id !== staffToDelete.value.id
    );

    toast.success("Staff deleted");
  } catch {
    toast.error("Failed to delete staff.");
  }

  cancelDelete();
};

// =========================
// ADD / EDIT STAFF
// =========================
const openAddModal = () => {
  isEdit.value = false;
  currentStaff.value = null;

  form.value = {
    user: {
      full_name: "",
      gender: "",
      date_of_birth: "2002-02-02",
      role: "staff",
    },
    assignedClass: "",
    tell: "",
  };

  showFormModal.value = true;
};

const openEditModal = (row) => {
  isEdit.value = true;
  currentStaff.value = row;

  form.value = {
    user: {
      full_name: row.user.full_name,
      gender: row.user.gender,
      date_of_birth: row.user.date_of_birth,
      role: row.user.role,
    },
    assignedClass: row.assignedClass,
    tell: row.tell,
  };

  showFormModal.value = true;
};

const closeFormModal = () => {
  showFormModal.value = false;
};

// =========================
// SUBMIT FORM
// =========================
const submitForm = async () => {
  loading.value = true;

  const payload = JSON.parse(JSON.stringify(form.value));

  if (!payload.user.full_name) {
    toast.error("Full name is required.");
    loading.value = false;
    return;
  }

  if (!payload.assignedClass) {
    payload.assignedClass="creche"
  }

  if (!payload.user.gender) {
    payload.user.gender="male"
  }

  try {
    if (isEdit.value) {
      await update_staff(currentStaff.value.id, payload);
      toast.success("Staff updated!");
    } else {

      await create_staff(payload);
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
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 {
    row-gap: 0.5rem;
  }
}
</style>
