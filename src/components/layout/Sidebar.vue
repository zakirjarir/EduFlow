<script setup lang="ts">
import { useRouter } from 'vue-router';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  QrCode, 
  ReceiptIndianRupee, 
  Settings, 
  LogOut,
  X 
} from 'lucide-vue-next';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';

defineProps<{
  isOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const router = useRouter();

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'students', label: 'Students', icon: Users, path: '/students' },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, path: '/attendance' },
  { id: 'qr-scan', label: 'QR Scanner', icon: QrCode, path: '/qr-scan' },
  { id: 'fees', label: 'Fees', icon: ReceiptIndianRupee, path: '/fees' },
];

const handleLogout = async () => {
  await api.auth.logout();
  router.push({ name: 'Login' });
};
</script>

<template>
  <!-- Mobile Overlay -->
  <div 
    v-if="isOpen" 
    @click="emit('close')"
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40] sm:hidden transition-opacity"
  ></div>

  <aside :class="cn(
    'fixed inset-y-0 left-0 z-[50] w-64 bg-[#151619] text-white flex flex-col border-r border-[#2A2B2F] transition-transform duration-300 sm:relative sm:translate-x-0',
    isOpen ? 'translate-x-0' : '-translate-x-full'
  )">
    <div class="p-6">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ClipboardCheck class="text-white" :size="24" />
          </div>
          <div>
            <h1 class="font-bold text-lg tracking-tight text-white">EduFlow</h1>
            <p class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">System v2.0</p>
          </div>
        </div>
        <!-- Mobile Close Button -->
        <button @click="emit('close')" class="sm:hidden text-gray-400 hover:text-white transition-colors">
          <X :size="20" />
        </button>
      </div>

      <nav class="space-y-1">
        <router-link
          v-for="item in MENU_ITEMS"
          :key="item.id"
          :to="item.path"
          v-slot="{ isActive }"
          @click="emit('close')"
        >
          <div :class="cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative outline-none cursor-pointer',
            isActive 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-gray-400 hover:text-white hover:bg-[#2A2B2F]'
          )">
            <component 
              :is="item.icon" 
              :size="20" 
              :class="isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'" 
            />
            <span class="font-medium text-sm">{{ item.label }}</span>
            
            <div
              v-if="isActive"
              class="absolute left-0 w-1 h-6 bg-white rounded-r-full"
            ></div>
          </div>
        </router-link>
      </nav>
    </div>

    <div class="mt-auto p-6 border-t border-[#2A2B2F]">
      <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-4 px-4">System Console</p>
      <button 
        @click="handleLogout"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <LogOut :size="20" />
        <span class="font-medium text-sm">Sign Out</span>
      </button>
    </div>
  </aside>
</template>
