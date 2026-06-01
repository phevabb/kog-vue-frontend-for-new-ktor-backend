<script setup>
import { onMounted, ref, computed } from 'vue'
import { CChart } from '@coreui/vue-chartjs'
import WidgetsStatsA from './../widgets/WidgetsStatsTypeA.vue'
import { get_collected_vs_pending_insight_ktor } from '../../../services/api'

const collectionSummary = ref([])
const loadingCollection = ref(false)
const collectionError = ref('')

// ----------------------------------------------------
// Fetch collection summary
// ----------------------------------------------------
const fetchCollectionSummary = async () => {
  loadingCollection.value = true
  collectionError.value = ''

  try {
    const response = await get_collected_vs_pending_insight_ktor()

    collectionSummary.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {

    collectionError.value = 'Failed to load collection summary.'
  } finally {
    loadingCollection.value = false
  }
}

onMounted(async () => {
  await fetchCollectionSummary()
})

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
const money = (value) => Number(value || 0)

const rateOf = (collected, pending) => {
  const c = money(collected)
  const p = money(pending)
  const total = c + p
  if (!total) return 0
  return Number(((c / total) * 100).toFixed(2))
}

const academicYearRank = (academicYear) => {
  const start = parseInt(String(academicYear || '').split('/')[0], 10)
  return Number.isNaN(start) ? 0 : start
}

const termRank = (term) => {
  const t = String(term || '').toLowerCase()
  if (t.includes('1')) return 1
  if (t.includes('2')) return 2
  if (t.includes('3')) return 3
  return 999
}

const totalCollected = computed(() =>
  collectionSummary.value.reduce((sum, item) => sum + money(item.collectedAmount), 0)
)

const totalPending = computed(() =>
  collectionSummary.value.reduce((sum, item) => sum + money(item.pendingAmount), 0)
)

const overallCollectionRate = computed(() =>
  rateOf(totalCollected.value, totalPending.value)
)

// ----------------------------------------------------
// Group by academic year
// ----------------------------------------------------
const groupedCollectionByYear = computed(() => {
  const bucket = {}

  for (const item of collectionSummary.value) {
    const academicYear = item.academicYear || 'Unknown Year'

    if (!bucket[academicYear]) {
      bucket[academicYear] = {
        academicYear,
        rows: [],
      }
    }

    bucket[academicYear].rows.push({
      term: item.term || 'Unknown Term',
      collectedAmount: money(item.collectedAmount),
      pendingAmount: money(item.pendingAmount),
      collectionRate: rateOf(item.collectedAmount, item.pendingAmount),
    })
  }

  return Object.values(bucket)
    .map((group) => {
      group.rows.sort((a, b) => termRank(a.term) - termRank(b.term))

      const yearCollected = group.rows.reduce((sum, row) => sum + row.collectedAmount, 0)
      const yearPending = group.rows.reduce((sum, row) => sum + row.pendingAmount, 0)
      const yearRate = rateOf(yearCollected, yearPending)

      return {
        ...group,
        totalCollected: yearCollected,
        totalPending: yearPending,
        totalRate: yearRate,
      }
    })
    .sort((a, b) => academicYearRank(b.academicYear) - academicYearRank(a.academicYear))
})

// ----------------------------------------------------
// Doughnut chart per academic year
// ----------------------------------------------------
const yearDoughnutData = (group) => ({
  labels: ['Collected', 'Pending'],
  datasets: [
    {
      data: [group.totalCollected, group.totalPending],
      backgroundColor: ['#1565c0', '#c62828'], // blue, red
      hoverBackgroundColor: ['#0d47a1', '#8e0000'],
      borderWidth: 0,
      spacing: 3,
      hoverOffset: 6,
    },
  ],
})

const yearDoughnutOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        boxWidth: 14,
        boxHeight: 14,
        padding: 18,
        color: '#495057',
        font: {
          size: 12,
          weight: 600,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || ''
          const value = context.parsed || 0
          return `${label}: GHS ${Number(value).toLocaleString()}`
        },
      },
    },
  },
})

const rateBadgeClass = (rate) => {
  if (rate >= 75) return 'rate-badge rate-good'
  if (rate >= 40) return 'rate-badge rate-mid'
  return 'rate-badge rate-low'
}
</script>

