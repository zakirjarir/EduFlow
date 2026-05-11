<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Camera, RefreshCw, UserCheck, AlertTriangle, ShieldCheck, SwitchCamera, Play, Pause } from 'lucide-vue-next';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { faceRecognitionService } from '../../services/FaceRecognitionService';

const videoRef = ref<HTMLVideoElement | null>(null);
const isModelsLoaded = ref(false);
const isTraining = ref(false);
const isScanning = ref(false);
const scanResult = ref<{ name: string; roll: string } | null>(null);
const error = ref('');
const facingMode = ref<'user' | 'environment'>('user');
const isAutoScanEnabled = ref(true);
const markedToday = ref(new Set<string>()); // Cache to prevent duplicate marking in same session
let animationFrameId: number | null = null;
let lastScanTime = 0;

const startVideo = async () => {
  if (videoRef.value && videoRef.value.srcObject) {
    const stream = videoRef.value.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: facingMode.value } 
    });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
    error.value = '';
  } catch (err) {
    console.error('Video error:', err);
    error.value = 'Camera access denied or device not found.';
  }
};

const toggleCamera = async () => {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user';
  await startVideo();
};

const initializeFaceSystem = async () => {
  try {
    isTraining.value = true;
    error.value = '';
    
    const students = await api.students.getAll();
    const studentsWithImages = students.filter(s => !!s.imageUrl);
    
    if (studentsWithImages.length === 0) {
      error.value = 'No students with registered photos found.';
      isTraining.value = false;
      isModelsLoaded.value = true;
      return;
    }

    const success = await faceRecognitionService.train(studentsWithImages);
    if (!success) {
      error.value = 'Biometric training failed. Ensure photos are clear.';
    } else {
      isModelsLoaded.value = true;
      // Start the auto-scan loop once models are ready
      startAutoScanLoop();
    }
    isTraining.value = false;
  } catch (err) {
    console.error('Face system initialization failed:', err);
    error.value = 'Biometric Engine Offline.';
    isTraining.value = false;
  }
};

const runSingleScan = async () => {
  if (!videoRef.value || !isModelsLoaded.value || isScanning.value || scanResult.value) return;

  try {
    isScanning.value = true;
    const studentId = await faceRecognitionService.recognize(videoRef.value);
    
    if (studentId) {
      // Check if already marked in this session
      if (markedToday.value.has(studentId)) {
        // Show subtle feedback or just wait
        console.log('Student already marked today');
      } else {
        const students = await api.students.getAll();
        const student = students.find(s => s.id === studentId);
        
        if (student) {
          await api.attendance.mark({
            studentId: student.id,
            date: format(new Date(), 'yyyy-MM-dd'),
            status: 'present',
            markedBy: 'FaceBiometric-Auto'
          });
          
          markedToday.value.add(studentId);
          scanResult.value = { name: student.name, roll: student.roll };
          
          // Auto-hide success message after 3 seconds to resume scanning
          setTimeout(() => {
            scanResult.value = null;
          }, 3000);
        }
      }
    }
  } catch (err) {
    console.error('Auto-scan error:', err);
  } finally {
    isScanning.value = false;
  }
};

const startAutoScanLoop = () => {
  const loop = async (time: number) => {
    if (!isAutoScanEnabled.value) {
      animationFrameId = requestAnimationFrame(loop);
      return;
    }

    // Scan every 800ms to save CPU
    if (time - lastScanTime > 800) {
      await runSingleScan();
      lastScanTime = time;
    }
    animationFrameId = requestAnimationFrame(loop);
  };
  animationFrameId = requestAnimationFrame(loop);
};

onMounted(async () => {
  await startVideo();
  await initializeFaceSystem();
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (videoRef.value && videoRef.value.srcObject) {
    const stream = videoRef.value.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
  }
});
</script>

