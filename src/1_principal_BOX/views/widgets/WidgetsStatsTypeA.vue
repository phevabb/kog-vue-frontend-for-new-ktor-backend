<script setup>
import { onMounted, ref } from 'vue'
import { getStyle } from '@coreui/utils'
import {
  num_of_staff_insight_ktor,
  get_num_of_students_insignt_ktor,
  get_administrators_count_ktor,
  get_student_deactivation_count
} from '../../../services/api'

const widgetChartRef1 = ref()
const widgetChartRef2 = ref()

const num_of_students = ref(0)
const num_of_staff = ref(0)
const num_of_admins = ref(0)
const num_of_deactivated_students = ref(0)

onMounted(async () => {
  try {
    const tk = await get_num_of_students_insignt_ktor()

    num_of_students.value = tk?.data?.count ?? 0
  } catch (err) {

  }

  try {
    const numStaff = await num_of_staff_insight_ktor()
    const kr = numStaff?.data?.count ?? 0

    num_of_staff.value = kr
    // num_of_staff.value = numStaff?.data?.count ?? 0
  } catch (err) {

  }

  try {
    const admins = await get_administrators_count_ktor()

    num_of_admins.value = admins?.data?.count ?? 0
  } catch (err) {

  }

  try {
    const deactivatedStudents = await get_student_deactivation_count()

    num_of_deactivated_students.value =
      deactivatedStudents?.data?.deactivated_students ?? 0
  } catch (err) {

  }

  document.documentElement.addEventListener('ColorSchemeChange', () => {
    if (widgetChartRef1.value) {
      widgetChartRef1.value.chart.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
      widgetChartRef1.value.chart.update()
    }

    if (widgetChartRef2.value) {
      widgetChartRef2.value.chart.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
      widgetChartRef2.value.chart.update()
    }
  })
})
</script>
<template>
  <CRow :xs="{ gutter: 4 }">
    <CCol :sm="6" :xl="4" :xxl="3">
      <CWidgetStatsA color="primary">
        <template #value
          >{{ num_of_students }}
          <span class="fs-6 fw-normal">  </span>
        </template>


        <template #title>Students</template>
        <template #action>
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="transparent" class="p-0 text-white" :caret="false">
              <CIcon icon="cil-options" class="text-white" />
            </CDropdownToggle>

          </CDropdown>
        </template>

      </CWidgetStatsA>
    </CCol>
    <CCol :sm="6" :xl="4" :xxl="3">
      <CWidgetStatsA color="info">
        <template #value
          >{{num_of_staff}}
          <span class="fs-6 fw-normal">  </span>
        </template>
        <template #title>Teachers</template>
        <template #action>
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="transparent" class="p-0 text-white" :caret="false">
              <CIcon icon="cil-options" class="text-white" />
            </CDropdownToggle>
            <!-- <CDropdownMenu>
              <CDropdownItem href="#">Action</CDropdownItem>
              <CDropdownItem href="#">Another action</CDropdownItem>
              <CDropdownItem href="#">Something else here</CDropdownItem>
            </CDropdownMenu> -->
          </CDropdown>
        </template>

      </CWidgetStatsA>
    </CCol>
    <CCol :sm="6" :xl="4" :xxl="3">
      <CWidgetStatsA color="warning">
        <template #value
          >{{num_of_admins}}
          <span class="fs-6 fw-normal">  </span>
        </template>
        <template #title>Administrators</template>
        <template #action>
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="transparent" class="p-0 text-white" :caret="false">
              <CIcon icon="cil-options" class="text-white" />
            </CDropdownToggle>
            <!-- <CDropdownMenu>
              <CDropdownItem href="#">Action</CDropdownItem>
              <CDropdownItem href="#">Another action</CDropdownItem>
              <CDropdownItem href="#">Something else here</CDropdownItem>
            </CDropdownMenu> -->
          </CDropdown>
        </template>

      </CWidgetStatsA>
    </CCol>
    <!-- <CCol :sm="6" :xl="4" :xxl="3">
      <CWidgetStatsA color="danger">
        <template #value
          >
            {{num_of_deactivated_students}}

        </template>
        <template #title>Deactivated Students</template>
        <template #action>
          <CDropdown placement="bottom-end">
            <CDropdownToggle color="transparent" class="p-0 text-white" :caret="false">
              <CIcon icon="cil-options" class="text-white" />
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem href="#">Action</CDropdownItem>
              <CDropdownItem href="#">Another action</CDropdownItem>
              <CDropdownItem href="#">Something else here</CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </template>

      </CWidgetStatsA>
    </CCol> -->
  </CRow>
</template>
