<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api';
import { Student, FeeRecord, FeeType, FeeStatus } from '../../types';
import { 
  Search, 
  Plus, 
  CheckCircle,
  X,
  CreditCard,
  History,
  TrendingUp,
  DollarSign,
  User,
  Phone,
  Mail,
  AlertTriangle,
  BookOpen,
  Banknote,
  ChevronRight
} from 'lucide-vue-next';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const students = ref<Student[]>([]);
const fees = ref<FeeRecord[]>([]);
const isAddModalOpen = ref(false);
const isCollectModalOpen = ref(false);
const selectedStudent = ref<Student | null>(null);
const search = ref('');
const activeTab = ref<'all' | 'due' | 'paid'>('all');

const formData = ref({
  studentId: '',
  type: 'monthly' as FeeType,
  amount: 0,
  status: 'due' as FeeStatus,
  date: format(new Date(), 'yyyy-MM-dd')
});

const collectData = ref({
  studentId: '',
  type: 'monthly' as FeeType,
  amount: 0,
  date: format(new Date(), 'yyyy-MM-dd')
});

// Student's existing due records shown in collect modal
const studentDueFees = ref<FeeRecord[]>([]);
const selectedFeeIds = ref<string[]>([]);

// ✅ Normalize fee record: fix snake_case -> camelCase from Supabase
const normalizeFee = (f: any): FeeRecord => ({
  id: f.id,
  studentId: f.studentId || f.student_id,
  type: f.type,
  amount: f.amount,
  status: f.status,
  date: f.date,
  timestamp: f.timestamp,
});

const load = async () => {
  const [s, f] = await Promise.all([
    api.students.getAll(),
    api.fees.getAll()
  ]);
  students.value = s;
  fees.value = f.map(normalizeFee);
};

onMounted(load);

const handleSubmit = async () => {
  try {
    await api.fees.add({ ...formData.value });
    isAddModalOpen.value = false;
    formData.value = { ...formData.value, studentId: '', amount: 0 };
    await load();
  } catch (err: any) {
    alert('Failed to add fee record: ' + (err.message || 'Unknown error'));
  }
};

const handleCollect = async () => {
  if (!collectData.value.studentId) {
    alert('Student not selected.');
    return;
  }
  if (selectedFeeIds.value.length === 0 && Number(collectData.value.amount) <= 0) {
    alert('No due records selected and no extra amount entered.');
    return;
  }
  try {
    // 1. Mark selected existing due records as paid
    await Promise.all(
      selectedFeeIds.value.map(id => api.fees.updateStatus(id, 'paid'))
    );
    // 2. If extra amount entered, add a new paid record
    const extra = Number(collectData.value.amount);
    if (extra > 0) {
      await api.fees.add({
        studentId: collectData.value.studentId,
        type: collectData.value.type,
        amount: extra,
        status: 'paid' as FeeStatus,
        date: collectData.value.date,
      });
    }
    isCollectModalOpen.value = false;
    selectedStudent.value = null;
    studentDueFees.value = [];
    selectedFeeIds.value = [];
    collectData.value = { studentId: '', type: 'monthly', amount: 0, date: format(new Date(), 'yyyy-MM-dd') };
    await load();
  } catch (err: any) {
    console.error('Collect fee error:', err);
    alert('Failed: ' + (err?.message || JSON.stringify(err)));
  }
};

const handleUpdateStatus = async (id: string, status: FeeStatus) => {
  try {
    await api.fees.updateStatus(id, status);
    await load();
  } catch (err: any) {
    alert('Failed to update status: ' + (err.message || 'Unknown error'));
  }
};

const openCollectModal = (student: Student) => {
  selectedStudent.value = student;
  // Load this student's due records from already-fetched fees
  studentDueFees.value = fees.value.filter(f => f.studentId === student.id && f.status === 'due');
  // Select all due records by default
  selectedFeeIds.value = studentDueFees.value.map(f => f.id);
  collectData.value = {
    studentId: student.id,
    type: 'monthly',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  };
  isCollectModalOpen.value = true;
};

const getStudent = (id: string) => students.value.find(s => s.id === id);

