<template>
  <CContainer fluid class="py-4 premium-bg">

    <!-- ✅ HEADER -->
    <CCard class="mb-4 premium-hero shadow-lg border-0">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center flex-wrap">

          <div class="d-flex align-items-center mb-3 mb-sm-0">
            <CAvatar size="lg" class="me-3 hero-avatar">
              <i class="cil-school text-white fs-3"></i>
            </CAvatar>

            <div>
              <h3 class="text-white fw-bold mb-1">
                Class Academic Performance Dashboard
              </h3>
              <div class="text-white-50">
                Insights • Top Students • Subject Analytics • Reports
              </div>
            </div>
          </div>

          <div class="d-flex gap-2">
            <CFormSelect v-model="selectedYear" class="premium-select">
              <option v-for="y in years" :key="y">{{ y }}</option>
            </CFormSelect>

            <CFormSelect v-model="selectedTerm" class="premium-select">
              <option v-for="t in terms" :key="t">{{ t }}</option>
            </CFormSelect>
          </div>

        </div>
      </CCardBody>
    </CCard>


    <!-- ✅ KPI SECTION -->
    <CRow class="mb-4">
      <CCol sm="6" md="3" v-for="k in kpis" :key="k.label">
        <CCard class="p-3 text-white border-0 shadow kpi-card" :class="k.bg">
          <div class="small">{{ k.label }}</div>
          <div class="fs-3 fw-bold">{{ k.value }}</div>
        </CCard>
      </CCol>
    </CRow>


    <!-- ✅ SUBJECT ANALYTICS (CLASS LEVEL) -->
    <CCard class="premium-card shadow mb-4">
      <CCardBody>
        <h5 class="fw-bold mb-3">Subject Analytics</h5>

        <CRow>
          <CCol md="3" v-for="s in subjects" :key="s.name">
            <CCard class="subject-card shadow-sm mb-3 border-0">
              <CCardBody>
                <h6 class="fw-bold">{{ s.name }}</h6>
                <div class="text-muted small">
                  Class Average: <b>{{ s.average }}%</b>
                </div>
                <div class="small mt-1">
                  Best Student: <b>{{ s.best }}</b>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

      </CCardBody>
    </CCard>


    <!-- ✅ SUBJECT ANALYTICS — PER STUDENT -->
    <CCard class="premium-card shadow mb-4">
      <CCardBody>
        <h5 class="fw-bold mb-3">Subject Analytics — Per Student</h5>

        <div class="table-responsive">
          <table class="table table-striped premium-table">
            <thead>
              <tr>
                <th>Student</th>
                <th v-for="sub in perStudentSubjects" :key="sub.subject" class="text-center">
                  {{ sub.subject }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="stu in students" :key="stu.id">
                <td class="fw-bold">{{ stu.name }}</td>

                <td class="text-center" v-for="sub in perStudentSubjects" :key="sub.subject">
                  <div class="fw-bold">{{ sub.scores[stu.id] }}%</div>
                  <div class="text-muted small">Pos: #{{ sub.positions[stu.id] }}</div>
                  <span class="badge bg-info">{{ sub.grades[stu.id] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </CCardBody>
    </CCard>


    <!-- ✅ STUDENT RANKING -->
    <CCard class="premium-card shadow">
      <CCardBody>

        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold">Student Ranking</h5>

          <CFormInput v-model="search" placeholder="Search student" style="max-width:200px" />
        </div>

        <div class="table-responsive">
          <table class="table table-striped premium-table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Average</th>
                <th>Rank</th>
                <th>Comment Status</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="stu in filteredStudents" :key="stu.id">
                <td>{{ stu.name }}</td>
                <td>{{ stu.average }}%</td>
                <td>#{{ stu.rank }}</td>

                <!-- ✅ STATUS BADGE -->
                <td>
                  <span v-if="studentNotes[stu.id].remarks || studentNotes[stu.id].attitude || studentNotes[stu.id].interest"
                        class="badge bg-success">
                    Comment Added
                  </span>
                  <span v-else class="badge bg-secondary">
                    No Comment
                  </span>
                </td>

                <td class="text-center">
                  <CButton size="sm" color="primary" variant="outline" @click="openStudent(stu)">
                    Add Comment
                  </CButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </CCardBody>
    </CCard>




    <!-- ✅ PREMIUM OFFCANVAS -->
    <COffcanvas
      placement="end"
      :visible="drawer"
      @hide="drawer = false"
      class="premium-offcanvas shadow-lg"
    >

      <!-- Prevent rendering until data is ready -->
      <CCardBody v-if="ready" class="p-4">

        <!-- ✅ HEADER WITH CLOSE BUTTON -->
        <div class="d-flex align-items-center justify-content-between mb-3">

          <div class="d-flex align-items-center">
            <CAvatar color="primary" size="lg" class="me-3 text-white fw-bold">
              {{ initials(activeStudent.name) }}
            </CAvatar>

            <div>
              <h4 class="fw-bold mb-0">{{ activeStudent.name }}</h4>
              <div class="text-muted small">Academic Performance Summary</div>
            </div>
          </div>

          <!-- ✅ X CLOSE BUTTON -->
          <CButton color="light" class="rounded-circle shadow-sm" @click="drawer = false"
                   style="width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
            <i class="cil-x fs-3"></i>
          </CButton>

        </div>

        <hr />


        <!-- ✅ CHARACTER ASSESSMENT -->
        <h6 class="fw-bold text-primary mb-3">Character Assessment</h6>

        <CFormTextarea
          v-model="studentNotes[activeStudent.id].attitude"
          rows="2"
          class="mb-3"
          placeholder="Enter attitude..."
        />

        <CFormTextarea
          v-model="studentNotes[activeStudent.id].interest"
          rows="2"
          class="mb-3"
          placeholder="Enter interest..."
        />

        <hr />


        <!-- ✅ TEACHER REMARKS -->
        <h6 class="fw-bold text-primary mb-2">Teacher’s Remarks</h6>

        <CFormTextarea
          v-model="studentNotes[activeStudent.id].remarks"
          rows="4"
          class="mb-3"
          placeholder="Enter your remarks..."
        />

        <CButton color="success" class="w-100" @click="saveRemark">
          <i class="cil-check me-2"></i> Save Remark
        </CButton>

      </CCardBody>
    </COffcanvas>

  </CContainer>
</template>

<script setup>
import { ref, computed } from "vue";

/* ✅ Year/Term selects */
const years = ["2024/2025", "2025/2026"];
const terms = ["1st Term", "2nd Term", "3rd Term"];

const selectedYear = ref("2025/2026");
const selectedTerm = ref("1st Term");

/* ✅ KPI counters */
const kpis = ref([
  { label: "Total Students", value: 32, bg: "bg-success" },
  { label: "Class Average", value: "72%", bg: "bg-primary" },
  { label: "Best Student", value: "Kwame Aidoo", bg: "bg-info" },
  { label: "Lowest Student", value: "Ama Serwaa", bg: "bg-danger" },
]);

/* ✅ Class-wide subject analytics */
const subjects = ref([
  { name: "Math", average: 82, best: "Kwame" },
  { name: "English", average: 76, best: "Kojo" },
  { name: "Science", average: 69, best: "Akua" },
  { name: "ICT", average: 91, best: "Yaw" },
  { name: "RME", average: 73, best: "Kojo" },
  { name: "History", average: 79, best: "Aidoo" },
  { name: "Fante", average: 85, best: "Kwesi" },
]);

/* ✅ Students */
const students = ref([
  { id: 1, name: "Kwame Aidoo", average: 90, rank: 1 },
  { id: 2, name: "Kojo Mensah", average: 84, rank: 2 },
  { id: 3, name: "Ama Serwaa", average: 62, rank: 24 },
]);

const search = ref("");

const filteredStudents = computed(() => {
  if (!search.value) return students.value;
  return students.value.filter((s) =>
    s.name.toLowerCase().includes(search.value.toLowerCase())
  );
});

/* ✅ Per-Student Subject Analytics */
const perStudentSubjects = ref([
  {
    subject: "Math",
    scores: { 1: 88, 2: 67, 3: 55 },
    positions: { 1: 2, 2: 14, 3: 21 },
    grades: { 1: "A", 2: "C", 3: "D" }
  },
  {
    subject: "English",
    scores: { 1: 80, 2: 74, 3: 50 },
    positions: { 1: 4, 2: 8, 3: 18 },
    grades: { 1: "B", 2: "B", 3: "D" }
  },
  {
    subject: "Science",
    scores: { 1: 92, 2: 70, 3: 40 },
    positions: { 1: 1, 2: 11, 3: 30 },
    grades: { 1: "A", 2: "C", 3: "E" }
  },
  {
    subject: "ICT",
    scores: { 1: 95, 2: 82, 3: 55 },
    positions: { 1: 1, 2: 5, 3: 20 },
    grades: { 1: "A", 2: "B", 3: "D" }
  }
]);

/* ✅ Offcanvas logic */
const drawer = ref(false);
const activeStudent = ref(null);

/* ✅ Per-student editable notes (Attitude, Interest, Remarks) */
const studentNotes = ref({});

students.value.forEach(stu => {
  studentNotes.value[stu.id] = {
    attitude: "",
    interest: "",
    remarks: ""
  };
});

/* ✅ Safe rendering guard */
const ready = computed(() => {
  return activeStudent.value && studentNotes.value[activeStudent.value.id];
});

/* ✅ Open */
function openStudent(stu) {
  activeStudent.value = stu;
  drawer.value = true;
}

/* ✅ Save remark + auto-close drawer */
function saveRemark() {
  const s = studentNotes.value[activeStudent.value.id];
  alert(`✅ Saved for ${activeStudent.value.name}`);

  drawer.value = false;  // ✅ Auto-close
}

/* ✅ Avatar initials helper */
function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map(n => n[0].toUpperCase())
    .join("");
}
</script>

<style scoped>
.premium-bg {
  background: #f2f4f8;
  min-height: 100vh;
}

.premium-hero {
  background: linear-gradient(135deg, #673ab7, #3f51b5);
  border-radius: 20px;
}

.hero-avatar {
  background: rgba(255, 255, 255, 0.2);
}

.kpi-card {
  border-radius: 14px;
}

.premium-card {
  border-radius: 18px;
  background: white;
}

.subject-card {
  border-radius: 16px;
  background: #fafbff;
}

.premium-table thead {
  background: #eef1f6;
  font-weight: bold;
}

.premium-table tbody tr:hover {
  background: #f7f9ff;
}

.premium-offcanvas {
  width: 420px !important;
  background: #f8f9fc;
  border-left: 1px solid #e3e6ef;
}

.stat-card {
  background: white;
  border-radius: 14px;
}

.subject-grade-card {
  background: white;
  border-radius: 14px;
  transition: 0.2s;
}

.subject-grade-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
</style>
