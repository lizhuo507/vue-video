import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { ElMessage, ElMessageBox } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
    baseURL:process.env.NODE_ENV === 'development' ? '/api2' : 'https://spsn.jtyst.zj.gov.cn:8001/api2',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // console.log(config.url);
    const accessToken = '51a15d83730941209cb68d6413340bc5'
    //window.$wujie?.props.token
    // if (accessToken) {
    //   config.headers.token = accessToken
    // }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
      // console.log(response)
      if (response.status == 200) {
          // ElMessage.success(msg)
          return response.data
      }
      // 响应数据为二进制流处理(Excel导出)
      if (response.data instanceof ArrayBuffer) {
          return response
      }
      return Promise.reject(new Error(response.data.msg || 'Error'))
  },
  (error: any) => {
    console.log('error', error)
    ElMessage.error({
      message: error.message,
    })
    return Promise.reject(error);
  }
);

// 导出 axios 实例
export default service;
