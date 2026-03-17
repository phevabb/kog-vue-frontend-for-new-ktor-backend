<template>
  <CContainer class="py-5">
    <!-- =========================== -->
    <!-- SECTION TITLE -->
    <!-- =========================== -->
    <CRow>
      <CCol>
        <h3 class="fw-bold mb-4">Online Payments</h3>
      </CCol>
    </CRow>

    <!-- =========================== -->
    <!-- PREMIUM SIDE-BY-SIDE TILES -->
    <!-- =========================== -->
    <CRow class="g-4">
      <!-- =========================== -->
      <!-- LEFT TILE – PAYMENT PREVIEW -->
      <!-- =========================== -->
      <CCol md="6">
        <CCard class="border-0 shadow-lg h-100 premium-card">
          <CCardBody class="d-flex flex-column p-4">
            <!-- Header -->
            <div
              class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom"
            >
              <h6 class="fw-bold mb-0 text-dark">Transaction Preview</h6>
              <CBadge color="success" class="px-3 py-2 rounded-pill shadow-sm">
                Success
              </CBadge>
            </div>

            <!-- Amount -->
            <div class="mb-4">
              <small class="text-muted text-uppercase">Amount</small>
              <p class="fw-bold text-primary fs-3 mt-1 mb-0">
                GHS
                {{
                  Number(amount || 0).toLocaleString('en-GH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                }}
              </p>
            </div>

            <!-- Date -->
            <div class="mt-auto pt-2">
              <small class="text-muted text-uppercase d-block">Date</small>
              <h6 class="fw-semibold mt-1 mb-0">
                {{ new Date().toLocaleDateString('en-GB') }}
              </h6>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <!-- =========================== -->
      <!-- RIGHT TILE – PAY ONLINE -->
      <!-- =========================== -->
      <CCol md="6">
        <CCard class="shadow-lg border-0 h-100 premium-card">
          <!-- HEADER -->
          <CCardHeader
            class="bg-gradient-primary text-white py-3 text-center"
            style="border-radius: 14px 14px 0 0;"
          >
            <h5 class="mb-0 fw-bold letter-spacing-1">Pay Online</h5>
          </CCardHeader>

          <!-- BODY -->
          <CCardBody class="p-4 d-flex flex-column">
            <!-- Student/Family Info -->
            <div class="text-center mb-4">
              <h5 class="fw-bold mb-1">
                {{ capitalizeWords(is_family ? family_name : user?.full_name) }}
              </h5>
              <small class="text-muted">Student ID • {{ user?.user_id }}</small>
            </div>

            <!-- Outstanding Panel -->
            <div class="premium-panel shadow-sm mb-4 text-center mx-auto">
              <small class="text-muted text-uppercase">Outstanding Balance</small>
              <h2 class="fw-bold text-danger mt-2 mb-0">
                GHS
                {{
                  Number(displayBalance).toLocaleString('en-GH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                }}
              </h2>
            </div>

            <!-- Amount Field -->
            <div class="mb-4">
              <label class="fw-semibold small mb-1">Amount to Pay</label>
              <CFormInput
                type="number"
                min="1"
                v-model="amount"
                placeholder="Eg: 200"
                class="py-2"
                :disabled="isPaying"
              />
            </div>

            <!-- Submit Button -->
            <div class="mt-auto">
              <CButton
                color="primary"
                class="w-100 py-3 fw-bold shadow-sm"
                size="lg"
                style="border-radius: 10px;"
                :disabled="!isValidAmount || isPaying"
                @click="payWithPaystack"
              >
                <CIcon :icon="cilCreditCard" class="me-2" />
                {{ isPaying ? 'Processing…' : 'Pay Securely' }}
              </CButton>

              <div class="text-center mt-2">
                <small class="text-muted">Secure • Powered by Paystack</small>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </CContainer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { CIcon } from '@coreui/icons-vue'
import { cilCreditCard } from '@coreui/icons'

// === API ===
import {
  create_online_transaction,
  verify_payment,
  student_profile,
  get_family_payment_list_per_term
} from '@/services/api'

const toast = useToast()

// =====================
// STATE
// =====================
const amount = ref(null)
const isPaying = ref(false)

const user = ref(null)
const displayBalance = ref(0)

const is_family = ref(false)
const family_name = ref('')
const family_id = ref(null)

const stats = ref({
  balance: 0,
  is_fully_cleared: false
})

const allPayments = ref([])

// Derived
const outstandingBalance = computed(() => stats.value.balance)

// =====================
// VALIDATION
// =====================
const isValidAmount = computed(() => {
  const val = Number(amount.value)
  return (
    val &&
    val > 0 &&
    Number.isFinite(val) &&
    val <= Number(displayBalance.value)
  )
})

// =====================
// HELPERS (IMMEDIATE + RECONCILE)
// =====================
function applyImmediateBalanceChange(paidAmount) {
  const toDeduct = Math.max(0, Number(paidAmount) || 0)
  displayBalance.value = Math.max(0, Number(displayBalance.value) - toDeduct)
}

async function reconcileBalances() {
  try {
    if (!user.value) return

    // Always refresh the student's profile
    const profile = await student_profile(user.value.user_id)
    stats.value.balance = Number(profile.data?.total_balance || 0)
    allPayments.value = profile.data?.payments || []

    if (!is_family.value) {
      // Individual view
      displayBalance.value = stats.value.balance
      return
    }

    // Family view: recompute family total from term list
    const famRes = await get_family_payment_list_per_term(family_id.value)
    family_name.value = famRes.data?.family_name || family_name.value
    family_id.value = famRes.data?.family || family_id.value

    const totalBalance = (famRes.data?.records || []).reduce((sum, record) => {
      return sum + Number(record.balance || 0)
    }, 0)

    displayBalance.value = Math.max(0, Number(totalBalance))
  } catch (err) {
    toast.error('Reconciliation error:', err)

    // Keep optimistic UI; optionally notify
  }
}

// =====================
// PAYSTACK
// =====================
const payWithPaystack = async () => {
  if (!isValidAmount.value || isPaying.value) return

  // Ensure Paystack script is present
  if (!window.PaystackPop) {
    toast.error('Payment service not ready. Please wait a moment and retry.')
    return
  }

  isPaying.value = true

  const reference = await createTransaction()
  if (!reference) {
    isPaying.value = false
    return // stop if creation failed
  }

  try {
    const handler = window.PaystackPop.setup({
      key: 'pk_test_a5628172fea1fc91e2744361548513a3a3598252',
      email: user.value?.email || 'payer@example.com',
      amount: Number(amount.value) * 100,
      currency: 'GHS',
      ref: reference,
      callback: (response) => {
        // Verify on our backend
        verifyPayment(response.reference)
      },
      onClose: () => {
        isPaying.value = false
      }
    })

    handler.openIframe()
  } catch (e) {
    isPaying.value = false
    toast.error('Unable to open payment window.')
  }
}

const verifyPayment = async (reference) => {
  try {
    const res = await verify_payment({ reference })

    if (res.data?.ok) {
      // 1) IMMEDIATE UI FEEDBACK
      applyImmediateBalanceChange(amount.value)

      // 2) Save paid, clear input
      const paid = Number(amount.value || 0)
      amount.value = null

      toast.success('Payment successful')

      // 3) AUTHORITATIVE RECONCILIATION
      await reconcileBalances()
    } else {
      toast.error('Payment verification failed')
    }
  } catch (err) {
    toast.error('Verification error')
  } finally {
    isPaying.value = false
  }
}

// =====================
// TRANSACTION CREATION
// =====================
const createTransaction = async () => {
  try {
    const payload = {
      amount: Number(amount.value),
      student: user.value?.user_id,
      family_id: is_family.value ? family_id.value : null,
      name: user.value?.full_name,
      email: user.value?.email || 'payer@example.com',
      payment_method: 'online',
      payment_type: is_family.value ? 'family' : 'student'
    }

    const res = await create_online_transaction(payload)

    if (res.data?.status) {
      return res.data.reference // RETURN — do NOT call gateway here
    } else {
      toast.error('Transaction creation failed')
      return null
    }
  } catch (err) {

    toast.error('Unable to create transaction')
    return null
  }
}

// =====================
// INIT (LOAD DATA + PAYSTACK SCRIPT)
// =====================
onMounted(async () => {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) return
    user.value = JSON.parse(userString)

    // Student baseline
    const res = await student_profile(user.value.user_id)
    stats.value.balance = Number(res.data?.total_balance || 0)

    const familyData = localStorage.getItem('family')
    if (!familyData) {
      // Individual view
      is_family.value = false
      displayBalance.value = stats.value.balance
    } else {
      // Family view
      is_family.value = true
      const family = JSON.parse(familyData)

      const famRes = await get_family_payment_list_per_term(family.id)
      family_name.value = famRes.data?.family_name || ''
      family_id.value = famRes.data?.family || family?.id

      const totalBalance = (famRes.data?.records || []).reduce((sum, record) => {
        return sum + Number(record.balance || 0)
      }, 0)

      displayBalance.value = Math.max(0, Number(totalBalance))
    }
  } catch (error) {

    toast.error(error)
    displayBalance.value = Number(stats.value?.balance || 0)
  }

  // Load Paystack script once
  if (!document.getElementById('paystack-script')) {
    const script = document.createElement('script')
    script.id = 'paystack-script'
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
  }
})

// =====================
// UTILS
// =====================
function capitalizeWords(text) {
  if (!text) return ''
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
.premium-card {
  border-radius: 18px !important;
}

.premium-panel {
  border: 1px solid #efefef;
  padding: 24px 20px;
  width: 85%;
  border-radius: 14px;
  background: #ffffff;
}

.letter-spacing-1 {
  letter-spacing: 0.5px;
}
</style>
