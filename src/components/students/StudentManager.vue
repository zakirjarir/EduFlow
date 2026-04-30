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
  Users
} from 'lucide-vue-next';
import { cn } from '../../lib/utils';

const students = ref<Student[]>([]);
const search = ref('');
const isModalOpen = ref(false);
const editingStudent = ref<Student | null>(null);
const formData = ref({
  name: '',
  roll: '',
  class: '',
  phone: ''
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
      phone: student.phone
    };
  } else {
    editingStudent.value = null;
    formData.value = { name: '', roll: '', class: '', phone: '' };
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingStudent.value = null;
};

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this student?')) {
    await api.students.delete(id);
    loadStudents();
  }
};

const filteredStudents = computed(() => 
  students.value.filter(s => 
    s.name.toLowerCase().includes(search.value.toLowerCase()) ||
    s.roll.includes(search.value)
  )
);
</script>

<template>
  <div class="p-8 space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Student Management</h2>
        <p class="text-gray-500">View and manage all enrolled students.</p>
      </div>
      <button 
        @click="openModal()"
        class="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
      >
        <Plus :size="20" />
        <span>Add Student</span>
      </button>
    </div>

    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex gap-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
          <input 
            type="text" 
            placeholder="Search by name or roll number..." 
            v-model="search"
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50/50">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class/Roll</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">QR Identity</th>
              <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50/50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold uppercase">
                    {{ student.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-bold text-gray-900">{{ student.name }}</p>
                    <p class="text-xs text-gray-400">ID: {{ student.id.split('-')[0] }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm text-gray-600">{{ student.class }}</p>
                <p class="text-xs text-indigo-500 font-mono">Roll: {{ student.roll }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ student.phone }}
              </td>
              <td class="px-6 py-4">
                 <div class="flex justify-center">
                    <img 
                      :src="`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${student.qrCode}`" 
                      class="w-12 h-12 border border-gray-100 rounded-lg p-1 bg-white"
                      alt="Student QR"
                    />
                 </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button 
                    @click="openModal(student)"
                    class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 :size="18" />
                  </button>
                  <button 
                    @click="handleDelete(student.id)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="filteredStudents.length === 0" class="p-12 text-center">
          <Users class="mx-auto text-gray-300 mb-2" :size="48" />
          <p class="text-gray-500">No students found matching your criteria.</p>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-900">{{ editingStudent ? 'Edit Student' : 'Add New Student' }}</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <X :size="24" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input 
              v-model="formData.name"
              type="text" 
              required
              class="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Zakir Jarir"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Roll Number</label>
              <input 
                v-model="formData.roll"
                type="text" 
                required
                class="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Class</label>
              <select 
                v-model="formData.class"
                class="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
              >
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
            <input 
              v-model="formData.phone"
              type="tel" 
              required
              class="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
            />
          </div>
          <button class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 mt-4">
             {{ editingStudent ? 'Update Profile' : 'Enroll Student' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
