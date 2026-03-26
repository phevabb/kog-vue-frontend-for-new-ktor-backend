<template>
  <v-container fluid class="pa-4 premium-bg">
    <!-- Header -->
    <v-card class="pa-4 mb-4 premium-hero" elevation="10">
      <div class="d-flex align-center justify-space-between flex-wrap">
        <div class="d-flex align-center">
          <v-avatar size="64" class="mr-4 premium-avatar">
            <v-icon size="36" color="white">mdi-file-table-box-multiple</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 text-white font-weight-bold">Teachers’ Academic Records</div>
            <div class="text-body-2 text-white opacity-80">
              Enter class & exam scores per subject — totals, grades & interpretations compute automatically
            </div>
          </div>
        </div>

        <div class="d-flex align-center mt-3 mt-sm-0">
          <v-chip color="white" text-color="white" class="mr-2" size="small" prepend-icon="mdi-cloud-check-outline">
            Auto‑save: {{ autoSave ? 'On' : 'Off' }}
          </v-chip>

        </div>
      </div>
    </v-card>

    <v-row>
      <v-col cols="12">
        <v-card class="pa-3 premium-card" elevation="6">

          <!-- TOP BAR: Context + Controls -->
          <div class="d-flex flex-wrap align-center justify-space-between mb-2">
            <!-- Context -->
            <div class="d-flex flex-wrap align-center">
              <v-chip size="x-small" color="primary" class="mr-1 mb-1">
                {{ ctx.year || '—' }}
              </v-chip>
              <v-chip size="x-small" color="primary" class="mr-1 mb-1">
                {{ ctx.term || '—' }}
              </v-chip>
              <v-chip size="x-small" color="primary" class="mr-2 mb-1">
                {{ ctx.gradeclassName || ctx.gradeclassId || '—' }}
              </v-chip>

              <v-chip size="x-small" color="secondary" class="mr-1 mb-1">
                {{ subjectLabel(subject) }}
              </v-chip>
            </div>

            <!-- Controls -->
            <div class="d-flex flex-wrap align-center">
              <v-select
                v-model="subject"
                :items="SUBJECTS"
                density="compact"
                variant="solo-filled"
                hide-details
                style="max-width: 150px"
                class="mr-2 mb-1"
                :disabled="booting"
              />

              <v-text-field
                v-model="search"
                density="compact"
                variant="solo-filled"
                hide-details
                prepend-inner-icon="mdi-magnify"
                style="max-width: 180px"
                class="mr-2 mb-1"
                :disabled="booting"
              />

              <v-btn size="x-small" variant="tonal" color="primary"
                     @click="schemeDialog = true"
                     :disabled="booting">
                Edit Scheme
              </v-btn>
            </div>
          </div>

          <!-- Scheme Info -->
          <div class="d-flex flex-wrap align-center mb-2">
            <v-chip size="x-small" class="mr-1">
              C: {{ scheme[subject].classMax }}
            </v-chip>
            <v-chip size="x-small" class="mr-1">
              E: {{ scheme[subject].examMax }}
            </v-chip>
            <v-chip size="x-small" color="info">
              Total: {{ scheme[subject].classMax + scheme[subject].examMax }}
            </v-chip>
          </div>

          <v-progress-linear v-if="booting" indeterminate class="mb-2" />
          <v-divider class="mb-2" />

          <!-- KPIs -->
          <v-row dense class="mb-2">
            <v-col cols="6" md="3">
              <v-card class="pa-2 kpi-card gradient-1" elevation="4">
                <div class="text-caption text-white">Completion</div>
                <div class="text-subtitle-1 text-white">{{ completionRate }}%</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="3">
              <v-card class="pa-2 kpi-card gradient-2" elevation="4">
                <div class="text-caption text-white">Average</div>
                <div class="text-subtitle-1 text-white">{{ subjectAverage.toFixed(1) }}</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="3">
              <v-card class="pa-2 kpi-card gradient-3" elevation="4">
                <div class="text-caption text-white">Highest</div>
                <div class="text-subtitle-1 text-white">{{ subjectMax.score.toFixed(1) }}</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="3">
              <v-card class="pa-2 kpi-card gradient-4" elevation="4">
                <div class="text-caption text-white">Lowest</div>
                <div class="text-subtitle-1 text-white">{{ subjectMin.score.toFixed(1) }}</div>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="mb-2" />

          <!-- TABLE HEADER ACTIONS -->
          <div class="d-flex flex-wrap justify-space-between align-center mb-2">
            <div class="text-subtitle-2 font-weight-bold">
              Marks Entry
            </div>

            <div class="d-flex flex-wrap">
              <v-btn size="x-small" class="mr-1 mb-1" variant="tonal"
                     @click="fillBlanks(subject, 40, 50)" :disabled="booting">
                Fill
              </v-btn>

              <v-btn size="x-small" class="mr-1 mb-1" variant="tonal" color="error"
                     @click="clearSubject(subject)" :disabled="booting">
                Clear
              </v-btn>

              <v-btn size="x-small" class="mr-1 mb-1" variant="tonal"
                     @click="importDialog = true" :disabled="booting">
                Import
              </v-btn>

              <v-btn size="x-small" class="mb-1" variant="tonal"
                     @click="exportCSV" :disabled="booting">
                Export
              </v-btn>
            </div>
          </div>

          <!-- TABLE (striped, sticky header, beautiful) -->
          <v-table
            fixed-header
            height="60vh"
            density="compact"
            class="marks-table striped-table beautiful-table"
          >
            <thead>
              <tr>
                <th style="width: 48px;">#</th>
                <th>Student</th>
                <th class="text-left">Class</th>
                <th class="text-left">Exam</th>
                <th class="text-right">Total</th>
                <th class="text-center">Grade</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(stu, i) in filteredStudents" :key="stu.id">
                <td class="text-medium-emphasis">{{ i + 1 }}</td>

                <td>
                  <div class="d-flex align-center">
                    <v-avatar size="26" class="mr-2" color="indigo">
                      <span class="text-white text-caption">{{ initials(stu.full_name) }}</span>
                    </v-avatar>
                    <div>
                      <div class="text-body-2">{{ stu.full_name }}</div>
                      <div class="text-caption text-disabled">{{ stu.indexNo }}</div>
                    </div>
                  </div>
                </td>

                <td class="text-left">
                  <v-text-field
                    v-model.number="rec(stu.id)[`${subject}_class_score`]"
                    density="compact"
                    variant="plain"
                    type="number"
                    hide-details
                    :min="0"
                    :max="scheme[subject].classMax"
                    :step="1"
                    @change="recalc(stu.id, subject)"
                    @blur="autoSaveDraft"
                    :disabled="booting"
                    :style="{
                      '--v-theme-on-background': '#1976d2',
                      color: '#1976d2'
                    }"
                    class="cell-input"
                  />
                </td>

                <td class="text-left">
                  <v-text-field
                    v-model.number="rec(stu.id)[`${subject}_exam_score`]"
                    density="compact"
                    variant="plain"
                    type="number"
                    hide-details
                    :min="0"
                    :max="scheme[subject].examMax"
                    :step="1"
                    @change="recalc(stu.id, subject)"
                    @blur="autoSaveDraft"
                    :disabled="booting"
                    :style="{
                      '--v-theme-on-background': '#1976d2',
                      color: '#1976d2'
                    }"
                    class="cell-input"
                  />
                </td>

                <td class="text-right">
                  {{
                    rec(stu.id)[`${subject}_total_score`] == null
                      ? '—'
                      : Number(rec(stu.id)[`${subject}_total_score`]).toFixed(0)
                  }}
                </td>

                <td class="text-center">
                  {{ rec(stu.id)[`${subject}_grade`] || '—' }}
                </td>

                <td class="text-center">
                  <v-chip size="x-small"
                    :color="isComplete(stu.id, subject) ? 'success' : 'grey'">
                    {{ isComplete(stu.id, subject) ? 'Done' : 'Pending' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-divider class="my-2" />

          <!-- FOOTER -->
          <div class="d-flex flex-wrap justify-space-between align-center">
            <div class="text-caption">
              Total = {{ scheme[subject].classMax + scheme[subject].examMax }}
            </div>

            <div class="d-flex">
              <v-btn size="small" class="mr-1" variant="tonal"
                     @click="saveDraft" :loading="saving"
                     :disabled="booting">
                Save
              </v-btn>

              <v-btn size="small" class="mr-1" variant="tonal"
                     @click="rankAndPreview"
                     :disabled="booting">
                Rank
              </v-btn>



              <v-btn size="small" color="success"
                     @click="publishDialog = true"
                     :disabled="completionRate < 60 || booting">
                Publish ({{ subjectLabel(subject) }})
              </v-btn>
            </div>
          </div>

        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog: Edit Scheme -->
    <v-dialog v-model="schemeDialog" max-width="520">
      <v-card>
        <v-card-title class="font-weight-bold">Edit Scoring Scheme — {{ subjectLabel(subject) }}</v-card-title>
        <v-divider />
        <v-card-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="schemeWorking.classMax" type="number" label="Class Max" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="schemeWorking.examMax" type="number" label="Exam Max" />
            </v-col>
          </v-row>
          <v-alert type="info" variant="tonal" border="start" class="mt-2">
            Recommended total is <strong>100</strong>.
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="tonal" @click="schemeDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveScheme">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Publish -->
    <v-dialog v-model="publishDialog" max-width="540">
      <v-card>
        <v-card-title class="font-weight-bold">Publish Results?</v-card-title>
        <v-divider />
        <v-card-text>
          <v-alert type="warning" variant="tonal" border="start" class="mb-3">
            Publishing will mark this subject as published for this class, year & term,
            but entries remain editable.
          </v-alert>
          <ul class="mt-2">
            <li>{{ completedCount }}/{{ filteredStudents.length }} students complete (for {{ subjectLabel(subject) }})</li>
            <li>Subject average: {{ subjectAverage.toFixed(1) }}</li>
            <li>Year/Term: {{ ctx.year }} / {{ ctx.term }} • Class: {{ ctx.gradeclassName || ctx.gradeclassId }}</li>
          </ul>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="tonal" @click="publishDialog = false">Cancel</v-btn>
          <v-btn color="success" :loading="sending" :disabled="sending" @click="confirmPublishAndSend">
            <v-icon start>mdi-check-decagram</v-icon>Publish ({{ subjectLabel(subject) }})
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Import CSV -->
    <v-dialog v-model="importDialog" max-width="820">
      <v-card>
        <v-card-title class="font-weight-bold">Import Scores from CSV (Paste)</v-card-title>
        <v-divider />
        <v-card-text>
          <p class="text-body-2 mb-2">
            Paste CSV with headers:
            <code>indexNo, class, exam</code>
          </p>
          <v-textarea
            v-model="csvText"
            rows="10"
            variant="outlined"
            placeholder="indexNo, class, exam
            S-001, 32, 52
            S-002, 28, 45"
          />
          <v-alert type="info" variant="tonal" class="mt-3" border="start">
            Index numbers must match the class list. Values must respect the class/exam maxima.
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="tonal" @click="importDialog = false">Close</v-btn>
          <v-btn color="primary" @click="applyCSVImport">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :timeout="2200" :color="snack.color" rounded="pill">
      <v-icon start>mdi-check-circle</v-icon>{{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>

import { useToast } from 'vue-toastification'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { get_terms_with_year, get_teacher_student, academic_records } from '@/services/api'

/* ---------------------------
   CONSTANTS
--------------------------- */

const toast = useToast()


const SUBJECTS = [
  'english', 'maths', 'science', 'rme', 'ict', 'history', 'fante', 'creativearts'
]
const GRADE_TO_TEXT = { A: 'Excellent', B: 'Very Good', C: 'Good', D: 'Credit', E: 'Pass' }

/* ---------------------------
   STATE
--------------------------- */
const ctx = reactive({ year: '', yearId: null, term: '', termId: null, gradeclassId: '', gradeclassName: '' })
const subject = ref('english')
const search = ref('')
const staff = ref(null)
const selectedStudentId = ref(null)

const scheme = reactive(Object.fromEntries(SUBJECTS.map(s => [s, { classMax: 50, examMax: 50 }])))
const schemeWorking = ref({ classMax: 50, examMax: 50 })
const schemeDialog = ref(false)

const published = ref(false)
const autoSave = ref(true)
const saving = ref(false)
const sending = ref(false)

/* ✅ Context-scoped records (fix for wrong-term/class bleed) */
const recordsByCtx = reactive({}) // { "<yearId>|<termId>|<gradeclassId>": { [studentId]: record } }

const classMeta = reactive({ attendance: 0, number_on_roll: 0, teacher_remarks: '', head_teacher_remarks: '', next_term_begins: '' })
const snack = reactive({ show: false, text: '', color: 'success' })

const publishDialog = ref(false)
const importDialog = ref(false)
const csvText = ref('')

const booting = ref(false)
const studentsFromApi = ref([])

/* ---------------------------
   COMPUTEDS
--------------------------- */
const students = computed(() => studentsFromApi.value || [])

/* ✅ a key that changes with Year/Term/Class */
const ctxKey = computed(() =>
  `${ctx.yearId || ctx.year}|${ctx.termId || ctx.term}|${ctx.gradeclassId || ctx.gradeclassName || ''}`
)

function currentRecordsBucket() {
  const key = ctxKey.value
  if (!recordsByCtx[key]) recordsByCtx[key] = {}
  return recordsByCtx[key]
}

const filteredStudents = computed(() => {
  const list = students.value
  if (!search.value) return list
  const q = (search.value || '').toLowerCase()
  return list.filter(s => (s.full_name || '').toLowerCase().includes(q) || (s.indexNo || '').toLowerCase().includes(q))
})

const completedCount = computed(() => filteredStudents.value.filter(s => isComplete(s.id, subject.value)).length)
const completionRate = computed(() => filteredStudents.value.length ? Math.round((completedCount.value / filteredStudents.value.length) * 100) : 0)

const subjectAverage = computed(() => {
  const vals = filteredStudents.value
    .map(s => rec(s.id)[`${subject.value}_total_score`] ?? NaN)
    .filter(v => !isNaN(v))
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
})
const subjectMax = computed(() => {
  const list = filteredStudents.value
  if (!list.length) return { score: 0, holder: '—' }
  let best = { score: -1, holder: '—' }
  for (const s of list) {
    const sc = rec(s.id)[`${subject.value}_total_score`] ?? 0
    if (sc > best.score) best = { score: sc, holder: s.full_name }
  }
  return best
})
const subjectMin = computed(() => {
  const list = filteredStudents.value
  if (!list.length) return { score: 0, holder: '—' }
  let worst = { score: 101, holder: '—' }
  for (const s of list) {
    const sc = rec(s.id)[`${subject.value}_total_score`] ?? 0
    if (sc < worst.score) worst = { score: sc, holder: s.full_name }
  }
  return worst
})

const samplePayload = computed(() => {
  const st = filteredStudents.value[0]
  return st ? buildPayload(st.id) : {}
})

/* ---------------------------
   HELPERS
--------------------------- */
function subjectLabel(key) {
  const map = { english: 'English', maths: 'Maths', science: 'Science', rme: 'RME', ict: 'ICT', history: 'History', fante: 'Fante', creativearts: 'Creative Arts' }
  return map[key] || key
}
function initials(name = '') {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()
}
function rec(studentId) {
  const bucket = currentRecordsBucket()   // ✅ context-scoped
  bucket[studentId] ||= {
    student: studentId,
    term: ctx.termId ?? ctx.term,
    academic_year: ctx.yearId ?? ctx.year,
    gradeclass: ctx.gradeclassId,
    promoted_to: null,
    attendance: 0, number_on_roll: 0,
    attitude: '', interest: '', teacher_remarks: '', head_teacher_remarks: '',
    next_term_begins: '', position: '', conduct: '', interpretation: '',
    ...Object.fromEntries(SUBJECTS.flatMap(s => ([
      [`${s}_class_score`, null],
      [`${s}_exam_score`, null],
      [`${s}_total_score`, null],
      [`${s}_grade`, null],
      [`${s}_interpretation`, null],
    ]))),
  }
  return bucket[studentId]
}
function isValidRange(v, min, max) {
  if (v === null || v === '' || v === undefined) return true
  const n = Number(v)
  return !isNaN(n) && n >= min && n <= max
}
function scoreClass(v, min, max) {
  if (v === null || v === '' || v === undefined) return ''
  return isValidRange(v, min, max) ? 'score-ok' : 'score-error'
}
function colorForScore(sc) {
  if (sc >= 85) return 'green'
  if (sc >= 70) return 'teal'
  if (sc >= 50) return 'light-blue'
  if (sc >= 30) return 'amber'
  return 'red'
}
function colorForGrade(g) {
  return { A: 'green', B: 'teal', C: 'light-blue', D: 'amber', E: 'red' }[g] || 'grey'
}
function computeGrade(total) {
  if (total >= 85) return 'A'
  if (total >= 70) return 'B'
  if (total >= 50) return 'C'
  if (total >= 30) return 'D'
  return 'E'
}
function isComplete(studentId, subj) {
  const r = rec(studentId)
  const c = r[`${subj}_class_score`]
  const e = r[`${subj}_exam_score`]
  return c !== null && e !== null && isValidRange(c, 0, scheme[subj].classMax) && isValidRange(e, 0, scheme[subj].examMax)
}
function recalc(studentId, subj) {
  const r = rec(studentId)
  const c = Number(r[`${subj}_class_score`] || 0)
  const e = Number(r[`${subj}_exam_score`] || 0)
  if ((r[`${subj}_class_score`] ?? null) === null && (r[`${subj}_exam_score`] ?? null) === null) {
    r[`${subj}_total_score`] = null
    r[`${subj}_grade`] = null
    r[`${subj}_interpretation`] = null
    return
  }
  const total = c + e
  r[`${subj}_total_score`] = total
  const g = computeGrade(total)
  r[`${subj}_grade`] = g
  r[`${subj}_interpretation`] = GRADE_TO_TEXT[g]
}
function clearSubject(subj) {
  const bucket = currentRecordsBucket() // ✅ scope
  filteredStudents.value.forEach(s => {
    const r = rec(s.id)
    r[`${subj}_class_score`] = null
    r[`${subj}_exam_score`] = null
    r[`${subj}_total_score`] = null
    r[`${subj}_grade`] = null
    r[`${subj}_interpretation`] = null
  })
  toast('Cleared scores for subject', 'warning')
  autoSaveDraft()
}
function fillBlanks(subj, classDefault = 20, examDefault = 40) {
  const clsMax = scheme[subj].classMax
  const exmMax = scheme[subj].examMax
  filteredStudents.value.forEach(s => {
    const r = rec(s.id)
    if (r[`${subj}_class_score`] == null) r[`${subj}_class_score`] = Math.min(classDefault, clsMax)
    if (r[`${subj}_exam_score`] == null) r[`${subj}_exam_score`] = Math.min(examDefault, exmMax)
    recalc(s.id, subj)
  })
  toast('Filled blanks', 'success')
  autoSaveDraft()
}
function rankAndPreview() {
  const list = filteredStudents.value.map(s => {
    const r = rec(s.id)
    const totals = SUBJECTS.map(subj => r[`${subj}_total_score`]).filter(v => typeof v === 'number')
    const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0
    return { id: s.id, avg }
  })
  const sorted = [...list].sort((a, b) => b.avg - a.avg)
  const N = filteredStudents.value.length || 0
  sorted.forEach((row, idx) => { rec(row.id).position = `${idx + 1}/${N}` })
  toast('Positions computed', 'success')
  autoSaveDraft()
}

/* ---------------------------
   CAPTURE & SEND
--------------------------- */
function collectSubjectRows() {
  const subj = subject.value
  return filteredStudents.value.map(stu => {
    const r = rec(stu.id)
    return {
      student_id: stu.id,
      index_no: stu.indexNo,
      class_score: r[`${subj}_class_score`],
      exam_score: r[`${subj}_exam_score`],
      total_score: r[`${subj}_total_score`],
      grade: r[`${subj}_grade`],
      interpretation: r[`${subj}_interpretation`],
    }
  })
}

function buildSubjectPayload() {
  return {
    context: {
      academic_year: ctx.year,
      academic_year_id: ctx.yearId,
      term: ctx.term,
      term_id: ctx.termId,
      gradeclass_id: ctx.gradeclassId,
      gradeclass_name: ctx.gradeclassName,
    },
    subject: subject.value,
    scheme: { ...scheme[subject.value] },
    rows: collectSubjectRows(),
  }
}

async function submitScores() {
  const payload = buildSubjectPayload()

  sending.value = true
  try {
    const res = await academic_records(payload) // axios instance call

    return res.data
  } catch (e) {
    if (e.response) {

      toast(`Failed to send: ${e.response.status}`, 'error')
    } else {

      toast(`Failed to send: ${e.message}`, 'error')
    }
    return null
  } finally {
    sending.value = false
  }
}

/* Publish flow that also sends */
async function confirmPublishAndSend() {
  const result = await submitScores()
  if (result !== null) {
    published.value = true
    publishDialog.value = false


    toast.success('Results Published ')
  }
}

/* ---------------------------
   PERSISTENCE (scoped per context)
--------------------------- */
const LS_KEY = 'acad_records_demo_v1'

function saveDraft() {
  saving.value = true
  const payload = {
    ctx,
    recordsByCtx,           // ✅ save all context buckets
    scheme,
    classMeta,
    published: published.value
  }
  localStorage.setItem(LS_KEY, JSON.stringify(payload))
  setTimeout(() => { saving.value = false;  }, 300)
}

/* keep autosave even when published */
function autoSaveDraft() { if (autoSave.value) saveDraft() }

function restoreDraft() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    Object.assign(classMeta, parsed.classMeta || {})
    published.value = !!parsed.published
    if (parsed.scheme) for (const s of SUBJECTS) { if (parsed.scheme[s]) scheme[s] = parsed.scheme[s] }
    if (parsed.recordsByCtx && typeof parsed.recordsByCtx === 'object') {
      for (const k of Object.keys(parsed.recordsByCtx)) {
        recordsByCtx[k] = parsed.recordsByCtx[k] || {}
      }
    }
  } catch {}
}

/* ---------------------------
   IMPORT / EXPORT
--------------------------- */
function exportCSV() {
  const headers = ['indexNo', 'class', 'exam', 'total', 'grade']
  const rows = filteredStudents.value.map(stu => {
    const r = rec(stu.id)
    return [
      stu.indexNo,
      r[`${subject.value}_class_score`] ?? '',
      r[`${subject.value}_exam_score`] ?? '',
      r[`${subject.value}_total_score`] ?? '',
      r[`${subject.value}_grade`] ?? '',
    ]
  })
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${ctx.gradeclassId}_${subject.value}_${ctx.term}_${ctx.year}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast('CSV exported', 'success')
}
function parseCSVText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (!lines.length) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1).map(l => l.split(',').map(v => v.trim()))
  return { headers, rows }
}
function applyCSVImport() {
  if (!csvText.value) return
  const { headers, rows } = parseCSVText(csvText.value)
  const expected = ['indexNo', 'class', 'exam']
  const ok = headers.length >= expected.length && expected.every((h, i) => headers[i].toLowerCase() === h.toLowerCase())
  if (!ok) { toast('CSV headers mismatch', 'error'); return }
  const map = Object.fromEntries(filteredStudents.value.map(s => [String(s.indexNo || '').toLowerCase(), s]))
  let applied = 0
  for (const row of rows) {
    const idNo = (row[0] || '').toLowerCase()
    const stu = map[idNo]
    if (!stu) continue
    const c = Number(row[1]); const e = Number(row[2])
    const clsMax = scheme[subject.value].classMax
    const exmMax = scheme[subject.value].examMax
    const r = rec(stu.id)
    if (!isNaN(c) && c >= 0 && c <= clsMax) r[`${subject.value}_class_score`] = c
    if (!isNaN(e) && e >= 0 && e <= exmMax) r[`${subject.value}_exam_score`] = e
    recalc(stu.id, subject.value)
    applied++
  }
  toast(`Imported ${applied} record(s)`, 'success')
  importDialog.value = false
  autoSaveDraft()
}

