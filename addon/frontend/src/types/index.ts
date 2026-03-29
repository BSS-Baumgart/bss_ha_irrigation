export interface Zone {
  id: number
  name: string
  color: string
  description?: string
  duration_min: number
  sequence_order: number
  enabled: boolean
  valve_count: number
  is_watering: boolean
}

export interface Valve {
  id: number
  name: string
  entity_id: string
  zone_id?: number
  zone_name?: string
  enabled: boolean
  notes?: string
  ha_state?: 'on' | 'off' | 'unavailable' | string
}

export type SensorType = 'rain' | 'soil' | 'flow' | 'temperature' | 'weather'

export interface Sensor {
  id: number
  name: string
  entity_id: string
  sensor_type: SensorType
  threshold?: number
  enabled: boolean
  notes?: string
  ha_state?: string
  is_blocking: boolean
}

export type WateringMode = 'sequential' | 'parallel'

export interface Schedule {
  id: number
  zone_id: number
  zone_name?: string
  weekdays: number   // bitmask
  start_time: string // "HH:MM"
  duration_override_min?: number
  mode: WateringMode
  enabled: boolean
  skip_if_rain: boolean
  skip_if_soil_wet: boolean
  skip_if_frost: boolean
  next_run?: string
}

export type SkipReason = 'rain' | 'soil_wet' | 'frost' | 'manual_stop' | 'ha_unavailable'
export type TriggerSource = 'schedule' | 'manual'

export interface WateringLog {
  id: number
  zone_id?: number
  zone_name: string
  started_at: string
  ended_at?: string
  duration_sec?: number
  triggered_by: TriggerSource
  skipped: boolean
  skip_reason?: SkipReason
  water_liters?: number
}

export interface ActiveZone {
  zone_id: number
  zone_name: string
  started_at: string
  duration_min: number
  elapsed_sec: number
  remaining_sec: number
}

export interface IrrigationStatus {
  active_zones: ActiveZone[]
  any_watering: boolean
}

export interface HAEntity {
  entity_id: string
  friendly_name: string
  state: string
  domain: string
  unit?: string
  device_class?: string
}

export interface WeatherData {
  condition: string
  temperature?: number
  precipitation_probability: number
  rain_expected_24h: boolean
  forecast: WeatherForecastItem[]
}

export interface WeatherForecastItem {
  datetime: string
  condition: string
  temperature?: number
  precipitation_probability: number
}
