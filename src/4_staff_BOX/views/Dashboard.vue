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
          <v-chip color="deep-purple" text-color="white" class="mr-2" size="small" prepend-icon="mdi-cloud-check-outline">
            Auto‑save: {{ autoSave ? 'On' : 'Off' }}
          </v-chip>
          <v-chip :color="published ? 'success' : 'warning'" text-color="white" size="small"
                  :prepend-icon="published ? 'mdi-check-decagram' : 'mdi-progress-clock'">
            {{ published ? 'Published (Locked)' : 'Draft' }}
          </v-chip>
        </div>
      </div>
    </v-card>

    <v-row>
      <!-- LEFT: Context & Subject/Search -->
      <v-col cols="12" md="4">
        <v-card class="pa-4 mb-4 premium-card" elevation="6">
          <div class="text-subtitle-1 font-weight-bold mb-2">Context</div>

          <v-progress-linear v-if="booting" indeterminate color="primary" class="mb-3" />

          <v-row dense>
            <v-col cols="12">
              <v-chip color="primary" text-color="white" class="mr-1 mb-1" size="small">
                Year: {{ ctx.year || '—' }}
              </v-chip>
              <v-chip color="primary" text-color="white" class="mr-1 mb-1" size="small">
                Term: {{ ctx.term || '—' }}
              </v-chip>
              <v-chip color="primary" text-color="white" class="mr-1 mb-1" size="small">
                Class: {{ ctx.gradeclassName || ctx.gradeclassId || '—' }}
              </v-chip>
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="subject"
                :items="SUBJECTS"
                label="Subject"
                variant="solo-filled"
                density="comfortable"
                :disabled="booting"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="search"
                label="Search student or index"
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
                density="comfortable"
                clearable
                :disabled="booting"
              />
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2 font-weight-bold">Scoring Scheme ({{ subjectLabel(subject) }})</div>
            <v-btn size="small" variant="tonal" color="primary" @click="schemeDialog = true" :disabled="booting || published">
              <v-icon start>mdi-pencil</v-icon>Edit
            </v-btn>
          </div>

          <v-chip class="mr-1 mb-1" color="primary" text-color="white" size="small">
            Class: {{ scheme[subject].classMax }}
          </v-chip>
          <v-chip class="mr-1 mb-1" color="primary" text-color="white" size="small">
            Exam: {{ scheme[subject].examMax }}
          </v-chip>
          <v-alert type="info" variant="tonal" density="compact" border="start" class="mt-2">
            Total: <strong>{{ scheme[subject].classMax + scheme[subject].examMax }}</strong> (should be 100)
          </v-alert>
        </v-card>

        <!-- Student List -->
        <v-card class="pa-0 premium-card" elevation="6">
          <div class="pa-4 d-flex align-center justify-space-between">
            <div class="text-subtitle-1 font-weight-bold">Students</div>
            <v-chip size="small" color="secondary" text-color="white">{{ filteredStudents.length }} in class</v-chip>
          </div>
          <v-divider />
          <v-virtual-scroll :items="filteredStudents" height="420" item-height="64">
            <template #default="{ item }">
              <v-list-item :key="item.id" class="px-4" @click="selectStudent(item.id)"
                           :active="item.id === selectedStudentId" :subtitle="item.indexNo" :title="item.full_name">
                <template #prepend>
                  <v-avatar color="indigo" size="36">
                    <span class="text-white">{{ initials(item.full_name) }}</span>
                  </v-avatar>
                </template>
                <template #append>
                  <v-chip size="x-small" :color="isComplete(item.id, subject) ? 'success' : 'grey'"
                          text-color="white" variant="elevated">
                    {{ isComplete(item.id, subject) ? 'Done' : 'Pending' }}
                  </v-chip>
                </template>
              </v-list-item>
              <v-divider />
            </template>
          </v-virtual-scroll>
        </v-card>
      </v-col>

      <!-- RIGHT: KPI + Editable Table + Summary -->
      <v-col cols="12" md="8">
        <!-- KPIs -->
        <v-row>
          <v-col cols="12" sm="6" lg="3">
            <v-card class="pa-4 kpi-card gradient-1" elevation="8">
              <div class="text-caption text-white opacity-80">Completion</div>
              <div class="d-flex align-center justify-space-between">
                <div class="text-h5 text-white">{{ completionRate }}%</div>
                <v-progress-circular :model-value="completionRate" color="white" size="42" width="4" />
              </div>
              <div class="text-caption text-white opacity-80 mt-1">{{ completedCount }}/{{ filteredStudents.length }} done</div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" lg="3">
            <v-card class="pa-4 kpi-card gradient-2" elevation="8">
              <div class="text-caption text-white opacity-80">Class Average ({{ subjectLabel(subject) }})</div>
              <div class="text-h5 text-white">{{ subjectAverage.toFixed(1) }}</div>
              <div class="text-caption text-white opacity-80 mt-1">out of 100</div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" lg="3">
            <v-card class="pa-4 kpi-card gradient-3" elevation="8">
              <div class="text-caption text-white opacity-80">Highest</div>
              <div class="text-h5 text-white">{{ subjectMax.score.toFixed(1) }}</div>
              <div class="text-caption text-white opacity-80 mt-1">{{ subjectMax.holder }}</div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" lg="3">
            <v-card class="pa-4 kpi-card gradient-4" elevation="8">
              <div class="text-caption text-white opacity-80">Lowest</div>
              <div class="text-h5 text-white">{{ subjectMin.score.toFixed(1) }}</div>
              <div class="text-caption text-white opacity-80 mt-1">{{ subjectMin.holder }}</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Context bar -->
        <v-alert type="info" variant="tonal" border="start" class="mb-4">
          <strong>Context:</strong>
          {{ ctx.year }} • {{ ctx.term }} • {{ ctx.gradeclassName || ctx.gradeclassId || '—' }} •
          <strong>{{ subjectLabel(subject) }}</strong>
        </v-alert>

        <!-- Editable table -->
        <v-card elevation="6" class="premium-card">
          <div class="d-flex align-center justify-space-between pa-4">
            <div class="text-subtitle-1 font-weight-bold">
              Marks Entry — {{ subjectLabel(subject) }}
            </div>
            <div class="d-flex flex-wrap align-center">
              <v-btn class="mr-2 mb-2" size="small" variant="tonal" color="secondary"
                     @click="fillBlanks(subject, 20, 40)" :disabled="published || booting">
                <v-icon start>mdi-auto-fix</v-icon>Fill Blanks
              </v-btn>
              <v-btn class="mr-2 mb-2" size="small" variant="tonal" color="error"
                     @click="clearSubject(subject)" :disabled="published || booting">
                <v-icon start>mdi-broom</v-icon>Clear Subject
              </v-btn>
              <v-btn class="mr-2 mb-2" size="small" variant="tonal" color="primary"
                     @click="importDialog = true" :disabled="published || booting">
                <v-icon start>mdi-tray-arrow-down</v-icon>Import CSV
              </v-btn>
              <v-btn class="mb-2" size="small" variant="tonal" color="primary" @click="exportCSV" :disabled="booting">
                <v-icon start>mdi-tray-arrow-up</v-icon>Export CSV
              </v-btn>
            </div>
          </div>

          <v-divider />

          <v-table density="comfortable" class="marks-table">
            <thead>
              <tr>
                <th style="width: 44px;">#</th>
                <th>Student</th>
                <th>Class ({{ scheme[subject].classMax }})</th>
                <th>Exam ({{ scheme[subject].examMax }})</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Interpretation</th>
                <th class="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(stu, i) in filteredStudents" :key="stu.id">
                <td>{{ i + 1 }}</td>
                <td>
                  <div class="d-flex align-center">
                    <v-avatar size="28" class="mr-2" color="indigo">
                      <span class="text-white text-caption">{{ initials(stu.full_name) }}</span>
                    </v-avatar>
                    <div>
                      <div class="text-body-2">{{ stu.full_name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ stu.indexNo }}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <v-text-field
                    v-model.number="rec(stu.id)[`${subject}_class_score`]"
                    variant="plain" density="compact" type="number"
                    :min="0" :max="scheme[subject].classMax" :step="1" hide-details
                    :class="scoreClass(rec(stu.id)[`${subject}_class_score`], 0, scheme[subject].classMax)"
                    @change="recalc(stu.id, subject)" @blur="autoSaveDraft" :disabled="published || booting"
                  />
                </td>
                <td>
                  <v-text-field
                    v-model.number="rec(stu.id)[`${subject}_exam_score`]"
                    variant="plain" density="compact" type="number"
                    :min="0" :max="scheme[subject].examMax" :step="1" hide-details
                    :class="scoreClass(rec(stu.id)[`${subject}_exam_score`], 0, scheme[subject].examMax)"
                    @change="recalc(stu.id, subject)" @blur="autoSaveDraft" :disabled="published || booting"
                  />
                </td>

                <td>
                  <v-chip :color="colorForScore(rec(stu.id)[`${subject}_total_score`] ?? 0)" text-color="white" size="small" variant="elevated">
                    {{ (rec(stu.id)[`${subject}_total_score`] ?? 0).toFixed(0) }}
                  </v-chip>
                </td>
                <td>
                  <v-chip :color="colorForGrade(rec(stu.id)[`${subject}_grade`])" size="small" text-color="white">
                    {{ rec(stu.id)[`${subject}_grade`] || '—' }}
                  </v-chip>
                </td>
                <td class="text-no-wrap">
                  {{ rec(stu.id)[`${subject}_interpretation`] || '—' }}
                </td>
                <td class="text-right">
                  <v-chip size="x-small" :color="isComplete(stu.id, subject) ? 'success' : 'grey'"
                          text-color="white" variant="elevated">
                    {{ isComplete(stu.id, subject) ? 'Complete' : 'Pending' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-divider />

          <!-- Class Meta -->


          <!-- Footer actions -->
          <div class="pa-4 d-flex flex-wrap justify-space-between align-center">
            <div class="text-body-2">
              <v-icon size="16" class="mr-1">mdi-information-outline</v-icon>
              Class {{ scheme[subject].classMax }} + Exam {{ scheme[subject].examMax }} = 100. Grading: A≥85, B≥70, C≥50, D≥30, else E.
            </div>
            <div class="d-flex">
              <v-btn class="mr-2" variant="tonal" color="secondary" @click="saveDraft" :loading="saving" :disabled="published || booting">
                <v-icon start>mdi-content-save-outline</v-icon>Save Draft
              </v-btn>
              <v-btn class="mr-2" variant="tonal" color="primary" @click="rankAndPreview" :disabled="published || booting">
                <v-icon start>mdi-numeric</v-icon>Compute Positions
              </v-btn>
              <v-btn color="success" @click="publishDialog = true" :disabled="published || completionRate < 60 || booting">
                <v-icon start>mdi-check-decagram</v-icon>Publish
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- JSON Preview -->
        <v-card class="pa-4 mt-4 premium-card" elevation="6">
          <div class="d-flex align-center justify-space-between">
            <div class="text-subtitle-1 font-weight-bold">Payload Preview (per student)</div>
            <v-btn size="small" color="primary" variant="tonal" @click="saveToServer" :disabled="published || booting">
              <v-icon start>mdi-cloud-upload</v-icon>Submit (stub)
            </v-btn>
          </div>
          <pre class="mt-3 payload-pre">{{ JSON.stringify(samplePayload, null, 2) }}</pre>
        </v-card>

        <!-- Snackbar -->
        <v-snackbar v-model="snack.show" :timeout="2200" :color="snack.color" rounded="pill">
          <v-icon start>mdi-check-circle</v-icon>{{ snack.text }}
        </v-snackbar>
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
            After publishing, entries lock for this class, year & term.
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
          <v-btn color="success" @click="confirmPublish"><v-icon start>mdi-check-decagram</v-icon>Publish</v-btn>
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
  </v-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { get_terms_with_year, get_teacher_student } from '@/services/api'

/* ---------------------------
   CONSTANTS
--------------------------- */
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

const scheme = reactive(Object.fromEntries(SUBJECTS.map(s => [s, { classMax: 40, examMax: 60 }])))
const schemeWorking = ref({ classMax: 40, examMax: 60 })
const schemeDialog = ref(false)

const published = ref(false)
const autoSave = ref(true)
const saving = ref(false)

const records = reactive({})  // { [studentId]: ... }
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
  records[studentId] ||= {
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
  return records[studentId]
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
   PERSISTENCE
--------------------------- */
const LS_KEY = 'acad_records_demo_v1'
function saveDraft() {
  saving.value = true
  const payload = { ctx, records, scheme, classMeta, published: published.value }
  localStorage.setItem(LS_KEY, JSON.stringify(payload))
  setTimeout(() => { saving.value = false; toast('Draft saved', 'success') }, 300)
}
function autoSaveDraft() { if (autoSave.value && !published.value) saveDraft() }
function restoreDraft() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    Object.assign(classMeta, parsed.classMeta || {})
    published.value = !!parsed.published
    if (parsed.scheme) for (const s of SUBJECTS) { if (parsed.scheme[s]) scheme[s] = parsed.scheme[s] }
    for (const k of Object.keys(parsed.records || {})) { records[k] = parsed.records[k] }
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
   PAYLOAD
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
    attitude: r.attitude,
    interest: r.interest,
    teacher_remarks: classMeta.teacher_remarks,
    head_teacher_remarks: classMeta.head_teacher_remarks,
    next_term_begins: classMeta.next_term_begins,
    position: r.position,
    conduct: r.conduct,
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
async function saveToServer() {
  const rows = filteredStudents.value.map(s => buildPayload(s.id))

  toast('Payloads logged to console (stub). Replace with real API.', 'info')
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
function initStudentsState() {
  classMeta.number_on_roll = students.value.length
  students.value.forEach(s => rec(s.id))
  // optional demo seed; remove in prod if not needed
  const subj = subject.value
  const list = students.value
  const seed = [
    { id: list[0]?.id, c: 28, e: 52 },
    { id: list[1]?.id, c: 30, e: 40 },
    { id: list[2]?.id, c: 18, e: 45 },
  ].filter(Boolean)
  seed.forEach(row => {
    const r = rec(row.id)
    r[`${subj}_class_score`] = row.c
    r[`${subj}_exam_score`] = row.e
    recalc(row.id, subj)
  })
}
function pruneStaleRecords() {
  const valid = new Set(students.value.map(s => String(s.id)))
  for (const k of Object.keys(records)) { if (!valid.has(String(k))) delete records[k] }
}

async function hydrateCtxFromApi() {
  // staff from localStorage for read-only display
  const staffString = localStorage.getItem('staff')
  if (staffString) {
    staff.value = JSON.parse(staffString)
    ctx.gradeclassId   = staff.value.assigned_class_id ?? staff.value.assigned_class ?? ''
    ctx.gradeclassName = staff.value.assigned_class_name ?? staff.value.assigned_class ?? ''
  }
  // term + year
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
function toast(text, color = 'success') { snack.text = text; snack.color = color; snack.show = true }
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
  } catch (e) {

    toast('Could not load students', 'error')
  } finally {
    booting.value = false
  }
})

// keep state in sync if students list refreshes again later
watch(studentsFromApi, () => { initStudentsState(); pruneStaleRecords() })
</script>

<style scoped>
/* Premium theming similar to enterprise dashboards */
.premium-bg { background: linear-gradient(135deg, #0d1321 0%, #1d2d44 40%, #3e5c76 100%); min-height: 100vh; }
.premium-hero { background: linear-gradient(135deg, rgba(103,58,183,0.82) 0%, rgba(33,150,243,0.82) 100%); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(4px); }
.premium-avatar { border: 2px solid rgba(255,255,255,0.6); }
.premium-card { border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.96); }

.kpi-card { border-radius: 16px; color: white; }
.gradient-1 { background: linear-gradient(135deg, #1de9b6, #1dc4e9); }
.gradient-2 { background: linear-gradient(135deg, #ff8a65, #ff5252); }
.gradient-3 { background: linear-gradient(135deg, #9ccc65, #43a047); }
.gradient-4 { background: linear-gradient(135deg, #ffd54f, #ffa000); }

.marks-table thead th { background: #f6f7fb; font-weight: 700; color: #3b3f5c; }
.marks-table tbody tr:hover { background: #fafbff; }
.score-error input { color: #d32f2f !important; font-weight: 600; }
.score-ok input { color: #1b5e20 !important; font-weight: 600; }

.payload-pre { background: #0d1321; color: #e3f2fd; padding: 12px; border-radius: 12px; font-size: 12px; max-height: 320px; overflow: auto; }
.opacity-80 { opacity: 0.8; }
.text-no-wrap { white-space: nowrap; }
</style>
