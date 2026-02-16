<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Families</strong>
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
                :disabled="selectedIds.length === 0"
                @click="showDeleteBulkModal = true"
              >
                Delete Selected ({{ selectedIds.length }})
              </CButton>
              <CButton color="primary" size="sm" @click="openAddModal">
                Add Family
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <p class="text-body-secondary small mb-3">
            Create families and manage their student members (relatives).
          </p>



          <div v-if="isLoading" class="d-flex align-items-center gap-2 mb-3">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading families…</span>
          </div>

          <CTable hover responsive>
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
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Members (Preview)</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Count</CTableHeaderCell>
                <CTableHeaderCell class="text-end" style="width:160px">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(family, idx) in families" :key="family.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="family.id" />
                </CTableDataCell>
                <CTableHeaderCell scope="row">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableHeaderCell>
                <CTableDataCell>{{ family.name }}</CTableDataCell>
                <CTableDataCell>
                  <span v-if="!family.members?.length" class="text-body-secondary">No members</span>
                  <span v-else>{{ previewMembers(family.members) }}</span>
                </CTableDataCell>
                <CTableDataCell class="text-end">
                  <CBadge color="info">{{ family.members?.length || 0 }}</CBadge>
                </CTableDataCell>
                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="info" variant="outline" @click="openEditModal(family)">
                      Edit
                    </CButton>
                    <CButton color="danger" variant="outline" @click="openDeleteConfirm(family)">
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && families.length === 0">
                <CTableDataCell colspan="6" class="text-center text-body-secondary py-4">
                  No families found<span v-if="searchTerm"> for “{{ searchTerm }}”</span>.
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
      <CModalTitle>{{ isEdit ? 'Edit Family' : 'Add Family' }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CFormInput
        v-model="form.name"
        label="Family Name"
        placeholder="Enter family name"
        :maxlength="100"
        :invalid="!!formValidationMessage"
        :disabled="isSubmitting"
      />
      <div v-if="formValidationMessage" class="invalid-feedback d-block">
        {{ formValidationMessage }}
      </div>

      <CFormLabel class="mt-3">Members (Students)</CFormLabel>
      <v-select
        v-model="form.memberIds"
        :options="studentOptions"
        multiple
        :reduce="opt => opt.value"
        label="label"
        placeholder="Search and select students..."
        :disabled="isSubmitting"
      />

      <div class="mt-3">
        <CFormSwitch v-model="form.is_active" label="Active Family" :disabled="isSubmitting" />
      </div>

      <CFormInput
        v-if="!form.is_active"
        v-model="form.deactivation_reason"
        label="Deactivation Reason"
        placeholder="Reason (optional)"
        :disabled="isSubmitting"
        class="mt-2"
      />
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">
        Cancel
      </CButton>
      <CButton color="primary" @click="saveFamily" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-1" />
        {{ isEdit ? 'Update' : 'Create' }}
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Single Delete Confirm -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader>
      <CModalTitle>Confirm Delete</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Delete family <strong>{{ deleteTarget?.name }}</strong>?
      <div v-if="deleteTarget?.members?.length" class="text-danger small mt-2">
        This will also remove all member associations.
      </div>
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

  <!-- Bulk Delete Confirm -->
  <CModal :visible="showDeleteBulkModal" @close="showDeleteBulkModal = false">
    <CModalHeader>
      <CModalTitle>Delete {{ selectedIds.length }} Families?</CModalTitle>
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
import vSelect from 'vue3-select'
import 'vue3-select/dist/vue3-select.css'
import Pagination from '@/Pagination.vue'

const editingId = ref(null)


import { rawst, get_families, create_family, update_family, delete_family } from '@/services/api'

const toast = useToast()
const pageSize = 10

// ── State ────────────────────────────────────────
const isLoading       = ref(false)
const isSubmitting    = ref(false)
const isDeleting      = ref(false)
const errorMessage    = ref('')

const families        = ref([])
const students        = ref([])

const searchTerm      = ref('')
const currentPage     = ref(1)
const totalPages      = ref(1)
const totalCount      = ref(0)

const selectedIds     = ref([])

const showFormModal         = ref(false)
const isEdit                = ref(false)
const form                  = reactive({
  name: '',
  memberIds: [],
  is_active: true,
  deactivation_reason: '',
})

const formValidationMessage = ref('')

const showDeleteSingleModal = ref(false)
const deleteTarget          = ref(null)

const showDeleteBulkModal   = ref(false)

// ── Cache ────────────────────────────────────────
const pageCache = ref(new Map()) // key: "page|search" → { results, count }

// ── Computed ─────────────────────────────────────
const showingRange = computed(() => {
  if (!families.value.length) return 'Showing 0 families'
  const start = (currentPage.value - 1) * pageSize + 1
  const end = start + families.value.length - 1
  return `Showing ${start}–${end} of ${totalCount.value}`
})

const studentOptions = computed(() =>
  students.value.map(s => ({
    label: s.user?.full_name || 'Unnamed',
    value: String( s.user?.id),
  }))
)

const previewMembers = (members = []) => {
  if (!members.length) return ''
  const names = members.slice(0, 3).map(m => m.full_name || m.user?.full_name || '—')
  return names.join(', ') + (members.length > 3 ? ` +${members.length - 3} more` : '')
}

const allSelected = computed(() =>
  families.value.length > 0 && families.value.every(f => selectedIds.value.includes(f.id))
)

const someSelected = computed(() =>
  !allSelected.value && families.value.some(f => selectedIds.value.includes(f.id))
)

// ── Watchers ─────────────────────────────────────
watch(searchTerm, () => {
  currentPage.value = 1
  loadFamilies()
})

// ── Methods ──────────────────────────────────────
function changePage(page) {
  currentPage.value = page
  loadFamilies()
}

async function loadFamilies() {
  const page = currentPage.value
  const search = searchTerm.value.trim() || undefined
  const cacheKey = `${page}|${search || ''}`

  if (pageCache.value.has(cacheKey)) {
    const cached = pageCache.value.get(cacheKey)
    families.value = cached.results
    totalCount.value = cached.count
    totalPages.value = Math.ceil(cached.count / pageSize)
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const params = { page, page_size: pageSize }
    if (search) params.search = search

    const res = await get_families(params)
    const data = res.data || {}

    const results = data.results || []
    const count = data.count || 0

    pageCache.value.set(cacheKey, { results, count })

    families.value = results
    totalCount.value = count
    totalPages.value = Math.ceil(count / pageSize)
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Could not load families'
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

async function loadStudents() {
  try {
    const res = await rawst()

    students.value = res.data || []
  } catch (err) {
    toast.error('Failed to load students')
  }
}

function openAddModal() {
  isEdit.value = false
  Object.assign(form, { name: '', memberIds: [], is_active: true, deactivation_reason: '' })
  editingId.value = null
  formValidationMessage.value = ''
  showFormModal.value = true
}

function openEditModal(family) {
  isEdit.value = true
  editingId.value = family.id   // ✅ STORE THE ID

  Object.assign(form, {
    name: family.name || '',
    memberIds: (family.members || []).map(m => String(m.id || m.user?.id)),
    is_active: !!family.is_active,
    deactivation_reason: family.deactivation_reason || '',
  })

  formValidationMessage.value = ''
  showFormModal.value = true
}


function closeFormModal() {
  if (isSubmitting.value) return
  showFormModal.value = false
}

async function saveFamily() {
  const name = form.name.trim()
  if (!name) {
    formValidationMessage.value = 'Family name is required'
    return
  }
  if (name.length > 100) {
    formValidationMessage.value = 'Name too long (max 100)'
    return
  }

  isSubmitting.value = true
  formValidationMessage.value = ''

  const payload = {
    name,
    member_ids: form.memberIds.map(Number),
    is_active: form.is_active,
    deactivation_reason: form.is_active ? '' : (form.deactivation_reason.trim() || undefined),
  }



  try {
    let updatedFamily
    if (isEdit.value) {
      updatedFamily = await update_family(editingId.value, payload)
      // Note: you lost editingId -- add ref if needed or pass from row

      const idx = families.value.findIndex(f => f.id === updatedFamily.data.id)
      if (idx !== -1) {
        families.value[idx] = updatedFamily.data
      }
      toast.success('Family updated')
    } else {
      updatedFamily = await create_family(payload)

      families.value.unshift(updatedFamily.data)
      totalCount.value += 1
      toast.success('Family created')
    }
    closeFormModal()
  } catch (err) {

    formValidationMessage.value = err.response?.data?.detail || 'Save failed'
    toast.error(formValidationMessage.value)
  } finally {
    isSubmitting.value = false
    closeFormModal()
  }
}

function openDeleteConfirm(family) {
  deleteTarget.value = family
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
    await delete_family(deleteTarget.value.id)
    families.value = families.value.filter(f => f.id !== deleteTarget.value.id)
    selectedIds.value = selectedIds.value.filter(id => id !== deleteTarget.value.id)
    totalCount.value = Math.max(0, totalCount.value - 1)
    toast.success('Family deleted')
    closeDeleteSingleModal()
  } catch (err) {
    const msg = err.response?.data?.detail || 'Delete failed'
    toast.error(msg)
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
    for (const id of ids) {
      await delete_family(id)
    }

    families.value = families.value.filter(f => !ids.includes(f.id))
    selectedIds.value = []
    totalCount.value = Math.max(0, totalCount.value - ids.length)

    toast.success(`Deleted ${ids.length} families`)
  } catch (error) {
    toast.error('Some deletions failed')
  } finally {
    isDeleting.value = false
    showDeleteBulkModal.value = false
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !families.value.some(f => f.id === id))
  } else {
    const current = new Set(selectedIds.value)
    families.value.forEach(f => current.add(f.id))
    selectedIds.value = [...current]
  }
}

// ── Lifecycle ────────────────────────────────────
onMounted(async () => {
  await loadStudents()
  await loadFamilies()
})
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