<template>
  <div>
    <WidgetsStatsA class="mb-4" />

    <!-- Top executive summary -->
    <CRow class="mb-4">
      <CCol :md="4">
        <div class="premium-stat premium-stat-blue">
          <div class="premium-stat-label">Total Collected</div>
          <div class="premium-stat-value">GHS {{ totalCollected.toLocaleString() }}</div>
        </div>
      </CCol>

      <CCol :md="4">
        <div class="premium-stat premium-stat-red">
          <div class="premium-stat-label">Total Pending</div>
          <div class="premium-stat-value">GHS {{ totalPending.toLocaleString() }}</div>
        </div>
      </CCol>

      <CCol :md="4">
        <div class="premium-stat premium-stat-yellow">
          <div class="premium-stat-label">Overall Collection Rate </div>

          <div class="premium-stat-value">{{ overallCollectionRate }}%</div>
        </div>
      </CCol>
    </CRow>

    <CRow>
      <CCol :md="12">
        <CCard class="premium-shell-card mb-4">
          <CCardHeader class="premium-shell-header">
            <div>
              <strong>Fee Collection Analysis by Academic Year</strong>
              <div class="premium-subtitle">
                Each academic year is shown as a premium analysis block with a visible chart and detailed term performance.
              </div>
            </div>
          </CCardHeader>

          <CCardBody class="p-0">
            <div v-if="loadingCollection" class="text-center py-5">
              Loading collection analysis...
            </div>

            <div v-else-if="collectionError" class="text-danger text-center py-5">
              {{ collectionError }}
            </div>

            <div v-else-if="!groupedCollectionByYear.length" class="text-center py-5 text-body-secondary">
              No collection summary data available.
            </div>

            <div v-else class="year-stack">
              <div
                v-for="group in groupedCollectionByYear"
                :key="group.academicYear"
                class="year-analysis-card"
              >
                <!-- Header -->
                <div class="year-analysis-header">
                  <div>
                    <div class="year-title">{{ group.academicYear }}</div>
                    <div class="year-subtitle">
                      Collected vs pending breakdown with term-by-term visibility
                    </div>
                  </div>

                  <div class="year-metrics">
                    <div class="year-chip chip-blue">
                      <span class="chip-label">Collected</span>
                      <span class="chip-value">GHS {{ group.totalCollected.toLocaleString() }}</span>
                    </div>
                    <div class="year-chip chip-red">
                      <span class="chip-label">Pending</span>
                      <span class="chip-value">GHS {{ group.totalPending.toLocaleString() }}</span>
                    </div>
                    <div class="year-chip chip-yellow">
                      <span class="chip-label">Rate</span>
                      <span class="chip-value">{{ group.totalRate }}%</span>
                    </div>
                  </div>
                </div>

                <!-- Body -->
                <div class="year-analysis-body">
                  <!-- Big visible chart -->
                  <div class="chart-pane">
                    <div class="doughnut-panel">
                      <div class="doughnut-wrap">
                        <CChart
                          type="doughnut"
                          :data="yearDoughnutData(group)"
                          :options="yearDoughnutOptions()"
                        />
                        <div class="doughnut-center">
                          <div style="padding-bottom: 50px;"> </div>
                          <div class="doughnut-center-rate">{{ group.totalRate }}%</div>

                          <div class="doughnut-center-label">Collection Rate </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Tight term analysis -->
                  <div class="table-pane">
                    <div class="term-grid">
                      <div
                        v-for="row in group.rows"
                        :key="`${group.academicYear}-${row.term}`"
                        class="term-card"
                      >
                        <div class="term-top">
                          <div class="term-name">{{ row.term }}</div>
                          <span :class="rateBadgeClass(row.collectionRate)">
                            {{ row.collectionRate }}%
                          </span>
                        </div>

                        <div class="term-values">
                          <div class="term-value term-value-blue">
                            <span>Collected</span>
                            <strong>GHS {{ row.collectedAmount.toLocaleString() }}</strong>
                          </div>
                          <div class="term-value term-value-red">
                            <span>Pending</span>
                            <strong>GHS {{ row.pendingAmount.toLocaleString() }}</strong>
                          </div>
                        </div>

                        <div class="term-progress-block">
                          <div class="term-progress-label">
                            <span>Collection progress</span>
                            <span>{{ row.collectionRate }}%</span>
                          </div>
                          <div class="rate-track">
                            <div
                              class="rate-fill"
                              :style="{ width: `${row.collectionRate}%` }"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer summary row tightly attached -->
                <div class="year-footer-row">
                  <div class="footer-item">
                    <span class="footer-label">Academic Year</span>
                    <span class="footer-value">{{ group.academicYear }}</span>
                  </div>
                  <div class="footer-item">
                    <span class="footer-label">Total Collected</span>
                    <span class="footer-value text-primary">GHS {{ group.totalCollected.toLocaleString() }}</span>
                  </div>
                  <div class="footer-item">
                    <span class="footer-label">Total Pending</span>
                    <span class="footer-value text-danger">GHS {{ group.totalPending.toLocaleString() }}</span>
                  </div>
                  <div class="footer-item">
                    <span class="footer-label">Collection Rate </span>
                    <span class="footer-value text-warning">{{ group.totalRate }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>

<style scoped>
.premium-shell-card {
  border: 0;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0.5rem 1.25rem rgba(15, 23, 42, 0.08);
}

.premium-shell-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  padding: 1rem 1.25rem;
}