const filteredFees = computed(() => {
  return fees.value
    .filter(f => {
      const student = getStudent(f.studentId);
      const q = search.value.trim().toLowerCase();
      // If no search query, show all; otherwise filter by name or roll
      const matchSearch = !q ||
        (student?.name.toLowerCase().includes(q) ?? false) ||
        (student?.roll.toLowerCase().includes(q) ?? false);
      const matchTab =
        activeTab.value === 'all' ||
        (activeTab.value === 'due' && f.status === 'due') ||
        (activeTab.value === 'paid' && f.status === 'paid');
      return matchSearch && matchTab;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
});

// Students who have due fees
const studentsWithDue = computed(() => {
  const dueStudentIds = new Set(
    fees.value.filter(f => f.status === 'due').map(f => f.studentId)
  );
  return students.value.filter(s => dueStudentIds.has(s.id));
});

const getDueAmount = (studentId: string) =>
  fees.value
    .filter(f => f.studentId === studentId && f.status === 'due')
    .reduce((sum, f) => sum + f.amount, 0);

const stats = computed(() => {
  const totalDue = fees.value.filter(f => f.status === 'due').reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.value.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  return { totalDue, totalPaid };
});

const feeTypeLabel: Record<FeeType, string> = {
  monthly: 'Monthly',
  admission: 'Admission',
  late: 'Late',
  absent: 'Absent',
  fine: 'Fine',
  other: 'Other'
};
</script>

<template>
  <div class="p-4 sm:p-8 space-y-6 animate-in active">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-10 sm:w-12 h-10 sm:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <CreditCard :size="22" />
        </div>
        <div>
          <h2 class="text-lg sm:text-xl font-black text-gray-900">Fee Manager</h2>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tracking & Collection</p>
        </div>
      </div>
      <button @click="isAddModalOpen = true" class="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
        <Plus :size="18" />
        New Entry
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-indigo-50 p-4 sm:p-6 rounded-3xl border border-indigo-100 flex items-center justify-between gap-4">
        <div>
          <p class="text-[9px] text-indigo-400 font-black uppercase tracking-widest mb-1">Total Collected</p>
          <h3 class="text-xl sm:text-3xl font-black text-indigo-900">{{ stats.totalPaid.toLocaleString() }} ৳</h3>
        </div>
        <TrendingUp class="text-indigo-200 hidden sm:block" :size="48" />
      </div>
      <div class="bg-amber-50 p-4 sm:p-6 rounded-3xl border border-amber-100 flex items-center justify-between gap-4">
        <div>
          <p class="text-[9px] text-amber-500 font-black uppercase tracking-widest mb-1">Outstanding Due</p>
          <h3 class="text-xl sm:text-3xl font-black text-amber-900">{{ stats.totalDue.toLocaleString() }} ৳</h3>
        </div>
        <History class="text-amber-200 hidden sm:block" :size="48" />
      </div>
    </div>

    <!-- Students with Due -->
    <div v-if="studentsWithDue.length > 0" class="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-red-50 bg-red-50/50 flex items-center gap-3">
        <AlertTriangle class="text-red-500" :size="18" />
        <h3 class="font-black text-red-700 text-sm uppercase tracking-widest">Students With Due Fees</h3>
        <span class="ml-auto bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{{ studentsWithDue.length }}</span>
      </div>
      <div class="divide-y divide-gray-50">
        <div
          v-for="student in studentsWithDue"
          :key="student.id"
          class="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors group"
        >
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img v-if="student.imageUrl" :src="student.imageUrl" :alt="student.name" class="w-full h-full object-cover" />
            <User v-else class="text-indigo-400" :size="18" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-black text-gray-900 text-sm truncate">{{ student.name }}</p>
            <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              <span class="text-[10px] text-gray-400 font-bold">Roll: {{ student.roll }}</span>
              <span class="text-[10px] text-gray-400 font-bold">Section: {{ student.section }}</span>
              <span v-if="student.batch" class="text-[10px] text-gray-400 font-bold">Batch: {{ student.batch }}</span>
            </div>
            <div class="flex flex-wrap gap-x-3 mt-0.5">
              <span v-if="student.phone" class="text-[10px] text-gray-500 flex items-center gap-1"><Phone :size="9" />{{ student.phone }}</span>
              <span v-if="student.email" class="text-[10px] text-gray-500 flex items-center gap-1"><Mail :size="9" />{{ student.email }}</span>
            </div>
          </div>

          <!-- Due amount -->
          <div class="text-right flex-shrink-0">
            <p class="text-sm font-black text-red-600">{{ getDueAmount(student.id).toLocaleString() }} ৳</p>
            <p class="text-[9px] text-red-400 font-bold uppercase">Due</p>
          </div>

          <!-- Collect Button -->
          <button
            @click="openCollectModal(student)"
            class="flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-100 active:scale-95 transition-all"
          >
            <Banknote :size="13" />
            Collect
          </button>
        </div>
      </div>
    </div>

    <!-- Fee Records Table -->
    <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/30 space-y-3">
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
          <input v-model="search" type="text" placeholder="Search by name or roll..." class="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium outline-none transition-all" />
        </div>
        <!-- Tabs -->
        <div class="flex gap-2">
          <button
            v-for="tab in (['all', 'due', 'paid'] as const)"
            :key="tab"
            @click="activeTab = tab"
            :class="cn(
              'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )"
          >
            {{ tab === 'all' ? 'All' : tab === 'due' ? '⚠ Due' : '✓ Paid' }}
          </button>
        </div>
      </div>

      <div class="overflow-x-auto text-left">
        <table class="w-full">
          <thead class="bg-gray-50/50">
            <tr>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
              <th class="hidden sm:table-cell px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right sm:text-left">Amount</th>
              <th class="hidden sm:table-cell px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 font-medium">
            <tr v-if="filteredFees.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-400 text-sm font-bold">No records found.</td>
            </tr>
            <tr v-for="fee in filteredFees" :key="fee.id" class="hover:bg-gray-50/50 transition-colors text-sm">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img v-if="getStudent(fee.studentId)?.imageUrl" :src="getStudent(fee.studentId)?.imageUrl" class="w-full h-full object-cover" />
                    <User v-else class="text-indigo-300" :size="14" />
                  </div>
                  <div>
                    <p class="font-black text-gray-900 truncate max-w-[110px] sm:max-w-none">
                      {{ getStudent(fee.studentId)?.name || '—' }}
                    </p>
                    <p class="text-[10px] text-gray-400 font-bold">Roll: {{ getStudent(fee.studentId)?.roll || '—' }}</p>
                  </div>
                </div>
              </td>
              <td class="hidden sm:table-cell px-6 py-4 text-xs text-gray-600 capitalize">
                {{ feeTypeLabel[fee.type] || fee.type }}
              </td>
              <td class="px-6 py-4 font-black text-gray-900 text-right sm:text-left">
                {{ fee.amount.toLocaleString() }} ৳
              </td>
              <td class="hidden sm:table-cell px-6 py-4 text-center">
                <span :class="cn(
                  'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block',
                  fee.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                  fee.status === 'partial' ? 'bg-blue-50 text-blue-600' :
                  'bg-amber-50 text-amber-600'
                )">{{ fee.status }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  v-if="fee.status !== 'paid'"
                  @click="handleUpdateStatus(fee.id, 'paid')"
                  class="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 shadow-md shadow-indigo-100 transition-all active:scale-95"
                >Mark Paid</button>
                <div v-else class="text-[10px] font-black uppercase text-emerald-600 flex items-center justify-end gap-1">
                  <CheckCircle :size="13" /> Paid
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== ADD FEE MODAL ===== -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isAddModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div class="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div class="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <DollarSign :size="20" />
                </div>
                <h3 class="font-black text-gray-900 text-lg">Add Fee Record</h3>
              </div>
              <button @click="isAddModalOpen = false" class="w-10 h-10 bg-white shadow-sm border border-gray-100 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 transition-all"><X :size="20" /></button>
            </div>
            <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Student</label>
                <select v-model="formData.studentId" required class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 transition-all">
                  <option value="">Choose a student...</option>
                  <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }} (Roll: {{ s.roll }})</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fee Category</label>
                  <select v-model="formData.type" class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700">
                    <option value="monthly">Monthly Fee</option>
                    <option value="admission">Admission Fee</option>
                    <option value="late">Late Fee</option>
                    <option value="absent">Absent Fee</option>
                    <option value="fine">Fine / Penalty</option>
                    <option value="other">Other Fees</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Amount (৳)</label>
                  <input v-model="formData.amount" type="number" placeholder="0" class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700" required />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
                <select v-model="formData.status" class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700">
                  <option value="due">Due</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <button type="submit" class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                <CheckCircle :size="20" />
                Save Record
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== COLLECT FEE MODAL ===== -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isCollectModalOpen && selectedStudent" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
          <div class="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div class="p-6 border-b border-gray-50 flex justify-between items-center bg-emerald-50/50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <Banknote :size="20" />
                </div>
                <h3 class="font-black text-gray-900 text-lg">Collect Fee</h3>
              </div>
              <button @click="isCollectModalOpen = false" class="w-10 h-10 bg-white shadow-sm border border-gray-100 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 transition-all"><X :size="20" /></button>
            </div>

            <!-- Student Info Card -->
            <div class="mx-6 mt-5 bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
              <div class="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="selectedStudent.imageUrl" :src="selectedStudent.imageUrl" :alt="selectedStudent.name" class="w-full h-full object-cover" />
                <User v-else class="text-indigo-400" :size="24" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-black text-gray-900 text-base truncate">{{ selectedStudent.name }}</p>
                <div class="flex flex-wrap gap-x-3 mt-0.5">
                  <span class="text-[10px] text-gray-500 font-bold">Roll: {{ selectedStudent.roll }}</span>
                  <span class="text-[10px] text-gray-500 font-bold">{{ selectedStudent.section }}</span>
                  <span v-if="selectedStudent.batch" class="text-[10px] text-gray-500 font-bold">Batch: {{ selectedStudent.batch }}</span>
                </div>
                <div class="flex flex-wrap gap-x-3 mt-0.5">
                  <span v-if="selectedStudent.phone" class="text-[10px] text-gray-500 flex items-center gap-1"><Phone :size="9" />{{ selectedStudent.phone }}</span>
                  <span v-if="selectedStudent.email" class="text-[10px] text-gray-500 flex items-center gap-1 truncate"><Mail :size="9" />{{ selectedStudent.email }}</span>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-lg font-black text-red-600">{{ getDueAmount(selectedStudent.id).toLocaleString() }} ৳</p>
                <p class="text-[9px] text-red-400 font-bold uppercase">Total Due</p>
              </div>
            </div>

            <form @submit.prevent="handleCollect" class="p-6 space-y-5">

              <!-- Existing Due Records: select to mark as paid -->
              <div v-if="studentDueFees.length > 0" class="space-y-2">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-1">Due Records — Select to Pay</label>
                  <button type="button" @click="selectedFeeIds = selectedFeeIds.length === studentDueFees.length ? [] : studentDueFees.map(f => f.id)" class="text-[9px] font-black uppercase text-indigo-500 hover:underline">
                    {{ selectedFeeIds.length === studentDueFees.length ? 'Deselect All' : 'Select All' }}
                  </button>
                </div>
                <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
                  <label
                    v-for="dueFee in studentDueFees"
                    :key="dueFee.id"
                    class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                    :class="selectedFeeIds.includes(dueFee.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'"
                  >
                    <input type="checkbox" :value="dueFee.id" v-model="selectedFeeIds" class="w-4 h-4 accent-emerald-500 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-black text-gray-800">{{ feeTypeLabel[dueFee.type] || dueFee.type }}</p>
                      <p class="text-[10px] text-gray-400 font-bold">{{ dueFee.date }}</p>
                    </div>
                    <p class="font-black text-amber-600 text-sm flex-shrink-0">{{ dueFee.amount.toLocaleString() }} ৳</p>
                  </label>
                </div>
              </div>

              <!-- Optional: add extra new paid fee -->
              <div class="border-t border-gray-100 pt-4 space-y-3">
                <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  {{ studentDueFees.length > 0 ? 'Extra / New Payment (optional)' : 'New Fee Payment' }}
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <select v-model="collectData.type" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-gray-700 text-sm">
                    <option value="monthly">Monthly</option>
                    <option value="admission">Admission</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="fine">Fine</option>
                    <option value="other">Other</option>
                  </select>
                  <input v-model.number="collectData.amount" type="number" placeholder="Amount (৳)" min="0"
                    class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-gray-700 text-sm" />
                </div>
              </div>

              <!-- Submit -->
              <button type="submit" class="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                <CheckCircle :size="20" />
                Collect & Mark Paid
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
