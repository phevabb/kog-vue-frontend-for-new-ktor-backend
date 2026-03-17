<template>
  <CContainer fluid class="mt-4">

    <!-- Page Header -->
    <CRow>
      <CCol>
        <h3 class="mb-3">Payment History</h3>
      </CCol>
    </CRow>

    <!-- ========================== -->
    <!-- SECTION 1: PAYMENTS PER TERM -->
    <!-- ========================== -->
    <CRow class="mb-4">
      <CCol>
        <CCard>
          <CCardHeader>
            <strong>Payments Per Term</strong>
          </CCardHeader>

<!-- Payment History -->
<v-card elevation="3" class="pa-4 mt-4">

  <v-table density="comfortable">
    <thead>
      <tr>
        <th>#</th>
        <th>Term</th>
        <th>Academic Year</th>
        <th>Class</th>
        <th class="text-end">Amount Paid (GHS)</th>
        <th class="text-end">Balance (GHS)</th>
        <th>Fully Paid</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="(rec, i) in filteredPayments_year" :key="rec.id">
        <td>{{ i + 1 }}</td>
        <td>{{ rec.term }}</td>
        <td>{{ rec.academicyear }}</td>
        <td>{{ rec.gradeclass }}</td>

        <!-- Right-aligned currency formatting -->
        <td class="text-end">{{ formatMoney(rec.amount) }}</td>
        <td class="text-end">{{ formatMoney(rec.balance) }}</td>

        <!-- Status chip with icon (same logic) -->
        <td>
          <v-chip
            :color="rec.fullypaid ? 'success' : 'error'"
            variant="flat"
            size="small"
            class="text-white"
          >
            <v-icon size="16" class="mr-1">
              {{ rec.fullypaid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
            {{ rec.fullypaid ? 'Fully Paid' : 'Not Paid' }}
          </v-chip>
        </td>
      </tr>
    </tbody>
  </v-table>
</v-card>


 <!-- Loading / Error -->
        <div v-if="loading" class="mt-4 text-grey">Loading student…</div>
        <div v-if="errorMsg" class="mt-2" style="color:#d32f2f;">{{ errorMsg }}</div>

        </CCard>
      </CCol>
    </CRow>

    <!-- ========================== -->
    <!-- SECTION 2: PAYMENT RECORDS -->
    <!-- ========================== -->

    <!-- Filters -->


    <!-- Payment Table -->
    <CCard>
      <CCardHeader>
        <strong>Payments</strong>
      </CCardHeader>

      <CCardBody class="p-0">
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Class</CTableHeaderCell>
              <CTableHeaderCell>Term</CTableHeaderCell>

              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell>Amount</CTableHeaderCell>
              <CTableHeaderCell>Method</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
<CTableRow v-for="(p, index) in filteredPayments_regular" :key="p.id">
  <CTableDataCell>{{ index + 1 + (page-1)*perPage }}</CTableDataCell>

  <CTableDataCell>{{ p.class }}</CTableDataCell>

  <CTableDataCell>{{ p.term }}</CTableDataCell>


  <CTableDataCell>{{ p.date }}</CTableDataCell>
  <CTableDataCell>{{ formatAmount(p.amount) }}</CTableDataCell>
  <CTableDataCell>{{ p.payment_method || 'Cash' }}</CTableDataCell>
</CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>

    </CCard>


  </CContainer>
</template>



<script setup>
import {
  CContainer, CRow, CCol, CCard, CCardHeader, CCardBody,
  CTable, CTableBody, CTableHead, CTableRow, CTableDataCell, CTableHeaderCell,
} from '@coreui/vue'
import { ref, computed, onMounted, watch } from 'vue'
import {
  get_student_payment_list_per_term,
  get_family_payment_list_per_term,
  get_family_payment_list_regular,
  get_regular_payments
} from "@/services/api"

/* ---------------------------------------------
   STATE
--------------------------------------------- */
const loading = ref(false)
const errorMsg = ref("")

// Per-term data
const perTermRecords = ref([])          // student per-term (year summary)
const payments_family_year = ref([])    // family per-term (year summary)

// Regular payments (second table)
const payments = ref([])                // student regular payments
const payments_family_regular = ref([]) // family regular payments

// Simple flags (optional)
const isFamily = ref(false)
const fam_id = ref("")

// Initialize family flag safely
try {
  const tmp = localStorage.getItem("family")
  if (tmp) isFamily.value = true
} catch (e) {
  // ignore parse/availability errors
}

/* ---------------------------------------------
   MERGED LISTS
--------------------------------------------- */
const filteredPayments_year = computed(() => [
  ...perTermRecords.value,
  ...payments_family_year.value
])

const filteredPayments_regular = computed(() => [
  ...payments.value,
  ...payments_family_regular.value
])

// Debug: see when merged lists update
watch(filteredPayments_year, (v) => {

}, { immediate: true })

watch(filteredPayments_regular, (v) => {

}, { immediate: true })

/* ---------------------------------------------
   LIFECYCLE: FETCH ALL DATA
--------------------------------------------- */
onMounted(async () => {
  loading.value = true
  try {


    // --- user id from localStorage (defensive) ---
    const userString = localStorage.getItem("user") || "{}"
    const userLocal = JSON.parse(userString)
    const uid = userLocal?.user_id

    // --- fetch student per-term + student regular in parallel ---
    const [paymentsRes, regular] = await Promise.all([
      get_student_payment_list_per_term(uid),
      get_regular_payments(uid)
    ])

    // --- prepare holders for family responses (DO NOT re-declare later) ---
    let fam_year_rec = { data: { records: [] } }
    let fam_fee_reg = { data: [] } // assuming .data is an array for family regulars

    // --- fetch family per-term + family regular if present in localStorage ---
    const familyData = localStorage.getItem("family")
    if (familyData) {
      const familyLocal = JSON.parse(familyData)
      if (familyLocal?.id) {
        fam_id.value = familyLocal.id
        // IMPORTANT: assign to outer lets (no const here)
        fam_year_rec = await get_family_payment_list_per_term(fam_id.value)
        fam_fee_reg = await get_family_payment_list_regular(fam_id.value)

     }
    }

    // --- map family per-term (use API shape you logged) ---
    payments_family_year.value = (fam_year_rec?.data?.records ?? []).map(item => ({
      term: item?.term_name,
      academicyear: item?.academic_year_name, // keep your chosen key
      balance: item?.balance,
      gradeclass: item?.fee_structure?.grade_class?.name,
      fullypaid: item?.is_fully_paid,
      date: item?.date_created ? new Date(item.date_created).toLocaleDateString() : "",
      amount: Number(item?.amount_paid ?? 0),
    }))

    // --- map student per-term ---
    perTermRecords.value = (paymentsRes?.data ?? []).map(item => ({
      term: item?.fee_structure?.term?.name,
      academicyear: item?.fee_structure?.academic_year?.name,
      balance: item?.balance,
      gradeclass: item?.fee_structure?.grade_class?.name,
      fullypaid: item?.is_fully_paid,
      date: item?.date_created ? new Date(item.date_created).toLocaleDateString() : "",
      amount: Number(item?.amount_paid ?? 0),
    }))

    // --- map student regular payments (second table) ---
    payments.value = (regular?.data ?? []).map(item => ({
      id: item?.id,
      date: item?.date ?? "",
      amount: Number(item?.amount ?? 0),
      payment_method: item?.payment_method ?? "Cash",
      term: item?.term ?? "",
      year: item?.academic_year ?? "",
      class: item?.grade_class ?? "",
    }))

    // --- map family regular payments (second table) ---
    // If your API returns { data: [] } for family regulars:
    payments_family_regular.value = (fam_fee_reg?.data ?? []).map(item => ({
      id: item?.id,
      date: item?.date ?? "",
      amount: Number(item?.amount ?? 0),
      payment_method: item?.payment_method ?? "Cash",
      term: item?.term_name ?? item?.term ?? "",
      year: item?.academic_year ?? item?.academicyear ?? "",
      class: item?.grade_class ?? item?.class ?? "",
    }))

  } catch (err) {

    errorMsg.value = "Failed to load student profile."
  } finally {
    loading.value = false
  }
})

/* ---------------------------------------------
   OPTIONAL: Filtering/paging for regular payments
   (update to work on the merged regular list)
--------------------------------------------- */
const search = ref("")
const paymentMethod = ref("")
const dateFrom = ref("")
const dateTo = ref("")

function normalizeDate(d) {
  return d || ""
}

const filteredRegular = computed(() => {
  const s = search.value.trim().toLowerCase()
  const method = paymentMethod.value
  const from = normalizeDate(dateFrom.value)
  const to = normalizeDate(dateTo.value)

  return filteredPayments_regular.value.filter(p => {
    const haystack = [
      p.class ?? "",
      p.term ?? "",
      p.year ?? "",
      p.payment_method ?? "",
      String(p.amount ?? ""),
      p.date ?? ""
    ].join(" ").toLowerCase()

    const matchSearch = s ? haystack.includes(s) : true
    const matchMethod = method ? (p.payment_method === method) : true
    const matchDateFrom = from ? (p.date >= from) : true
    const matchDateTo = to ? (p.date <= to) : true

    return matchSearch && matchMethod && matchDateFrom && matchDateTo
  })
})

const page = ref(1)
const perPage = 10
const totalPages = computed(() => Math.ceil(filteredRegular.value.length / perPage))
const paginatedRegular = computed(() => {
  const start = (page.value - 1) * perPage
  return filteredRegular.value.slice(start, start + perPage)
})

/* ---------------------------------------------
   FORMATTING
--------------------------------------------- */
const formatAmount = (a) => `${Number(a).toFixed(2)} GHS`

function formatMoney(value) {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return value
  return new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
</script>

