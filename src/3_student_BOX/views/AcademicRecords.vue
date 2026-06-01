<template>
  <CContainer fluid class="py-4 report-pack-wrapper">

    <!-- PACK HEADER / ACTIONS -->
    <div class="d-flex justify-content-between align-items-center mb-3 no-print">
      <div>
        <h3 class="fw-bold m-0">Student Report Pack</h3>
        <small class="text-muted">All terms for the selected class & year</small>
      </div>
      <div class="d-flex gap-2">

        <button class="btn btn-primary" @click="printAll">
          <i class="cil-print me-1"></i> Print All
        </button>
      </div>
    </div>

    <!-- SHEETS (one per term) -->
    <div
      v-for="(rec, idx) in displayRecords"
      :key="rec.id || idx"
      class="sheet shadow-lg border-0 rounded-4 mb-5"
    >

      <!-- SHEET HEADER -->
<!-- SHEET HEADER -->
<CCard class="border-0 rounded-4 report-header">
  <CCardBody class="p-4">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">

      <!-- Left: School + Title + Context -->
      <div>
        <!-- Always-visible school name -->
        <h1 class="school-name m-0">
          King Of Glory Preparatory School
        </h1>



        <div class="text-muted mt-1 small">
          <span class="me-2">
            Academic Year:
            <strong>{{ rec.academicYear?.name || rec.academic_year || '—' }}</strong>
          </span>
          <span class="me-2">•</span>
          <span class="me-2">
            Term:
            <strong>{{ rec.term?.name || rec.term || '—' }}</strong>
          </span>
          <span class="me-2">•</span>
          <span>
            Class:
            <strong>{{ rec.classLevel?.name || rec.class_level || '—' }}</strong>
          </span>
        </div>
      </div>

      <!-- Right: Student block with Avatar -->
      <div class="d-flex align-items-center gap-3">



<div class="avatar-ring">
  <!-- Real profile picture -->
  <img
    v-if="profilpic.profile_picture"
    :src="profilpic.profile_picture"
    alt="Profile Picture"
    class="avatar-img"
    @error="onImgError"
  />

  <!-- Fallback avatar -->
  <img
    v-else
    class="avatar-img"
    :src="avatarSrc(rec)"
    :alt="rec.student?.name || 'Student'"
    @error="onImgError"
  />
</div>






        <div class="text-end">
          <div class="fw-bold fs-5">{{ rec.student?.name || '—' }}</div>
          <div class="text-muted small">
             <strong>ACADEMIC REPORT</strong>
          </div>
          <div class="text-muted small">
            Overall Position:
            <strong>{{ rec.overallPosition ? ordinal(rec.overallPosition) : '—' }}</strong>
            <span v-if="rec.numberOnRoll"> / {{ rec.numberOnRoll }}</span>
          </div>
        </div>
      </div>

    </div>
  </CCardBody>
</CCard>




      <!-- SUBJECT TABLE -->
      <CCard class="border-0 rounded-4 glass-card mt-3">
        <CCardHeader class="bg-light fw-bold">Academic Performance</CCardHeader>
        <CCardBody class="p-0">

          <CTable responsive hover class="mb-0 text-center align-middle rc-table">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell style="width: 44px;">#</CTableHeaderCell>
                <CTableHeaderCell class="text-start">Subject</CTableHeaderCell>
                <CTableHeaderCell>Class</CTableHeaderCell>
                <CTableHeaderCell>Exam</CTableHeaderCell>
                <CTableHeaderCell>Total</CTableHeaderCell>
                <CTableHeaderCell>Grade</CTableHeaderCell>
                <CTableHeaderCell>Interpretation</CTableHeaderCell>
                <CTableHeaderCell>Position</CTableHeaderCell>

              </CTableRow>
            </CTableHead>

              <CTableBody>
                <CTableRow v-for="(s, i) in rec.subjects" :key="i">
                  <CTableDataCell class="text-muted">{{ i + 1 }}</CTableDataCell>

                  <CTableDataCell class="fw-semibold text-start">
                    {{ s.subjectName }}
                  </CTableDataCell>

                  <CTableDataCell>{{ show(s.classScore) }}</CTableDataCell>
                  <CTableDataCell>{{ show(s.examScore) }}</CTableDataCell>
                  <CTableDataCell class="fw-bold">{{ show(s.totalScore) }}</CTableDataCell>

                  <CTableDataCell>
                    <strong>{{ s.gradeCode || '-' }}</strong>
                  </CTableDataCell>

                  <CTableDataCell>{{ s.interpretation || '-' }}</CTableDataCell>

                  <CTableDataCell>
                    {{ s.position ? ordinal(s.position) : '-' }}
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>

