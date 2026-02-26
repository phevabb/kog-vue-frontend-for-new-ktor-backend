<template>
  <v-container fluid class="pa-4">
    <v-row>
      <!-- LEFT COLUMN -->
      <v-col cols="12" md="4">
        <v-card class="pa-4" elevation="3">
          <div class="d-flex flex-column align-center">
            <v-avatar size="100" color="primary" class="mb-3">
              <span class="text-h5">{{ initials }}</span>
            </v-avatar>

            <h2 class="text-h6 font-weight-bold mb-1">{{ student.full_name || '—' }}</h2>
            <v-chip
              :color="student.is_active ? 'success' : 'grey'"
              size="small"
              class="mb-3"
            >
              {{ student.is_active ? 'Active Student' : 'Inactive' }}
            </v-chip>
          </div>

          <v-divider class="my-3"></v-divider>

          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>
                <strong>Gender:</strong> {{ student.gender || '—' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Class:</strong> {{ student.current_class_display || student.current_class || '—' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Nationality:</strong> {{ student.nationality || '—' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Date of Birth:</strong> {{ student.date_of_birth || '—' }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Parent Info -->
        <v-card class="pa-4 mt-4" elevation="3">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Parent Contacts</h3>

          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>
                <strong>Father:</strong> {{ student.name_of_father || '—' }}
                <div class="text-grey">{{ student.contact_of_father || '—' }}</div>
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Mother:</strong> {{ student.name_of_mother || '—' }}
                <div class="text-grey">{{ student.contact_of_mother || '—' }}</div>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Health Info -->
        <v-card class="pa-4 mt-4" elevation="3">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Health Info</h3>

          <v-list density="compact">
            <v-list-item>
              <v-icon color="green" class="me-2">mdi-shield-check</v-icon>
              <v-list-item-title>
                Immunized: <strong>{{ student.is_immunized ? 'Yes' : 'No' }}</strong>
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-icon color="red" class="me-2">mdi-alert-circle</v-icon>
              <v-list-item-title>
                Allergies:
                <strong>{{ student.has_allergies ? (student.allergic_foods || 'Yes') : 'None' }}</strong>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- RIGHT COLUMN -->
      <v-col cols="12" md="8">
        <!-- Stats (demo) -->
        <v-row>
          <!-- <v-col cols="12" sm="4">
            <v-card elevation="3" class="pa-4 text-center">
              <h4 class="text-body-2 text-grey">Attendance</h4>
              <h2>{{ stats.attendance }}%</h2>
            </v-card>
          </v-col> -->

          <v-col cols="12" sm="6">
            <v-card elevation="3" class="pa-4 text-center">
              <h4 class="text-body-2 text-grey">Total Payments</h4>
              <h2>
                GHS {{ Number(stats.total_payments).toLocaleString('en-GH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) }}
              </h2>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6">
            <v-card elevation="3" class="pa-4 text-center">
              <h4 class="text-body-2 text-grey">Amount Owed</h4>
              <h2>
                GHS {{ Number(stats.balance).toLocaleString('en-GH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) }}
              </h2>
            </v-card>
          </v-col>


        </v-row>

        <!-- Academic Info -->
        <v-card elevation="3" class="pa-4 mt-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Academic Info</h3>

          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>
                <strong>Current Class:</strong> {{ student.current_class_display || student.current_class || '—' }}
              </v-list-item-title>
            </v-list-item>


          </v-list>
        </v-card>



        <!-- Payment History (demo) -->
        <v-card elevation="3" class="pa-4 mt-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-4">Payment History</h3>

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
              <tr v-for="(p, i) in payments" :key="i">
                <td>{{ i + 1 }}</td>

                <td>{{ p.term }}</td>
                <td>{{ p.academicyear }}</td>
                <td>{{ p.gradeclass }}</td>
                <td class="text-end">{{ p.amount }}</td>
                <td class="text-end">{{ p.balance }}</td>

                <td>
                  <v-chip
                    :color="p.fullypaid ? 'success' : 'error'"
                    variant="flat"
                    size="small"
                    class="text-white"
                  >
                    <v-icon
                      size="16"
                      class="mr-1"
                    >
                      {{ p.fullypaid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>

                    {{ p.fullypaid ? 'Fully Paid' : 'Not Paid' }}
                  </v-chip>
                </td>

              </tr>
            </tbody>
          </v-table>
        </v-card>

        <!-- Academic records (demo) -->
        <v-card elevation="3" class="pa-4 mt-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-4">Academic records</h3>

          <v-table density="comfortable">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th class="text-end">Amount (GHS)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in payments" :key="i">
                <td>{{ i + 1 }}</td>
                <td>{{ p.date }}</td>
                <td class="text-end">{{ p.amount }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <!-- Loading / Error -->
        <div v-if="loading" class="mt-4 text-grey">Loading student…</div>
        <div v-if="errorMsg" class="mt-2" style="color:#d32f2f;">{{ errorMsg }}</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { student_profile, get_student_payment_list } from "@/services/api"

const loading = ref(false)
const errorMsg = ref("")

const student = ref({
  full_name: "",
  gender: "",
  nationality: "",
  date_of_birth: "",
  current_class: "",
  current_class_display: "",
  class_seeking_admission_to: "",
  name_of_father: "",
  contact_of_father: "",
  name_of_mother: "",
  contact_of_mother: "",
  is_immunized: false,
  has_allergies: false,
  allergic_foods: "",
  last_school_attended: "",
  other_related_info: "",
  is_active: false,
})

const payments = ref([])


onMounted(async () => {
  try {
    loading.value = true

    // For demo: ensure we have a user with a user_id in localStorage
    let userLocal = null
    const userString = localStorage.getItem("user")

      userLocal = JSON.parse(userString)

    // IMPORTANT: use user_id (not id)
    const uid = userLocal.user_id

    const res = await student_profile(userLocal.user_id)
    const paymentsRes = await get_student_payment_list(userLocal.user_id)

    payments.value = paymentsRes.data.map(item => ({
      term: item.fee_structure.term.name,
      academicyear: item.fee_structure.academic_year.name,
      balance: item.balance,
      gradeclass: item.fee_structure.grade_class.name,
      fullypaid: item.is_fully_paid,
  date: new Date(item.date_created).toLocaleDateString(),
  amount: Number(item.amount_paid)
}))



    stats.value.total_payments = Number(res.data.total_amount_paid)
    stats.value.balance = Number(res.data.total_balance)
    stats.value.is_fully_cleared = res.data.is_fully_cleared


    const { user, profile } = res.data || {}

    if (!user || !profile) {
      errorMsg.value = "Incomplete data returned by server."
      return
    }

    const classMap = {
  1: "Creche",
  2: "Nursery 1",
  3: "Nursery 2",
  4: "KG 1",
  5: "KG 2",
  6: "Class 1",
  7: "Class 2",
  8: "Class 3",
  9: "Class 4",
  10: "Class 5",
  11: "Class 6",
  12: "JHS 1",
  13: "JHS 2",
  14: "JHS 3",
}


    student.value = {
      full_name: user.full_name || "",
      gender: user.gender || "",
      nationality: user.nationality || "",
      date_of_birth: user.date_of_birth || "",
      current_class: profile.current_class ?? "",
      current_class_display: classMap[profile.current_class] || profile.current_class_display || "",
      class_seeking_admission_to: profile.class_seeking_admission_to || "",
      name_of_father: profile.name_of_father || "",
      contact_of_father: profile.contact_of_father || "",
      name_of_mother: profile.name_of_mother || "",
      contact_of_mother: profile.contact_of_mother || "",
      is_immunized: !!profile.is_immunized,
      has_allergies: !!profile.has_allergies,
      allergic_foods: profile.allergic_foods || "",
      last_school_attended: profile.last_school_attended || "",
      other_related_info: profile.other_related_info || "",
      is_active: !!user.is_active,
    }
  } catch (err) {

    errorMsg.value = "Failed to load student profile."
  } finally {
    loading.value = false
  }
})

const stats = ref({
  // attendance: 95, // keep if still needed
  total_payments: 0,
  balance: 0,
  is_fully_cleared: false,
})




const initials = computed(() => {
  if (!student.value.full_name) return "S"
  return student.value.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
})
</script>

<style scoped>
.text-grey { color: #6c757d; }
</style>
