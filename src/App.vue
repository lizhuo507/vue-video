<template>
  <div class="app-main">
    <div class="app-container">
      <h4 class="pb-1 pl-1 flex justify-between items-center">
        <el-text truncated> 视频在线率统计 </el-text>
        <el-button link type="primary" @click="logout">
          <el-icon>
            <SwitchButton /> </el-icon
          >退出登录</el-button
        >
      </h4>
      <div class="search-container">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item prop="keywords" label="路公司名称">
            <el-input
              v-model="queryParams.company"
              :style="{
                width: 120 + (queryParams.company?.length || 0) * 10 + 'px',
              }"
              placeholder="路公司名称"
              clearable
              :disabled="isCompany"
            />
          </el-form-item>
          <el-form-item
            prop="keywords"
            :label="queryParams.countType == 1 ? '管养单位' : '路段名称'"
          >
            <el-input
              :style="{
                width:
                  120 + (queryParams.installPlace?.length || 0) * 10 + 'px',
              }"
              v-model="queryParams.installPlace"
              :placeholder="
                queryParams.countType == 1 ? '管养单位' : '路段名称'
              "
              clearable
            />
          </el-form-item>
          <el-form-item prop="keywords" label="设置阈值(%)">
            <el-input-number
              v-model="threshold"
              :min="0"
              :max="100"
              style="width: 80px"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item prop="keywords" label="统计依据">
            <el-select
              v-model="queryParams.countType"
              placeholder=""
              style="width: 180px"
              @change="onChange"
            >
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery" :icon="Search">
              搜索</el-button
            >
            <el-button
              @click="handleExport"
              type="success"
              v-if="isExport"
              :disabled="!ids.length"
              :icon="Download"
              >导出</el-button
            >
          </el-form-item>
        </el-form>
      </div>

      <el-card shadow="never" class="table-container">
        <template #header>
          <div class="flex items-center">
            <el-text class="mr-5" truncated> 视频在线统计状态: </el-text>
            <el-radio-group v-model="time">
              <el-radio-button label="实时" :value="0" />
              <el-radio-button label="昨日" :value="1" />
              <el-radio-button label="近一周" :value="7" />
              <el-radio-button label="近30天" :value="30" />
              <el-radio-button
                label="自定义"
                :value="4"
                @click="dialogVisible2 = true"
              />
            </el-radio-group>
          </div>
        </template>

        <el-table
          ref="dataTableRef"
          v-loading="loading"
          :data="tableData"
          highlight-current-row
          border
          :summary-method="getSummaries"
          show-summary
          @selection-change="handleSelectionChange"
          :header-cell-style="{ backgroundColor: '#f5f7fa' }"
        >
          <template #empty>
            <el-empty />
          </template>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="路公司名称" prop="company" width="400" />
          <el-table-column
            v-if="queryParams.countType == 1"
            label="管养单位"
            prop="road_sec"
            width="400"
          />
          <el-table-column
            v-else
            label="路段名称"
            prop="install_place"
            width="400"
          />
          <el-table-column label="接入数" prop="collect_num"> </el-table-column>

          <el-table-column label="在线数" prop="online_num" />
          <el-table-column label="离线数" prop="outline_num" />
          <el-table-column
            :label="time === 0 ? '实时在线率' : '平均在线率'"
            prop="online_rate"
          >
            <template #default="{ row }">
              <span
                :class="{
                  'text-red-500':
                    Number(row.online_rate.slice(0, -1)) < threshold,
                }"
                >{{ row.online_rate }}</span
              >
            </template>
          </el-table-column>

          <el-table-column
            fixed="right"
            label="操作"
            width="150"
            v-if="time !== 7 && time !== 30"
          >
            <template #default="{ row }">
              <el-button type="primary" link @click="openDialog(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="mt-5 flex justify-end"
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </el-card>
      <!-- 详情弹窗 -->
      <el-dialog
        v-model="dialogVisible"
        title="详情"
        width="80%"
        @close="closeDialog"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <el-table
          v-loading="dialogLoading"
          :data="list.slice((currentPage - 1) * 10, currentPage * 10)"
          style="width: 100%"
        >
          <template #empty>
            <el-empty />
          </template>
          <el-table-column prop="camera_name" label="摄像机名称" />
          <el-table-column prop="camera_index_code" label="ID" width="300" />
          <el-table-column
            prop="server_index_code"
            label="网关编号"
            width="300"
          />
          <el-table-column prop="online_status" label="在线状态" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.online_status === '在线'" type="success"
                >在线</el-tag
              >
              <el-tag v-else type="info">离线</el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="60">
            <template #default="{ row }">
              <el-button type="primary" link>
                <el-icon
                  class="text-[16px] hover:text-[18px]"
                  @click="playVideo(row)"
                >
                  <VideoCamera />
                </el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="flex justify-end"
          layout="prev, pager, next"
          :total="list.length"
          :page-size="10"
          :current-page="currentPage"
          @current-change="currentPageChange"
        />
        <template #footer> </template>
      </el-dialog>
      <!-- 自定义弹框 -->
      <el-dialog
        v-model="dialogVisible2"
        title="自定义日期"
        width="450px"
        @close="closeDialog"
      >
        <el-date-picker
          style="width: 100%"
          v-model="date"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :value-format="format"
          @calendar-change="(val: Date) => firstdate = val"
          :disabled-date="disableddate"
          placeholder="选择日期范围"
        >
        </el-date-picker>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="timeSubmit">确 定</el-button>
            <el-button @click="closeDialog">取 消</el-button>
          </div>
        </template>
      </el-dialog>
      <!-- 下载进度条 -->
      <el-dialog
        title="正在导出，请耐心等待"
        v-model="fileDown.loadDialogStatus"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="true"
        width="20%"
        @close="source.cancel('下载被取消')"
      >
        <div style="text-align: center">
          <el-progress :percentage="fileDown.percentage" indeterminate />
        </div>
      </el-dialog>
      <div
        v-if="videoVisible"
        class="video-modal"
        :style="{ left: left + 'px', top: top + 'px' }"
        ref="modal"
      >
        <div class="flex justify-between">
          <el-text>
            {{ videoTitle }}
          </el-text>
          <el-button link
            ><el-icon
              @click="videoVisible = false"
              class="cursor-pointer text-[20px]"
            >
              <Close /> </el-icon
          ></el-button>
        </div>
        <div class="video">
          <video :controls="true" ref="video" src="" autoplay></video>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, nextTick, watchEffect } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Download } from "@element-plus/icons-vue";
