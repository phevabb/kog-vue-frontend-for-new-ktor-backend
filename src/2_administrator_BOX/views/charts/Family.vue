<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Families</strong>

            <!-- Actions: Search + Delete Selected + Add -->
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <!-- Search by name -->
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by family name..."
                aria-label="Search by family name"
                size="sm"
                style="min-width: 260px;"
              />

              <!-- Bulk delete -->
              <CButton
                color="danger"
                size="sm"
                :disabled="selectedIds.length === 0"
                @click="openBulkDeleteConfirm"
              >
                Delete Selected ({{ selectedIds.length }})
              </CButton>



              <!-- Add Family -->
              <CButton color="primary" size="sm" @click="openAddModal">
                Add Family
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <p class="text-body-secondary small">Create families and manage their student members (relatives).</p>

          <!-- Error -->
          <CAlert color="danger" v-if="errorMessage" class="py-2">
            {{ errorMessage }}
          </CAlert>

          <!-- Loading -->
          <div class="d-flex align-items-center gap-2 mb-2" v-if="isLoading">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading families…</span>
          </div>

          <!-- TABLE -->
          <!-- Remove <DocsExample> if your project doesn't include it -->
          <div>
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <!-- Select-all (applies to current filtered rows) -->
                  <CTableHeaderCell scope="col" class="text-center" style="width: 48px;">
                    <CFormCheck
                      :checked="allSelected"
                      :indeterminate="someSelected"
                      @change="toggleSelectAll"
                      aria-label="Select all in current view"
                    />
                  </CTableHeaderCell>

                  <CTableHeaderCell scope="col" style="width: 60px;">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Members (Preview)</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end">Count</CTableHeaderCell>
                  <CTableHeaderCell scope="col" class="text-end" style="width: 240px;">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow v-for="(row, idx) in filteredFamilies" :key="row.id">
                  <CTableDataCell class="text-center">
                    <CFormCheck v-model="selectedIds" :value="row.id" aria-label="Select row" />
                  </CTableDataCell>

                  <CTableHeaderCell scope="row">{{ (currentPage - 1) * pageSize + idx + 1 }}</CTableHeaderCell>
                  <CTableDataCell>{{ row.name }}</CTableDataCell>

                  <CTableDataCell>
                    <span v-if="(row.members?.length || 0) === 0" class="text-body-secondary">No members</span>
                    <span v-else>{{ previewMembers(row.members) }}</span>
                  </CTableDataCell>

                  <CTableDataCell class="text-end">
                    <CBadge color="info">{{ row.members?.length || 0 }}</CBadge>
                  </CTableDataCell>

                  <CTableDataCell class="text-end">
                    <CButtonGroup size="sm">

                      <CButton
                        color="info"
                        variant="outline"
                        class="me-2"
                        @click="openEditModal(row)"
                      >
                        Edit
                      </CButton>

                      <CButton color="danger" variant="outline" @click="openSingleDeleteConfirm(row)">
                        Delete
                      </CButton>
                    </CButtonGroup>
                  </CTableDataCell>
                </CTableRow>

                <!-- Empty -->
                <CTableRow v-if="!isLoading && filteredFamilies.length === 0">
                  <CTableDataCell colspan="6" class="text-center text-body-secondary">
                    No families found
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


          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>


  <!-- Add/Edit Family Modal (with members selection) -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Family' : 'Add Family' }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-3">
        <CFormLabel for="name">Family Name</CFormLabel>
        <CFormInput
          id="name"
          v-model="formFamily.name"
          type="text"
          :maxlength="100"
          placeholder="Enter family name (max 100 chars)"
        />
        <div class="text-body-secondary small mt-1">
          Must be unique. Max 100 characters.
        </div>
      </div>

      <div class="mb-2">
  <CFormLabel class="mb-1">Members (Students)</CFormLabel>

  <v-select
    v-model="formFamily.memberIds"
    :options="studentOptionsForSelect"
    :multiple="true"
    :close-on-select="false"
    :reduce="opt => opt.value"
    label="label"
    placeholder="Search and select students"
  />
