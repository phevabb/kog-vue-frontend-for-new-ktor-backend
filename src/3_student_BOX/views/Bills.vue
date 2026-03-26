<template>
  <CContainer fluid class="py-4 bills-bg">

    <!-- ✅ HEADER -->
    <CCard class="bills-hero shadow-lg border-0 mb-4">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center flex-wrap">

          <div class="d-flex align-items-center">
            <CAvatar size="lg" class="me-3 bills-avatar">
              <i class="cil-credit-card text-white fs-3"></i>
            </CAvatar>

            <div>
              <h2 class="fw-bold text-white mb-0">{{ student.name }}</h2>
              <div class="text-white-50">Billing Summary • {{ selectedYear }} — {{ selectedTerm }}</div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-3 mt-sm-0">
            <CFormSelect v-model="selectedYear" class="bills-select">
              <option v-for="y in years" :key="y">{{ y }}</option>
            </CFormSelect>

            <CFormSelect v-model="selectedTerm" class="bills-select">
              <option v-for="t in terms" :key="t">{{ t }}</option>
            </CFormSelect>
          </div>

        </div>
      </CCardBody>
    </CCard>


    <!-- ✅ BILL SUMMARY CARDS -->
    <CRow class="mb-4">

      <CCol md="4">
        <CCard class="bill-card shadow-sm">
          <CCardBody>
            <div class="small text-muted">Current Bill</div>
            <div class="fs-3 fw-bold text-primary">GH¢ {{ bill.current }}</div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="4">
        <CCard class="bill-card shadow-sm">
          <CCardBody>
            <div class="small text-muted">Arrears</div>
            <div class="fs-3 fw-bold text-danger">GH¢ {{ bill.arrears }}</div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="4">
        <CCard class="bill-card shadow-sm">
          <CCardBody>
            <div class="small text-muted">Total Outstanding</div>
            <div class="fs-3 fw-bold text-dark">GH¢ {{ totalOutstanding }}</div>
          </CCardBody>
        </CCard>
      </CCol>

    </CRow>



    <!-- ✅ INVOICE BREAKDOWN -->
    <CCard class="bill-section shadow-sm mb-4">
      <CCardBody>

        <h4 class="fw-bold text-primary mb-4">Invoice Details</h4>

        <div class="table-responsive">
          <table class="table table-striped bill-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-end">Amount (GH¢)</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="row in invoice" :key="row.label">
                <td>{{ row.label }}</td>
                <td class="text-end">{{ row.amount }}</td>
              </tr>
            </tbody>

            <tfoot>
              <tr class="fw-bold">
                <td>Total</td>
                <td class="text-end">GH¢ {{ bill.current }}</td>
              </tr>
            </tfoot>

          </table>
        </div>

      </CCardBody>
    </CCard>



    <!-- ✅ PAYMENT HISTORY -->
    <CCard class="bill-section shadow-sm">
      <CCardBody>

        <h4 class="fw-bold text-primary mb-4">Payment History</h4>

        <div class="table-responsive">
          <table class="table table-striped payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Mode</th>
                <th class="text-end">Amount (GH¢)</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="pay in payments" :key="pay.date">
                <td>{{ pay.date }}</td>
                <td>{{ pay.mode }}</td>
                <td class="text-end">{{ pay.amount }}</td>
              </tr>
            </tbody>

            <tfoot>
              <tr class="fw-bold">
                <td colspan="2">Total Paid</td>
                <td class="text-end text-success">GH¢ {{ totalPaid }}</td>
              </tr>
            </tfoot>

          </table>
        </div>

      </CCardBody>
    </CCard>

  </CContainer>
</template>
<script setup>
import { ref, computed } from "vue";

/* ✅ Dummy Student Info */
const student = ref({
  name: "Kwame Aidoo",
  class: "Class 6"
});

/* ✅ Filters */
const years = ["2024/2025", "2025/2026"];
const terms = ["1st Term", "2nd Term", "3rd Term"];

const selectedYear = ref("2025/2026");
const selectedTerm = ref("1st Term");

/* ✅ Bill Structure */
const bill = ref({
  current: 850,   // current term charges
  arrears: 200,   // unpaid from last term
});

/* ✅ Invoice Breakdown */
const invoice = ref([
  { label: "Tuition Fee", amount: 500 },
  { label: "Books & Stationery", amount: 120 },
  { label: "ICT Lab Fee", amount: 80 },
  { label: "PTA Dues", amount: 50 },
  { label: "Uniform Maintenance", amount: 100 },
]);

/* ✅ Payment History */
const payments = ref([
  { date: "Feb 10, 2026", mode: "Cash", amount: 300 },
  { date: "Feb 25, 2026", mode: "Momo", amount: 350 },
]);

/* ✅ Computed */
const totalPaid = computed(() =>
  payments.value.reduce((sum, p) => sum + p.amount, 0)
);

const totalOutstanding = computed(() =>
  bill.value.current + bill.value.arrears - totalPaid.value
);
</script>


<style scoped>
.parent-bg, .bills-bg {
  background: #eef2f8;
  min-height: 100vh;
}

/* ✅ HERO */
.bills-hero {
  background: linear-gradient(135deg, #5a8dee, #2157d5);
  border-radius: 20px;
}
.bills-avatar {
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(4px);
}

/* ✅ Selects */
.bills-select {
  min-width: 150px;
}

/* ✅ Cards */
.bill-card {
  border-radius: 14px;
  background: #ffffff;
}

/* ✅ Sections */
.bill-section {
  border-radius: 16px;
}

/* ✅ Table Headers */
.bill-table thead,
.payment-table thead {
  background: #f3f5fa;
  font-weight: bold;
}

/* ✅ Totals */
.bill-table tfoot td,
.payment-table tfoot td {
  background: #fafbff;
  font-size: 1.1rem;
}

/* ✅ Striped Rows */
.bill-table tbody tr:nth-child(odd),
.payment-table tbody tr:nth-child(odd) {
  background: #f8faff !important;
}
</style>
