import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/SystemSelect.vue'),
    meta: {
      title: '视频在线率系统入口'
    }
  },
  {
    path: '/demo',
    name: 'demo',
    component: () => import('@/views/home/demo.vue'),
    meta: {
      title: '视频在线率系统入口'
    }
  },
  // 高速入口路由
  {
    path: '/video-highway-hd',
    name: 'video-highway-hd',
    component: () => import('@/views/videoSystem/VideoSystem.vue'),
    meta: {
      title: '高速高清视频系统',
      streamType: '2', // 高清视频类型
      systemType: 'highway' // 高速系统
    }
  },
  {
    path: '/video-highway-sd',
    name: 'video-highway-sd',
    component: () => import('@/views/videoSystem/VideoSystem.vue'),
    meta: {
      title: '高速标清视频系统',
      streamType: '1', // 标清视频类型
      systemType: 'highway' // 高速系统
    }
  },
  // 级联入口路由
  {
    path: '/video-provincial',
    name: 'video-provincial',
    component: () => import('@/views/videoSystem/VideoSystem.vue'),
    meta: {
      title: '国省道视频系统',
      streamType: '1', // 默认使用标清
      systemType: 'provincial' // 国省道系统
    }
  },
  {
    path: '/video-port',
    name: 'video-port',
    component: () => import('@/views/videoSystem/VideoSystem.vue'),
    meta: {
      title: '港航视频系统',
      streamType: '1', // 默认使用标清
      systemType: 'port' // 港航系统
    }
  },
  // 车载入口路由
  {
    path: '/video-passenger',
    name: 'video-passenger',
    component: () => import('@/views/videoSystem/VideoSystem.vue'),
    meta: {
      title: '客运视频系统',
      streamType: '1', // 默认使用标清
      systemType: 'passenger' // 客运系统
    }
  },
  {
    path: '/video-freight',
    name: 'video-freight',
    component: () => import('@/views/videoSystem/VideoSystem.vue'),
    meta: {
      title: '货运视频系统',
      streamType: '1', // 默认使用标清
      systemType: 'freight' // 货运系统
    }
  },
  // 其他系统路由可以在这里添加
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由前置守卫，设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
  next();
});

export default router; 