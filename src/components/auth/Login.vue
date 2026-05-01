<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../../services/api';
import { UserRole, Student } from '../../types';
import { LogIn, GraduationCap, ShieldCheck, ArrowRight } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'login', data: { user: Student | null; role: UserRole }): void
}>();

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const isSignUp = ref(false);
const successMessage = ref('');

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    if (isSignUp.value) {
      await api.auth.signUp(email.value, password.value);
      successMessage.value = 'Account created successfully! Please check your email for confirmation (if enabled).';
      isSignUp.value = false;
    } else {
      const result = await api.auth.login(email.value, password.value);
      emit('login', result);
    }
  } catch (err: any) {
    error.value = err.message || `${isSignUp.value ? 'Sign up' : 'Login'} failed. Please check credentials.`;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row shadow-indigo-100">
      <div class="p-8 w-full">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
             <GraduationCap class="text-white" :size="32" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900">EduFlow {{ isSignUp ? 'Registration' : 'Login' }}</h1>
          <p class="text-gray-500 text-sm mt-2">
            {{ isSignUp ? 'Create a new account to join EduFlow.' : 'Enter your credentials to access the system.' }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="error" class="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium border border-red-100 animate-in fade-in">
             {{ error }}
          </div>
          <div v-if="successMessage" class="p-3 bg-green-50 text-green-600 text-xs rounded-xl font-medium border border-green-100 animate-in fade-in">
             {{ successMessage }}
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
            <div class="relative">
              <input 
                v-model="email"
                type="email" 
                required
                class="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                :placeholder="isSignUp ? 'your@email.com' : 'e.g. admin@eduflow.com'"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Password</label>
            <input 
              v-model="password"
              type="password" 
              required
              class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Min. 6 characters"
            />
          </div>

          <button 
            type="submit"
            :disabled="isLoading"
            class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span v-if="isLoading">{{ isSignUp ? 'Creating Account...' : 'Authenticating...' }}</span>
            <template v-else>
              <span>{{ isSignUp ? 'Register Now' : 'Login Now' }}</span>
              <ArrowRight :size="18" />
            </template>
          </button>

          <div class="text-center mt-4">
            <button 
              type="button"
              @click="isSignUp = !isSignUp"
              class="text-indigo-600 text-xs font-bold hover:underline"
            >
              {{ isSignUp ? 'Already have an account? Login here' : "Don't have an account? Create one" }}
            </button>
          </div>
        </form>

        <div class="mt-8 pt-6 border-t border-gray-50">
          <div class="flex items-center justify-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck :size="14" />
            Secure Enterprise Access
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
