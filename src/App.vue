<template>
  <div class="app-main">
    <div class="app-container">
      <h4 class="pb-1 pl-1 flex justify-between items-center">
        <el-text truncated> 视频在线率统计 </el-text>
        <el-button link type="primary" @click="logout">
          <el-icon> <SwitchButton /> </el-icon>退出登录</el-button
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
            :label="queryParams.countType == 11 ? '管养单位' : '路段名称'"
          >
            <el-autocomplete
              v-model.trim="installPlace"
              :fetch-suggestions="querySearch"
              clearable
              :style="{
                width: 120 + (installPlace?.length || 0) * 10 + 'px',
              }"
              :value-key="queryParams.countType == 11 ? 'name' : 'nameValue'"
              class="inline-input w-50"
              :placeholder="
                queryParams.countType == 11 ? '管养单位' : '路段名称'
              "
              @select="handleSelect"
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
                :label="
                  showDate.length > 0 && time === 4
                    ? showDate[0] + ` ~ ` + showDate[1]
                    : '自定义'
                "
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
            v-if="queryParams.countType == 11"
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
            <template #header="{ row }">
              <div>
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="time==0? '每五分钟更新一次' :getDayCount(queryParams)==''?'6点至23:30，每半小时检测一次，在线则加30分钟。累计时长≥600分钟，视为全天在线。':'多天在线率相加/对应天数'"
                  placement="top-start"
                >
                  <el-text>
                    <el-icon class="tips"><InfoFilled /></el-icon>
                    {{ time === 0 ? "实时在线率" : "平均在线率" }}
                  </el-text>
                </el-tooltip>
              </div>
            </template>
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
            v-if="getDayCount(queryParams)==''"
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
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        @close="closeDialog"
      >
        <el-date-picker
          style="width: 100%"
          v-model="date"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @calendar-change="(val: Date) => firstdate = val"
          :disabled-date="disabledDate"
          placeholder="选择日期范围"
        >
        </el-date-picker>
        <div class="mt-[20px]">
          <el-text class="text-red-500 text-[12px]">
            温馨提示：<br />
            自定义时间区间为1天时，可查询导出明细，<br />
            自定义时间区间大于1天时，不支持查询导出明细。
          </el-text>
        </div>
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
import { Search, Download, InfoFilled } from "@element-plus/icons-vue";
import request from "@/utils/request";
import axios from "axios";
import dayjs from "dayjs";
import Hls from "hls.js";
import { isMoreThanOneDay } from "@/utils";
defineOptions({
  name: "Dashboard",
  inheritAttrs: false,
});
const token = "51a15d83730941209cb68d6413340bc5";
const develop = process.env.NODE_ENV === "development";

const options = ref([
  {
    label: "管养单位",
    value: 11,
  },
  {
    label: "路段名称",
    value: 22,
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
  countType: 11,
  start: "",
  end: "",
  threshold: 0, //设为0,查全部
});

const installPlace = ref<string>(""); //搜索后赋值给queryParams.installPlace

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
let queryList: any = [];
const querySearch = async (queryString: string, cb: any): Promise<any> => {
  console.log(queryString);
  let res: any = await request.post(`/vhcioiset/videoGetName?token=${token}`, {
    name: queryString,
    countType: queryParams.countType,
  });
  if (queryParams.countType == 22) queryList = res;
  cb(res);
};
const handleSelect = (item: any) => {
  console.log(item);
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
  videoRequest(row);
};
const videoRequest = async (row: any): Promise<any> => {
  const res: any = await request.post(
    `/vhcioiset/videoPointUrl?token=${token}`,
    {
      cameraIndexCodes: [row.camera_index_code],
      streamType: "1",
    }
  );
  if (!res) return videoRequest(row);
  hls?.stopLoad();
  if (!res.data[0].hlsUrl) {
    ElMessage.error("没有找到视频");
  }
  initializePlayer(res.data[0].hlsUrl);
};

//禁用时间
let firstdate = <any>[];
const disabledDate = (date: any) => {
  const minTime = dayjs(firstdate).subtract(29, "day").valueOf();
  const maxTime = dayjs(firstdate).add(29, "day").valueOf();
  const disabledTime = dayjs(date).valueOf();
  const yesterday = dayjs().subtract(1, "day").valueOf();
  return (
    disabledTime < minTime || disabledTime > maxTime || disabledTime > yesterday
  );
};

watchEffect(() => {
  console.log("date发生变化:", date.value);
});
const showDate = ref<any[]>([]);

// 监听时间区间
watch(
  time,
  (newValue, oldValue) => {
    isExport.value = true;
    showDate.value = [];
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
      // isExport.value = false;
    }
    if (newValue == 30) {
      //近一月
      queryParams.start = dayjs()
        .subtract(30, "day")
        .startOf("day")
        .format(format);
      queryParams.end = dayjs().subtract(1, "day").endOf("day").format(format);
      // isExport.value = false;
    }
    if (newValue == 4) {
      // tableData.value = []
      date.value = [];
      return;
    }

    queryParams.page = 1;
    handleQuery();
  },
  { immediate: true }
);