</div>


      <div class="col-md-6 mt-3 d-flex gap-4">
              <CFormSwitch v-model="formFamily.is_active" label="Active Family" />
      </div>

      <div class="col-12" v-if="formFamily.is_active === false">
              <CFormLabel>Reason for Deactivating</CFormLabel>
              <CFormInput v-model="formFamily.deactivation_reason" />
            </div>

      <div class="text-danger small mt-2" v-if="formValidationMessage">
        {{ formValidationMessage }}
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">
        Cancel
      </CButton>
      <CButton color="primary" @click="submitForm" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
        {{ isEdit ? 'Update' : 'Save' }}
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Manage Members Modal (quick members edit) -->
  <CModal :visible="showMembersModal" @close="closeMembersModal" size="lg">
    <CModalHeader>
      <CModalTitle>Manage Members — {{ currentFamily?.name }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-2 d-flex justify-content-between align-items-center">
        <div class="text-body-secondary small">
          Select or remove students to update family members.
        </div>
        <CFormInput
          v-model="memberSearch"
          size="sm"
          placeholder="Filter students..."
          style="max-width: 220px;"
        />
      </div>

      <CRow>
        <CCol :md="12">
          <CFormSelect
            v-model="membersEdit.memberIds"
            multiple
            :size="12"
            aria-label="Select family members"
          >
            <option
              v-for="st in filteredStudentOptions"
              :key="st.id"
              :value="String(st.id)"
            >
              {{ st.user.full_name }}
            </option>
          </CFormSelect>
        </CCol>
      </CRow>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeMembersModal" :disabled="isSubmitting">
        Cancel
      </CButton>
      <CButton color="primary" @click="submitMembersUpdate" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
        Save Members
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Confirm Delete (Single) -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader><CModalTitle>Delete Family</CModalTitle></CModalHeader>
    <CModalBody>
      Delete family <strong>{{ deleteTarget?.name }}</strong>?
      <div
  class="text-danger small mt-1 fw-semibold"
  v-if="deleteTarget?.members?.length"
>
  ⚠️ This will delete the family and remove all its member associations.
</div>

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
      You are about to delete <strong>{{ selectedIds.length }}</strong> family(ies).
      This action cannot be undone. Continue?
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeBulkDeleteConfirm" :disabled="isDeleting">
        Cancel
      </CButton>
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
import {  watch } from 'vue'
const searchTerm = ref('')
const pageSize = 10
const currentPage = ref(1)
const totalPages = ref(1)

import vSelect from "vue3-select";
import "vue3-select/dist/vue3-select.css";

import Pagination from '@/Pagination.vue'
import { ref, computed, reactive, onMounted } from 'vue'

import { st, rawst, get_families, create_family, update_family, delete_family } from '../../../services/api'
import {useToast} from 'vue-toastification'

function onPageChanged(page) {
  loadFamilies(page)
}

watch(searchTerm, () => {
  currentPage.value = 1
  loadFamilies(1)
})


const toast = useToast()

const familyApi = (() => {
  const clone = (x) => JSON.parse(JSON.stringify(x))

  return {
    async listFamilies(params = {}) {
      try {
        const response = await get_families(params)


        return clone(response.data || [])
      } catch (error) {

        throw error
      }
    },

    async listStudents() {
      try {
        const response = await rawst()

        return clone(response.data || [])
      } catch (error) {

        throw error
      }
    },

    async createFamily(payload /* { name, memberIds } */) {
      try {

        const response = await create_family(payload)

        return clone(response.data || response)
      } catch (error) {

        throw error
      }
    },

    async updateFamily(id, payload /* { name, memberIds } */) {
      try {


        const response = await update_family(id, payload)
        return clone(response.data || response)
      } catch (error) {

        throw error
      }
    },

    async updateFamilyMembers(id, memberIds /* number[]|string[] */) {
      try {
        const payload = { memberIds }
        const response = await update_family(id, payload)
        return clone(response.data || response)
      } catch (error) {

        throw error
      }
    },

    async deleteFamily(id) {
      try {
        const response = await delete_family(id)
        toast.success('Family deleted successfully.')
        return { success: true, ...(response.data || {}) }
      } catch (error) {

        throw error
      }
    },

    async deleteFamilies(ids /* number[] */) {
      try {
        const results = await Promise.allSettled(ids.map(id => delete_family(id)))

        const successCount = results.filter(r => r.status === 'fulfilled').length
        const failCount = results.filter(r => r.status === 'rejected').length

        return { success: failCount === 0, deleted: successCount, failed: failCount }
      } catch (error) {

        throw error
      }
    },
  }
})()

const studentOptionsForSelect = computed(() =>
  filteredStudentOptions.value.map(st => ({
    label: st.user.full_name,
    value: String(st.user.id),
  }))
)


/* ---------- State ---------- */
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')

const families = ref([])
const students = ref([])

/* Search controls */


/* Selection */
const selectedIds = ref([])

/* Form (Add/Edit) */
const showFormModal = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const formFamily = reactive({
  deactivation_reason: '',
  name: '',
  memberIds: [], // array of strings (from <option value>)
  is_active: true,
})
const formValidationMessage = ref('')

/* Members modal */
const showMembersModal = ref(false)
const currentFamily = ref(null)
const membersEdit = reactive({
  memberIds: [], // array of strings
})
/* shared member filter */
const memberSearch = ref('')

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
const filteredFamilies = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()

  return families.value
    .filter(family => family.is_active === true)
    .filter(family =>
      !q || String(family.name || '').toLowerCase().includes(q)
    )
})


