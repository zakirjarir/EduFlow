<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api';
import { Student } from '../../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Users,
  ShieldCheck,
  Star,
  Camera,
  RefreshCcw
} from 'lucide-vue-next';
import { cn } from '../../lib/utils';

const students = ref<Student[]>([]);
const search = ref('');
const isModalOpen = ref(false);
const editingStudent = ref<Student | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const isCameraActive = ref(false);
const capturedImage = ref<string | null>(null);

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    isCameraActive.value = true;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (err) {
    console.error("Error accessing camera:", err);
    alert("Could not access camera. Please check permissions.");
  }
};

const stopCamera = () => {
  if (videoRef.value && videoRef.value.srcObject) {
    const stream = videoRef.value.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    videoRef.value.srcObject = null;
  }
  isCameraActive.value = false;
};

const capturePhoto = () => {
  if (videoRef.value) {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.value.videoWidth;
    canvas.height = videoRef.value.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.value, 0, 0);
      capturedImage.value = canvas.toDataURL('image/jpeg');
      formData.value.imageUrl = capturedImage.value;
      stopCamera();
    }
  }
};

const resetPhoto = () => {
  capturedImage.value = null;
  formData.value.imageUrl = '';
  startCamera();
};

const formData = ref({
  name: '',
  roll: '',
  index: '',
  section: 'A',
  batch: '2024',
  phone: '',
  email: '',
  imageUrl: '',
  isCaptain: false
});

const loadStudents = async () => {
  students.value = await api.students.getAll();
};

onMounted(loadStudents);

const handleSubmit = async () => {
  try {
    let finalImageUrl = formData.value.imageUrl;
    
    // If it's a new base64 capture, upload it first
    if (finalImageUrl.startsWith('data:')) {
      const uploadId = editingStudent.value?.id || `new-${Date.now()}`;
      finalImageUrl = await api.students.uploadImage(finalImageUrl, uploadId);
      formData.value.imageUrl = finalImageUrl;
    }

    if (editingStudent.value) {
      await api.students.update(editingStudent.value.id, formData.value);
    } else {
      await api.students.add(formData.value);
    }
    closeModal();
    loadStudents();
  } catch (err) {
    console.error('Submit error:', err);
  }
};

const openModal = (student?: Student) => {
  if (student) {
    editingStudent.value = student;
    formData.value = {
      name: student.name,
      roll: student.roll,
      index: student.index || '',
      section: student.section,
      batch: student.batch || '2024',
      phone: student.phone,
      email: student.email || '',
      imageUrl: student.imageUrl || '',
      isCaptain: student.isCaptain || false
    };
  } else {
    editingStudent.value = null;
    formData.value = { 
      name: '', 
      roll: '', 
      index: '', 
      section: 'A', 
      batch: '2024', 
      phone: '', 
      email: '', 
      imageUrl: '', 
      isCaptain: false 
    };
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingStudent.value = null;
  stopCamera();
  capturedImage.value = null;
};

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this student record?')) {
    await api.students.delete(id);
    loadStudents();
  }
};

const toggleCaptain = async (student: Student) => {
  await api.students.update(student.id, { isCaptain: !student.isCaptain });
  loadStudents();
};

const filteredStudents = computed(() => 
  students.value.filter(s => 
    s.name.toLowerCase().includes(search.value.toLowerCase()) ||
    s.roll.includes(search.value) ||
    (s.index && s.index.toLowerCase().includes(search.value.toLowerCase()))
  )
);
</script>

