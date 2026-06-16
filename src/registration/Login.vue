
<template>
  <div class="login-wrapper d-flex flex-row align-items-center justify-content-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol md="8" lg="7">

          <CCardGroup class="login-group shadow-lg">

            <!-- LEFT: FORM -->
            <CCard class="p-4 border-0 login-card animate-fade">
              <CCardBody>
                <CForm @submit.prevent="onSubmit">

                  <div class="text-center mb-4">
                    <h1 class="title">Login</h1>
                    <p class="subtitle">Sign in to your account</p>
                  </div>

                  <CAlert v-if="error" color="danger" class="mb-3 text-center">
                    {{ error }}
                  </CAlert>

                  <!-- Username -->
                  <CInputGroup class="mb-3 input-wrap">
                    <CInputGroupText class="input-icon">
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
                  <CInputGroup class="mb-3 input-wrap">
                    <CInputGroupText class="input-icon">
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
                  <CInputGroup class="mb-4 input-wrap">
                    <CInputGroupText class="input-icon">
                      <CIcon icon="cil-people" />
                    </CInputGroupText>
                    <CFormSelect v-model="role" :disabled="loading" required>
                      <option disabled value="" selected>Select role</option>
                      <option value="administrator">Administrator</option>
                      <option value="principal">Principal</option>
                      <option value="student">Parent</option>
                      <option value="staff">Teacher</option>
                    </CFormSelect>
                  </CInputGroup>

                  <!-- Buttons -->
                  <CRow class="align-items-center">
                    <CCol xs="6">
                      <CButton
                        type="submit"
                        color="dark"
                        class="px-4 py-2 text-white rounded-pill w-100 fw-semibold animate-scale"
                        :disabled="loading"
                      >
                        <CSpinner v-if="loading" size="sm" class="me-2" />
                        Login
                      </CButton>
                    </CCol>

                    <CCol xs="6" class="text-end">
                      <router-link to="/reset-password" class="forgot-link">
                        Forgot password?
                      </router-link>
                    </CCol>
                  </CRow>

                </CForm>
              </CCardBody>
            </CCard>

            <!-- RIGHT: BRANDING -->
            <CCard class="brand-card text-white py-5 border-0 animate-slide">
              <CCardBody class="text-center">
                <h2 class="brand-title">KING OF GLORY PREP. SCHOOL</h2>
                <hr class="brand-line" />
                <p class="brand-text">
                  Simplify school fees.<br />
                  Stay organized.<br />
                  Manage payments with ease.
                </p>
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
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login_ktor } from '../services/api'

const toast = useToast()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const role = ref<'administrator' | 'principal' | 'staff' | 'student'>('administrator')

const loading = ref(false)
const error = ref<string | null>(null)

// ✅ store only what you actually receive from Ktor
function storeAuth(token: string, user: any, role: string) {
  localStorage.setItem('token', token)

  localStorage.setItem(
    'user',
    JSON.stringify({
      ...user,
      role,
    }),
  )
}

function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('family')
  localStorage.removeItem('staff')
}

function nextTarget() {
  const redirectPath = route?.query?.redirect as string | undefined

  if (redirectPath) {
    return redirectPath
  }

  let user: any = null

  try {
    const raw = localStorage.getItem('user')
    if (raw) user = JSON.parse(raw)
  } catch {}

  if (user?.role === 'administrator') return { name: 'student_fee_records_admin' }
  if (user?.role === 'principal') return { name: 'PrincipalDashboard' }
  if (user?.role === 'student') return { name: 'AcademicRecords' }
  if (user?.role === 'staff') return { name: 'StaffDashboard' }

  return { name: 'Login' }
}

async function onSubmit() {
  error.value = null
  loading.value = true

  try {
    const payload = {
      userId: username.value.trim(),
      role: role.value,
      pin: password.value.trim(),
    }

    const { data } = await login_ktor(payload)


    // Ktor response: { access, role, user }
    const token = data?.access
    if (!token) throw new Error('No token received')

    storeAuth(token, data.user, data.role)

    toast.success('Login successful')

    const target = nextTarget()
    await router.replace(target)

  } catch (e: any) {
    const backendError =
      e?.response?.data?.error ||
      e?.response?.data?.detail ||
      e?.message ||
      'Login failed'

    error.value = backendError
    toast.error(backendError)
    clearAuth()
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
/* PAGE */
.login-wrapper {
  min-height: 100vh;
  background: #ffffff;
  padding: 20px;
}

/* CARD GROUP */
.login-group {
  border-radius: 22px;
  overflow: hidden;
}

/* LEFT CARD */
.login-card {
  background: #ffffff;
  border-right: 1px solid #f0f0f0;
}

/* RIGHT BRAND CARD */
.brand-card {
  background: linear-gradient(180deg, #6461f2, #6461f2);
}

.brand-title {
  font-weight: 700;
  font-size: 1.6rem;
}

.brand-line {
  border-color: rgba(255, 255, 255, 0.3);
  width: 50%;
}

.brand-text {
  opacity: 0.85;
  line-height: 1.6;
}

/* TITLES */
.title {
  font-size: 2rem;
  font-weight: 700;
}

.subtitle {
  font-size: 0.95rem;
  color: #888;
}

/* INPUTS */
.input-wrap input,
.input-wrap select {
  background: #f7f7f7 !important;
  border: 1px solid #e5e5e5 !important;
  padding: 11px 12px !important;
  border-radius: 6px !important;
}

.input-wrap input:focus,
.input-wrap select:focus {
  border-color: #000 !important;
  box-shadow: none !important;
}

.input-icon {
  background: #efefef !important;
  border-right: none !important;
}

/* Forgot link */
.forgot-link {
  color: #333;
  font-weight: 600;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* ✅ ANIMATIONS */
.animate-fade {
  animation: fadeIn 0.8s ease-out;
}

.animate-slide {
  animation: slideIn 0.9s ease-out;
}

.animate-scale:hover {
  transform: scale(1.03);
  transition: 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ✅ RESPONSIVE */
@media (max-width: 991px) {
  .login-group {
    flex-direction: column;
  }
  .login-card {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
}
</style>