const filteredIds = computed(() => filteredFamilies.value.map(r => r.id))
const allSelected = computed(() =>
  filteredIds.value.length > 0 && filteredIds.value.every(id => selectedIds.value.includes(id)),
)
const someSelected = computed(() =>
  filteredIds.value.length > 0 &&
  !allSelected.value &&
  filteredIds.value.some(id => selectedIds.value.includes(id)),
)

const filteredStudentOptions = computed(() => {
  const q = memberSearch.value.trim().toLowerCase()
  if (!q) return students.value
  return students.value.filter(s => String(s.user.full_name || '').toLowerCase().includes(q))
})

/* ---------- Helpers ---------- */
function previewMembers(members) {
  return (members || []).map(m => m.full_name).join(', ')
}


function resetForm() {
  formFamily.name = ''
  formFamily.memberIds = []
  memberSearch.value = ''
  formValidationMessage.value = ''
  editingId.value = null
}

function validateForm() {
  const name = String(formFamily.name || '').trim()
  if (!name) {
    formValidationMessage.value = 'Family name is required.'
    return false
  }
  if (name.length > 100) {
    formValidationMessage.value = 'Name must be at most 100 characters.'
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
async function loadFamilies(page = 1) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const rows = await familyApi.listFamilies({
      page,
      search: searchTerm.value?.trim() || undefined,
    })


    families.value = Array.isArray(rows?.results) ? rows.results : []
    currentPage.value = page
    totalPages.value = Math.ceil((rows?.count ?? 0) / pageSize)

  } catch (err) {
    errorMessage.value = err?.message || 'Failed to load families.'
  } finally {
    isLoading.value = false
  }
}

async function loadStudents() {

const rows = await familyApi.listStudents()


  const list = Array.isArray(rows) ? rows : Array.isArray(rows?.results) ? rows.results : []
  students.value = list.filter(Boolean) // remove any undefined/null
  return students.value


}

/* ---------- Modal handlers (Add/Edit) ---------- */
function openAddModal() {
  isEdit.value = false
  resetForm()
  showFormModal.value = true
}
function openEditModal(row) {
  isEdit.value = true
  editingId.value = row.id
  formFamily.name = row?.name ?? ''
  formFamily.memberIds = (row?.members || []).map(m => String(m.id))
  memberSearch.value = ''
  formValidationMessage.value = ''
  showFormModal.value = true
  formFamily.is_active = row?.is_active ?? true
}
function closeFormModal() {
  if (!isSubmitting.value) {
    showFormModal.value = false
    resetForm()
  }
}

