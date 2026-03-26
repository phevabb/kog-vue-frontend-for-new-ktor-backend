<template>
  <CContainer fluid class="py-4 parent-bg">

    <!-- ✅ HEADER -->
    <CCard class="parent-hero shadow-lg border-0 mb-4">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center flex-wrap">

          <div class="d-flex align-items-center">
            <CAvatar size="lg" class="me-3 parent-avatar">
              <i class="cil-user text-white fs-3"></i>
            </CAvatar>

            <div>
              <h2 class="fw-bold text-white mb-0">{{ student.name }}</h2>
              <div class="text-white-50">
                Performance Overview • {{ selectedYear }} — {{ selectedTerm }}
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-3 mt-sm-0">
            <CFormSelect v-model="selectedYear" class="parent-select">
              <option v-for="y in years" :key="y">{{ y }}</option>
            </CFormSelect>

            <CFormSelect v-model="selectedTerm" class="parent-select">
              <option v-for="t in terms" :key="t">{{ t }}</option>
            </CFormSelect>
          </div>

        </div>
      </CCardBody>
    </CCard>


    <!-- ✅ INFO CARDS -->
    <CRow class="mb-4">
      <CCol md="4">
        <CCard class="shadow-sm info-card">
          <CCardBody>
            <div class="small text-muted">Class</div>
            <div class="fs-4 fw-bold">{{ student.class }}</div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="4">
        <CCard class="shadow-sm info-card">
          <CCardBody>
            <div class="small text-muted">Overall Position</div>
            <div class="fs-4 fw-bold">{{ student.position }}</div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="4">
        <CCard class="shadow-sm info-card">
          <CCardBody>
            <div class="small text-muted">Class Average</div>
            <div class="fs-4 fw-bold">{{ classAvg }}%</div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>


    <!-- ✅ PERFORMANCE CHART -->
    <CCard class="shadow parent-card mb-4">
      <CCardBody>
        <h4 class="fw-bold mb-3 text-primary">Performance Chart</h4>

        <div style="height: 360px;">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </CCardBody>
    </CCard>


    <!-- ✅ SUBJECT TABLE -->
    <CCard class="shadow parent-card mb-4">
      <CCardBody>

        <h4 class="fw-bold mb-4">Subject Performance Breakdown</h4>

        <div class="table-responsive">
          <table class="table table-striped performance-table align-middle">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Score</th>
                <th>Position</th>
                <th>Teacher Remark</th>
                <th class="text-center">More</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="sub in subjects" :key="sub.name">
                <td class="fw-bold">{{ sub.name }}</td>
                <td>{{ sub.score }}%</td>
                <td>#{{ sub.position }}</td>
                <td>{{ sub.remark }}</td>
                <td class="text-center">
                  <CButton size="sm" color="primary" variant="outline" @click="openSubject(sub)">
                    View
                  </CButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </CCardBody>
    </CCard>


    <!-- ✅ SUBJECT DETAILS DRAWER -->
    <COffcanvas placement="end" :visible="drawer" @hide="drawer=false" class="subject-offcanvas shadow-lg">
      <CCardBody v-if="activeSubject">

        <div class="d-flex justify-content-between mb-3">
          <h4 class="fw-bold">{{ activeSubject.name }}</h4>

          <CButton color="light" class="rounded-circle" @click="drawer=false">
            <i class="cil-x fs-4"></i>
          </CButton>
        </div>

        <p class="text-muted">{{ activeSubject.description }}</p>

        <CCard class="shadow-sm border-0 p-3 mt-3 info-mini">
          <div class="d-flex justify-content-between"><span>Score</span><b>{{ activeSubject.score }}%</b></div>
          <div class="d-flex justify-content-between"><span>Position</span><b>#{{ activeSubject.position }}</b></div>
          <div class="d-flex justify-content-between"><span>Teacher Remark</span><b>{{ activeSubject.remark }}</b></div>
        </CCard>

      </CCardBody>
    </COffcanvas>

  </CContainer>
</template>


<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";