<template>
  <div class="p-8 space-y-8 animate-in active">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm transition-all">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
           <Users :size="20" class="sm:hidden" />
           <Users :size="24" class="hidden sm:block" />
        </div>
        <div>
          <h2 class="text-lg sm:text-xl font-black text-gray-900">Student Directory</h2>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enrollment and role management</p>
        </div>
      </div>
      <button 
        @click="openModal()"
        class="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
      >
        <Plus :size="18" />
        <span>Enroll Student</span>
      </button>
    </div>

    <!-- Table Section -->
    <div class="bg-white rounded-[32px] sm:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/30">
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
          <input 
            type="text" 
            placeholder="Search students..." 
            v-model="search"
            class="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border border-gray-100 shadow-sm rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>
      </div>

      <div class="overflow-x-auto text-left">
        <table class="w-full">
          <thead class="bg-gray-50/50">
            <tr>
              <th class="px-6 sm:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
              <th class="px-6 sm:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sec & Roll</th>
              <th class="hidden sm:table-cell px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">QR Identity</th>
              <th class="px-6 sm:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-indigo-50/30 transition-colors group">
              <td class="px-6 sm:px-8 py-4 sm:py-6">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner overflow-hidden border border-gray-100 shrink-0">
                    <img v-if="student.imageUrl" :src="student.imageUrl" class="w-full h-full object-cover" alt="Student" />
                    <span v-else class="text-sm sm:text-base">{{ student.name.charAt(0) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-black text-gray-900 truncate text-sm sm:text-base">{{ student.name }}</p>
                    <div class="flex items-center gap-2">
                       <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">IDX: {{ student.index }}</p>
                       <span v-if="student.isCaptain" class="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase tracking-widest">Captain</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 sm:px-8 py-4 sm:py-6">
                 <div class="flex flex-col">
                   <span class="text-sm font-black text-gray-700">Sec {{ student.section }} ({{ student.batch }})</span>
                   <span class="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Roll #{{ student.roll }}</span>
                 </div>
              </td>
              <td class="hidden sm:table-cell px-8 py-6">
                 <div class="flex justify-center">
                    <img 
                      :src="`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${student.qrCode}`" 
                      class="w-10 h-10 border border-gray-100 rounded-xl p-1 bg-white shadow-sm"
                      alt="Student QR"
                    />
                 </div>
              </td>
              <td class="px-6 sm:px-8 py-4 sm:py-6 text-right">
                <div class="flex justify-end gap-1 sm:gap-2">
                  <button 
                    @click="toggleCaptain(student)"
                    class="p-2 text-gray-400 hover:text-amber-500 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all active:scale-90"
                    :title="student.isCaptain ? 'Demote from Captain' : 'Make Captain'"
                  >
                    <Star :size="18" :class="student.isCaptain ? 'fill-amber-500 text-amber-500' : ''" />
                  </button>
                  <button 
                    @click="openModal(student)"
                    class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all active:scale-90"
                  >
                    <Edit2 :size="18" />
                  </button>
                  <button 
                    @click="handleDelete(student.id)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all active:scale-90"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="filteredStudents.length === 0" class="py-20 text-center">
          <div class="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-4">
             <Users class="text-gray-200" :size="40" />
          </div>
          <p class="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching students found</p>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div class="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <!-- Modal Header (Sticky) -->
            <div class="p-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
              <div class="flex items-center gap-3">
                 <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Plus :size="20" />
                 </div>
                 <div>
                   <h3 class="font-black text-gray-900 text-lg leading-tight">{{ editingStudent ? 'Update Profile' : 'Enroll Student' }}</h3>
                   <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Academic Record Management</p>
                 </div>
              </div>
              <button @click="closeModal" class="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X :size="20" /></button>
            </div>
            
            <!-- Modal Body (Scrollable) -->
            <div class="overflow-y-auto flex-1 p-6 space-y-6 bg-gray-50/20">
              <form @submit.prevent="handleSubmit" id="studentForm" class="space-y-6">
                <!-- Name Section -->
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Identification Name</label>
                  <input 
                    v-model="formData.name"
                    type="text" 
                    required
                    class="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-700 shadow-sm"
                    placeholder="e.g. Zakir Jarir"
                  />
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <!-- Roll & Index -->
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Academic Roll #</label>
                    <input 
                      v-model="formData.roll"
                      type="text" 
                      required
                      class="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-indigo-600 shadow-sm"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Index Number</label>
                    <input 
                      v-model="formData.index"
                      type="text" 
                      required
                      class="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 shadow-sm"
                    />
                  </div>
  
                  <!-- Section & Batch -->
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Section Name</label>
                    <input 
                      v-model="formData.section"
                      type="text" 
                      required
                      placeholder="e.g. A, B, Rose"
                      class="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 shadow-sm"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Batch Year</label>
                    <input 
                      v-model="formData.batch"
                      type="text" 
                      required
                      placeholder="e.g. 2024"
                      class="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 shadow-sm"
                    />
                  </div>
  
                  <!-- Phone & Email -->
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone / Mobile</label>
                    <input 
                      v-model="formData.phone"
                      type="tel" 
                      required
                      placeholder="e.g. +880..."
                      class="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 shadow-sm"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Auth Email</label>
                    <input 
                      v-model="formData.email"
                      type="email" 
                      required
                      placeholder="student@eduflow.com"
                      class="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 shadow-sm"
                    />
                  </div>
                </div>
  
                <!-- Photo Section -->
                <div class="space-y-4 p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100/50">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] font-black uppercase tracking-widest text-indigo-400">Student Identity Portrait</label>
                    <button 
                      v-if="!isCameraActive && !formData.imageUrl"
                      type="button"
                      @click="startCamera"
                      class="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Camera :size="14" />
                      Open Camera
                    </button>
                  </div>

                  <div class="relative aspect-square w-full max-w-[240px] mx-auto bg-white rounded-3xl border-2 border-dashed border-indigo-200 overflow-hidden flex items-center justify-center group">
                    <video 
                      v-show="isCameraActive"
                      ref="videoRef" 
                      autoplay 
                      playsinline 
                      class="w-full h-full object-cover"
                    ></video>
                    
                    <img 
                      v-if="formData.imageUrl && !isCameraActive" 
                      :src="formData.imageUrl" 
                      class="w-full h-full object-cover"
                    />

                    <div v-if="!isCameraActive && !formData.imageUrl" class="text-center p-4">
                      <Camera :size="32" class="mx-auto text-indigo-200 mb-2" />
                      <p class="text-[10px] text-indigo-300 font-bold uppercase">No photo captured</p>
                    </div>

                    <!-- Camera Controls -->
                    <div v-if="isCameraActive" class="absolute bottom-4 inset-x-0 flex justify-center gap-2">
                      <button 
                        type="button"
                        @click="capturePhoto"
                        class="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all active:scale-90"
                      >
                        <Camera :size="20" />
                      </button>
                      <button 
                        type="button"
                        @click="stopCamera"
                        class="bg-white text-gray-400 p-3 rounded-full shadow-lg hover:text-red-500 transition-all active:scale-90 border border-gray-100"
                      >
                        <X :size="20" />
                      </button>
                    </div>

                    <!-- Reset Control -->
                    <button 
                      v-if="formData.imageUrl && !isCameraActive"
                      type="button"
                      @click="resetPhoto"
                      class="absolute top-2 right-2 bg-white/80 backdrop-blur text-gray-600 p-2 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600"
                    >
                      <RefreshCcw :size="16" />
                    </button>
                  </div>
                </div>

                <!-- Image URL (Fallback) -->
                <div class="space-y-2">
                   <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Manual Image URL (Optional)</label>
                   <input 
                     v-model="formData.imageUrl"
                     type="text" 
                     placeholder="https://images.unsplash.com/..."
                     class="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 shadow-sm text-xs"
                   />
                </div>
  
                <!-- Roles -->
                <div class="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm">
                   <div class="flex items-center gap-3">
                      <div class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                        <Star :size="16" class="fill-current" />
                      </div>
                      <div>
                        <p class="font-black text-amber-900 text-xs">Assign Head Captain</p>
                        <p class="text-[9px] text-amber-600 font-bold uppercase tracking-widest">Grants attendance privileges</p>
                      </div>
                   </div>
                   <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" v-model="formData.isCaptain" class="sr-only peer">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 transition-all"></div>
                   </label>
                </div>
              </form>
            </div>
  
            <!-- Modal Footer (Sticky) -->
            <div class="p-6 border-t border-gray-50 bg-white shrink-0">
              <button 
                type="submit" 
                form="studentForm"
                class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck :size="18" />
                {{ editingStudent ? 'Authorize Changes' : 'Confirm Enrollment' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
