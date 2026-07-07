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
  ChevronRight,
  QrCode,
  Camera
} from 'lucide-vue-next';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '../../lib/utils';
import QRScanner from './QRScanner.vue';
import FaceScanner from './FaceScanner.vue';

const students = ref<Student[]>([]);
const attendance = ref<AttendanceRecord[]>([]);
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'));
const search = ref('');
const activeMode = ref<'list' | 'qr' | 'face'>('list');

// ✅ Fix snake_case -> camelCase from Supabase
const normalizeAttendance = (a: any): AttendanceRecord => ({
  id: a.id,
  studentId: a.studentId || a.student_id,
  date: a.date,
  status: a.status,
  markedBy: a.markedBy || a.marked_by,
  timestamp: a.timestamp,
});

const loadData = async () => {
  const [s, a] = await Promise.all([
    api.students.getAll(),
    api.attendance.getByDate(selectedDate.value)
  ]);
  students.value = s;
  attendance.value = a.map(normalizeAttendance);
};

onMounted(loadData);
watch(selectedDate, loadData);

const handleMark = async (studentId: string, status: AttendanceStatus) => {
  try {
    await api.attendance.mark({
      studentId,
      date: selectedDate.value,
      status,
      markedBy: 'manual'
    });
    await loadData();
  } catch (err: any) {
    console.error('Attendance mark error:', err);
    alert('Failed to mark attendance: ' + (err.message || 'Unknown error'));
  }
};

const getStatus = (studentId: string) => {
  return attendance.value.find(a => a.studentId === studentId)?.status;
};

