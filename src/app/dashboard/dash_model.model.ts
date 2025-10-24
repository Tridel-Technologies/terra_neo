export interface AwacDataModel {
    id?: number;
    file_id?: number;
    station_id?: string;
    type?: string;
  
    // Coordinates and Date
    lat?: string | number | null;
    lon?: string | number | null;
    coord_unit?: string;
    coord_unit_to?: string;
    date?: string; // ISO timestamp
  
    // Battery
    battery?: string | number | null;
    battery_unit?: string;
    battery_unit_to?: string;
  
    // Depth / Pressure / Water level
    depth_unit?: string;
    depth_unit_to?: string;
    pressure?: string | number | null;
    water_level_unit?: string;
    water_level_unit_to?: string;
    high_water_level?: string | number | null;
  
    // Orientation
    heading?: string | number | null;
    pitch?: string | number | null;
    roll?: string | number | null;
    temperature?: string | number | null;
  
    // Current units
    current_speed_unit?: string;
    current_speed_unit_to?: string;
    current_direction_unit?: string;
    current_direction_unit_to?: string;
  
    // Bin data (ADCP)
    bin_1_direction?: number;
    bin_1_speed?: number;
    bin_2_direction?: number;
    bin_2_speed?: number;
    bin_3_direction?: number;
    bin_3_speed?: number;
    bin_4_direction?: number;
    bin_4_speed?: number;
    bin_5_direction?: number;
    bin_5_speed?: number;
    bin_6_direction?: number;
    bin_6_speed?: number;
    bin_7_direction?: number;
    bin_7_speed?: number;
    bin_8_direction?: number;
    bin_8_speed?: number;
    bin_9_direction?: number;
    bin_9_speed?: number;
    bin_10_direction?: number;
    bin_10_speed?: number;
    bin_11_direction?: number;
    bin_11_speed?: number;
    bin_12_direction?: number;
    bin_12_speed?: number;
    bin_13_direction?: number;
    bin_13_speed?: number;
    bin_14_direction?: number;
    bin_14_speed?: number;
    bin_15_direction?: number;
    bin_15_speed?: number;
    bin_16_direction?: number;
    bin_16_speed?: number;
    bin_17_direction?: number;
    bin_17_speed?: number;
    bin_18_direction?: number;
    bin_18_speed?: number;
    bin_19_direction?: number;
    bin_19_speed?: number;
    bin_20_direction?: number;
    bin_20_speed?: number;
  
    // Units for coordinates and currents
    coordUnit?: string;
    coordUnitTo?: string;
    currentDirectionUnit?: string;
    currentDirectionUnitTo?: string;
    currentSpeedUnit?: string;
    currentSpeedUnitTo?: string;
  
    // Others
    highWaterLevel?: number;
    fileId?: number;
    pressureUnit?: string;
    stationId?: string;
  }
  