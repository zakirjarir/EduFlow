<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '../../services/api';
import { Student, AttendanceRecord, AttendanceStatus } from '../../types';
import { 
  ClipboardCheck, 
  Search, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '../../lib/utils';

const students = ref<Student[]>([]);
const attendance = ref<AttendanceRecord[]>([]);
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'));
const search = ref('');

const loadData = async () => {
  const [s, a] = await Promise.all([
    api.students.getAll(),
    api.attendance.getByDate(selectedDate.value)
  ]);
  students.value = s;
  attendance.value = a;
};

onMounted(loadData);
watch(selectedDate, loadData);

const handleMark = async (studentId: string, status: AttendanceStatus) => {
  await api.attendance.mark({
    studentId,
    date: selectedDate.value,
    status
  });
  loadData();
};

const getStatus = (studentId: string) => {
  return attendance.value.find(a => a.studentId === studentId)?.status;
};

const filteredStudents = computed(() => students.value.filter(s => 
  s.name.toLowerCase().includes(search.value.toLowerCase()) ||
  s.roll.includes(search.value)
));

const stats = computed(() => ({
  total: students.value.length,
  present: attendance.value.filter(a => a.status === 'present').length,
  absent: attendance.value.filter(a => a.status === 'absent').length,
  late: attendance.value.filter(a => a.status === 'late').length,
}));

const changeDate = (days: number) => {
  const newDate = days > 0 
    ? addDays(new Date(selectedDate.value), Math.abs(days)) 
    : subDays(new Date(selectedDate.value), Math.abs(days));
  selectedDate.value = format(newDate, 'yyyy-MM-dd');
};
</script>

<template>
  <div class="p-8 space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Daily Attendance</h2>
        <p class="text-gray-500">Mark attendance for students manually or via QR.</p>
      </div>
      <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
        <button @click="changeDate(-1)" class="p-1 hover:bg-gray-50 rounded-lg text-gray-400">
          <ChevronLeft :size="20" />
        </button>
        <div class="flex items-center gap-2 px-2">
          <CalendarIcon :size="16" class="text-indigo-600" />
          <span class="font-bold text-sm text-gray-700">
            {{ format(new Date(selectedDate), 'MMMM dd, yyyy') }}
          </span>
        </div>
        <button @click="changeDate(1)" class="p-1 hover:bg-gray-50 rounded-lg text-gray-400">
          <ChevronRight :size="20" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
         <div>
           <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total</p>
           <p class="text-xl font-bold text-gray-900">{{ stats.total }}</p>
         </div>
         <ClipboardCheck class="text-gray-200" :size="24" />
      </div>
      <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center shadow-sm">
         <div>
           <p class="text-xs text-emerald-600 uppercase font-bold tracking-wider">Present</p>
           <p class="text-xl font-bold text-emerald-700">{{ stats.present }}</p>
         </div>
         <CheckCircle2 class="text-emerald-200" :size="24" />
      </div>
      <div class="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center shadow-sm">
         <div>
           <p class="text-xs text-red-600 uppercase font-bold tracking-wider">Absent</p>
           <p class="text-xl font-bold text-red-700">{{ stats.absent }}</p>
         </div>
         <XCircle class="text-red-200" :size="24" />
      </div>
      <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 flex justify-between items-center shadow-sm">
         <div>
           <p class="text-xs text-amber-600 uppercase font-bold tracking-wider">Late</p>
           <p class="text-xl font-bold text-amber-700">{{ stats.late }}</p>
         </div>
         <Clock class="text-amber-200" :size="24" />
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
          <input 
            v-model="search"
            type="text" 
            placeholder="Filter by name or roll..." 
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50/50">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50/50 transition-colors">
              <td class="px-6 py-4 font-bold text-gray-900">{{ student.name }}</td>
              <td class="px-6 py-4 text-sm font-mono text-gray-500">{{ student.roll }}</td>
              <td class="px-6 py-4 text-center">
                 <span :class="cn(
                    'px-3 py-1 rounded-full text-xs font-bold uppercase',
                    getStatus(student.id) === 'present' ? 'bg-emerald-100 text-emerald-700' :
                    getStatus(student.id) === 'absent' ? 'bg-red-100 text-red-700' :
                    getStatus(student.id) === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                 )">
                    {{ getStatus(student.id) || 'Not Marked' }}
                 </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button 
                    @click="handleMark(student.id, 'present')"
                    :class="cn('p-2 rounded-lg transition-all', getStatus(student.id) === 'present' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')"
                  ><CheckCircle2 :size="18" /></button>
                  <button 
                    @click="handleMark(student.id, 'absent')"
                    :class="cn('p-2 rounded-lg transition-all', getStatus(student.id) === 'absent' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100')"
                  ><XCircle :size="18" /></button>
                  <button 
                    @click="handleMark(student.id, 'late')"
                    :class="cn('p-2 rounded-lg transition-all', getStatus(student.id) === 'late' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100')"
                  ><Clock :size="18" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