import request from "@/utils/request";
import axios from "axios";
import dayjs from "dayjs";
import Hls from "hls.js";

defineOptions({
  name: "Dashboard",
  inheritAttrs: false,
});
const token = "51a15d83730941209cb68d6413340bc5";
const develop = process.env.NODE_ENV === "development";

const options = ref([
  {
    label: "管养单位",
    value: 1,
  },
  {
    label: "路段名称",
    value: 2,
  },
]);
const user = reactive<any>(window.$wujie?.props.roleInfo?.user || {});
const isCompany = ref<boolean>(
  //不属于视频枢纽部门或者fullName不等于全省
  develop ? false : user.deptId !== "10010109" || user.fullName !== "全省"
);
const isExport = ref(true);
const loading = ref(false);
const dialogLoading = ref(false);
const ids = ref<string[]>([]);
const total = ref<number>(0);
const date = ref<any>([]);

const tableData = ref<any[]>([]);
const list = ref<any[]>([]);
const dialogVisible = ref<boolean>(false);
const dialogVisible2 = ref<boolean>(false);
const currentPage = ref<number>(1);
const format = "YYYY-MM-DD HH:mm:ss";
const queryParams = reactive<any>({
  page: 1,
  pageSize: 20,
  company: (user.fullName === "全省" ? "" : user.fullName) || "",
  installPlace: "",
  countType: 1,
  start: "",
  end: "",
  threshold: 0, //设为0,查全部
});

const threshold = ref<number>(100);
const time = ref<number>(0); //时间区间
console.log(
  "window.$wujie?.props: ",
  window.$wujie?.props,
  queryParams.company?.length
);
const videoVisible = ref(false);
const left = ref<any>(null);
const top = ref<any>(null);
let dragging = false;
let startX = 0;
let startY = 0;
const modal = ref<HTMLElement | null>(null);
const video = ref<HTMLElement | null>(null);
const videoTitle = ref<string>("");
const startDrag = (event: MouseEvent) => {
  dragging = true;
  startX = event.clientX - modal.value!.getBoundingClientRect().left - 300;
  startY = event.clientY - modal.value!.getBoundingClientRect().top - 218;
  window.addEventListener("mousemove", drag);
  // document.body.style.cursor = 'move';
};
const stopDrag = () => {
  dragging = false;
  window.removeEventListener("mousemove", drag);
  // document.body.style.cursor = 'auto';
};
const drag = (event: MouseEvent) => {
  if (dragging) {
    left.value = event.clientX - startX;
    top.value = event.clientY - startY;
  }
};
//点击播放
let hls: any;
const playVideo = async (row: {
  camera_index_code: string;
  camera_name: string;
}) => {
  videoVisible.value = true;
  videoTitle.value = row.camera_name;
  nextTick(() => {
    if (modal.value) {
      modal.value.addEventListener("mousedown", startDrag);
      window.addEventListener("mouseup", stopDrag);
    }
  });
  const res: any = await request.post(
    `/vhcioiset/videoPointUrl?token=${token}`,
    {
      cameraIndexCodes: [row.camera_index_code],
      streamType: "1",
    }
  );
  hls?.stopLoad();
  if (!res.data[0].hlsUrl) {
    ElMessage.error("没有找到视频");
  }
  initializePlayer(res.data[0].hlsUrl);
};
let firstdate = <any>[];
const disableddate = (date: any) => {
  const minTime = dayjs(firstdate).subtract(29, "day").valueOf();
  const maxTime = dayjs(firstdate).add(29, "day").valueOf();
  return dayjs(date).valueOf() < minTime || dayjs(date).valueOf() > maxTime;
};