const filteredStudents = computed(() => students.value.filter(s => {
  const q = search.value.trim().toLowerCase();
  return !q || s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q);
}));

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
  <div class="p-4 sm:p-8 space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
           <ClipboardCheck :size="20" class="sm:hidden" />
           <ClipboardCheck :size="24" class="hidden sm:block" />
        </div>
        <div>
          <h2 class="text-lg sm:text-xl font-black text-gray-900">Attendance</h2>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">Management Records</p>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
        <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
          <button 
             @click="activeMode = 'list'"
             :class="cn('flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', activeMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400')"
          >List</button>
          <button 
             @click="activeMode = 'qr'"
             :class="cn('flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2', activeMode === 'qr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400')"
          >
            <QrCode :size="14" />
            <span class="sm:hidden lg:inline">QR</span>
          </button>
          <button 
             @click="activeMode = 'face'"
             :class="cn('flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2', activeMode === 'face' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400')"
          >
            <Camera :size="14" />
            <span class="sm:hidden lg:inline">Face</span>
          </button>
        </div>

        <div class="flex items-center justify-between gap-3 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100">
          <button @click="changeDate(-1)" class="p-1 hover:bg-white hover:rounded-lg text-gray-400 transition-all">
            <ChevronLeft :size="20" />
          </button>
          <div class="flex items-center gap-2">
            <CalendarIcon :size="14" class="text-indigo-600" />
            <span class="font-black text-[10px] text-gray-700 uppercase tracking-widest whitespace-nowrap">
              {{ format(new Date(selectedDate.split('-').map((n, i) => i === 1 ? Number(n)-1 : Number(n)) as any), 'MMM dd') }}
            </span>
          </div>
          <button @click="changeDate(1)" class="p-1 hover:bg-white hover:rounded-lg text-gray-400 transition-all">
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mode: QR Scanner -->
    <div v-if="activeMode === 'qr'" class="animate-in fade-in zoom-in duration-300">
       <QRScanner />
    </div>

    <!-- Mode: Face Scanner -->
    <div v-else-if="activeMode === 'face'" class="animate-in fade-in zoom-in duration-300">
       <FaceScanner />
    </div>

    <!-- Mode: List Display -->
    <div v-else class="space-y-6">
      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
           <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 relative z-10">Total Students</p>
           <p class="text-3xl font-black text-gray-900 relative z-10">{{ stats.total }}</p>
           <ClipboardCheck class="absolute -right-4 -bottom-4 text-gray-50 group-hover:text-indigo-50 transition-colors" :size="96" />
        </div>
        <div class="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-200">
           <p class="text-[10px] opacity-70 font-black uppercase tracking-widest mb-1">Present</p>
           <p class="text-3xl font-black">{{ stats.present }}</p>
        </div>
        <div class="bg-red-500 p-6 rounded-3xl text-white shadow-lg shadow-red-200">
           <p class="text-[10px] opacity-70 font-black uppercase tracking-widest mb-1">Absent</p>
           <p class="text-3xl font-black">{{ stats.absent }}</p>
        </div>
        <div class="bg-amber-500 p-6 rounded-3xl text-white shadow-lg shadow-amber-200">
           <p class="text-[10px] opacity-70 font-black uppercase tracking-widest mb-1">Late</p>
           <p class="text-3xl font-black">{{ stats.late }}</p>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100 bg-gray-50/30">
          <div class="relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
            <input 
              v-model="search"
              type="text" 
              placeholder="Search by name or roll number..." 
              class="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        <div class="overflow-x-auto text-left">
          <table class="w-full">
            <thead class="bg-gray-50/50">
              <tr>
                <th class="px-6 sm:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Info</th>
                <th class="hidden sm:table-cell px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Roll</th>
                <th class="px-6 sm:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th class="px-6 sm:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="student in filteredStudents"
                :key="student.id"
                class="transition-all duration-200"
                :class="
                  getStatus(student.id) === 'present' ? 'bg-emerald-50 hover:bg-emerald-100/70' :
                  getStatus(student.id) === 'absent'  ? 'bg-red-50 hover:bg-red-100/70' :
                  getStatus(student.id) === 'late'    ? 'bg-amber-50 hover:bg-amber-100/70' :
                  'bg-white hover:bg-gray-50'
                "
              >
                <!-- Student Info -->
                <td class="px-6 sm:px-8 py-4 sm:py-5">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-sm ring-2 transition-all"
                      :class="
                        getStatus(student.id) === 'present' ? 'bg-emerald-200 text-emerald-800 ring-emerald-400' :
                        getStatus(student.id) === 'absent'  ? 'bg-red-200 text-red-800 ring-red-400' :
                        getStatus(student.id) === 'late'    ? 'bg-amber-200 text-amber-800 ring-amber-400' :
                        'bg-gray-100 text-gray-400 ring-gray-200'
                      "
                    >
                      <img v-if="student.imageUrl" :src="student.imageUrl" :alt="student.name" class="w-full h-full object-cover" />
                      <span v-else>{{ student.name.charAt(0) }}</span>
                    </div>
                    <div class="min-w-0">
                      <span class="font-black text-gray-900 block truncate text-sm">{{ student.name }}</span>
                      <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{{ student.roll }}</span>
                    </div>
                  </div>
                </td>

                <!-- Roll (desktop) -->
                <td class="hidden sm:table-cell px-8 py-5">
                  <span class="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg font-mono text-xs font-bold">{{ student.roll }}</span>
                </td>

                <!-- Status Badge -->
                <td class="px-6 sm:px-8 py-4 sm:py-5 text-center">
                  <span :class="cn(
                    'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5',
                    getStatus(student.id) === 'present' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' :
                    getStatus(student.id) === 'absent'  ? 'bg-red-600 text-white shadow-sm shadow-red-200' :
                    getStatus(student.id) === 'late'    ? 'bg-amber-500 text-white shadow-sm shadow-amber-200' :
                    'bg-gray-200 text-gray-500'
                  )">
                    <div class="w-1.5 h-1.5 rounded-full bg-white/60 hidden sm:block"></div>
                    <span class="hidden sm:inline">{{ getStatus(student.id) === 'present' ? 'Present' : getStatus(student.id) === 'absent' ? 'Absent' : getStatus(student.id) === 'late' ? 'Late' : 'N/A' }}</span>
                    <span class="sm:hidden">{{ getStatus(student.id) === 'present' ? 'P' : getStatus(student.id) === 'absent' ? 'A' : getStatus(student.id) === 'late' ? 'L' : '—' }}</span>
                  </span>
                </td>

                <!-- Action Buttons -->
                <td class="px-6 sm:px-8 py-4 sm:py-5 text-right">
                  <div class="flex justify-end gap-1.5 sm:gap-2">
                    <button
                      @click="handleMark(student.id, 'present')"
                      title="Present"
                      :class="cn('p-2 sm:p-2.5 rounded-xl transition-all', getStatus(student.id) === 'present' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-300 scale-110' : 'bg-white border border-emerald-200 text-emerald-500 hover:bg-emerald-50')"
                    ><CheckCircle2 :size="17" /></button>
                    <button
                      @click="handleMark(student.id, 'absent')"
                      title="Absent"
                      :class="cn('p-2 sm:p-2.5 rounded-xl transition-all', getStatus(student.id) === 'absent' ? 'bg-red-600 text-white shadow-md shadow-red-300 scale-110' : 'bg-white border border-red-200 text-red-500 hover:bg-red-50')"
                    ><XCircle :size="17" /></button>
                    <button
                      @click="handleMark(student.id, 'late')"
                      title="Late"
                      :class="cn('p-2 sm:p-2.5 rounded-xl transition-all', getStatus(student.id) === 'late' ? 'bg-amber-500 text-white shadow-md shadow-amber-300 scale-110' : 'bg-white border border-amber-200 text-amber-500 hover:bg-amber-50')"
                    ><Clock :size="17" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
