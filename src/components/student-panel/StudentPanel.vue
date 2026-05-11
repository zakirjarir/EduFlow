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
  student: Student | null;
}>();

const fees = ref<FeeRecord[]>([]);
const attendance = ref<AttendanceRecord[]>([]);
const activeSubTab = ref('fees');

onMounted(async () => {
  if (!props.student) return;
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
  <div v-if="!student" class="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
     <div class="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 animate-bounce">
        <AlertCircle :size="40" />
     </div>
     <div class="max-w-xs">
        <h2 class="text-2xl font-black text-gray-900 mb-2">Profile Not Linked</h2>
        <p class="text-sm text-gray-500 font-medium leading-relaxed">
          Your account is authenticated but has not been linked to a student record yet. 
          Please contact the administrator with your Roll No. to complete your profile setup.
        </p>
     </div>
     <button @click="api.auth.logout()" class="text-indigo-600 font-bold text-sm hover:underline">
       Logout and try again
     </button>
  </div>

  <div v-else class="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in active">
    <!-- Header Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div class="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 flex items-center justify-between">
        <div>
           <p class="text-[10px] opacity-80 uppercase font-black tracking-widest mb-1">Total Due</p>
           <h3 class="text-2xl sm:text-3xl font-black">${{ feeStats.due }}</h3>
        </div>
        <CreditCard :size="32" class="opacity-30 sm:hidden" />
        <CreditCard :size="40" class="opacity-30 hidden sm:block" />
      </div>
      
      <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
           <p class="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Attendance Rate</p>
           <h3 class="text-2xl sm:text-3xl font-black text-gray-900">{{ attendanceStats.rate }}%</h3>
        </div>
        <Activity :size="32" class="text-indigo-100 sm:hidden" />
        <Activity :size="40" class="text-indigo-100 hidden sm:block" />
      </div>

      <div class="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-200 flex items-center justify-between">
        <div>
           <p class="text-[10px] opacity-80 uppercase font-black tracking-widest mb-1">Total Paid</p>
           <h3 class="text-2xl sm:text-3xl font-black">${{ feeStats.paid }}</h3>
        </div>
        <DollarSign :size="32" class="opacity-30 sm:hidden" />
        <DollarSign :size="40" class="opacity-30 hidden sm:block" />
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto">
      <button 
        @click="activeSubTab = 'fees'"
        :class="cn('flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap', activeSubTab === 'fees' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')"
      >
        My Fees
      </button>
      <button 
        @click="activeSubTab = 'attendance'"
        :class="cn('flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap', activeSubTab === 'attendance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')"
      >
        History
      </button>
      <button 
        v-if="student.isCaptain"
        @click="activeSubTab = 'take-attendance'"
        :class="cn('flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap', activeSubTab === 'take-attendance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-50')"
      >
        <UserCheck :size="16" />
        Captain
      </button>
    </div>

    <!-- Tab Content -->
    <div class="space-y-6">
      
      <!-- Fees Section -->
      <div v-if="activeSubTab === 'fees'" class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
           <h4 class="font-black text-gray-900 text-sm uppercase tracking-widest">Fee Records</h4>
        </div>
        <div class="overflow-x-auto text-left">
          <table class="w-full">
            <thead class="bg-gray-50/50">
              <tr>
                <th class="px-6 sm:px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                <th class="hidden sm:table-cell px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th class="px-6 sm:px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right sm:text-left">Amount</th>
                <th class="px-6 sm:px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="fee in fees" :key="fee.id" class="hover:bg-gray-50/30 transition-colors group">
                <td class="px-6 sm:px-8 py-4">
                  <div class="flex items-center gap-2 sm:gap-3">
                    <div :class="cn('w-2 h-2 rounded-full shrink-0', fee.type === 'late' || fee.type === 'absent' ? 'bg-red-500' : 'bg-indigo-500')"></div>
                    <span class="font-bold text-gray-700 capitalize text-sm sm:text-base">{{ fee.type }}</span>
                  </div>
                </td>
                <td class="hidden sm:table-cell px-8 py-4 text-xs text-gray-400">
                  {{ format(new Date(fee.date), 'MMM dd, yyyy') }}
                </td>
                <td class="px-6 sm:px-8 py-4 font-black text-gray-900 text-right sm:text-left text-sm sm:text-base">
                  ${{ fee.amount }}
                </td>
                <td class="px-6 sm:px-8 py-4 text-right">
                   <div :class="cn(
                     'px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2',
                     fee.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                   )">
                     {{ fee.status }}
                   </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Attendance History -->
      <div v-if="activeSubTab === 'attendance'" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
         <div v-for="rec in attendance" :key="rec.id" class="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-3">
               <div :class="cn(
                 'w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center',
                 rec.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 
                 rec.status === 'absent' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
               )">
                 <component :is="rec.status === 'present' ? CheckCircle : rec.status === 'absent' ? Calendar : Activity" :size="16" class="sm:hidden" />
                 <component :is="rec.status === 'present' ? CheckCircle : rec.status === 'absent' ? Calendar : Activity" :size="20" class="hidden sm:block" />
               </div>
               <div class="min-w-0">
                  <p class="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">{{ format(new Date(rec.date), 'MMM dd') }}</p>
                  <p class="font-black text-gray-900 capitalize text-xs sm:text-sm">{{ rec.status }}</p>
               </div>
            </div>
         </div>
         <div v-if="attendance.length === 0" class="col-span-full py-12 text-center text-gray-400">
            No attendance records yet.
         </div>
      </div>

      <!-- Captain Panel -->
      <div v-if="activeSubTab === 'take-attendance' && student.isCaptain" class="bg-white rounded-3xl border border-indigo-100 shadow-lg shadow-indigo-50/30 overflow-hidden">
        <div class="p-4 sm:p-6 bg-indigo-50/50 flex items-center gap-4 border-b border-indigo-100">
           <div class="w-10 sm:w-12 h-10 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
             <UserCheck :size="24" />
           </div>
           <div>
             <h4 class="font-black text-gray-900 uppercase tracking-widest text-xs sm:text-sm">Captain Console</h4>
             <p class="text-[10px] text-indigo-400 font-bold">Sec: {{ student.section }} ({{ student.batch }})</p>
           </div>
        </div>
        <AttendanceSystem />
      </div>

    </div>
  </div>
</template>
