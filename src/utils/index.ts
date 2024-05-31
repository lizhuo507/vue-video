/**
 * 判断两个时间区间
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {number} - 返回天数差值
 */
import dayjs from "dayjs";
export function isMoreThanOneDay(startDate:Date, endDate:Date) {
  
  const start = dayjs(startDate);
  const end = dayjs(endDate);


  // 计算两个时间的差值（以小时为单位）
  const differenceInDays = end.diff(start, 'day');
  // 返回时间差值
  return differenceInDays+1
}