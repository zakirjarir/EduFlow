<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Camera, RefreshCw, UserCheck, AlertTriangle, ShieldCheck } from 'lucide-vue-next';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { faceRecognitionService } from '../../services/FaceRecognitionService';

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isModelsLoaded = ref(false);
const isTraining = ref(false);
const isScanning = ref(false);
const scanResult = ref<{ name: string; roll: string } | null>(null);
const error = ref('');

const startVideo = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (err) {
    console.error('Video error:', err);
    error.value = 'Camera access denied.';
  }
};

const initializeFaceSystem = async () => {
  try {
    isTraining.value = true;
    const students = await api.students.getAll();
    const studentsWithImages = students.filter(s => !!s.imageUrl);
    
    if (studentsWithImages.length === 0) {
      error.value = 'No students with registered photos found.';
      isTraining.value = false;
      isModelsLoaded.value = true;
      return;
    }

    await faceRecognitionService.train(studentsWithImages);
    isModelsLoaded.value = true;
    isTraining.value = false;
  } catch (err) {
    console.error('Face system initialization failed:', err);
    error.value = 'Failed to initialize biometric engine.';
    isTraining.value = false;
  }
};

const handleScan = async () => {
  if (!videoRef.value) return;

  isScanning.value = true;
  scanResult.value = null;
  error.value = '';

  try {
    const studentId = await faceRecognitionService.recognize(videoRef.value);
    
    if (studentId) {
      const students = await api.students.getAll();
      const student = students.find(s => s.id === studentId);
      
      if (student) {
        await api.attendance.mark({
          studentId: student.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          status: 'present',
          markedBy: 'FaceBiometric'
        });
        scanResult.value = { name: student.name, roll: student.roll };
      }
    } else {
      error.value = 'Face not recognized. Please align and try again.';
    }
  } catch (err) {
    console.error('Scan error:', err);
    error.value = 'Error processing biometrics.';
  } finally {
    isScanning.value = false;
  }
};

onMounted(async () => {
  await startVideo();
  await initializeFaceSystem();
});

onUnmounted(() => {
  if (videoRef.value && videoRef.value.srcObject) {
    const stream = videoRef.value.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
  }
});
</script>

<template>
  <div class="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
    <div class="flex items-center justify-between">
       <div>
         <h4 class="font-black text-gray-900 flex items-center gap-2">
           <Camera class="text-indigo-600" />
           Face Scan Attendance
         </h4>
         <p class="text-xs text-gray-400 mt-1">Smart Biometric Recognition System</p>
       </div>
       <div v-if="isTraining" class="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
         <RefreshCw class="animate-spin" :size="14" />
         Training Models...
       </div>
       <div v-else-if="isModelsLoaded" class="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
         <ShieldCheck :size="14" />
         Biometrics Active
       </div>
    </div>

    <div class="relative group">
       <div class="aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-inner border-[6px] border-gray-800">
          <video 
            ref="videoRef" 
            autoplay 
            muted 
            playsinline
            class="w-full h-full object-cover opacity-80"
          ></video>
          
          <!-- Scanning Overlay -->
          <div v-if="isScanning" class="absolute inset-0 pointer-events-none">
             <div class="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,1)] animate-scan"></div>
             <div class="absolute inset-0 border-2 border-indigo-500/30 rounded-3xl m-8"></div>
          </div>

          <!-- Processing Overlay -->
          <div v-if="isScanning" class="absolute inset-0 bg-indigo-900/40 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all">
             <div class="flex flex-col items-center gap-4">
                <div class="relative">
                   <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                   <div class="absolute inset-0 flex items-center justify-center">
                      <Camera class="text-white" :size="24" />
                   </div>
                </div>
                <p class="text-white text-xs font-black uppercase tracking-widest">Analyzing Biometrics...</p>
             </div>
          </div>

          <!-- Success result overlay -->
          <Transition name="scale">
            <div v-if="scanResult" class="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white text-center p-6 z-20">
               <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-xl animate-in zoom-in-50 duration-500">
                 <UserCheck :size="32" />
               </div>
               <p class="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Identity Verified</p>
               <h3 class="text-2xl font-black">{{ scanResult.name }}</h3>
               <p class="text-sm font-bold opacity-90 mt-1 uppercase tracking-widest">Attendance Marked</p>
               <button @click="scanResult = null" class="mt-6 px-8 py-2.5 bg-white text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Next Student</button>
            </div>
          </Transition>

          <canvas ref="canvasRef" class="absolute inset-0"></canvas>
       </div>

       <!-- Action Controls -->
       <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
          <button 
            @click="handleScan"
            :disabled="isScanning || isTraining || !isModelsLoaded"
            :class="cn(
              'px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl',
              (isScanning || isTraining || !isModelsLoaded) ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600 backdrop-blur-md' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 border border-indigo-500'
            )"
          >
             <RefreshCw v-if="isScanning" class="animate-spin" :size="18" />
             <Camera v-else :size="18" />
             {{ isScanning ? 'Processing...' : 'Verify Biometrics' }}
          </button>
       </div>
    </div>

    <div v-if="error" class="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-bottom-2">
       <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
          <AlertTriangle :size="16" />
       </div>
       {{ error }}
    </div>

    <div class="grid grid-cols-3 gap-4 text-center mt-4">
       <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Engine</p>
          <p class="text-xs font-black text-gray-900">v2.0-BIO</p>
       </div>
       <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Liveness</p>
          <p class="text-xs font-black text-emerald-600 uppercase tracking-widest">ACTIVE</p>
       </div>
       <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Status</p>
          <p class="text-xs font-black text-indigo-600 uppercase tracking-widest">{{ isModelsLoaded ? 'Ready' : 'Syncing' }}</p>
       </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scan {
  0% { transform: translateY(-150px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(150px); opacity: 0; }
}
.animate-scan {
  animation: scan 2s infinite ease-in-out;
}

.scale-enter-active, .scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from, .scale-leave-to {
  transform: scale(0.85);
  opacity: 0;
}
</style>
