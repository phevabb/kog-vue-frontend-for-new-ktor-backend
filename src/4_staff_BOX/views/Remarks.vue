







<template>
  <CContainer fluid>
    <CRow>

      <!-- STUDENT LIST -->
      <CCol md="4">
        <CCard class="shadow-sm border-0">
          <CCardHeader class="bg-light fw-bold">
            Class Students
          </CCardHeader>

          <CCardBody class="p-0">

            <!-- Loading -->
            <div v-if="loading" class="text-center py-4 text-muted">
              Loading students…
            </div>

            <!-- No records -->
            <div
              v-else-if="!academicRecords.length"
              class="text-center py-4 text-muted"
            >
              No students found for this class.
            </div>

            <CListGroup v-else flush>
              <CListGroupItem
                v-for="record in academicRecords"
                :key="record.id"
                :active="record.id === selectedId"
                @click="selectStudent(record)"
                class="d-flex justify-content-between align-items-center cursor-pointer"
              >
                <span>{{ record.student_name }}</span>
                <CBadge color="secondary" shape="rounded-pill">
                  {{ record.overall_position || '-' }}
                </CBadge>
              </CListGroupItem>
            </CListGroup>

          </CCardBody>
        </CCard>
      </CCol>

      <!-- REMARKS FORM -->
      <CCol md="8">
        <CCard class="shadow border-0">
          <CCardHeader class="bg-primary text-white">
            <strong>Academic Remarks</strong>
            <div class="small opacity-75" v-if="selectedRecord">
              {{ selectedRecord.student_name }}
              • {{ context.classLevel }}
              • {{ context.term }}
            </div>
          </CCardHeader>

          <CCardBody v-if="selectedRecord">
            <CForm @submit.prevent="saveRemarks">

              <!-- Behaviour -->
              <h6 class="fw-bold text-primary mb-3">Pupil Behaviour</h6>

              <CRow class="mb-3">
                <CCol md="4">
                  <label class="form-label">Conduct</label>
                  <CFormInput v-model="selectedRecord.conduct" />
                </CCol>


                <CCol md="4">
                  <label class="form-label">Attitude</label>
                  <CFormInput v-model="selectedRecord.attitude" />
                </CCol>


                <CCol md="4">
                  <label class="form-label">Interest</label>
                  <CFormInput v-model="selectedRecord.interest" />
                </CCol>


              </CRow>


              <!-- Class Information -->
<h6 class="fw-bold text-primary mt-4 mb-3">
  Class Information
</h6>

<CRow class="mb-3">
  <CCol md="6">
    <label class="form-label">Number on Roll</label>
    <CFormInput
      type="number"
      min="1"
      v-model="selectedRecord.number_on_roll"
      placeholder="e.g. 32"
    />
  </CCol>

  <CCol md="6">
    <label class="form-label">Promoted To</label>
    <CFormInput
      v-model="selectedRecord.promoted_to"
      placeholder="e.g. Class 6 / Repeated"
    />
  </CCol>
</CRow>



              <!-- Remarks -->
              <h6 class="fw-bold text-primary mt-4 mb-2">
               Class Teacher's Remarks
              </h6>



              <CFormTextarea
                v-model="selectedRecord.teacher_remarks"
                rows="2"
              />

              <h6 class="fw-bold text-primary mt-4 mb-2">
                Head Teacher's Remarks
              </h6>
              <CFormTextarea
                v-model="selectedRecord.head_teacher_remarks"
                rows="2"
              />

              <!-- Next Term -->
              <CRow class="mt-4">
                <CCol md="6">
                  <label class="form-label">Next Term Begins</label>
                  <CFormInput
                    v-model="selectedRecord.next_term_begins"
                  />
                </CCol>
              </CRow>


              <CCol md="6">
  <label class="form-label">
    Attendance
    <small class="text-muted">(present/total)</small>
  </label>

  <CFormInput
    v-model="selectedRecord.attendance"
    placeholder="e.g. 23/45"
    @input="sanitizeAttendance"
  />

  <!-- Validation error -->
  <div v-if="fieldErrors.attendance" class="text-danger small mt-1">
    {{ fieldErrors.attendance }}
  </div>
</CCol>


              <!-- Actions -->
              <div class="d-flex justify-content-end mt-4">
               <CButton
  color="primary"
  type="submit"
  style="color: #fff"
>
  Save Remarks