/* ---------- Members modal handlers ---------- */
function openMembersModal(row) {
  currentFamily.value = row
  membersEdit.memberIds = (row?.members || []).map(m => String(m.id))
  memberSearch.value = ''
  showMembersModal.value = true
}
function closeMembersModal() {
  if (!isSubmitting.value) {
    showMembersModal.value = false
    currentFamily.value = null
    membersEdit.memberIds = []
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

  // Backends typically expect numeric IDs; convert from strings
  const memberIdsNumeric = (formFamily.memberIds || []).map(v => Number(v))

  const payload = {
    name: formFamily.name,
    member_ids: memberIdsNumeric,
    is_active: formFamily.is_active,
    deactivation_reason: formFamily.deactivation_reason || "Not Specified",

  }


  const done = () => (isSubmitting.value = false)

  if (isEdit.value && editingId.value != null) {
    familyApi
      .updateFamily(editingId.value, payload)
      .then((updated) => {
        families.value = families.value.map(r => (r.id === updated.id ? updated : r))
        showFormModal.value = false
        resetForm()
        addToast({ message: 'Family updated.' })
      })
      .catch((err) => (formValidationMessage.value = err?.message || 'Failed to update family.'))
      .finally(done)
  } else {
    familyApi
      .createFamily(payload)
      .then((created) => {
        families.value = [...families.value, created]
        showFormModal.value = false
        resetForm()
        toast.success('Family created successfully.')

      })
      .catch((err) => (formValidationMessage.value = err?.message || 'Failed to add family.'))
      .finally(done)
  }
}

/* ---------- Submit (Members update) ---------- */
function submitMembersUpdate() {
  if (!currentFamily.value) return
  isSubmitting.value = true

  const memberIdsNumeric = (membersEdit.memberIds || []).map(v => Number(v))

  familyApi
    .updateFamilyMembers(currentFamily.value.id, memberIdsNumeric)
    .then((updated) => {
      families.value = families.value.map(r => (r.id === updated.id ? updated : r))
      // ✅ close modal immediately
      showMembersModal.value = false
      currentFamily.value = null
      membersEdit.memberIds = []
      addToast({ message: 'Members updated.' })
    })
    .finally(() => {
      isSubmitting.value = false
    })
}

/* ---------- Delete (Single/Bulk) ---------- */
async function confirmDeleteSingle() {
  if (!deleteTarget.value) return

  isDeleting.value = true
  const familyId = deleteTarget.value.id
  const familyName = deleteTarget.value.name



  try {
    const response = await delete_family(familyId)


    // Remove from local list
    families.value = families.value.filter(f => f.id !== familyId)
    selectedIds.value = selectedIds.value.filter(id => id !== familyId)

    toast.success(`Family "${familyName}" deleted successfully.`, { position: 'top-right' })
  } catch (err) {


    let message = `Failed to delete "${familyName}". Connected to another record`

    // Detect foreign key / constraint errors from backend
    const backendMsg = err.response?.data?.message || err.response?.data?.error
    if (backendMsg?.toLowerCase().includes('foreign key') || backendMsg?.toLowerCase().includes('constraint')) {
      message = `Cannot delete "${familyName}" because it is linked to a student or record. Remove the associated record first.`
    }

    toast.error(message, { position: 'top-right' })
  } finally {
    showDeleteSingleModal.value = false
    deleteTarget.value = null
    isDeleting.value = false
  }
}



function confirmDeleteBulk() {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return
  isDeleting.value = true
  familyApi
    .deleteFamilies(ids)
    .then(() => {
      const toDelete = new Set(ids.map(String))
      families.value = families.value.filter(r => !toDelete.has(String(r.id)))
      selectedIds.value = []
      // ✅ close modal
      showDeleteBulkModal.value = false
      addToast({ message: `Deleted ${ids.length} family(ies).` })
    })
    .finally(() => (isDeleting.value = false))
}

/* ---------- Init ---------- */
onMounted(async () => {
  try {
    isLoading.value = true
    await loadStudents()
    await loadFamilies()
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}

/* Ensure the card area accepts clicks */
.c-card, .card, .card-body, .c-card-body {
  position: relative;
  pointer-events: auto;
  z-index: 1;
}

/* If any global overlay is accidentally left on, disable its clicks */
.page-overlay, .docs-example, .demo-wrapper, .example, .overlay {
  pointer-events: none !important; /* Only if you identify it’s not needed */
}
</style>
