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
  Star
} from 'lucide-vue-next';
import { cn } from '../../lib/utils';

const students = ref<Student[]>([]);
const search = ref('');
const isModalOpen = ref(false);
const editingStudent = ref<Student | null>(null);

const formData = ref({
  name: '',
  roll: '',
  class: 'Class 10',
  phone: '',
  password: '',
  isCaptain: false
});

const loadStudents = async () => {
  students.value = await api.students.getAll();
};

onMounted(loadStudents);

const handleSubmit = async () => {
  if (editingStudent.value) {
    await api.students.update(editingStudent.value.id, formData.value);
  } else {
    await api.students.add(formData.value);
  }
  closeModal();
  loadStudents();
};

const openModal = (student?: Student) => {
  if (student) {
    editingStudent.value = student;
    formData.value = {
      name: student.name,
      roll: student.roll,
      class: student.class,
      phone: student.phone,
      password: student.password || '',
      isCaptain: student.isCaptain || false
    };
  } else {
    editingStudent.value = null;
    formData.value = { name: '', roll: '', class: 'Class 10', phone: '', password: '', isCaptain: false };
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingStudent.value = null;
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
    s.roll.includes(search.value)
  )
);
</script>

<template>
  <div class="p-8 space-y-8 animate-in active">
    <!-- Header -->
    <div class="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
           <Users :size="24" />
        </div>
        <div>
          <h2 class="text-xl font-black text-gray-900">Student Directory</h2>
          <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">Enrollment and role management</p>
        </div>
      </div>
      <button 
        @click="openModal()"
        class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
      >
        <Plus :size="18" />
        <span>Enroll Student</span>
      </button>
    </div>

    <!-- Table Section -->
    <div class="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100 bg-gray-50/30">
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
          <input 
            type="text" 
            placeholder="Search by student name or roll..." 
            v-model="search"
            class="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>
      </div>

      <div class="overflow-x-auto text-left">
        <table class="w-full">
          <thead class="bg-gray-50/50">
            <tr>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Details</th>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Class & Roll</th>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Permissions</th>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">QR Identity</th>
              <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-indigo-50/30 transition-colors group">
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                    {{ student.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-black text-gray-900">{{ student.name }}</p>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PH: {{ student.phone }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6">
                 <div class="flex flex-col">
                   <span class="text-sm font-black text-gray-700">{{ student.class }}</span>
                   <span class="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Roll #{{ student.roll }}</span>
                 </div>
              </td>
              <td class="px-8 py-6">
                 <button 
                  @click="toggleCaptain(student)"
                  :class="cn(
                    'px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm',
                    student.isCaptain ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                  )"
                 >
                   <Star :size="14" :class="student.isCaptain ? 'fill-amber-500' : ''" />
                   {{ student.isCaptain ? 'Captain' : 'General' }}
                 </button>
              </td>
              <td class="px-8 py-6">
                 <div class="flex justify-center">
                    <img 
                      :src="`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${student.qrCode}`" 
                      class="w-10 h-10 border border-gray-100 rounded-xl p-1 bg-white shadow-sm"
                      alt="Student QR"
                    />
                 </div>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex justify-end gap-2">
                  <button 
                    @click="openModal(student)"
                    class="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all active:scale-90"
                  >
                    <Edit2 :size="18" />
                  </button>
                  <button 
                    @click="handleDelete(student.id)"
                    class="p-2.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all active:scale-90"
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
    <Transition name="fade">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md">
        <div class="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
          <div class="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <div class="flex items-center gap-3">
               <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <Plus :size="20" />
               </div>
               <h3 class="font-black text-gray-900 text-lg">{{ editingStudent ? 'Update Profile' : 'Enroll Student' }}</h3>
            </div>
            <button @click="closeModal" class="w-10 h-10 bg-white shadow-sm border border-gray-100 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 transition-all"><X :size="20" /></button>
          </div>
          
          <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Identification Name</label>
              <input 
                v-model="formData.name"
                type="text" 
                required
                class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-700"
                placeholder="e.g. Zakir Jarir"
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Academic Roll #</label>
                <input 
                  v-model="formData.roll"
                  type="text" 
                  required
                  class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-indigo-600"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Class Level</label>
                <select 
                  v-model="formData.class"
                  class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                >
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone / Mobile</label>
                <input 
                  v-model="formData.phone"
                  type="tel" 
                  required
                  placeholder="e.g. +880..."
                  class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Access Password</label>
                <input 
                  v-model="formData.password"
                  type="text" 
                  placeholder="Set password"
                  class="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                />
              </div>
            </div>

            <div class="flex items-center justify-between p-5 bg-amber-50 rounded-2xl border border-amber-100">
               <div>
                  <p class="font-black text-amber-900 text-sm">Assign Head Captain</p>
                  <p class="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Grants attendance privileges</p>
               </div>
               <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="formData.isCaptain" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 transition-all"></div>
               </label>
            </div>

            <button type="submit" class="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
              <ShieldCheck :size="20" />
              {{ editingStudent ? 'Authorize Changes' : 'Confirm Enrollment' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>
