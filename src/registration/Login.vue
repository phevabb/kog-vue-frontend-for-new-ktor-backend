
<template>
  <div class="wrapper min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol :md="8">
          <CCardGroup>
            <CCard class="p-4">
              <CCardBody>
                <CForm @submit.prevent="onSubmit">
                  <h1>Login</h1>
                  <p class="text-body-secondary">Sign In to your account</p>

                  <CAlert v-if="error" color="danger" class="mb-3">
                    {{ error }}
                  </CAlert>

                  <!-- Username -->
                  <CInputGroup class="mb-3">
                    <CInputGroupText>
                      <CIcon icon="cil-user" />
                    </CInputGroupText>
                    <CFormInput
                      v-model="username"
                      placeholder="Email or ID"
                      autocomplete="username"
                      required
                    />
                  </CInputGroup>

                  <!-- Password -->
                  <CInputGroup class="mb-3">
                    <CInputGroupText>
                      <CIcon icon="cil-lock-locked" />
                    </CInputGroupText>
                    <CFormInput
                      v-model="password"
                      type="password"
                      placeholder="Password"
                      autocomplete="current-password"
                      required
                    />
                  </CInputGroup>

                  <!-- Role -->
                  <CInputGroup class="mb-4">
                    <CInputGroupText>
                      <CIcon icon="cil-people" />
                    </CInputGroupText>
                    <CFormSelect v-model="role" :disabled="loading" required>
                      <option disabled value="" selected>Select role</option>
                      <option value="administrator">Administrator</option>
                      <option value="principal">Principal</option>
                      <option value="student">Parent</option>
                      <option value="staff">Teacher</option>
                      <!-- Add more if applicable -->
                      <!-- <option value="manager">Manager</option>
                      <option value="staff">Staff</option> -->
                    </CFormSelect>
                  </CInputGroup>

                  <CRow class="align-items-center">
                    <CCol :xs="6">
                      <CButton type="submit" color="primary" class="px-4" :disabled="loading">
                        <CSpinner v-if="loading" size="sm" class="me-2" />
                        Login
                      </CButton>
                    </CCol>
                    <CCol :xs="6" class="text-right">
                      <CButton color="link" class="px-0" type="button">
                         <router-link to="/reset-password">Forgot password?</router-link>
                      </CButton>
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>

            <CCard class="text-white bg-primary py-5" style="width: 44%">
              <CCardBody class="text-center">
                <div>
                  <h2>KING OF GLORY PREP. SCHOOL</h2>
                  <hr />
                  <p>
  Simplify school fees.<br>
  Stay organized.<br>
  Manage payments with ease.
</p>


                </div>
              </CCardBody>
            </CCard>
          </CCardGroup>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification'
const toast = useToast()
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '../services/api' // your API helper

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const role = ref('')          // <--- new
const loading = ref(false)
const error = ref<string | null>(null)

function storeAuth(token: string, user: any, family: any, staff: any) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('family', JSON.stringify(family))
  localStorage.setItem('staff', JSON.stringify(staff))

}


function nextTarget() {
  // 1) Honor ?redirect=<routeName> from guard (validate it exists)
  const redirectName = route?.query?.redirect
  if (redirectName) {
    const resolved = router.resolve({ name: redirectName })
    if (resolved && resolved.name) {
      return { name: redirectName }
    }
    // if invalid, fall through to role home
  }

  // 2) Get user safely from storage
  let user = null
  try {
    const raw = localStorage.getItem('user')
    if (raw) user = JSON.parse(raw)
  } catch (e) {

  }

  // 3) Role-based landing (use names that DEFINITELY exist)
  if (user && user.role === 'administrator') {
    return { name: 'student_fee_records_admin' }
  }

  if (user && user.role === 'principal') {
    return { name: 'PrincipalDashboard' }
  }


  if (user && user.role === 'student') {
    return { name: 'StudentDashboard' }
  }

  if (user && user.role === 'staff') {
    return { name: 'StaffDashboard' }
  }

  // 4) Fallback
  return { name: 'Login' }
}

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    const payload = {
      login_id: username.value,
      password: password.value,
      role: role.value, // keep only if backend expects this
    }

    const { data } = await login(payload)
    const token = data?.token || data?.access || data?.key
    if (!token) throw new Error('No token received from server')

    // Persist server-authoritative user + token
    storeAuth(token, data.user, data.family, data.staff,)

    // Decide where to go
    const target = nextTarget()

    // Avoid self-redirect; prefer replace after login
    const currentName = router.currentRoute.value?.name
    if (target?.name && target.name !== currentName) {
      await router.replace(target)
    } else {
  const roleRoutes = {
    principal: { name: 'PrincipalDashboard' },
    administrator: { name: 'student_fee_records_admin' },
    student: { name: 'StudentDashboard' }
  }

  await router.replace(
    roleRoutes[data.user?.role] || { name: 'Login' }
  )
}


  } catch (e) {


    const backendError =
      e?.response?.data?.non_field_errors?.[0] ||
      e?.response?.data?.detail ||
      e?.response?.data?.error ||
      e?.response?.data?.password?.[0] ||
      e?.message ||
      'Login failed'
    error.value = backendError
  } finally {
    loading.value = false
  }
}

</script>