/* ---------------------------
   SCHEME DIALOG
--------------------------- */
watch(subject, () => { schemeWorking.value = { ...scheme[subject.value] } })
function saveScheme() {
  scheme[subject.value] = { ...schemeWorking.value }
  schemeDialog.value = false
  toast('Scheme updated', 'success')
  autoSaveDraft()
}

/* ---------------------------
   PAYLOAD (FULL per student if you need it)
--------------------------- */
function buildPayload(studentId) {
  const r = rec(studentId)
  return {
    student: studentId,
    term: ctx.termId ?? ctx.term,
    academic_year: ctx.yearId ?? ctx.year,
    gradeclass: ctx.gradeclassId,
    promoted_to: r.promoted_to,
    attendance: classMeta.attendance,
    number_on_roll: classMeta.number_on_roll,
    interpretation: r.interpretation,
    ...Object.fromEntries(SUBJECTS.flatMap(s => ([
      [`${s}_class_score`, r[`${s}_class_score`]],
      [`${s}_exam_score`, r[`${s}_exam_score`]],
      [`${s}_total_score`, r[`${s}_total_score`]],
      [`${s}_grade`, r[`${s}_grade`]],
      [`${s}_interpretation`, r[`${s}_interpretation`]],
    ]))),
  }
}

/* ---------------------------
   API BOOT + STUDENTS LOAD
--------------------------- */
function normalizeStudent(raw = {}) {
  return {
    id: raw.id,
    indexNo: String(raw.indexNo ?? raw.indexno ?? raw.index_no ?? ''),
    full_name: raw.full_name ?? `${raw.first_name ?? ''} ${raw.last_name ?? ''}`.trim(),
  }
}

