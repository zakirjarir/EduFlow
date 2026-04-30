<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api';
import { Student, FeeRecord, FeeType, FeeStatus } from '../../types';
import { 
  Search, 
  Plus, 
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  CreditCard,
  History,
  TrendingUp,
  DollarSign
} from 'lucide-vue-next';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const students = ref<Student[]>([]);
const fees = ref<FeeRecord[]>([]);
const isModalOpen = ref(false);
const search = ref('');

const formData = ref({
  studentId: '',
  type: 'monthly' as FeeType,
  amount: 0,
  status: 'due' as FeeStatus,
  date: format(new Date(), 'yyyy-MM-dd')
});

const load = async () => {
  const [s, f] = await Promise.all([
    api.students.getAll(),
    api.fees.getAll()
  ]);
  students.value = s;
  fees.value = f;
};

onMounted(load);

const handleSubmit = async () => {
  await api.fees.add({
    ...formData.value,
  });
  isModalOpen.value = false;
  formData.value = { ...formData.value, studentId: '', amount: 0 };
  load();
};

const handleUpdateStatus = async (id: string, status: FeeStatus) => {
  await api.fees.updateStatus(id, status);
  load();
};

const filteredFees = computed(() => fees.value.filter(f => {
  const student = students.value.find(s => s.id === f.studentId);
  return student?.name.toLowerCase().includes(search.value.toLowerCase()) ||
         student?.roll.includes(search.value);
}).sort((a, b) => b.timestamp - a.timestamp));

const getStudent = (id: string) => students.value.find(s => s.id === id);

const stats = computed(() => {
  const totalDue = fees.value.filter(f => f.status === 'due').reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.value.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  return { totalDue, totalPaid };
});
</script>

<template>
  <div class="p-8 space-y-8 animate-in active">
    <!-- Header -->
    <div class="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
           <CreditCard :size="24" />
        </div>
        <div>
          <h2 class="text-xl font-black text-gray-900">Financial Management</h2>
          <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">Revenue and fee tracking</p>
        </div>
      </div>
      <button @click="isModalOpen = true" class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
        <Plus :size="18" />
        New Fee Entry
      </button>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center justify-between">
        <div>
           <p class="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Total Collections</p>
           <h3 class="text-3xl font-black text-indigo-900">${{ stats.totalPaid }}</h3>
        </div>
        <TrendingUp class="text-indigo-200" :size="48" />
      </div>
      <div class="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-center justify-between">
        <div>
           <p class="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-1">Total Outstanding</p>
           <h3 class="text-3xl font-black text-amber-900">${{ stats.totalDue }}</h3>
        </div>
        <History class="text-amber-200" :size="48" />
      </div>
    </div>

    <!-- Records Table -->
    <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100 bg-gray-50/30 flex gap-4">
        <div class="relative flex-1">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
          <input v-model="search" type="text" placeholder="Filter by student name or roll..." class="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl text-sm transition-all focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div class="overflow-x-auto text-left">
        <table class="w-full">
          <thead class="bg-gray-50/50">
            <tr>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 font-medium">
            <tr v-for="fee in filteredFees" :key="fee.id" class="hover:bg-gray-50/50 transition-colors group">
              <td class="px-8 py-5">
                <p class="font-black text-gray-900">{{ getStudent(fee.studentId)?.name || 'Unknown' }}</p>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Roll: {{ getStudent(fee.studentId)?.roll }}</p>
              </td>
              <td class="px-8 py-5">
                <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider">{{ fee.type }}</span>
              </td>
              <td class="px-8 py-5 font-black text-gray-900">${{ fee.amount }}</td>
              <td class="px-8 py-5 text-center">
                 <div :class="cn(
                   'px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2',
                   fee.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                 )">
                   <component :is="fee.status === 'paid' ? CheckCircle : AlertCircle" :size="14" />
                   {{ fee.status }}
                 </div>
              </td>
              <td class="px-8 py-5 text-right">
                <button v-if="fee.status !== 'paid'" @click="handleUpdateStatus(fee.id, 'paid')" class="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 shadow-md shadow-indigo-100 transition-all active:scale-95">Mark Paid</button>
                <span v-else class="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center justify-end gap-1"><CheckCircle :size="14" /> Receipt Generated</span>
              </td>
            </tr>
            <tr v-if="filteredFees.length === 0">
               <td colspan="5" class="py-12 text-center text-gray-400 italic">No matching fee records found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal (Modern) -->
    <Transition name="fade">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
        <div class="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
          <div class="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <div class="flex items-center gap-3">
               <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <DollarSign :size="20" />
               </div>
               <h3 class="font-black text-gray-900 text-lg">Record Fee Payment</h3>
            </div>
            <button @click="isModalOpen = false" class="w-10 h-10 bg-white shadow-sm border border-gray-100 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 transition-all"><X :size="20" /></button>
          </div>
          
          <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Student</label>
              <select v-model="formData.studentId" required class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-700">
                <option value="">Choose a student...</option>
                <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }} (Roll: {{ s.roll }})</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
               <div class="space-y-2">
                 <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fee Category</label>
                 <select v-model="formData.type" class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-700">
                    <option value="monthly">Monthly Fee</option>
                    <option value="admission">Admission Fee</option>
                    <option value="late">Late Fee</option>
                    <option value="absent">Absent Fee</option>
                    <option value="fine">Fine / Penalty</option>
                    <option value="other">Other Fees</option>
                 </select>
               </div>
               <div class="space-y-2">
                 <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Amount ($)</label>
                 <input v-model="formData.amount" type="number" placeholder="0.00" class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-700" required />
               </div>
            </div>

            <button type="submit" class="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
              <CheckCircle :size="20" />
              Complete Transaction
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>
