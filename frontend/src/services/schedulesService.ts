import apiClient from './apiClient';
import type { Schedule, ScheduleListResponse, ScheduleCreate, ScheduleUpdate } from '../types/schedule';

export interface ListSchedulesParams {
  page?: number;
  limit?: number;
  vehicle_type_id?: string;
  vehicle_class?: string;
  is_active?: boolean;
}

export async function listSchedules(params?: ListSchedulesParams): Promise<ScheduleListResponse> {
  const response = await apiClient.get<ScheduleListResponse>('/schedules', {
    params: {
      page: params?.page,
      limit: params?.limit,
      vehicle_type_id: params?.vehicle_type_id,
      vehicle_class: params?.vehicle_class,
      is_active: params?.is_active,
    },
  });
  return response.data;
}

export async function createSchedule(body: ScheduleCreate): Promise<Schedule> {
  const response = await apiClient.post<Schedule>('/schedules', body);
  return response.data;
}

export async function getSchedule(scheduleId: string): Promise<Schedule> {
  const response = await apiClient.get<Schedule>(`/schedules/${scheduleId}`);
  return response.data;
}

export async function updateSchedule(scheduleId: string, body: ScheduleUpdate): Promise<Schedule> {
  const response = await apiClient.put<Schedule>(`/schedules/${scheduleId}`, body);
  return response.data;
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  await apiClient.delete(`/schedules/${scheduleId}`);
}