function pruneStaleRecords() {
  const bucket = currentRecordsBucket() // ✅ scoped
  const valid = new Set(students.value.map(s => String(s.id)))
  for (const k of Object.keys(bucket)) { if (!valid.has(String(k))) delete bucket[k] }
}

/* Ensure each student has an initialized record (for THIS context) */
function initStudentsState() {
  const bucket = currentRecordsBucket() // ✅ scoped
  for (const s of studentsFromApi.value) {
    if (!bucket[s.id]) rec(s.id)
  }
}

async function hydrateCtxFromApi() {
  // staff from localStorage for read-only display
  const staffString = localStorage.getItem('staff')
  if (staffString) {
    staff.value = JSON.parse(staffString)
    ctx.gradeclassId   = staff.value.assigned_class_id ?? staff.value.assigned_class ?? ''
    ctx.gradeclassName = staff.value.assigned_class_name ?? staff.value.assigned_class ?? ''
  }
  // Get latest term + academic year from API
  const trm = await get_terms_with_year()
  const t = trm?.data ?? trm
  ctx.termId = t?.id ?? null
  ctx.term   = t?.name ?? ''
  ctx.year   = t?.academic_year ?? ''
  ctx.yearId = t?.academic_year_id ?? null
}
async function loadTeacherStudents() {
  const ans = await get_teacher_student()
  const list = Array.isArray(ans?.data) ? ans.data : (Array.isArray(ans) ? ans : [])
  studentsFromApi.value = list.map(normalizeStudent)
}

