<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Fee Structures</strong>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                :placeholder="searchPlaceholder"
                :aria-label="searchPlaceholder"
                size="sm"
                style="min-width: 220px"
              />

              <CButton
                color="danger"
                size="sm"
                :disabled="selectedIds.length === 0"
                @click="openBulkDeleteConfirm"
              >
                Delete Selected ({{ selectedIds.length }})
              </CButton>

              <CButton class="text-white" color="primary" size="sm" @click="openAddModal">
                Add Fee Structure
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <p class="text-body-secondary small">Fee Structures.</p>

          <CAlert color="danger" v-if="errorMessage" class="py-2">
            {{ errorMessage }}
          </CAlert>

          <div class="d-flex align-items-center gap-2 mb-2" v-if="isLoading">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading fee structures…</span>
          </div>

          <div v-if="isLoading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading fee structures...</span>
          </div>

          <CTable v-else hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col" class="text-center" style="width: 48px">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="someSelected"
                    @change="toggleSelectAll"
                    aria-label="Select all in current view"
                  />
                </CTableHeaderCell>

                <CTableHeaderCell scope="col" style="width: 60px">#</CTableHeaderCell>
                <CTableHeaderCell scope="col">Academic Year</CTableHeaderCell>
                <CTableHeaderCell scope="col">Class</CTableHeaderCell>
                <CTableHeaderCell scope="col">Term</CTableHeaderCell>
                <CTableHeaderCell scope="col">Has Discount</CTableHeaderCell>
                <CTableHeaderCell scope="col" class="text-end">Amount (GHS)</CTableHeaderCell>
                <CTableHeaderCell scope="col" class="text-end" style="width: 160px">
                  Actions
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(row, idx) in rows" :key="row.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="row.id" aria-label="Select row" />
                </CTableDataCell>

                <CTableHeaderCell scope="row">
                  {{ rowNumber(idx) }}
                </CTableHeaderCell>

                <CTableDataCell>{{ row.academic_year?.name || "—" }}</CTableDataCell>
                <CTableDataCell>{{ row.grade_class?.name || "—" }}</CTableDataCell>
                <CTableDataCell>{{ row.term?.name || "—" }}</CTableDataCell>

                <CTableDataCell>
                  <CBadge :color="row.is_discounted ? 'success' : 'secondary'">
                    {{ row.is_discounted ? "Yes" : "No" }}
                  </CBadge>
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  {{ formatAmount(row.amount) }}
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton
                      color="secondary"
                      variant="outline"
                      @click="openEditModal(row)"
                    >
                      Edit
                    </CButton>
                    <CButton
                      color="danger"
                      variant="outline"
                      @click="openSingleDeleteConfirm(row)"
                    >
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && rows.length === 0">
                <CTableDataCell colspan="8" class="text-center text-body-secondary">
                  No fee structures found
                  <span v-if="searchTerm"> for “{{ searchTerm }}” </span>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <!-- Pagination + Range -->
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px"
          >
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-changed="onPageChanged"
            />
            <div style="font-size: 14px; color: #7f8c8d">
              {{ showingRange }}
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Add/Edit Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal" size="xl">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? "Edit Fee Structure" : "Add Fee Structure" }}</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <!-- Academic Year -->
      <div class="mb-3">
        <CFormLabel for="academic_year">Academic Year</CFormLabel>
        <CFormSelect id="academic_year" v-model="formFee.academicYearId">
          <option value="" disabled selected>Select Academic Year</option>
          <option v-for="ay in academicYears" :key="ay.id" :value="Number(ay.id)">
            {{ ay.name }}
          </option>
        </CFormSelect>
      </div>

      <!-- Grade/Class -->
      <div v-if="!formFee.is_discount" class="mb-3">
        <CFormLabel for="grade_class">Class</CFormLabel>
        <CFormSelect id="grade_class" v-model="formFee.gradeClassId">
          <option value="" disabled selected>Select Class</option>
          <option v-for="gc in gradeClasses" :key="gc.id" :value="Number(gc.id)">
            {{ gc.name }}
          </option>
        </CFormSelect>
      </div>

      <!-- Term -->
      <div class="mb-3">
        <CFormLabel for="term">Term</CFormLabel>
        <CFormSelect id="term" v-model="formFee.termId">
          <option value="" disabled selected>Select Term</option>
          <option v-for="t in terms" :key="t.id" :value="Number(t.id)">
            {{ t.name }}
          </option>
        </CFormSelect>
      </div>

      <!-- Amount -->
      <div class="mb-3">
        <CFormLabel for="amount">Amount (GHS)</CFormLabel>
        <CFormInput
          id="amount"
          v-model="formFee.amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g., 250.00"
        />
      </div>

      <!-- Discount Toggle -->
      <div class="mb-3 d-flex align-items-center">
        <CFormLabel class="me-3 mb-0">Discounted Fee</CFormLabel>
        <CFormSwitch v-model="formFee.is_discount" color="primary" label="Yes" />
      </div>

      <!-- Discounted Students -->
      <div v-if="formFee.is_discount" class="mb-3">
        <CFormLabel>Select Students for Discount</CFormLabel>
        <v-select
          v-model="formFee.discounted_student_ids"
          :options="studentOptionsForSelect"
          :multiple="true"
          :close-on-select="false"
          placeholder="Search and select students"
          :reduce="(opt) => opt.value"
        />
      </div>

      <div class="text-danger small mt-2" v-if="formValidationMessage">
        {{ formValidationMessage }}
      </div>
    </CModalBody>

    <CModalFooter>
      <CButton
        color="secondary"
        variant="outline"
        @click="closeFormModal"
        :disabled="isSubmitting"
      >
        Cancel
      </CButton>

      <CButton class="text-white" color="primary" @click="submitForm" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
        {{ isEdit ? "Update" : "Save" }}
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Confirm Delete (Single) -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader>
      <CModalTitle>Delete Fee Structure</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Are you sure you want to delete
      <strong>
        {{ deleteTarget?.grade_class?.name }} / {{ deleteTarget?.term?.name }} /
        {{ deleteTarget?.academic_year?.name }}
      </strong>
      ? This action cannot be reversed.
    </CModalBody>
    <CModalFooter>
      <CButton
        color="secondary"
        variant="outline"
        @click="closeDeleteSingleModal"
        :disabled="isDeleting"
      >
        Cancel
      </CButton>

      <CButton
        color="danger"
        @click="() => { confirmDeleteSingle(); closeDeleteSingleModal(); }"
        :disabled="isDeleting"
      >
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Confirm Delete (Bulk) -->
  <CModal :visible="showDeleteBulkModal" @close="closeBulkDeleteConfirm">
    <CModalHeader>
      <CModalTitle>Delete Selected</CModalTitle>
    </CModalHeader>
    <CModalBody>
      You are about to delete <strong>{{ selectedIds.length }}</strong> fee structure(s). This
      action cannot be undone. Continue?
    </CModalBody>
    <CModalFooter>
      <CButton
        color="secondary"
        variant="outline"
        @click="closeBulkDeleteConfirm"
        :disabled="isDeleting"
      >
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDeleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import vSelect from "vue3-select";
import "vue3-select/dist/vue3-select.css";

