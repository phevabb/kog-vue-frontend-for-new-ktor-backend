<script setup>
import { computed } from "vue";

// Props
const props = defineProps({
  totalPages: {
    type: Number,
    required: true,
    default: 4,
  },
  currentPage: {
    type: Number,
    required: true,
    default: 2,
  },
});

// Emit
const emit = defineEmits(["page-changed"]);

// Methods
function changePage(page) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit("page-changed", page);
  }
}

// Computed: smart pagination (no overflow)
// Computed: smart pagination (no overflow)
const pages = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  const delta = 2; // how many pages to show around current
  const range = [];

  // Always show first page
  range.push(1);

  // Calculate left and right boundaries
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  // Add ellipsis if there's a gap between first page and left boundary
  if (left > 2) {
    range.push("...");
  }

  // Add page numbers between left and right
  for (let i = left; i <= right; i++) {
    // Fix: Ensure we don't add duplicate pages when there are exactly 2 pages
    if (i !== 1 && i !== total) {
      range.push(i);
    }
  }

  // Add ellipsis if there's a gap between right boundary and last page
  if (right < total - 1) {
    range.push("...");
  }

  // Add last page if there is more than one page
  if (total > 1) {
    range.push(total);
  }

  return range;
});
</script>

<template>
  <div class="pagination">
    <!-- Previous button -->
    <button
      :disabled="currentPage === 1"
      @click="changePage(currentPage - 1)"
      class="pagination-btn"
    >
      Prev
    </button>

    <!-- Page numbers with ... -->
    <div
      v-for="(page, index) in pages"
      :key="index"
      @click="page !== '...' && changePage(page)"
      :class="['pagination-page', { active: page === currentPage, dots: page === '...' }]"
    >
      {{ page }}
    </div>

    <!-- Next button -->
    <button
      :disabled="currentPage === totalPages"
      @click="changePage(currentPage + 1)"
      class="pagination-btn"
    >
      Next
    </button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* so it never overflows horizontally */
  gap: 6px;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #f8f8f8;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.pagination-btn:disabled {
  background: #eee;
  cursor: not-allowed;
}

.pagination-page {
  padding: 6px 12px;
  border: 1px solid #ddd;
  cursor: pointer;
  border-radius: 4px;
  min-width: 32px;
  text-align: center;
  transition: background 0.2s, color 0.2s;
}

.pagination-page:hover:not(.dots):not(.active) {
  background: #007bff;
  color: white;
}

.pagination-page.active {
  background: #007bff;
  color: white;
  font-weight: bold;
}

.pagination-page.dots {
  cursor: default;
  background: transparent;
  border: none;
}
</style>
