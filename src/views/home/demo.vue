<template>
  <div class="bid-rule-management">
    <div class="page-header">
      <h2 class="text-xl font-bold">招标规则管理</h2>
      <div class="action-buttons">
        <el-button type="primary" @click="handleAddRule">新增规则</el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-area">
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        border
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="id" label="ID" width="50" />
        <el-table-column prop="title" label="标题" width="180" />
        <el-table-column prop="ruleName" label="规则名" show-overflow-tooltip />
        <el-table-column
          prop="checkPoint"
          label="检测点"
          width="250"
          show-overflow-tooltip
        />
        <el-table-column
          prop="ruleSource"
          label="依据"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column
          prop="checkLocation"
          label="位置"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column prop="enabled" label="状态" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.enabled"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container flex justify-end mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增规则' : '编辑规则'"
      width="800px"
      destroy-on-close
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="ruleForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="规则名" prop="ruleName">
          <el-input
            v-model="ruleForm.ruleName"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="请输入规则名"
          />
        </el-form-item>
        <el-form-item label="检测点" prop="checkPoint">
          <el-input
            v-model="ruleForm.checkPoint"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="请输入检测点"
          />
        </el-form-item>
        <el-form-item label="依据" prop="ruleSource">
          <el-input
            v-model="ruleForm.ruleSource"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入依据"
          />
        </el-form-item>
        <el-form-item label="位置" prop="checkLocation">
          <el-input
            v-model="ruleForm.checkLocation"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入位置"
          />
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-switch
            v-model="ruleForm.enabled"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
      destroy-on-close
    >
      <div class="confirm-content">
        <p>确定要删除规则 "{{ currentRule?.title }}" 吗？</p>
        <p class="text-red-500 text-sm mt-2">此操作不可逆，请谨慎操作！</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确定删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
const Request =ref()
const getAccessToken =ref()
// 表格数据
const tableData = ref([])
const tableLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 新增/编辑对话框
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' 或 'edit'
const ruleFormRef = ref(null)
const ruleForm = reactive({
  id: '',
  title: '',
  ruleName: '',
  checkPoint: '',
  ruleSource: '',
  checkLocation: '',
  enabled: 1,
})

// 删除对话框
const deleteDialogVisible = ref(false)
const currentRule = ref(null)

// 表单验证规则
const rules = reactive({
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  ruleName: [{ required: true, message: '请输入规则名', trigger: 'blur' }],
  checkPoint: [{ required: true, message: '请输入检测点', trigger: 'blur' }],
  ruleSource: [{ required: true, message: '请输入依据', trigger: 'blur' }],
  checkLocation: [{ required: true, message: '请输入位置', trigger: 'blur' }],
})

// 加载表格数据
const loadTableData = async () => {
  tableLoading.value = true

  try {
    // 构建查询参数
    const params = {
      token: getAccessToken(),
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    }

    // 调用列表接口
    const response = await Request.zhgztDocRulesListGet(params)
    // 直接使用 response.data，已在拦截器中处理过
    tableData.value = response.records || []
    total.value = response.total || 0
  } catch (error) {
    console.error('获取规则列表出错:', error)
    ElMessage.error('获取规则列表出错：' + (error.message || '未知错误'))
    tableData.value = []
    total.value = 0
  } finally {
    tableLoading.value = false
  }
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  loadTableData()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadTableData()
}

// 新增规则
const handleAddRule = () => {
  dialogType.value = 'add'
  Object.keys(ruleForm).forEach((key) => {
    ruleForm[key] = key === 'enabled' ? 1 : ''
  })
  dialogVisible.value = true
}

// 编辑规则
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.keys(ruleForm).forEach((key) => {
    ruleForm[key] = row[key]
  })
  dialogVisible.value = true
}

// 删除规则
const handleDelete = (row) => {
  currentRule.value = row
  deleteDialogVisible.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!currentRule.value || !currentRule.value.id) {
    ElMessage.warning('无效的规则ID')
    return
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: '删除中...',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  try {
    // 调用删除接口
    await Request.zhgztDocRulesDeleteGet({
      token: getAccessToken(),
      id: currentRule.value.id,
    })
    // 响应已在拦截器中处理过，直接显示成功消息
    ElMessage.success(`已删除规则: ${currentRule.value.ruleName}`)
    deleteDialogVisible.value = false
    // 重新加载数据
    loadTableData()
  } catch (error) {
    console.error('删除规则出错:', error)
    ElMessage.error('删除规则出错：' + (error.message || '未知错误'))
  } finally {
    loadingInstance.close()
  }
}

// 提交表单
const submitForm = async () => {
  if (!ruleFormRef.value) return

  await ruleFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      const loadingInstance = ElLoading.service({
        lock: true,
        text: dialogType.value === 'add' ? '保存中...' : '更新中...',
        background: 'rgba(0, 0, 0, 0.7)',
      })

      try {
        // 构建保存参数
        const params = {
          token: getAccessToken(),
          ...ruleForm,
        }

        // 调用保存接口
        await Request.zhgztDocRulesSavePost(params)
        // 响应已在拦截器中处理过，直接显示成功消息
        ElMessage.success(
          `${dialogType.value === 'add' ? '新增' : '编辑'}规则成功`,
        )
        dialogVisible.value = false
        // 重新加载数据
        loadTableData()
      } catch (error) {
        console.error(
          `${dialogType.value === 'add' ? '新增' : '编辑'}规则出错:`,
          error,
        )
        ElMessage.error(
          `${dialogType.value === 'add' ? '新增' : '编辑'}规则出错：` +
            (error.message || '未知错误'),
        )
      } finally {
        loadingInstance.close()
      }
    } else {
      console.log('验证失败', fields)
      ElMessage.warning('请完善表单信息')
    }
  })
}

// 状态变更
const handleStatusChange = async (row) => {
  try {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '更新状态中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })

    const params = {
      token: getAccessToken(),
      id: row.id,
      title: row.title,
      ruleName: row.ruleName,
      checkPoint: row.checkPoint,
      ruleSource: row.ruleSource,
      checkLocation: row.checkLocation,
      enabled: row.enabled,
    }

    // 调用保存接口更新状态
    await Request.zhgztDocRulesSavePost(params)
    // 响应已在拦截器中处理过，直接显示成功消息
    const status = row.enabled === 1 ? '启用' : '禁用'
    ElMessage.success(`已${status}规则: ${row.title}`)

    loadingInstance.close()
  } catch (error) {
    // 如果出错，回滚状态
    row.enabled = row.enabled === 1 ? 0 : 1
    console.error('更新状态出错:', error)
    ElMessage.error('更新状态出错：' + (error.message || '未知错误'))
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadTableData()
})
</script>

<style scoped>
.bid-rule-management {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-area {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
/* .el-table :deep(.el-table__cell) {
  text-align: center;
} */
.confirm-content {
  padding: 20px 0;
  text-align: center;
}

.pagination-container {
  margin-top: 20px;
}

/* 对话框内容样式优化 */
:deep(.el-dialog__body) {
  padding: 20px 30px;
}
</style>