import { ref, computed, reactive, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import Pagination from "@/Pagination.vue";

import {
  rawst,
  get_academic_years,
  get_classes,
  get_terms,
  create_fee_structure,
  get_fee_structures,
  update_fee_structure,
  delete_fee_structure,
} from "@/services/api.js";

/* -------------------------------------------------------
   CONSTANTS
------------------------------------------------------- */
const PAGE_SIZE = 10;
const CRECHE_CLASS_ID = 7; // set this to your real NewGradeClass id for "creche"

/* -------------------------------------------------------
   STATE
------------------------------------------------------- */
const toast = useToast();

const isLoading = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const errorMessage = ref("");

const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);

const academicYears = ref([]);
const gradeClasses = ref([]);
const terms = ref([]);

const feeStructures = ref([]);
const selectedIds = ref([]);

const searchTerm = ref("");

/* -------------------------------------------------------
   CACHE
------------------------------------------------------- */
const pageCache = reactive(new Map());
const makeKey = (page, search) => `${page}__${search || ""}`;

function clearCache() {
  pageCache.clear();
}

let loadSeq = 0;

/* -------------------------------------------------------
   COMPUTED
------------------------------------------------------- */
const rows = computed(() => feeStructures.value);

const searchPlaceholder = computed(() => "Search Fee Structure");