<CTableFoot>
  <CTableRow class="fw-bold">
    <CTableDataCell></CTableDataCell>
    <CTableDataCell class="text-start">Totals / Average</CTableDataCell>

    <CTableDataCell>{{ sumClass(rec.subjects) }}</CTableDataCell>
    <CTableDataCell>{{ sumExam(rec.subjects) }}</CTableDataCell>
    <CTableDataCell>{{ rec.rawScoreTotal }}</CTableDataCell>

    <CTableDataCell>—</CTableDataCell>
    <CTableDataCell class="text-muted">
      Avg: {{ avgTotal(rec.subjects).toFixed(1) }}
    </CTableDataCell>
    <CTableDataCell>—</CTableDataCell>
  </CTableRow>
</CTableFoot>

          </CTable>


        </CCardBody>
      </CCard>

      <!-- SUMMARY ROW -->
      <CRow class="mt-3">
        <CCol md="4" class="mb-3">
          <CCard class="shadow-sm border-0 text-center rounded-4">
            <CCardBody>
              <div class="text-muted">Attendance</div>
              <div class="fs-4 fw-bold">{{ show(rec.attendance) }}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md="4" class="mb-3">
          <CCard class="shadow-sm border-0 text-center rounded-4">
            <CCardBody>
              <div class="text-muted">Number on Roll</div>
              <div class="fs-4 fw-bold">{{ show(rec.numberOnRoll) }}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md="4" class="mb-3">
          <CCard class="shadow-sm border-0 text-center rounded-4">
            <CCardBody>
              <div class="text-muted">Conduct</div>
              <div class="fs-4 fw-bold">{{ show(rec.conduct) }}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <!-- REMARKS / PROMO -->
      <CRow class="mt-1">
        <CCol md="8" class="mb-3">
          <CCard class="shadow-sm border-0 rounded-4 h-100">
            <CCardHeader class="bg-light fw-bold">Remarks</CCardHeader>
            <CCardBody>
              <p class="mb-2"><strong>Attitude:</strong> {{ rec.attitude || '-' }}</p>
              <p class="mb-2"><strong>Interest:</strong> {{ rec.interest || '-' }}</p>
              <p class="mb-2"><strong>Teacher's Remarks:</strong> {{ rec.teacherRemarks || '-' }}</p>
              <p class="mb-0"><strong>Head Teacher's Remarks:</strong> {{ rec.headTeacherRemarks || '-' }}</p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md="4" class="mb-3">
          <CCard class="shadow-sm border-0 rounded-4 h-100">
            <CCardHeader class="bg-light fw-bold">Promotion / Next Term</CCardHeader>
            <CCardBody>
              <p class="mb-2"><strong>Promoted To:</strong> {{ rec.promotedTo || '-' }}</p>
              <p class="mb-0"><strong>Next Term Begins:</strong> {{ rec.nextTermBegins || '-' }}</p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <!-- PAGE FOOTER -->
      <div class="d-flex justify-content-between text-muted small mt-3 sheet-footer">


      </div>
    </div>
    <!-- /sheet -->

  </CContainer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getReportCardByUser_ktor , get_profile_picture,} from '@/services/api'

/* ----------------------------------------------------
   PROPS (school branding only)
---------------------------------------------------- */
const props = defineProps({
  school: {
    type: Object,
    default: () => ({
      name: '',
      logoUrl: '',
    }),
  },
})

/* ----------------------------------------------------
   SUBJECT LIST
---------------------------------------------------- */
const SUBJECTS = [
  { key: 'english', label: 'English' },
  { key: 'maths', label: 'Maths' },
  { key: 'science', label: 'Science' },
  { key: 'rme', label: 'RME' },
  { key: 'ict', label: 'ICT' },
  { key: 'history', label: 'History' },
  { key: 'fante', label: 'Fante' },
  { key: 'creativearts', label: 'Creative Arts' },
]
const subjects = SUBJECTS

/* ----------------------------------------------------
   STATE
---------------------------------------------------- */
const loading = ref(true)
const displayRecords = ref([])          // MULTI-TERM RECORD DATA
const student = ref(null)               // THE LOGGED-IN STUDENT

/* ----------------------------------------------------
   LOAD STUDENT FROM LOCALSTORAGE
---------------------------------------------------- */


