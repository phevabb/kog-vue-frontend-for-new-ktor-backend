<template>
  <CContainer fluid class="py-4 attend-bg">

    <!-- ✅ ULTRA MODERN HEADER -->
    <CCard class="attend-hero shadow-lg border-0 mb-4">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center flex-wrap">

          <div class="d-flex align-items-center">
            <CAvatar size="lg" class="me-3 attend-avatar">
              <i class="cil-calendar-check text-white fs-2"></i>
            </CAvatar>

            <div>
              <h2 class="fw-bold text-white mb-0">Attendance Dashboard</h2>
              <div class="text-white-50">
                Track attendance • Mark register • Analyse class presence
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 mt-3 mt-sm-0">
            <CFormSelect v-model="selectedMonth" class="attend-select">
              <option v-for="m in months" :key="m">{{ m }}</option>
            </CFormSelect>
            <CFormSelect v-model="selectedYear" class="attend-select">
              <option v-for="y in years" :key="y">{{ y }}</option>
            </CFormSelect>
          </div>

        </div>
      </CCardBody>
    </CCard>


    <!-- ✅ KPI ROW -->
    <CRow class="mb-4">
      <CCol sm="6" md="3" v-for="k in analytics" :key="k.label">
        <CCard class="p-4 text-white border-0 shadow attend-kpi" :class="k.bg">
          <div class="small">{{ k.label }}</div>
          <div class="display-6 fw-bold">{{ k.value }}</div>
        </CCard>
      </CCol>
    </CRow>


    <!-- ✅ ATTENDANCE HEATMAP -->
    <CCard class="attend-card shadow mb-4">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="fw-bold">Attendance Heatmap</h4>
          <div class="small text-muted">Darker = more absences</div>
        </div>

        <div class="heatmap-grid">
          <div
            v-for="day in heatmap"
            :key="day.day"
            class="heatmap-cell"
            :style="{ backgroundColor: heatColor(day.absences) }"
            @click="viewDay(day)"
          >
            {{ day.day }}
          </div>
        </div>
      </CCardBody>
    </CCard>



    <!-- ✅ ✅ ✅ TAKE ATTENDANCE (REGISTER) -->
    <CCard class="attend-card shadow mb-4">
      <CCardBody>

        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="fw-bold">Take Attendance</h4>
          <div class="small text-muted">{{ today }}</div>
        </div>

        <div class="table-responsive">
          <table class="table attendance-take-table table-striped align-middle">

            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th class="text-center">Present</th>
                <th class="text-center">Absent</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(stu, i) in students" :key="stu.id">

                <td>{{ i + 1 }}</td>
                <td class="fw-bold">{{ stu.name }}</td>

                <td class="text-center">
                  <input
                    type="checkbox"
                    class="form-check-input attend-checkbox"
                    :checked="todayAttendance[stu.id] === 'present'"
                    @change="markPresent(stu.id)"
                  />
                </td>

                <td class="text-center">
                  <input
                    type="checkbox"
                    class="form-check-input attend-checkbox"
                    :checked="todayAttendance[stu.id] === 'absent'"
                    @change="markAbsent(stu.id)"
                  />
                </td>

              </tr>
            </tbody>
          </table>
        </div>

<CButton
  color="primary"
  class="px-4 mt-3"
  @click="submitAttendance"
  :style="btnStyle"
  @mouseover="btnStyle.backgroundColor = '#0b5ed7'"
  @mouseleave="btnStyle.backgroundColor = '#0d6efd'"
>
  <i class="cil-check me-2" style="color: white;"></i>
  <span style="color: white;">Submit Attendance</span>