/* ---------------------------
   LIFECYCLE
--------------------------- */

function confirmPublish() { published.value = true; publishDialog.value = false; toast('Published', 'success') }
function selectStudent(id) { selectedStudentId.value = id }

onMounted(async () => {
  booting.value = true
  try {
    await hydrateCtxFromApi()
    await loadTeacherStudents()
    initStudentsState()
    pruneStaleRecords()
    restoreDraft()
    // After restore, ensure current context bucket exists
    currentRecordsBucket()
  } catch (e) {

    toast('Could not load students', 'error')
  } finally {
    booting.value = false
  }
})

/* ✅ when Year/Term/Class context changes, reset/init THIS context */
watch(ctxKey, () => {
  initStudentsState()
  pruneStaleRecords()
})

/* Also re-init if student list refreshes later */
watch(studentsFromApi, () => { initStudentsState(); pruneStaleRecords() })
</script>

<style scoped>
/* Premium theming similar to enterprise dashboards */
.premium-bg { background: linear-gradient(135deg, #eaecf0 0%, #dae4f3 40%, #a0b4c6 100%); min-height: 100vh; }
.premium-hero { background: linear-gradient(135deg, rgba(103,58,183,0.82) 0%, rgba(33,150,243,0.82) 100%); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(4px); }
.premium-avatar { border: 2px solid rgba(255,255,255,0.6); }
.premium-card { border-radius: 18px; border: 1px solid rgba(232, 225, 225, 0.06); background: rgba(255,255,255,0.98); }

/* KPI Cards */
.kpi-card { border-radius: 14px; color: white; }
.gradient-1 { background: linear-gradient(135deg, #1de9b6, #1dc4e9); }
.gradient-2 { background: linear-gradient(135deg, #ff8a65, #ff5252); }
.gradient-3 { background: linear-gradient(135deg, #9ccc65, #43a047); }
.gradient-4 { background: linear-gradient(135deg, #ffd54f, #ffa000); }

/* Table redesign */
.marks-table thead th {
  background: #f5f7fb;
  color: #3b3f5c;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 2;
}
.beautiful-table table {
  border-collapse: separate !important;
  border-spacing: 0;
}
.beautiful-table tbody td, .beautiful-table thead th {
  border-bottom: 1px solid #eef1f6;
}
.beautiful-table tbody tr:hover {
  background: #fafcff;
}

/* Stripes */
.striped-table tbody tr:nth-child(odd) {
  background: #fcfdff;
}

/* Compact cell paddings */
.marks-table :deep(td), .marks-table :deep(th) {
  padding: 10px 12px !important;
}

/* Right/center helpers */
.text-right { text-align: right; }
.text-center { text-align: center; }

/* Input appearance inside cells */
.cell-input :deep(.v-field__input) {
  padding: 0 !important;
}

/* Validity backgrounds (keep blue text) */
.score-error input {
  background-color: #fff6f6;
  box-shadow: inset 0 0 0 1px rgba(239, 225, 225, 0.25);
  border-radius: 6px;
}
.score-ok input {
  background-color: #f6fff6;
  box-shadow: inset 0 0 0 1px rgba(67,160,71,0.25);
  border-radius: 6px;
}

.opacity-80 { opacity: 0.8; }
.text-no-wrap { white-space: nowrap; }
.text-disabled { color: rgba(0,0,0,0.45); }
</style>