const profilpic = ref({
  profile_picture: "",

});

/* ----------------------------------------------------
   FETCH REPORT CARD USING BACKEND API
---------------------------------------------------- */
async function fetchReportCard() {
  loading.value = true

const stored = localStorage.getItem('user')
    const stu = JSON.parse(stored)

  student.value = stu

  if (!stu?.id) {

    loading.value = false
    return
  }

  try {

    const response = await getReportCardByUser_ktor(stu.userId)


    profilpic.value.profile_picture = response?.data[0]?.student?.profilePictureUrl || ''








  displayRecords.value = (Array.isArray(response.data) ? response.data : [response.data])
  .map(record => ({
    ...record,
    student: {
      ...record.student,
      full_name: stu?.full_name || '',
      indexNo: stu?.user_id|| '' ,

    }
  }))

  } catch (err) {

    displayRecords.value = []               // FAIL SAFE
  } finally {
    loading.value = false
  }
}

/* ----------------------------------------------------
   COMPUTED HELPERS
---------------------------------------------------- */
function show(v) { return v === null || v === undefined ? '-' : v }

function ordinal(n) {
  const num = Number(n)
  if (!num) return '-'
  const s = ['th', 'st', 'nd', 'rd'], v = num % 100
  return num + (s[(v - 20) % 10] || s[v] || s[0])
}

function gradeColor(g) {
  return { A: 'success', B: 'info', C: 'primary', D: 'warning', E: 'danger' }[g] || 'secondary'
}

function sumClass(subjects) {
  if (!Array.isArray(subjects)) return 0;
  return subjects.reduce((acc, s) => acc + (s.classScore || 0), 0);
}

function sumExam(subjects) {
  if (!Array.isArray(subjects)) return 0;
  return subjects.reduce((acc, s) => acc + (s.examScore || 0), 0);
}

function sumTotal(subjects) {
  if (!Array.isArray(subjects)) return 0;
  return subjects.reduce((acc, s) => acc + (s.totalScore || 0), 0);
}

function avgTotal(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) return 0;
  return sumTotal(subjects) / subjects.length;
}

function avgGrade(rec) {
  const t = avgTotal(rec)
  if (t >= 85) return 'A'
  if (t >= 70) return 'B'
  if (t >= 50) return 'C'
  if (t >= 30) return 'D'
  return 'E'
}

/* ----------------------------------------------------
   AVATAR HANDLING
---------------------------------------------------- */
const dummyAvatar =
  "data:image/svg+xml;base64," +
  btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>
    <rect width='140' height='140' fill='#d1d5db'/>
    <circle cx='70' cy='56' r='26' fill='white'/>
    <rect x='22' y='90' width='96' height='34' rx='17' fill='white'/>
  </svg>`)

function avatarSrc(rec) {
  return rec.student?.photo_url || rec.student?.avatar || dummyAvatar
}
function onImgError(e) {
  if (e?.target) e.target.src = dummyAvatar
}

/* ----------------------------------------------------
   GLOBAL ACTIONS
---------------------------------------------------- */
const today = new Date().toLocaleDateString()
function printAll() { window.print() }
function toggleTheme() { document.body.classList.toggle('report-dark') }

/* ----------------------------------------------------
   MOUNT
---------------------------------------------------- */
onMounted(async () => {
  await fetchReportCard()
})
</script>




<style scoped>
.report-pack-wrapper :deep(.card) { border-radius: 18px; }

.report-header{
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
}

.glass-card{
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0,0,0,0.04);
}

/* Avatar ring */
.avatar-ring{
  width: 70px; height: 70px; border-radius: 50%;
  padding: 2px; background: linear-gradient(135deg, #60a5fa, #22c55e);
}
.avatar-img{
  width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
  display: block; background: #fff;
}

/* Sheet wrapper + print paging */
.sheet{
  padding: 16px;
  background: #f8fafc;
}
.sheet-footer{ padding: 0 4px; }

/* Page break on print */
@media print {
  .no-print{ display: none !important; }
  .sheet{ page-break-after: always; }
  .sheet:last-child{ page-break-after: auto; }
  .report-header{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

.school-name {
  font-weight: 900;
  letter-spacing: 0.5px;
  line-height: 1.1;
  font-size: clamp(20px, 2.6vw, 28px);
  background: linear-gradient(90deg, #0f172a, #334155);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 4px;
}


.badge strong {
  font-weight: 700 !important;
}


/* Existing styles … keep your avatar, report-header, etc. */
</style>
