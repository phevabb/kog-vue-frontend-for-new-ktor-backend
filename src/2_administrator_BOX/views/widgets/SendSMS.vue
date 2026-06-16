<template>
  <div class="sms-page">
    <CCard class="sms-card shadow-sm border-0">
      <CCardBody>
        <div class="sms-header">
          <div>
            <h4 class="mb-1">Send SMS</h4>
            <p class="text-muted mb-0">
              Send an SMS message to all students’ dads.
            </p>
          </div>

          <div class="sms-icon">
            <i class="bi bi-chat-dots"></i>
          </div>
        </div>

        <div class="audience-box mt-4">
          <div class="audience-icon">
            <i class="bi bi-people-fill"></i>
          </div>

          <div>
            <small class="text-muted d-block">Recipients</small>
            <strong>All Students’ Dads</strong>
          </div>
        </div>

        <CAlert
          v-if="alert.show"
          :color="alert.type"
          dismissible
          class="mt-4"
          @close="alert.show = false"
        >
          {{ alert.message }}
        </CAlert>

        <CForm class="mt-4" @submit.prevent="sendSms">
          <div class="mb-3">
            <CFormLabel for="message">
              SMS Message
            </CFormLabel>

            <CFormTextarea
              id="message"
              v-model="form.message"
              rows="8"
              maxlength="459"
              placeholder="Type the SMS message here..."
              class="sms-textarea"
              :disabled="loading"
            />

            <div class="message-footer">
              <small :class="charactersLeft < 20 ? 'text-danger' : 'text-muted'">
                {{ form.message.length }}/459 characters
              </small>

              <small class="text-muted">
                Estimated SMS parts: {{ smsParts }}
              </small>
            </div>
          </div>

          <div class="send-actions">
            <CButton
              color="secondary"
              variant="outline"
              type="button"
              :disabled="loading || !form.message"
              @click="clearForm"
            >
              Clear
            </CButton>

            <CButton
              color="primary"
              type="submit"
              class="send-button"
              :disabled="loading || !canSend"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>

              {{ loading ? 'Sending...' : 'Send SMS' }}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import axios from 'axios'

const loading = ref(false)

const form = reactive({
  message: '',
})

const alert = reactive({
  show: false,
  type: 'success',
  message: '',
})

const charactersLeft = computed(() => {
  return 459 - form.message.length
})

const smsParts = computed(() => {
  if (!form.message.length) return 0

  if (form.message.length <= 160) return 1

  return Math.ceil(form.message.length / 153)
})

const canSend = computed(() => {
  return form.message.trim().length > 0
})

const showAlert = (type, message) => {
  alert.type = type
  alert.message = message
  alert.show = true
}

const clearForm = () => {
  form.message = ''
  alert.show = false
}

const validateForm = () => {
  if (!form.message.trim()) {
    showAlert('danger', 'Please type the SMS message.')
    return false
  }

  if (form.message.length > 459) {
    showAlert('danger', 'Your message is too long.')
    return false
  }

  return true
}

const sendSms = async () => {
  if (!validateForm()) return

  loading.value = true
  alert.show = false

  try {
    /**
     * Backend should automatically fetch all students' dads phone numbers.
     *
     * Example Ktor endpoint:
     * POST /api/sms/send-to-student-dads
     */
    const response = await axios.post('/api/sms/send-to-student-dads', {
      message: form.message.trim(),
    })

    showAlert(
      'success',
      response.data?.message || 'SMS sent successfully to all students’ dads.'
    )

    form.message = ''
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to send SMS. Please try again.'

    showAlert('danger', message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.sms-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(50, 31, 219, 0.08), transparent 30%),
    linear-gradient(135deg, #f8f9fc 0%, #eef1f7 100%);
}

.sms-card {
  width: 100%;
  max-width: 640px;
  border-radius: 22px;
  overflow: hidden;
}

.sms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.sms-header h4 {
  font-weight: 700;
  color: #1f2937;
}

.sms-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: rgba(50, 31, 219, 0.1);
  color: #321fdb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.audience-box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: #f4f6ff;
  border: 1px solid rgba(50, 31, 219, 0.12);
}

.audience-icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  background: #321fdb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.sms-textarea {
  resize: none;
  border-radius: 14px;
  padding: 14px;
  line-height: 1.6;
}

.sms-textarea:focus {
  box-shadow: 0 0 0 0.2rem rgba(50, 31, 219, 0.12);
}

.message-footer {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.send-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.send-button {
  min-width: 130px;
  font-weight: 600;
  border-radius: 12px;
}

button {
  border-radius: 12px;
}

@media (max-width: 576px) {
  .sms-page {
    padding: 14px;
    align-items: flex-start;
  }

  .sms-card {
    border-radius: 18px;
  }

  .sms-header {
    align-items: flex-start;
  }

  .send-actions {
    flex-direction: column-reverse;
  }

  .send-actions button {
    width: 100%;
  }
}
</style>