const allSelected = computed(() => {
  const ids = rows.value.map((r) => r.id);
  return ids.length > 0 && ids.every((id) => selectedIds.value.includes(id));
});

const someSelected = computed(() => {
  const ids = rows.value.map((r) => r.id);
  if (ids.length === 0) return false;
  const selectedInView = ids.filter((id) => selectedIds.value.includes(id)).length;
  return selectedInView > 0 && selectedInView < ids.length;
});

const showingRange = computed(() => {
  if (totalCount.value === 0) return "Showing 0–0 of 0";
  const start = (currentPage.value - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage.value * PAGE_SIZE, totalCount.value);
  return `Showing ${start}–${end} of ${totalCount.value}`;
});

const moneyFmt = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatAmount(v) {
  const n = Number(v);
  return Number.isFinite(n) ? moneyFmt.format(n) : v;
}

function rowNumber(idx) {
  return (currentPage.value - 1) * PAGE_SIZE + idx + 1;
}

/* -------------------------------------------------------
   LOADERS
------------------------------------------------------- */
async function loadReferenceData() {
  const [years, classes, t] = await Promise.all([
    get_academic_years(),
    get_classes(),
    get_terms(),
  ]);

  academicYears.value = years?.data || [];
  gradeClasses.value = classes?.data || [];
  terms.value = t?.data || [];
}

async function loadFeeStructures(page = 1) {
  const search = searchTerm.value.trim();
  const key = makeKey(page, search);

  if (pageCache.has(key)) {
    const cached = pageCache.get(key);
    feeStructures.value = cached.results;
    totalCount.value = cached.count;
    currentPage.value = page;
    totalPages.value = Math.max(1, Math.ceil(cached.count / PAGE_SIZE));
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  const mySeq = ++loadSeq;

  try {
    const res = await get_fee_structures({
      page,
      search: search || undefined,
    });

    if (mySeq !== loadSeq) return;

    const data = res?.data || { results: [], count: 0 };
    feeStructures.value = data.results || [];
    totalCount.value = data.count || 0;

    currentPage.value = page;
    totalPages.value = Math.max(1, Math.ceil((data.count || 0) / PAGE_SIZE));

    pageCache.set(key, { results: feeStructures.value, count: totalCount.value });
  } catch (err) {
    if (mySeq !== loadSeq) return;

    errorMessage.value =
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to load fee structures.";
  } finally {
    if (mySeq === loadSeq) isLoading.value = false;
  }
}

function onPageChanged(page) {
  loadFeeStructures(page);
}

/* Debounced search */
let searchTimer = null;
watch(searchTerm, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    loadFeeStructures(1);
  }, 350);
});

/* -------------------------------------------------------
   SELECT ALL
------------------------------------------------------- */
function toggleSelectAll() {
  const idsInView = rows.value.map((r) => r.id);
  if (idsInView.length === 0) return;

  if (allSelected.value) {
    const remove = new Set(idsInView);
    selectedIds.value = selectedIds.value.filter((id) => !remove.has(id));
  } else {
    const set = new Set(selectedIds.value);
    idsInView.forEach((id) => set.add(id));
    selectedIds.value = [...set];
  }
}

/* -------------------------------------------------------
   STUDENTS (discount selector)
------------------------------------------------------- */
const studentOptions = ref([]);