</CButton>
              </div>

              <CAlert color="success" v-if="saved" class="mt-3">
                Remarks saved for {{ selectedRecord.student_name }}.
              </CAlert>

            </CForm>
          </CCardBody>

          <CCardBody v-else class="text-center text-muted py-5">
            Select a student to enter remarks.
          </CCardBody>

        </CCard>
      </CCol>

    </CRow>
  </CContainer>
</template>




<script setup>
import { ref, onMounted } from 'vue'
import { get_academic_comments, create_academic_comment } from '@/services/api'

/* ✅ Read staff data from localStorage */
const staffRaw = localStorage.getItem('staff')
const staff = staffRaw ? JSON.parse(staffRaw) : null

import { useToast } from 'vue-toastification'

const toast = useToast()

const assignedClassName = staff?.assignedClass.name || null


/* UI display context */
const context = {
  classLevel: assignedClassName,
  term: 'Current Term',
  academicYear: 'Current Academic Year',
}

/* State */
const academicRecords = ref([])
const selectedId = ref(null)
const selectedRecord = ref(null)
const loading = ref(false)
const saved = ref(false)

/* ✅ Fetch academic records for teacher's class */
const fetchAcademicComments = async () => {
  if (!assignedClassName) {
    toast.error('No assigned class found for staff. Cannot load academic comments.')
    return
  }

  loading.value = true
  try {
    const response = await get_academic_comments(assignedClassName)

    academicRecords.value = response.data || []

    /* Auto‑select first student */
    if (academicRecords.value.length > 0) {
      selectedId.value = academicRecords.value[0].id
      selectedRecord.value = academicRecords.value[0]
    }
  } catch (error) {

  } finally {
    loading.value = false
  }
}

/* Select student */
const selectStudent = (record) => {
  selectedId.value = record.id
  selectedRecord.value = record
  saved.value = false
}


const fieldErrors = ref({})

const sanitizeAttendance = () => {
  if (!selectedRecord.value?.attendance) return

  // Allow only digits and slash
  selectedRecord.value.attendance =
    selectedRecord.value.attendance.replace(/[^\d/]/g, '')
}


/* Save remarks (PATCH can plug in here later) */
const saveRemarks = async () => {
  if (!selectedRecord.value) return

  loading.value = true
  saved.value = false
  fieldErrors.value = {}   // ✅ clear old errors

  try {
    const payload = {
      attendance: selectedRecord.value.attendance,
      number_on_roll: selectedRecord.value.number_on_roll,
      promoted_to: selectedRecord.value.promoted_to,

      conduct: selectedRecord.value.conduct,
      interest: selectedRecord.value.interest,
      attitude: selectedRecord.value.attitude,

      teacher_remarks: selectedRecord.value.teacher_remarks,
      head_teacher_remarks: selectedRecord.value.head_teacher_remarks,
      next_term_begins: selectedRecord.value.next_term_begins,
    }

    await create_academic_comment(selectedRecord.value.id, payload)

    saved.value = true
  } catch (error) {

    if (error.response && error.response.data) {
      fieldErrors.value = error.response.data
    }
  } finally {
    loading.value = false
    setTimeout(() => (saved.value = false), 2000)
  }
}

if (academicRecords.value.length > 0) {
  selectStudent(academicRecords.value[0])
}

/* ✅ Load records when component mounts */
onMounted(fetchAcademicComments)
</script>




<style scoped>
/* General */
.cursor-pointer {
  cursor: pointer;
}

.form-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #495057;
}

/* Card Enhancements */
.ccard {
  border-radius: 14px;
}

.ccard-header {
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
}

/* Student List */
.list-group-item {
  transition: background-color 0.2s ease, transform 0.15s ease;
  padding: 0.75rem 1rem;
}

.list-group-item:hover {
  background-color: #f8f9fa;
  transform: translateX(2px);
}

.list-group-item.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: #ffffff;
}

/* Badge */
.badge {
  font-size: 0.7rem;
  padding: 0.35em 0.6em;
}

/* Section Headings */
h6 {
  letter-spacing: 0.4px;
  font-size: 0.85rem;
  text-transform: uppercase;
}

/* Inputs */
input,
textarea {
  border-radius: 10px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

input:focus,
textarea:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.15);
}

/* Buttons */
button {
  border-radius: 30px;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

/* Alerts */
.alert {
  border-radius: 10px;
  font-size: 0.85rem;
}

/* Responsive polish */
@media (max-width: 768px) {
  .ccard-header strong {
    font-size: 1rem;
  }

  h6 {
    font-size: 0.8rem;
  }
}
</style>
