<script setup lang="ts">
import { ref, computed } from 'vue';
import Sidebar from './components/layout/Sidebar.vue';
import Dashboard from './components/dashboard/Dashboard.vue';
import StudentManager from './components/students/StudentManager.vue';
import AttendanceSystem from './components/attendance/AttendanceSystem.vue';
import QRScanner from './components/attendance/QRScanner.vue';
import FeesManager from './components/fees/FeesManager.vue';
import { Search, Bell, User } from 'lucide-vue-next';

const activeTab = ref('dashboard');

const currentComponent = computed(() => {
  switch (activeTab.value) {
    case 'dashboard': return Dashboard;
    case 'students': return StudentManager;
    case 'attendance': return AttendanceSystem;
    case 'qr-scan': return QRScanner;
    case 'fees': return FeesManager;
    default: return Dashboard;
  }
});

const setActiveTab = (tab: string) => {
  activeTab.value = tab;
};
</script>

<template>
  <div class="flex h-screen bg-[#F9FAFB] font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Sidebar -->
    <Sidebar :activeTab="activeTab" @update:activeTab="setActiveTab" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <!-- Top Navbar -->
      <header class="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
        <div class="flex items-center gap-4 flex-1">
           <div class="relative max-w-md w-full">
              <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Global search..." 
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-100 transition-all"
              />
           </div>
        </div>
        
        <div class="flex items-center gap-4">
          <button class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative">
            <Bell :size="20" />
            <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div class="h-8 w-[1px] bg-gray-100 mx-2"></div>
          <div class="flex items-center gap-3">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-bold text-gray-900">Admin User</p>
              <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Super Admin</p>
            </div>
            <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <User :size="20" />
            </div>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto bg-gray-50/30">
        <Transition name="fade" mode="out-in">
          <component :is="currentComponent" />
        </Transition>
      </main>

      <!-- Footer Info -->
      <footer class="h-10 bg-white border-t border-gray-100 px-8 flex items-center justify-between text-[10px] text-gray-400 font-medium uppercase tracking-widest">
         <span>EduFlow Management System v1.0.0</span>
         <span>Local Storage Backend Interface</span>
      </footer>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