const studentOptionsForSelect = computed(() =>
  studentOptions.value
    .filter((s) => s.is_discounted_student)
    .map((s) => ({
      label: s.user?.full_name ?? s.full_name ?? s.name ?? `ID ${s.id}`,
      value: s.id,
    }))
);

async function fetchUsers() {
  try {
    const response = await rawst();
    const raw = response?.data || [];
    studentOptions.value = Array.isArray(raw) ? raw : raw.results || [];
  } catch (err) {

    toast.error("Failed to load students for discount selector", {
      position: "top-right",
    });
  }
}

/* -------------------------------------------------------
   FORM
------------------------------------------------------- */
const showFormModal = ref(false);
const isEdit = ref(false);
const editingId = ref(null);

const formFee = reactive({
  academicYearId: "",
  gradeClassId: "",
  termId: "",
  amount: "",
  is_discount: false,
  discounted_student_ids: [],
});

const formValidationMessage = ref("");

function resetForm() {
  formFee.academicYearId = "";
  formFee.gradeClassId = "";
  formFee.termId = "";
  formFee.amount = "";
  formFee.is_discount = false;
  formFee.discounted_student_ids = [];
  formValidationMessage.value = "";
  editingId.value = null;
}

watch(
  () => formFee.is_discount,
  (val) => {
    if (val) {
      formFee.gradeClassId = CRECHE_CLASS_ID;
    }
  }
);

function validateForm() {
  if (!formFee.academicYearId || !formFee.termId) {
    formValidationMessage.value = "Academic Year and Term are required.";
    return false;
  }

  if (formFee.is_discount && !formFee.gradeClassId) {
    formFee.gradeClassId = CRECHE_CLASS_ID;
  }

  if (!formFee.is_discount && !formFee.gradeClassId) {
    formValidationMessage.value = "Class is required for non-discounted fees.";
    return false;
  }

  if (formFee.is_discount && formFee.discounted_student_ids.length === 0) {
    formValidationMessage.value = "Please select at least one discounted student.";
    return false;
  }

  if (formFee.amount === "" || formFee.amount === null) {
    formValidationMessage.value = "Amount is required.";
    return false;
  }

  if (Number(formFee.amount) < 0) {
    formValidationMessage.value = "Amount cannot be negative.";
    return false;
  }

  formValidationMessage.value = "";
  return true;
}

function openAddModal() {
  isEdit.value = false;
  resetForm();
  showFormModal.value = true;
}

function openEditModal(row) {
  isEdit.value = true;
  editingId.value = row.id;

  formFee.academicYearId = row.academic_year?.id ?? "";
  formFee.gradeClassId = row.grade_class?.id ?? "";
  formFee.termId = row.term?.id ?? "";
  formFee.amount = row.amount ?? "";
  formFee.is_discount = !!row.is_discounted;
  formFee.discounted_student_ids =
    row.discounted_student_ids ??
    row.discounted_students?.map((s) => s.id) ??
    [];

  formValidationMessage.value = "";
  showFormModal.value = true;
}

function closeFormModal() {
  if (!isSubmitting.value) {
    showFormModal.value = false;
    resetForm();
  }
}

/* -------------------------------------------------------
   SUBMIT
------------------------------------------------------- */
function extractErrorMessage(err) {
  const data = err?.response?.data;

  if (!data) return err?.message || "Failed to save fee structure.";

  if (typeof data === "string") {
    if (data.includes("IntegrityError")) {
      return "The selected class does not match the backend FK configuration. Check that FeeStructure.grade_class points to NewGradeClass and that migrations are up to date.";
    }
    return data.slice(0, 300);
  }

  return (
    data.message ||
    data.detail ||
    JSON.stringify(data)
  );
}

