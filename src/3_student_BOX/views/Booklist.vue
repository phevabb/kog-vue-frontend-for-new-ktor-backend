<template>
  <CContainer fluid class="py-4 book-bg">

    <!-- ✅ HEADER -->
    <CCard class="book-hero shadow-lg border-0 mb-4">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center flex-wrap">

          <div class="d-flex align-items-center">
            <CAvatar size="lg" class="me-3 book-avatar">
              <i class="cil-library text-white fs-3"></i>
            </CAvatar>

            <div>
              <h2 class="fw-bold text-white mb-0">Booklist for {{ student.name }}</h2>
              <div class="text-white-50">Academic Year • {{ selectedYear }}</div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-3 mt-sm-0">
            <CFormSelect v-model="selectedYear" class="book-select">
              <option v-for="y in years" :key="y">{{ y }}</option>
            </CFormSelect>
          </div>

        </div>
      </CCardBody>
    </CCard>


    <!-- ✅ SUMMARY CARDS -->
    <CRow class="mb-4">
      <CCol md="4">
        <CCard class="summary-card shadow-sm">
          <CCardBody>
            <div class="small text-muted">Total Books</div>
            <div class="fs-3 fw-bold text-primary">{{ totalBooks }}</div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="4">
        <CCard class="summary-card shadow-sm">
          <CCardBody>
            <div class="small text-muted">Purchased Books</div>
            <div class="fs-3 fw-bold text-success">{{ purchasedBooks }}</div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="4">
        <CCard class="summary-card shadow-sm">
          <CCardBody>
            <div class="small text-muted">Outstanding Cost</div>
            <div class="fs-3 fw-bold text-danger">GH¢ {{ outstandingCost }}</div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>



    <!-- ✅ BOOKLIST TABLE -->
    <CCard class="book-section shadow-sm mb-4">
      <CCardBody>

        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="fw-bold text-primary">Required Books</h4>

          <CButton color="info" variant="outline" @click="downloadList">
            <i class="cil-cloud-download me-2"></i> Download PDF
          </CButton>
        </div>

        <div class="table-responsive">
          <table class="table table-striped book-table align-middle">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Subject</th>
                <th>Price (GH¢)</th>
                <th>Status</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="book in books" :key="book.title">
                <td class="fw-bold">{{ book.title }}</td>
                <td>{{ book.subject }}</td>
                <td>{{ book.price }}</td>

                <td>
                  <span
                    class="badge"
                    :class="book.purchased ? 'bg-success' : 'bg-warning text-dark'"
                  >
                    {{ book.purchased ? "Purchased" : "Not Purchased" }}
                  </span>
                </td>

                <td class="text-center">
                  <CButton
                    size="sm"
                    :color="book.purchased ? 'danger' : 'success'"
                    variant="outline"
                    @click="togglePurchased(book)"
                  >
                    {{ book.purchased ? "Unmark" : "Mark as Purchased" }}
                  </CButton>
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr class="fw-bold">
                <td colspan="2">Total Required Cost</td>
                <td colspan="3">GH¢ {{ totalCost }}</td>
              </tr>
            </tfoot>

          </table>
        </div>

      </CCardBody>
    </CCard>




    <!-- ✅ BOOK SHELF (VISUAL GRID DISPLAY) -->
    <CCard class="book-section shadow-sm mb-5">
      <CCardBody>

        <h4 class="fw-bold text-primary mb-4">Bookshelf Overview</h4>

        <div class="shelf-grid">
          <div
            v-for="book in books"
            :key="book.title"
            class="shelf-card shadow-sm"
          >
            <div class="shelf-title fw-bold">{{ book.title }}</div>
            <div class="text-muted small">{{ book.subject }}</div>

            <div class="mt-3">
              <span
                class="badge"
                :class="book.purchased ? 'bg-success' : 'bg-secondary'"
              >
                {{ book.purchased ? "Purchased" : "Pending" }}
              </span>
            </div>
          </div>
        </div>

      </CCardBody>
    </CCard>

  </CContainer>
</template>


<script setup>
import { ref, computed } from "vue";

/* ✅ Student */
const student = ref({
  name: "Kwame Aidoo",
  class: "Class 6",
});

/* ✅ Academic years */
const years = ["2024/2025", "2025/2026", "2026/2027"];
const selectedYear = ref("2025/2026");
const selectedTerm = ref("1st Term");

/* ✅ Booklist (Dummy Data) */
const books = ref([
  { title: "New Oxford Mathematics P6", subject: "Maths", price: 60, purchased: false },
  { title: "Essential English P6", subject: "English", price: 55, purchased: true },
  { title: "Integrated Science for Schools P6", subject: "Science", price: 70, purchased: false },
  { title: "Ghana History Made Simple", subject: "History", price: 45, purchased: false },
  { title: "RME for Primary 6", subject: "RME", price: 50, purchased: true },
  { title: "Fante Reader P6", subject: "Fante", price: 35, purchased: false },
  { title: "Creative Arts Workbook", subject: "Creative Arts", price: 40, purchased: false },
  { title: "ICT Power Book P6", subject: "ICT", price: 65, purchased: true },
]);

/* ✅ Computed Values */
const totalBooks = computed(() => books.value.length);

const purchasedBooks = computed(() =>
  books.value.filter(b => b.purchased).length
);

const totalCost = computed(() =>
  books.value.reduce((sum, b) => sum + b.price, 0)
);

const outstandingCost = computed(() =>
  books.value
    .filter(b => !b.purchased)
    .reduce((sum, b) => sum + b.price, 0)
);

/* ✅ Toggle purchased status */
function togglePurchased(book) {
  book.purchased = !book.purchased;
}

/* ✅ Download (future placeholder) */
function downloadList() {
  alert("📄 Booklist PDF will be available soon!");
}
</script>


<style scoped>
.book-bg {
  background: #eef2f8;
  min-height: 100vh;
}

/* ✅ Hero Banner */
.book-hero {
  background: linear-gradient(135deg, #4b79ff, #6a4eff);
  border-radius: 20px;
}
.book-avatar {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(4px);
}

/* ✅ Summary Cards */
.summary-card {
  border-radius: 16px;
  background: #ffffff;
}

/* ✅ Book Sections */
.book-section {
  border-radius: 18px;
  background: #ffffff;
}

/* ✅ Table */
.book-table thead {
  background: #f3f5fa;
  font-weight: bold;
}

/* ✅ Bookshelf Grid */
.shelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.shelf-card {
  background: #f8faff;
  padding: 18px;
  border-radius: 12px;
  transition: 0.25s;
}
.shelf-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}

.shelf-title {
  font-size: 15px;
}
</style>
