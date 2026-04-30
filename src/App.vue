<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Sidebar from './components/layout/Sidebar.vue';
import Dashboard from './components/dashboard/Dashboard.vue';
import StudentManager from './components/students/StudentManager.vue';
import AttendanceSystem from './components/attendance/AttendanceSystem.vue';
import QRScanner from './components/attendance/QRScanner.vue';
import FeesManager from './components/fees/FeesManager.vue';
import StudentPanel from './components/student-panel/StudentPanel.vue';
import Login from './components/auth/Login.vue';
import { Search, Bell, User, LogOut } from 'lucide-vue-next';
import { UserRole, Student } from './types';

const activeTab = ref('dashboard');
const authState = ref<{ user: Student | null; role: UserRole | null }>({
  user: null,
  role: null,
});

onMounted(() => {
  const saved = localStorage.getItem('ef_auth');
  if (saved) {
    authState.value = JSON.parse(saved);
  }
});

const handleLogin = (data: { user: Student | null; role: UserRole }) => {
  authState.value = data;
  localStorage.setItem('ef_auth', JSON.stringify(data));
  if (data.role === 'student') {
    activeTab.value = 'student-home';
  }
};

const handleLogout = () => {
  authState.value = { user: null, role: null };
  localStorage.removeItem('ef_auth');
};

const currentComponent = computed(() => {
  if (authState.value.role === 'student') {
    return StudentPanel;
  }

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
  <div v-if="!authState.role">
    <Login @login="handleLogin" />
  </div>

  <div v-else class="flex h-screen bg-[#F9FAFB] font-sans selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Sidebar (Only for Admin) -->
    <Sidebar 
      v-if="authState.role === 'admin'"
      :activeTab="activeTab" 
      @update:activeTab="setActiveTab" 
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <!-- Top Navbar -->
      <header class="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10 shrink-0">
        <div class="flex items-center gap-4 flex-1">
           <div v-if="authState.role === 'admin'" class="relative max-w-md w-full">
              <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Global search..." 
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-100 transition-all"
              />
           </div>
           <div v-else class="flex items-center gap-3">
              <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                EF
              </div>
              <h1 class="font-bold text-gray-900">Student Portal</h1>
           </div>
        </div>
        
        <div class="flex items-center gap-4">
          <button @click="handleLogout" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2">
            <LogOut :size="20" />
            <span class="text-xs font-bold uppercase tracking-wider hidden sm:block">Logout</span>
          </button>
          <div class="h-8 w-[1px] bg-gray-100 mx-2"></div>
          <div class="flex items-center gap-3">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-bold text-gray-900">
                {{ authState.user?.name || 'Administrator' }}
              </p>
              <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                {{ authState.role === 'admin' ? 'Super Admin' : `Roll: ${authState.user?.roll}` }}
              </p>
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
          <component :is="currentComponent" :student="authState.user" />
        </Transition>
      </main>

      <!-- Footer Info -->
      <footer class="h-10 bg-white border-t border-gray-100 px-8 flex items-center justify-between text-[10px] text-gray-400 font-medium uppercase tracking-widest shrink-0">
         <span>EduFlow Management System v2.0.0</span>
         <span>Role: {{ authState.role }}</span>
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
