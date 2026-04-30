<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../../services/api';
import { Student } from '../../types';
import { 
  QrCode, 
  UserCheck, 
  History,
  XCircle,
  ScanLine
} from 'lucide-vue-next';
import { format } from 'date-fns';

const lastScanned = ref<{ student: Student; status: string } | null>(null);
const error = ref<string | null>(null);
const logs = ref<string[]>([]);
let scanner: Html5QrcodeScanner | null = null;

onMounted(() => {
  scanner = new Html5QrcodeScanner(
    "qr-reader",
    { fps: 10, qrbox: { width: 250, height: 250 } },
    false
  );

  const onScanSuccess = async (decodedText: string) => {
    try {
      const students = await api.students.getAll();
      const student = students.find(s => s.qrCode === decodedText);

      if (student) {
        const date = format(new Date(), 'yyyy-MM-dd');
        await api.attendance.mark({
          studentId: student.id,
          date,
          status: 'present'
        });
        
        lastScanned.value = { student, status: 'Success' };
        error.value = null;
        logs.value = [`[${format(new Date(), 'HH:mm:ss')}] Marked ${student.name} as Present`, ...logs.value].slice(0, 10);
        
        setTimeout(() => lastScanned.value = null, 3000);
      } else {
        error.value = "Invalid QR: Student not found";
        setTimeout(() => error.value = null, 3000);
      }
    } catch (err) {
      error.value = "Processing Error";
    }
  };

  scanner.render(onScanSuccess, (err) => { /* ignore routine errors */ });
});

onUnmounted(() => {
  if (scanner) {
    scanner.clear().catch(console.error);
  }
});
</script>

<template>
  <div class="p-8 space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Scanner Side -->
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode class="text-indigo-600" />
            Attendance Scanner
          </h2>
          <p class="text-gray-500">Scan ID cards to mark attendance automatically.</p>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
          <div id="qr-reader" class="w-full"></div>
          
          <Transition name="slide-up">
            <div v-if="lastScanned" class="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center text-white z-10">
              <UserCheck :size="64" class="mb-4" />
              <h3 class="text-2xl font-bold">{{ lastScanned.student.name }}</h3>
              <p class="opacity-90">Success!</p>
            </div>
            <div v-else-if="error" class="absolute inset-0 bg-red-500/95 flex flex-col items-center justify-center text-white z-10">
              <XCircle :size="64" class="mb-4" />
              <h3 class="text-2xl font-bold">Error</h3>
              <p class="opacity-90">{{ error }}</p>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Logs Side -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full min-h-[400px]">
        <div class="p-4 border-b border-gray-100 font-bold flex justify-between">
          <span class="flex items-center gap-2"><History :size="18" class="text-indigo-600" /> Activity Log</span>
        </div>
        <div class="flex-1 p-4 space-y-3 overflow-y-auto">
          <div v-if="logs.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400">
             <ScanLine :size="48" class="opacity-20 animate-pulse mb-2" />
             <p>No activity yet.</p>
          </div>
          <div v-for="(log, i) in logs" :key="i" class="text-sm font-mono text-gray-600 flex gap-2">
            <span class="text-emerald-500">•</span> {{ log }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from { transform: translateY(100%); opacity: 0; }
.slide-up-leave-to { transform: translateY(-100%); opacity: 0; }
</style>
