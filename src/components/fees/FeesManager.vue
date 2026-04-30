<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api';
import { Student, FeeRecord, FeeType, FeeStatus } from '../../types';
import { 
  ReceiptIndianRupee, 
  Search, 
  Plus, 
  DollarSign, 
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  X
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
  await api.fees.add(formData.value);
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
}));

const getStudent = (id: string) => students.value.find(s => s.id === id);
</script>

<template>
  <div class="p-8 space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Fees Management</h2>
        <p class="text-gray-500">Track and manage student financial records.</p>
      </div>
      <button @click="isModalOpen = true" class="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
        <Plus :size="20" />
        Record Fee
      </button>
    </div>

    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex gap-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
          <input v-model="search" type="text" placeholder="Filter records..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm" />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50/50">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="fee in filteredFees" :key="fee.id" class="hover:bg-gray-50/50 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-gray-900">{{ getStudent(fee.studentId)?.name || 'Unknown' }}</p>
                <p class="text-xs text-gray-400">Roll: {{ getStudent(fee.studentId)?.roll }}</p>
              </td>
              <td class="px-6 py-4 capitalize text-sm">{{ fee.type }}</td>
              <td class="px-6 py-4 font-bold text-indigo-600">${{ fee.amount }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <component :is="fee.status === 'paid' ? CheckCircle : fee.status === 'due' ? AlertCircle : Clock" :size="16" :class="fee.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'" />
                  <span :class="cn('text-xs font-bold uppercase', fee.status === 'paid' ? 'text-emerald-600' : 'text-amber-600')">{{ fee.status }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <button v-if="fee.status !== 'paid'" @click="handleUpdateStatus(fee.id, 'paid')" class="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg hover:bg-emerald-100">Mark Paid</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div class="p-6 border-b border-gray-100 flex justify-between">
          <h3 class="font-bold">New Fee Entry</h3>
          <button @click="isModalOpen = false"><X :size="20" /></button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <select v-model="formData.studentId" required class="w-full p-2 border rounded-xl outline-none">
            <option value="">Select Student</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }} ({{ s.roll }})</option>
          </select>
          <div class="grid grid-cols-2 gap-4">
             <select v-model="formData.type" class="p-2 border rounded-xl"><option value="monthly">Monthly</option><option value="admission">Admission</option></select>
             <input v-model="formData.amount" type="number" placeholder="Amount" class="p-2 border rounded-xl" required />
          </div>
          <button class="w-full bg-indigo-600 text-white font-bold py-2 rounded-xl">Save</button>
        </form>
      </div>
    </div>
  </div>
</template>
