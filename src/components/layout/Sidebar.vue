<script setup lang="ts">
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  QrCode, 
  ReceiptIndianRupee, 
  Settings, 
  LogOut 
} from 'lucide-vue-next';
import { cn } from '../../lib/utils';

defineProps<{
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: 'update:activeTab', tab: string): void;
}>();

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'qr-scan', label: 'QR Scanner', icon: QrCode },
  { id: 'fees', label: 'Fees', icon: ReceiptIndianRupee },
  { id: 'settings', label: 'Settings', icon: Settings },
];
</script>

<template>
  <div class="w-64 bg-[#151619] text-white flex flex-col border-r border-[#2A2B2F] h-screen">
    <div class="p-6">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ClipboardCheck class="text-white" :size="24" />
        </div>
        <div>
          <h1 class="font-bold text-lg tracking-tight">EduFlow</h1>
          <p class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Management System</p>
        </div>
      </div>

      <nav class="space-y-1">
        <button
          v-for="item in MENU_ITEMS"
          :key="item.id"
          @click="emit('update:activeTab', item.id)"
          :class="cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative outline-none',
            activeTab === item.id 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'text-gray-400 hover:text-white hover:bg-[#2A2B2F]'
          )"
        >
          <component 
            :is="item.icon" 
            :size="20" 
            :class="activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'" 
          />
          <span class="font-medium text-sm">{{ item.label }}</span>
          
          <div
            v-if="activeTab === item.id"
            class="absolute left-0 w-1 h-6 bg-white rounded-r-full"
          ></div>
        </button>
      </nav>
    </div>

    <div class="mt-auto p-6 border-t border-[#2A2B2F]">
      <button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
        <LogOut :size="20" />
        <span class="font-medium text-sm">Logout</span>
      </button>
    </div>
  </div>
</template>