watchEffect(() => {
  console.log("date发生变化:", date.value);
});
// 监听时间区间
watch(
  time,
  (newValue) => {
    isExport.value = true;
    if (newValue == 0) {
      //实时
      queryParams.start = dayjs().startOf("day").format(format);
      queryParams.end = dayjs().format(format);
    }
    if (newValue == 1) {
      //昨日
      queryParams.start = dayjs()
        .subtract(1, "day")
        .startOf("day")
        .format(format);
      queryParams.end = dayjs().subtract(1, "day").endOf("day").format(format);
    }
    if (newValue == 7) {
      //近七天
      queryParams.start = dayjs()
        .subtract(7, "day")
        .startOf("day")
        .format(format);
      queryParams.end = dayjs().subtract(1, "day").endOf("day").format(format);
      isExport.value = false;
    }
    if (newValue == 30) {
      //近一月
      queryParams.start = dayjs()
        .subtract(30, "day")
        .startOf("day")
        .format(format);
      queryParams.end = dayjs().subtract(1, "day").endOf("day").format(format);
      isExport.value = false;
    }
    if (newValue == 4) return (tableData.value = []);
    // ids.value=[]
    // queryParams.company=user.fullName

    queryParams.page = 1;
    handleQuery();
  },
  { immediate: true }
);
//自定义时间提交
function timeSubmit() {
  if (!date.value || date.value?.length == 0)
    return ElMessage.warning("请选择查询日期");
  queryParams.start = dayjs(date.value[0]).startOf("day").format(format);
  queryParams.end = dayjs(date.value[1]).endOf("day").format(format);
  handleQuery();
  dialogVisible2.value = false;
}
let allNum: any;
/** 查询 */
async function handleQuery() {
  loading.value = true;
  //列表接口
  const res: any = await request
    .post(`/vhcioiset/videoPointHisList?token=${token}`, {
      ...queryParams,
      onFlag: time.value == 0 ? "on" : "off",
    })
    .catch(() => {
      tableData.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
  //合计接口
  allNum = await request.post(`/vhcioiset/videoPointSumList?token=${token}`, {
    ...queryParams,
    onFlag: time.value == 0 ? "on" : "off",
  });
  // console.log(res.responseData,allNum);
  if (res.code != 200) return ElMessage.error(res.msg);
  tableData.value = res.responseData;
  total.value = Number(res.totalCount);
}

function onChange() {
  queryParams.page = 1;
  queryParams.pageSize = 20;
  handleQuery();
}
function currentPageChange(val: number) {
  currentPage.value = val;
}

//列表合计
function getSummaries(param: any) {
  const { columns, data } = param;
  const sums: string[] = [];
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = "合计";
    }
    if (index === 1) {
      sums[index] = "";
    }
    if (index === 3) {
      sums[index] = allNum?.collect_num || "-";
    }
    if (index === 4) {
      sums[index] = allNum?.online_num || "-";
    }
    if (index === 5) {
      sums[index] = allNum?.outline_num || "-";
    }
    if (index === 6) {
      sums[index] = allNum?.online_rate || "-";
    }
  });
  return sums;
}
//详情弹框
async function openDialog(row: any) {
  dialogLoading.value = true;
  // list.value=[]
  const params = { ...queryParams };
  if (params.countType == 1) {
    params.company = row.road_sec;
  } else {
    params.company = row.road_sec;
    params.installPlace = row.install_place;
  }
  delete params.page;
  delete params.pageSize;
  dialogVisible.value = true;
  const res: any = await request
    .post(`/vhcioiset/videoPointDtList?token=${token}`, {
      ...params,
      onFlag: time.value == 0 ? "on" : "off",
    })
    .finally(() => {
      dialogLoading.value = false;
    });
  if (res.code != 200) return ElMessage.error("查询失败");
  list.value = res.responseData;
}

/** 关闭表单弹窗 */
function closeDialog() {
  dialogVisible.value = false;
  dialogVisible2.value = false;
  videoVisible.value = false;
  currentPage.value = 1;
  hls?.stopLoad();
}
function handleSizeChange(val: number) {
  queryParams.pageSize = val;
  handleQuery();
}

function handleCurrentChange(val: number) {
  queryParams.page = val;
  handleQuery();
}