async function submitForm() {
  if (!validateForm()) return;

  isSubmitting.value = true;

  const payload = {
    academic_year_id: Number(formFee.academicYearId),
    grade_class_id: Number(formFee.gradeClassId),
    term_id: Number(formFee.termId),
    amount: formFee.amount,
    discounted_student_ids: formFee.is_discount
      ? formFee.discounted_student_ids.map(Number)
      : [],
    is_discounted: !!formFee.is_discount,
  };


  try {
    if (isEdit.value && editingId.value != null) {
      const res = await update_fee_structure(editingId.value, payload);
      const updated = res?.data;

      if (updated?.id != null) {
        feeStructures.value = feeStructures.value.map((r) =>
          r.id === updated.id ? updated : r
        );
      }

      toast.success("Fee structure updated successfully.", {
        position: "top-right",
      });
    } else {
      await create_fee_structure(payload);
      toast.success("Fee structure added successfully.", {
        position: "top-right",
      });

      currentPage.value = 1;
    }

    clearCache();
    await loadFeeStructures(currentPage.value);

    showFormModal.value = false;
    resetForm();
  } catch (err) {

    formValidationMessage.value = extractErrorMessage(err);
  } finally {
    isSubmitting.value = false;
  }
}

/* -------------------------------------------------------
   DELETE
------------------------------------------------------- */
const showDeleteSingleModal = ref(false);
const deleteTarget = ref(null);
const showDeleteBulkModal = ref(false);

function openSingleDeleteConfirm(row) {
  deleteTarget.value = row;
  showDeleteSingleModal.value = true;
}

function closeDeleteSingleModal() {
  if (!isDeleting.value) {
    showDeleteSingleModal.value = false;
    deleteTarget.value = null;
  }
}

function openBulkDeleteConfirm() {
  showDeleteBulkModal.value = true;
}

function closeBulkDeleteConfirm() {
  if (!isDeleting.value) {
    showDeleteBulkModal.value = false;
  }
}

function friendlyDeleteError(error, id) {
  const associatedRecordName =
    error?.response?.data?.associatedRecordName || "a linked student's fee record";

  let message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    error?.message ||
    `Cannot delete fee structure ID ${id} because it is linked to ${associatedRecordName}.`;

  if (String(message).includes("violates foreign key constraint")) {
    message = `Cannot delete fee structure ID ${id} because it is linked to ${associatedRecordName}. Please delete the associated record first.`;
  }

  return message;
}

async function confirmDeleteSingle() {
  if (!deleteTarget.value) return;

  isDeleting.value = true;

  try {
    const id = deleteTarget.value.id;
    await delete_fee_structure(id);

    feeStructures.value = feeStructures.value.filter((r) => r.id !== id);
    selectedIds.value = selectedIds.value.filter((x) => x !== id);

    toast.success("Fee structure deleted successfully.", {
      position: "top-right",
    });

    clearCache();
    await loadFeeStructures(currentPage.value);

    closeDeleteSingleModal();
  } catch (error) {
    toast.error(friendlyDeleteError(error, deleteTarget.value.id), {
      position: "top-right",
    });
  } finally {
    isDeleting.value = false;
    closeDeleteSingleModal();
  }
}

async function confirmDeleteBulk() {
  if (selectedIds.value.length === 0) return;

  isDeleting.value = true;
  const ids = [...selectedIds.value];

  try {
    const results = await Promise.allSettled(ids.map((id) => delete_fee_structure(id)));

    let successCount = 0;

    results.forEach((result, idx) => {
      const id = ids[idx];
      if (result.status === "fulfilled") {
        successCount++;
      } else {
        toast.error(friendlyDeleteError(result.reason, id), {
          position: "top-right",
        });
      }
    });

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} fee structure(s) successfully.`, {
        position: "top-right",
      });
    }

    selectedIds.value = [];
    showDeleteBulkModal.value = false;

    clearCache();
    await loadFeeStructures(currentPage.value);
  } finally {
    isDeleting.value = false;
  }
}

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */
onMounted(async () => {
  try {
    isLoading.value = true;
    await Promise.all([loadReferenceData(), fetchUsers()]);
    await loadFeeStructures(1);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 {
    row-gap: 0.5rem;
  }
}
</style>
