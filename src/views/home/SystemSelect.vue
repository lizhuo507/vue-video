<template>
  <div class="system-select">
    <div class="title-area">
      <h1 class="main-title custom-font">视频枢纽在线率统计</h1>
    </div>
    <div class="system-container">
      <div class="main-categories">
        <!-- 高速入口 -->
        <div class="main-category">
          <div class="category-title">高速入口</div>
          <div class="arrow-down"></div>
          <div class="sub-categories">
            <div class="system-card" @click="navigateTo('video-highway-sd')">
              <div class="system-icon">
                <el-icon><VideoCamera /></el-icon>
              </div>
              <div class="system-name">标清</div>
            </div>
            <div class="system-card" @click="navigateTo('video-highway-hd')">
              <div class="system-icon">
                <el-icon><VideoPlay /></el-icon>
              </div>
              <div class="system-name">高清</div>
            </div>
          </div>
        </div>
        
        <!-- 级联入口 -->
        <div class="main-category">
          <div class="category-title">级联入口</div>
          <div class="arrow-down"></div>
          <div class="sub-categories">
            <div class="system-card disabled">
              <div class="developing-badge">开发中</div>
              <div class="system-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="system-name">国省道</div>
            </div>
            
            <div class="system-card disabled">
              <div class="developing-badge">开发中</div>
              <div class="system-icon">
                <el-icon><Ship /></el-icon>
              </div>
              <div class="system-name">港航</div>
            </div>
          </div>
        </div>
        
        <!-- 车载入口 -->
        <div class="main-category">
          <div class="category-title">车载入口</div>
          <div class="arrow-down"></div>
          <div class="sub-categories">
            <div class="system-card disabled">
              <div class="developing-badge">开发中</div>
              <div class="system-icon">
                <el-icon><Van /></el-icon>
              </div>
              <div class="system-name">客运</div>
            </div>
            
            <div class="system-card disabled">
              <div class="developing-badge">开发中</div>
              <div class="system-icon">
                <el-icon><Box /></el-icon>
              </div>
              <div class="system-name">货运</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { VideoCamera, VideoPlay, TrendCharts, Ship, Van, Box } from '@element-plus/icons-vue';

const router = useRouter();

const navigateTo = (route: string) => {
  router.push({ name: route });
};
</script>

<style scoped lang="scss">
.system-select {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #041528;
  background-image: linear-gradient(0deg, rgba(0, 30, 60, 0.8) 0%, rgba(4, 21, 40, 0.9) 100%), url('@/assets/bg-wave.png');
  background-size: cover;
  background-position: center bottom;
  overflow: hidden;
  padding: 0;
}

.title-area {
  width: 100%;
  min-height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url('@/assets/bg-title.png');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  margin: 0;
  padding: 15px 0;
  position: relative;
}

.main-title {
  color: #1fcbff;
  font-size: 36px;
  font-weight: bold;
  text-shadow: 0 0 15px rgba(31, 203, 255, 0.7);
  margin: 0;
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
}

.custom-font {
  font-weight: 900;
  letter-spacing: 6px;
  font-size: 42px;
  text-shadow: 
    0 0 10px rgba(31, 203, 255, 0.8),
    0 0 20px rgba(31, 203, 255, 0.5),
    0 0 30px rgba(31, 203, 255, 0.3);
  /* 添加动画效果 */
  animation: textGlow 2s infinite alternate;
}

.system-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding-top: 60px;
  padding-bottom: 40px;
}

.main-categories {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 60px;
  width: 100%;
}

.main-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  min-width: 280px;
  padding: 25px 15px;
  background-image: url('@/assets/bg-边框.png');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

.category-title {
  color: #1fcbff;
  font-size: 26px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(31, 203, 255, 0.5);
  text-align: center;
}

.arrow-down {
  width: 20px;
  height: 20px;
  border-right: 3px solid #1fcbff;
  border-bottom: 3px solid #1fcbff;
  transform: rotate(45deg);
  margin: 0 auto;
  animation: arrow-bounce 2s infinite;
}

.sub-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 10px;
}

.system-card {
  width: 220px;
  height: 80px;
  background: rgba(0, 40, 85, 0.5);
  border: 2px solid #0e5c82;
  border-radius: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  padding: 0 20px;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent 0%, rgba(31, 203, 255, 0.1) 100%);
    z-index: 1;
  }
  
  &::after {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(90deg, #1fcbff, #1a73e8, #1fcbff);
    background-size: 400%;
    z-index: -1;
    border-radius: 8px;
    filter: blur(8px);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    
    &::after {
      opacity: 1;
      animation: glowing 3s linear infinite;
    }
  }
  
  &.disabled {
    opacity: 0.7;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
      
      &::after {
        opacity: 0;
        animation: none;
      }
    }
  }
}

.developing-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: rgba(255, 165, 0, 0.9);
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  padding: 3px 8px;
  border-bottom-left-radius: 8px;
  z-index: 2;
}

.system-icon {
  color: #1fcbff;
  font-size: 28px;
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.system-name {
  color: #1fcbff;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
}

@keyframes arrow-bounce {
  0%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  50% {
    transform: translateY(5px) rotate(45deg);
  }
}

@keyframes glowing {
  0% {
    background-position: 0 0;
  }
  50% {
    background-position: 400% 0;
  }
  100% {
    background-position: 0 0;
  }
}

@keyframes textGlow {
  0% {
    filter: brightness(1) drop-shadow(0 0 10px rgba(31, 203, 255, 0.8));
    transform: scale(1);
  }
  100% {
    filter: brightness(1.2) drop-shadow(0 0 15px rgba(31, 203, 255, 1));
    transform: scale(1.03);
  }
}
</style> 