</CButton>

      </CCardBody>
    </CCard>



    <!-- ✅ CLASS ATTENDANCE SUMMARY -->
    <CCard class="attend-card shadow mb-4">
      <CCardBody>

        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="fw-bold">Class Attendance Summary</h4>
          <CFormInput v-model="search" placeholder="Search student..." style="max-width:200px" />
        </div>

        <div class="table-responsive">
          <table class="table table-hover attendance-table align-middle">

            <thead>
              <tr>
                <th>Student</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Attendance %</th>
                <th>Status</th>
                <th class="text-center">Details</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="stu in filteredStudents" :key="stu.id">
                <td class="fw-bold">{{ stu.name }}</td>
                <td>{{ stu.present }}</td>
                <td>{{ stu.absent }}</td>
                <td>{{ calcPercent(stu.present, stu.absent) }}%</td>

                <td>
                  <span
                    class="badge"
                    :class="stu.absent === 0 ? 'bg-success' : 'bg-warning text-dark'"
                  >
                    {{ stu.absent === 0 ? 'Perfect' : 'Irregular' }}
                  </span>
                </td>

                <td class="text-center">
                  <CButton size="sm" variant="outline" color="primary" @click="openDetails(stu)">
                    View
                  </CButton>
                </td>
              </tr>
            </tbody>

          </table>
        </div>

      </CCardBody>
    </CCard>



    <!-- ✅ SLIDE‑OVER PANEL -->
    <COffcanvas
      placement="end"
      :visible="drawer"
      @hide="drawer=false"
      class="attend-offcanvas shadow-lg"
    >
      <CCardBody v-if="activeStudent" class="p-4">

        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center">
            <CAvatar color="primary" size="lg" class="me-3 text-white fw-bold">
              {{ initials(activeStudent.name) }}
            </CAvatar>
            <div>
              <h4 class="fw-bold mb-0">{{ activeStudent.name }}</h4>
              <div class="text-muted small">Attendance Record</div>
            </div>
          </div>

          <CButton color="light" class="rounded-circle" @click="drawer=false">
            <i class="cil-x fs-4"></i>
          </CButton>
        </div>


        <CCard class="shadow-sm border-0 p-3 attend-summary mb-3">
          <div class="d-flex justify-content-between"><span>Total Present</span><b>{{ activeStudent.present }}</b></div>
          <div class="d-flex justify-content-between"><span>Total Absent</span><b>{{ activeStudent.absent }}</b></div>
          <div class="d-flex justify-content-between"><span>Attendance %</span><b>{{ calcPercent(activeStudent.present, activeStudent.absent) }}%</b></div>
        </CCard>

        <h6 class="fw-bold text-primary">Absence History</h6>

        <ul class="list-group mb-3">
          <li v-for="(a,i) in activeStudent.absenceHistory" :key="i" class="list-group-item d-flex justify-content-between">
            <span>{{ a.date }} — {{ a.reason }}</span>
            <small class="text-muted">{{ a.type }}</small>
          </li>
        </ul>

      </CCardBody>
    </COffcanvas>

  </CContainer>
</template>

<script setup>
import { ref, computed } from "vue";



const btnStyle = {
  color: "white",
  backgroundColor: "#0d6efd",
  border: "none"
}

/* ✅ Month/Year filters */
const months = ["January", "February", "March", "April"];
const years = ["2024", "2025", "2026"];
const today = new Date().toDateString();

const selectedMonth = ref("March");
const selectedYear = ref("2026");

/* ✅ KPI Analytics */
const analytics = ref([
  { label: "Present Today", value: 28, bg: "bg-success" },
  { label: "Absent Today", value: 4, bg: "bg-danger" },
  { label: "Month Presence Rate", value: "89%", bg: "bg-primary" },
  { label: "Highest Attendance", value: "96%", bg: "bg-info" },
]);

