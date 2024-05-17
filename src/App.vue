<template>
  <div class="app-main">
    <div class="app-container">
      <h4 class="pb-1 pl-1 flex justify-between items-center">
        <el-text  truncated> 视频在线率统计 </el-text>
        <el-button link type="primary" @click="logout"
          >
          <el-icon>
            <SwitchButton />
           </el-icon
          >退出登录</el-button
        >
      </h4>
      <div class="search-container">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item prop="keywords" label="路公司名称">
            <el-input
              v-model="queryParams.company"
              :style="{width:120 + (queryParams.company?.length||0) * 10+'px'}"
              placeholder="路公司名称"
              clearable
              :disabled="isCompany"
            />
          </el-form-item>
          <el-form-item prop="keywords" label="路段名称">
            <el-input
              v-model="queryParams.installPlace"
              class="w-[200px]"
              placeholder="路段名称"
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
              @change="() => handleQuery()"
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
            :label="time !== 7 && time !== 30 ? '实时在线率' : '平均在线率'"
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
        width="65%"
        @close="closeDialog"
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
          <el-table-column prop="camera_index_code" label="ID" />
          <el-table-column prop="server_index_code" label="网关编号" />
          <el-table-column prop="online_status" label="在线状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.online_status === '在线'" type="success"
                >在线</el-tag
              >
              <el-tag v-else type="info">离线</el-tag>
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
        <template #footer>
          <!-- <div class="dialog-footer">
            <el-button @click="closeDialog" type="danger">关 闭</el-button>
          </div> -->
        </template>
      </el-dialog>
      <!-- 自定义弹框 -->
      <el-dialog
        v-model="dialogVisible2"
        title="自定义日期"
        width="450px"
        @close="closeDialog"
      >
        <el-date-picker
          v-model="date"
          type="date"
          placeholder="请选日期"
          value-format="YYYY-MM-DD"
        />
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { Search, Download } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";
import axios from "axios";
import dayjs from "dayjs";

defineOptions({
  name: "Dashboard",
  inheritAttrs: false,
});
const token = "51a15d83730941209cb68d6413340bc5";

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
const userName = ref<any>(window.$wujie?.props.roleInfo?.user.userName || "");
const isCompany = ref<boolean>(
  userName.value?.slice(-2) === "公司" && userName.value !== "全省"
);
const loading = ref(false);
const dialogLoading = ref(false);
const ids = ref<string[]>([]);
const total = ref<number>(0);
const date = ref<any>("");
const tableData = ref<any[]>([]);
const list = ref<any[]>([]);
const dialogVisible = ref<boolean>(false);
const dialogVisible2 = ref<boolean>(false);
const currentPage = ref<number>(1);
const format = "YYYY-MM-DD HH:mm:ss";
const queryParams = reactive<any>({
  page: 1,
  pageSize: 20,
  company: userName.value === "全省" ? "" : userName.value,
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
// 监听时间区间
watch(
  time,
  (newValue) => {
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
      queryParams.end = dayjs()
      .subtract(1, "day")
      .endOf("day")
      .format(format);
    }
    if (newValue == 7) {
      //近七天
      queryParams.start = dayjs()
        .subtract(7, "day")
        .startOf("day")
        .format(format);
      queryParams.end = dayjs()
      .subtract(1, "day")
      .endOf("day")
      .format(format);
    }
    if (newValue == 30) {
      //近一月
      queryParams.start = dayjs()
        .subtract(30, "day")
        .startOf("day")
        .format(format);
      queryParams.end = dayjs()
      .subtract(1, "day")
      .endOf("day")
      .format(format);
    }
    if (newValue == 4) return (tableData.value = []);
    // ids.value=[]
    // queryParams.company=userName.value
    // isCompany.value=userName.value&&userName.value.slice(-2) === '公司'

    queryParams.page = 1;
    handleQuery();
  },
  { immediate: true }
);
let allNum: any;
/** 查询 */
async function handleQuery() {
  loading.value = true;
  // console.log(time.value);
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

function currentPageChange(val: number) {
  currentPage.value = val;
}
/** 行checkbox 选中事件 */
function handleSelectionChange(selection: any) {
  if (queryParams.countType == 1) {
    ids.value = selection.map((item: any) => item.road_sec);
  } else {
    ids.value = selection.map((item: any) => item.install_place);
  }
}
//列表合计
function getSummaries(param: any) {
  const { columns, data } = param;
  const sums: string[] = [];
  columns.forEach((column:any, index:number) => {
    if (index === 0) {
      sums[index] = "合计";
    }
    if (index === 1) {
      sums[index] = '';
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
async function openDialog(row:any) {
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

//自定义时间提交
function timeSubmit() {
  if (!date.value) return ElMessage.warning("请选择查询日期");
  queryParams.start = dayjs(date.value).startOf("day").format(format);
  queryParams.end = dayjs(date.value).endOf("day").format(format);
  handleQuery();
  dialogVisible2.value = false;
}

/** 关闭表单弹窗 */
function closeDialog() {
  dialogVisible.value = false;
  dialogVisible2.value = false;
  currentPage.value = 1;
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
  if (params.countType == 1) {
    params.company = ids.value;
  } else {
    params.installPlace = ids.value;
  }
  request({
    method: "post",
    url: `/vhcioiset/getVideoPointExcel?token=${token}`,
    data: { ...params, onFlag: time.value == 0 ? "on" : "off" },
    responseType: "blob",
    cancelToken: source.token,
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
      console.log(error);
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
      location.origin + (process.env.NODE_ENV === 'development'?'/out/#/login?pwd=1&appName=spzxl':'/#/login?appName=spzxl');
  })
}
</script>