//自定义时间提交
function timeSubmit() {
  if (!date.value || date.value?.length == 0)
    return ElMessage.warning("请选择查询日期");
  showDate.value = date.value;
  queryParams.start = dayjs(date.value[0]).startOf("day").format(format);
  queryParams.end = dayjs(date.value[1]).endOf("day").format(format);
  handleQuery();
  dialogVisible2.value = false;
}

/** 查询 */
let allNum: any;
async function handleQuery() {
  loading.value = true;
  //列表接口
  if (queryParams.countType == 22) {
    queryParams.installPlace =
      queryList.find((e: any) => e.nameValue === installPlace.value)?.name ||
      installPlace.value;
  } else {
    queryParams.installPlace = installPlace.value;
  }
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
  installPlace.value = "";
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
    if (index === 3) {
      sums[index] = String(allNum?.collect_num) || "-";
    }
    if (index === 4) {
      sums[index] = String(allNum?.online_num) || "-";
    }
    if (index === 5) {
      sums[index] = String(allNum?.outline_num) || "-";
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
  if (params.countType == 11) {
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
  dialogVisible.value = false; //详情
  dialogVisible2.value = false; //自定义
  videoVisible.value = false; //视频播放
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
  if (queryParams.countType == 11) {
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
      if (per > 79) {
        fileDown.percentage = 99;
        return;
      }
      let addNum = getRandom(0, 20);
      fileDown.percentage = per + addNum;
    },
    ids.value.length > 50 ? 500 : 100
  );
  var params = { ...queryParams };
  //清空防止查询项干扰
  params.company = "";
  params.installPlace = "";
  //不同统计依据的处理
  if (params.countType == 11) {
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
    data: {
      ...params,
      onFlag: time.value == 0 ? "on" : "off",
      twoRate: getDayCount(params),
    },
    responseType: "blob",
    cancelToken: source.token,
    // timeout: 1000,
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
        // ElMessage.info(error.message);
        // fileDown.loadDialogStatus = false;
        // 请求被取消处理逻辑
      }
    });
}
function getDayCount(params: any) {
  const time = isMoreThanOneDay(params.start, params.end);
  console.log(time + "天");
  if (time === 1) {
    return "";
  }else if (time === 2) {
    return "two";
  } else {
    return "on";
  }
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
      hls.loadSource(convertToHttps(url)); // 替换成你的HLS流URL
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
function convertToHttps(url: string) {
  // 如果 URL 以 "http://" 开头，则替换为 "https://"
  if (url.startsWith("http://")) {
    return "https://" + url.slice(7);
  }
  // 如果 URL 以其他协议开头或已经是 HTTPS，则直接返回原始 URL
  return url;
}
</script>

<style scoped lang="scss">
.tips {
  color: var(--el-color-primary);
  margin-top: 4px !important;
}
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