<template>
  <div class="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm space-y-6">
    <div class="flex items-center justify-between">
       <div class="flex items-center gap-3">
         <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Camera :size="22" />
         </div>
         <div>
           <h4 class="font-black text-gray-900 tracking-tight">Biometric Attendance</h4>
           <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI Engine Active</p>
         </div>
       </div>

       <div class="flex items-center gap-2">
         <button 
           @click="isAutoScanEnabled = !isAutoScanEnabled"
           :class="cn(
             'p-2 rounded-xl border transition-all',
             isAutoScanEnabled ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400'
           )"
           title="Toggle Auto-Scan"
         >
           <component :is="isAutoScanEnabled ? Pause : Play" :size="18" />
         </button>
         <button 
           @click="toggleCamera"
           class="p-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:bg-white hover:shadow-sm transition-all"
           title="Switch Camera"
         >
           <SwitchCamera :size="18" />
         </button>
       </div>
    </div>

    <div class="relative">
       <div class="aspect-video bg-[#151619] rounded-[32px] overflow-hidden shadow-inner border-[8px] border-[#1C1D21] relative">
          <video 
            ref="videoRef" 
            autoplay 
            muted 
            playsinline
            :class="cn('w-full h-full object-cover transition-opacity duration-500', isModelsLoaded ? 'opacity-90' : 'opacity-40')"
          ></video>
          
          <!-- Scanning Animation -->
          <div v-if="isAutoScanEnabled && isModelsLoaded && !scanResult" class="absolute inset-0 pointer-events-none">
             <div class="absolute inset-x-12 top-0 h-full flex items-center justify-center">
                <div class="w-full h-0.5 bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,1)] animate-scan"></div>
             </div>
             <!-- Scanning corners -->
             <div class="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-indigo-500 rounded-tl-lg"></div>
             <div class="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-indigo-500 rounded-tr-lg"></div>
             <div class="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-indigo-500 rounded-bl-lg"></div>
             <div class="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-indigo-500 rounded-br-lg"></div>
          </div>

          <!-- Processing Overlay -->
          <div v-if="isScanning" class="absolute top-6 right-6 z-10">
             <div class="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <RefreshCw class="text-indigo-400 animate-spin" :size="12" />
                <span class="text-[9px] text-white font-black uppercase tracking-widest">Matching...</span>
             </div>
          </div>

          <!-- Loading State -->
          <div v-if="isTraining || !isModelsLoaded" class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
             <div class="flex flex-col items-center gap-4">
                <div class="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p class="text-white text-[10px] font-black uppercase tracking-widest text-center px-8">
                  {{ isTraining ? 'Training AI Models...' : 'Initializing Biometric Engine...' }}
                </p>
             </div>
          </div>

          <!-- Success overlay -->
          <Transition name="scale">
            <div v-if="scanResult" class="absolute inset-0 bg-emerald-600/95 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-6 z-20">
               <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-emerald-600 mb-4 shadow-2xl animate-in zoom-in-50 duration-500">
                 <UserCheck :size="40" />
               </div>
               <p class="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Attendance Verified</p>
               <h3 class="text-3xl font-black mb-1">{{ scanResult.name }}</h3>
               <p class="text-xs font-bold opacity-70 uppercase tracking-widest">Roll: {{ scanResult.roll }}</p>
               
               <div class="mt-6 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                  <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span class="text-[10px] font-bold uppercase">Ready in 3s...</span>
               </div>
            </div>
          </Transition>
       </div>
    </div>

    <div v-if="error" class="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
       <AlertTriangle :size="16" class="shrink-0" />
       {{ error }}
    </div>

    <div class="grid grid-cols-3 gap-4 text-center">
       <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-100 transition-colors">
          <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Marked Today</p>
          <p class="text-lg font-black text-gray-900">{{ markedToday.size }}</p>
       </div>
       <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Liveness</p>
          <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Enabled</p>
       </div>
       <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Engine</p>
          <p class="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">v2.0-BIO</p>
       </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scan {
  0% { transform: translateY(-120px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(120px); opacity: 0; }
}
.animate-scan {
  animation: scan 2.5s infinite ease-in-out;
}

.scale-enter-active, .scale-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from, .scale-leave-to {
  transform: scale(0.8) translateY(20px);
  opacity: 0;
}
</style>
