<template>
<CRow>
  <CCol :xs="12">
    <CCard class="mb-4">
      <CCardHeader class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-sm-between gap-2">
        <div>
          <h5 class="mb-0">Fee Overview </h5>
          <small class="text-body-secondary">Projected Collections</small>
        </div>

        <div class="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
          <!-- Search Input -->
          <CFormInput
            v-model="searchTerm"
            placeholder="Search by Year..."
            size="sm"
            style="width: 250px;"
          />
        </div>
      </CCardHeader>

      <CCardBody>
        <CAlert color="danger" v-if="errorMessage" class="py-2">
          {{ errorMessage }}
        </CAlert>

        <div class="d-flex align-items-center gap-2 mb-2" v-if="isLoading">
          <CSpinner size="sm" />
          <span class="text-body-secondary small">Loading fee records…</span>
        </div>

        <DocsExample>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col" style="width: 60px;">#</CTableHeaderCell>

                <CTableHeaderCell scope="col">Term</CTableHeaderCell>
                <CTableHeaderCell scope="col">Academic Year</CTableHeaderCell>
                <CTableHeaderCell scope="col">Collected Amount (GHS)</CTableHeaderCell>
                <CTableHeaderCell scope="col">Pending Amount (GHS)</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="(row, idx) in filteredRecords" :key="row.id">
                <CTableHeaderCell scope="row">{{ idx + 1 }}</CTableHeaderCell>

                <CTableDataCell>{{ row.term }}</CTableDataCell>
                <CTableDataCell>{{ row.academicYear }}</CTableDataCell>
                <CTableDataCell>{{ formatNumber(row.collectedAmount) }}</CTableDataCell>
                <CTableDataCell>{{ formatNumber(row.pendingAmount) }}</CTableDataCell>




              </CTableRow>
            </CTableBody>
          </CTable>
        </DocsExample>
      </CCardBody>
    </CCard>
  </CCol>
</CRow>


</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { get_collected_vs_pending_insight_ktor } from '../../../services/api'

const isLoading = ref(false)
const errorMessage = ref('')
const records = ref([])

function formatNumber(value) {
  if (value === null || value === undefined) return '0.00'

  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}



// single search term
const searchTerm = ref('')

const filteredRecords = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return records.value

  return records.value.filter(row => {
    return String(row?.academic_year || '').toLowerCase().includes(q)
  })
})

async function loadRecords() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const rows = await get_collected_vs_pending_insight_ktor()




    records.value = rows.data || rows
  } catch (err) {

    errorMessage.value = err?.message || 'Failed to load fee records.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadRecords())
</script>



<style scoped>
/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 {
    row-gap: 0.5rem;
  }
}
</style>
