<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api';
import { Student, FeeRecord, AttendanceRecord } from '../../types';
import { 
  CreditCard, 
  ClipboardCheck, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  Activity,
  DollarSign,
  UserCheck
} from 'lucide-vue-next';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import AttendanceSystem from '../attendance/AttendanceSystem.vue';

const props = defineProps<{
  student: Student;
}>();

const fees = ref<FeeRecord[]>([]);
const attendance = ref<AttendanceRecord[]>([]);
const activeSubTab = ref('fees');

onMounted(async () => {
  const [f, a] = await Promise.all([
    api.fees.getByStudentId(props.student.id),
    api.attendance.getAll().then(all => all.filter(rec => rec.studentId === props.student.id))
  ]);
  fees.value = f;
  attendance.value = a;
});

const feeStats = computed(() => {
  const paid = fees.value.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const due = fees.value.filter(f => f.status === 'due').reduce((sum, f) => sum + f.amount, 0);
  return { paid, due };
});

const attendanceStats = computed(() => {
  const total = attendance.value.length;
  const present = attendance.value.filter(a => a.status === 'present').length;
  return { total, present, rate: total ? Math.round((present / total) * 100) : 0 };
});
</script>

<template>
  <div class="p-8 space-y-8 animate-in active">
    <!-- Header Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 flex items-center justify-between">
        <div>
           <p class="text-xs opacity-80 uppercase font-bold tracking-widest mb-1">Total Due</p>
           <h3 class="text-3xl font-black">${{ feeStats.due }}</h3>
        </div>
        <CreditCard :size="40" class="opacity-30" />
      </div>
      
      <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
           <p class="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Attendance Rate</p>
           <h3 class="text-3xl font-black text-gray-900">{{ attendanceStats.rate }}%</h3>
        </div>
        <Activity :size="40" class="text-indigo-100" />
      </div>

      <div class="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-200 flex items-center justify-between">
        <div>
           <p class="text-xs opacity-80 uppercase font-bold tracking-widest mb-1">Total Paid</p>
           <h3 class="text-3xl font-black">${{ feeStats.paid }}</h3>
        </div>
        <DollarSign :size="40" class="opacity-30" />
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-4 bg-gray-100 p-1 rounded-2xl w-fit">
      <button 
        @click="activeSubTab = 'fees'"
        :class="cn('px-6 py-2 rounded-xl text-sm font-bold transition-all', activeSubTab === 'fees' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')"
      >
        My Fees
      </button>
      <button 
        @click="activeSubTab = 'attendance'"
        :class="cn('px-6 py-2 rounded-xl text-sm font-bold transition-all', activeSubTab === 'attendance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')"
      >
        Attendance History
      </button>
      <button 
        v-if="student.isCaptain"
        @click="activeSubTab = 'take-attendance'"
        :class="cn('px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2', activeSubTab === 'take-attendance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-50')"
      >
        <UserCheck :size="16" />
        Captain Panel
      </button>
    </div>

    <!-- Tab Content -->
    <div class="space-y-6">
      
      <!-- Fees Section -->
      <div v-if="activeSubTab === 'fees'" class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
           <h4 class="font-bold text-gray-900">Fee Records</h4>
           <span class="text-xs bg-gray-50 px-3 py-1 rounded-full text-gray-400 font-bold uppercase tracking-wider">Academic Year 2024</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-50/50">
              <tr>
                <th class="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                <th class="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th class="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                <th class="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="fee in fees" :key="fee.id" class="hover:bg-gray-50/30 transition-colors">
                <td class="px-8 py-4">
                  <div class="flex items-center gap-3">
                    <div :class="cn('w-2 h-2 rounded-full', fee.type === 'late' || fee.type === 'absent' ? 'bg-red-500' : 'bg-indigo-500')"></div>
                    <span class="font-bold text-gray-700 capitalize">{{ fee.type }} Fee</span>
                  </div>
                </td>
                <td class="px-8 py-4 text-sm text-gray-400">
                  {{ format(new Date(fee.date), 'MMM dd, yyyy') }}
                </td>
                <td class="px-8 py-4 font-black text-gray-900">
                  ${{ fee.amount }}
                </td>
                <td class="px-8 py-4">
                   <div :class="cn(
                     'px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest w-fit flex items-center gap-2',
                     fee.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                   )">
                     <component :is="fee.status === 'paid' ? CheckCircle : AlertCircle" :size="14" />
                     {{ fee.status }}
                   </div>
                </td>
              </tr>
              <tr v-if="fees.length === 0">
                 <td colspan="4" class="px-8 py-12 text-center text-gray-400 italic">No fee records found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Attendance History -->
      <div v-if="activeSubTab === 'attendance'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div v-for="rec in attendance" :key="rec.id" class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-3">
               <div :class="cn(
                 'w-10 h-10 rounded-xl flex items-center justify-center',
                 rec.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 
                 rec.status === 'absent' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
               )">
                 <component :is="rec.status === 'present' ? CheckCircle : rec.status === 'absent' ? Calendar : Activity" :size="20" />
               </div>
               <div>
                  <p class="text-xs text-gray-400 font-bold uppercase tracking-wider">{{ format(new Date(rec.date), 'MMM dd') }}</p>
                  <p class="font-bold text-gray-900 capitalize">{{ rec.status }}</p>
               </div>
            </div>
         </div>
         <div v-if="attendance.length === 0" class="col-span-full py-12 text-center text-gray-400">
            No attendance records yet.
         </div>
      </div>

      <!-- Captain Panel (Modular Reuse of Attendance System) -->
      <div v-if="activeSubTab === 'take-attendance' && student.isCaptain" class="bg-white rounded-3xl border border-indigo-100 shadow-lg shadow-indigo-50">
        <div class="p-6 bg-indigo-50/50 flex items-center gap-4 rounded-t-3xl border-b border-indigo-100">
           <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
             <UserCheck :size="24" />
           </div>
           <div>
             <h4 class="font-bold text-gray-900 uppercase tracking-widest text-sm">Class Captain Console</h4>
             <p class="text-xs text-indigo-400">Class: {{ student.class }} | Authorized access</p>
           </div>
        </div>
        <AttendanceSystem />
      </div>

    </div>
  </div>
</template>