/* ✅ Students */
const students = ref([
  {
    id: 1,
    name: "Kwame Aidoo",
    present: 18,
    absent: 2,
    remark: "",
    absenceHistory: [
      { date: "Mar 5", reason: "Fever", type: "Excused" },
      { date: "Mar 12", reason: "Late", type: "Unexcused" },
    ]
  },
  {
    id: 2,
    name: "Kojo Mensah",
    present: 20,
    absent: 0,
    remark: "",
    absenceHistory: []
  },
  {
    id: 3,
    name: "Ama Serwaa",
    present: 14,
    absent: 6,
    remark: "",
    absenceHistory: [
      { date: "Mar 2", reason: "Travel", type: "Excused" },
      { date: "Mar 11", reason: "Unknown", type: "Unexcused" },
      { date: "Mar 18", reason: "Sick", type: "Excused" },
    ]
  }
]);

/* ✅ Search filter */
const search = ref("");
const filteredStudents = computed(() => {
  if (!search.value) return students.value;
  return students.value.filter(s =>
    s.name.toLowerCase().includes(search.value.toLowerCase())
  );
});

/* ✅ Heatmap Dummy Data */
const heatmap = ref(
  Array.from({ length: 31 }).map((_, i) => ({
    day: i + 1,
    absences: Math.floor(Math.random() * 4)
  }))
);

function heatColor(level) {
  return ["#e9ffe9", "#fff5c4", "#ffdf9c", "#ffb3b3"][level];
}

/* ✅ TAKE ATTENDANCE */
const todayAttendance = ref({});
students.value.forEach(s => todayAttendance.value[s.id] = null);

function markPresent(id) {
  todayAttendance.value[id] = "present";
}
function markAbsent(id) {
  todayAttendance.value[id] = "absent";
}

function submitAttendance() {
  students.value.forEach(stu => {
    if (todayAttendance.value[stu.id] === "present") stu.present++;
    if (todayAttendance.value[stu.id] === "absent") stu.absent++;
  });

  alert("✅ Attendance saved successfully!");
}

/* ✅ Slide-over details */
const drawer = ref(false);
const activeStudent = ref(null);

function openDetails(stu) {
  activeStudent.value = stu;
  drawer.value = true;
}

function calcPercent(present, absent) {
  const total = present + absent;
  if (!total) return 0;
  return Math.round((present / total) * 100);
}

function initials(name) {
  return name.split(" ").map(n => n[0].toUpperCase()).join("");
}

function viewDay(day) {
  alert(`Absences on day ${day.day}: ${day.absences}`);
}
</script>

<style scoped>
.attend-bg {
  background: #eef1f8;
  min-height: 100vh;
}

/* ✅ Hero */
.attend-hero {
  background: linear-gradient(135deg, #4b79ff, #6a4eff);
  border-radius: 22px;
}
.attend-avatar {
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
}

/* ✅ KPIs */
.attend-kpi {
  border-radius: 18px;
  transition: 0.25s;
}
.attend-kpi:hover {
  transform: translateY(-5px);
}

/* ✅ Card */
.attend-card {
  border-radius: 18px;
  background: white;
}

/* ✅ Heatmap */
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}
.heatmap-cell {
  padding: 12px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}
.heatmap-cell:hover {
  transform: scale(1.1);
  box-shadow: 0px 3px 12px rgba(0,0,0,0.1);
}

/* ✅ TAKING ATTENDANCE TABLE */
.attendance-take-table thead {
  background: #f0f2f7;
  font-weight: bold;
}
.attendance-take-table tbody tr:nth-child(odd) {
  background: #f7f9fc !important;
}
.attendance-take-table tbody tr:nth-child(even) {
  background: #eef1f6 !important;
}
.attendance-take-table tbody tr:hover {
  background: #e4eaff !important;
}
.attendance-take-table td {
  padding: 12px 10px;
}

/* ✅ Custom checkbox */
.attend-checkbox {
  width: 20px;
  height: 20px;
  transform: scale(1.3);
  cursor: pointer;
  accent-color: #4b79ff;
}

/* ✅ Slide-over */
.attend-offcanvas {
  width: 420px !important;
  background: #fbfcff;
}
.attend-summary {
  border-radius: 14px;
  background: #fff;
}
</style>