/* ✅ Student Info */
const student = ref({
  name: "Kwame Aidoo",
  class: "Class 6",
  position: "5th / 32",
});

/* ✅ Filters */
const years = ["2024/2025", "2025/2026"];
const terms = ["1st Term", "2nd Term", "3rd Term"];

const selectedYear = ref("2025/2026");
const selectedTerm = ref("1st Term");

/* ✅ FULL 8‑SUBJECT BREAKDOWN */
const subjects = ref([
  { name: "English", score: 82, best: 95, average: 76, worst: 40, position: 4, remark: "Good", description: "Language skills and comprehension." },
  { name: "Maths", score: 78, best: 97, average: 72, worst: 34, position: 6, remark: "Improving", description: "Algebra, geometry, numeracy." },
  { name: "Science", score: 74, best: 89, average: 70, worst: 32, position: 8, remark: "Try harder", description: "Physics, Biology, Chemistry." },
  { name: "History", score: 69, best: 92, average: 63, worst: 29, position: 10, remark: "Fair", description: "Ancient and modern history." },
  { name: "RME", score: 85, best: 96, average: 78, worst: 50, position: 3, remark: "Very Good", description: "Religious and moral education." },
  { name: "Fante", score: 90, best: 98, average: 84, worst: 45, position: 2, remark: "Excellent", description: "Local language studies." },
  { name: "Creative Arts", score: 71, best: 88, average: 66, worst: 30, position: 9, remark: "Good effort", description: "Drawing, crafts, drama, music." },
  { name: "ICT", score: 88, best: 100, average: 81, worst: 54, position: 2, remark: "Excellent", description: "Computing essentials." },
]);

/* ✅ Class Average */
const classAvg = ref(75);

/* ✅ Chart reference */
const chartCanvas = ref(null);
let chartInstance;

onMounted(() => {
  const labels = subjects.value.map(s => s.name);

  const studentScores = subjects.value.map(s => s.score);
  const bestScores = subjects.value.map(s => s.best);
  const avgScores = subjects.value.map(s => s.average);
  const worstScores = subjects.value.map(s => s.worst);

  chartInstance = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Your Child",
          data: studentScores,
          borderColor: "#FFD000",
          backgroundColor: "#FFD000",
          borderWidth: 4,
          tension: 0.25,
          pointStyle: "star",
          pointRadius: 7,
        },
        {
          label: "Best Student",
          data: bestScores,
          borderColor: "#004CFF",
          borderDash: [6, 4],
          borderWidth: 3,
          tension: 0.25,
          pointStyle: "triangle",
          pointRadius: 7,
        },
        {
          label: "Class Average",
          data: avgScores,
          borderColor: "#8B4513",
          borderDash: [2, 6],
          borderWidth: 3,
          tension: 0.25,
          pointStyle: "rectRounded",
          pointRadius: 7,
        },
        {
          label: "Worst Student",
          data: worstScores,
          borderColor: "#FF1E1E",
          borderWidth: 3,
          tension: 0.25,
          pointStyle: "cross",
          pointRadius: 7,
        },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 14, weight: "600" } },
        }
      },
      scales: {
        y: { suggestedMin: 0, suggestedMax: 100, ticks: { stepSize: 10 } }
      }
    }
  });
});

/* ✅ Offcanvas Logic */
const drawer = ref(false);
const activeSubject = ref(null);

function openSubject(sub) {
  activeSubject.value = sub;
  drawer.value = true;
}
</script>


<style scoped>
.parent-bg {
  background: #eef2f8;
  min-height: 100vh;
}

.parent-hero {
  background: linear-gradient(135deg, #6a4eff, #4b79ff);
  border-radius: 20px;
}

.parent-avatar {
  background: rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(4px);
}

.info-card {
  border-radius: 14px;
}

.parent-card {
  border-radius: 18px;
}

.performance-table thead {
  background: #f4f6fa;
  font-weight: bold;
}

.subject-offcanvas {
  width: 380px !important;
  background: #fbfbff;
}

.info-mini {
  border-radius: 12px;
}
</style>