function getRandom(min: number, max: number) {
  //根据最小值和最大值产生一个随机数
  return Math.round(Math.random() * (max - min) + min);
}

/** 行checkbox 选中事件 */
function handleSelectionChange(selection: any) {
  if (queryParams.countType == 1) {
    //管养单位
    ids.value = selection.map((item: any) => item.road_sec);
  } else {
    //路段名称
    ids.value = selection.map((item: any) => item);
  }
}
const fileDown = reactive<any>({
  loadDialogStatus: false, //弹出框控制的状态
  percentage: 0, //进度条的百分比
  source: {}, //取消下载时的资源对象
});
let source: any;
async function handleExport() {
  // if (ids.value.length < 1) return ElMessage.warning("请至少选项一项导出");
  const result = await ElMessageBox.confirm("确定要导出吗?", "提示", {
    type: "warning",
  }).catch((e) => e);
  if (result !== "confirm") return;
  source = axios.CancelToken.source();
  //这里放参数
  fileDown.loadDialogStatus = true;
  fileDown.percentage = 0;
  let culPer = window.setInterval(
    () => {
      let per = fileDown.percentage;
      console.log("当前下载进度：" + per);
      if (per > 89) {
        fileDown.percentage = 99;
        return;
      }
      let addNum = getRandom(0, 10);
      fileDown.percentage = per + addNum;
    },
    ids.value.length > 50 ? 1000 : 500
  );
  var params = { ...queryParams };
  //清空防止查询项干扰
  params.company = "";
  params.installPlace = "";
  //不同统计依据的处理
  if (params.countType == 1) {
    //管养单位
    params.company = ids.value;
  } else {
    //路段名称
    params.company = ids.value.map((item: any) => item.road_sec);
    params.installPlace = ids.value.map((item: any) => item.install_place);
  }
  request({
    method: "post",
    url: `/vhcioiset/getVideoPointExcel?token=${token}`,
    data: { ...params, onFlag: time.value == 0 ? "on" : "off" },
    responseType: "blob",
    cancelToken: source.token,
    timeout: 120000,
  })
    .then((res: any) => {
      console.log(res);
      const content = res.data;
      if (content?.size == 0) {
        return ElMessage.error("下载失败");
      }
      const blob = new Blob([res]);
      const fileName = "视频在线率统计.xlsx"; //替换文件名
      window.clearInterval(culPer); //去掉定时器
      fileDown.loadDialogStatus = false; //关闭弹窗
      if ("download" in document.createElement("a")) {
        const elink = document.createElement("a");
        elink.download = fileName;
        elink.style.display = "none";
        elink.href = URL.createObjectURL(blob);
        document.body.appendChild(elink);
        elink.click();
        setTimeout(function () {
          URL.revokeObjectURL(elink.href); // 释放URL 对象
          document.body.removeChild(elink);
        }, 100);
      }
    })
    .catch((error: any) => {
      // fileDown.loadDialogStatus = false;
      window.clearInterval(culPer); //去掉定时器
      fileDown.loadDialogStatus = false;
      if (axios.isCancel(error)) {
        ElMessage.info(error.message);
        fileDown.loadDialogStatus = false;
        // 请求被取消处理逻辑
      }
    });
}
async function logout() {
  // console.log(location);
  const result = await ElMessageBox.confirm("确定要退出登录吗?", "提示", {
    type: "warning",
  }).catch((e) => e);
  if (result !== "confirm") return;
  window.$wujie.props.logoutSilent(false).then(() => {
    window.$wujie.props.getWindow().location.href =
      location.origin +
      (develop ? "/out/#/login?pwd=1&appName=spzxl" : "/#/login?appName=spzxl");
  });
}
function initializePlayer(url: any) {
  // console.log(url);
  if (Hls.isSupported() && video.value) {
    try {
      const videoModal: any = video.value;
      hls = new Hls();
      hls.loadSource(url); // 替换成你的HLS流URL
      hls.attachMedia(videoModal);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoModal.muted = true;
        videoModal.play();
      });
    } catch (error) {
      console.log("error", error);
    }
  }
}
</script>

<style scoped lang="scss">
.video-modal {
  width: 600px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0px 0px 10px 0 rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  background-color: #fff;
  padding: 0 10px 10px;
  z-index: 99999;

  &:hover {
    cursor: move;
  }

  .video {
    width: 580px;
    height: 400px;

    video {
      width: 100%;
      height: 100%;
      object-fit: fill;
      cursor: pointer;

      /* 隐藏视频播放器进度条 */
      &::-webkit-media-controls-timeline {
        display: none;
      }

      &::-webkit-media-controls-current-time-display {
        display: none;
      }

      &::-webkit-media-controls-current-time-display {
        display: none;
      }

      &::-webkit-media-controls-time-remaining-display {
        display: none;
      }
    }
  }
}
</style>
