import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as loginApi } from '@/api/admin';
import request from '@/api/request';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '');
  const username = ref(localStorage.getItem('admin_username') || '');
  const role = ref(localStorage.getItem('admin_role') || '');
  const site = ref(localStorage.getItem('admin_site') || '');
  const viewSite = ref(localStorage.getItem('admin_view_site') || '');

  // 店铺功能开关
  const isBookingEnabled = ref(false);
  const isVotingEnabled = ref(false);

  const isLoggedIn = computed(() => !!token.value);
  const isSuper = computed(() => role.value === 'super');
  const currentSite = computed(() => {
    if (role.value === 'site') return site.value;
    return viewSite.value;
  });

  async function login(usernameInput: string, password: string): Promise<boolean> {
    try {
      const res = await loginApi(usernameInput, password);
      token.value = res.token;
      username.value = res.username;
      role.value = res.role;
      site.value = res.site;

      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('admin_username', res.username);
      localStorage.setItem('admin_role', res.role);
      localStorage.setItem('admin_site', res.site);

      // 如果是店铺用户，获取店铺功能开关
      if (res.role === 'site' && res.site) {
        await fetchStoreFeatures(res.site);
      }

      // 如果是超管且有 viewSite，获取该店铺功能开关
      if (res.role === 'super' && viewSite.value) {
        await fetchStoreFeatures(viewSite.value);
      }

      return true;
    } catch {
      return false;
    }
  }

  async function fetchStoreFeatures(siteName: string) {
    try {
      const store: any = await request.get(`/admin/stores/${siteName}`);
      isBookingEnabled.value = store.isBookingEnabled || false;
      isVotingEnabled.value = store.isVotingEnabled || false;
    } catch {
      isBookingEnabled.value = false;
      isVotingEnabled.value = false;
    }
  }

  function setViewSite(s: string) {
    viewSite.value = s;
    localStorage.setItem('admin_view_site', s);
    // 切换店铺时重新获取功能开关
    if (role.value === 'super' && s) {
      fetchStoreFeatures(s);
    }
  }

  function logout() {
    token.value = '';
    username.value = '';
    role.value = '';
    site.value = '';
    viewSite.value = '';
    isBookingEnabled.value = false;
    isVotingEnabled.value = false;

    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_site');
    localStorage.removeItem('admin_view_site');
  }

  return {
    token, username, role, site, viewSite, currentSite,
    isBookingEnabled, isVotingEnabled,
    isLoggedIn, isSuper,
    login, logout, setViewSite, fetchStoreFeatures
  };
});