.premium-subtitle {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.2rem;
}

.premium-stat {
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  background: #ffffff;
  box-shadow: 0 0.35rem 1rem rgba(15, 23, 42, 0.06);
  height: 100%;
  border-left: 6px solid transparent;
}

.premium-stat-label {
  font-size: 0.82rem;
  color: #6c757d;
  margin-bottom: 0.35rem;
}

.premium-stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.2;
}

.premium-stat-blue {
  border-left-color: #1565c0;
}

.premium-stat-red {
  border-left-color: #c62828;
}

.premium-stat-yellow {
  border-left-color: #fbc02d;
}

.year-stack {
  display: flex;
  flex-direction: column;
}

.year-analysis-card {
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: #ffffff;
}

.year-analysis-card:last-child {
  border-bottom: 0;
}

.year-analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #ffffff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
}

.year-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #212529;
}

.year-subtitle {
  font-size: 0.84rem;
  color: #6c757d;
  margin-top: 0.2rem;
}

.year-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: flex-end;
}

.year-chip {
  min-width: 130px;
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.chip-label {
  font-size: 0.72rem;
  color: #6c757d;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.chip-value {
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.1;
}

.chip-blue {
  background: rgba(21, 101, 192, 0.08);
}

.chip-red {
  background: rgba(198, 40, 40, 0.08);
}

.chip-yellow {
  background: rgba(251, 192, 45, 0.16);
}

.year-analysis-body {
  display: grid;
  grid-template-columns: minmax(320px, 390px) 1fr;
  gap: 0;
  align-items: stretch;
}

.chart-pane {
  background: #ffffff;
  border-right: 1px solid rgba(15, 23, 42, 0.06);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doughnut-panel {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doughnut-wrap {
  position: relative;
  width: 100%;
  max-width: 320px;
  height: 320px;
}

.doughnut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.doughnut-center-rate {
  font-size: 2rem;
  font-weight: 800;
  color: #212529;
  line-height: 1;
}

.doughnut-center-label {
  margin-top: 0.35rem;
  font-size: 0.82rem;
  color: #6c757d;
}

.table-pane {
  background: #fbfcfe;
  padding: 0;
}

.term-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

.term-card {
  padding: 1rem 1.1rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.term-card:last-child {
  border-bottom: 0;
}

.term-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.term-name {
  font-size: 1rem;
  font-weight: 700;
  color: #212529;
}

.term-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  margin-bottom: 0.9rem;
}

.term-value {
  border-radius: 0.85rem;
  padding: 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.term-value span {
  font-size: 0.75rem;
  color: #6c757d;
}

.term-value strong {
  font-size: 0.98rem;
  font-weight: 700;
}

.term-value-blue {
  background: rgba(21, 101, 192, 0.08);
}

.term-value-red {
  background: rgba(198, 40, 40, 0.08);
}

.term-progress-block {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.term-progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: #6c757d;
}

.rate-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.rate-good {
  background: rgba(25, 135, 84, 0.12);
  color: #146c43;
}

.rate-mid {
  background: rgba(251, 192, 45, 0.18);
  color: #8a6d00;
}

.rate-low {
  background: rgba(198, 40, 40, 0.12);
  color: #a61e1e;
}

.rate-track {
  width: 100%;
  height: 12px;
  background: #e9ecef;
  border-radius: 999px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbc02d 0%, #ffca28 100%);
  border-radius: 999px;
}

.year-footer-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  background: #fffdf4;
}

.footer-item {
  padding: 0.85rem 1rem;
  border-right: 1px solid rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.footer-item:last-child {
  border-right: 0;
}

.footer-label {
  font-size: 0.72rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.footer-value {
  font-size: 0.96rem;
  font-weight: 700;
}

@media (max-width: 991.98px) {
  .year-analysis-header {
    flex-direction: column;
  }

  .year-metrics {
    justify-content: flex-start;
  }

  .year-analysis-body {
    grid-template-columns: 1fr;
  }

  .chart-pane {
    border-right: 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  }

  .year-footer-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 575.98px) {
  .term-values {
    grid-template-columns: 1fr;
  }

  .year-footer-row {
    grid-template-columns: 1fr;
  }

  .doughnut-wrap {
    max-width: 280px;
    height: 280px;
  }
}
</style>
