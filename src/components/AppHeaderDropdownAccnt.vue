<script setup>
import { logout } from '@/services/api.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const itemsCount = 42
const avatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'

const handleLogout = async () => {
  try {
    await logout()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('family')
    localStorage.removeItem('staff')
    router.push('/login')
  } catch (error) {

  }
}

const goToChangePassword = () => {
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null
  if (!user) {

    return
  }
  const role = user.role   // or your actual auth store

  if (role === "principal") {
    router.push({ name: "principal_change_password" })
  } else if (role === "administrator") {
    router.push({ name: "admin_change_password" })
  } else {

  }
}

</script>

<template>
  <CDropdown placement="bottom-end" variant="nav-item">
    <CDropdownToggle class="py-0 pe-0" :caret="false">
      <CAvatar :src="avatar" size="md" />
    </CDropdownToggle>

    <CDropdownMenu class="pt-0">
      <CDropdownHeader
        component="h6"
        class="bg-body-secondary text-body-secondary fw-semibold mb-2 rounded-top"
      >
        Account
      </CDropdownHeader>








      <CDropdownItem  @click="goToChangePassword" style="cursor:pointer;"><CIcon icon="cil-shield-alt" />
        Change Password
      </CDropdownItem>

      <CDropdownItem @click="handleLogout" style="cursor:pointer;">
        <CIcon icon="cil-lock-locked" /> Logout
      </CDropdownItem>






    </CDropdownMenu>
  </CDropdown>
</template>
