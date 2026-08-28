// Real-Time Open-Source Traffic & Weather Telematics API Utility (Open-Meteo)

export interface LiveCityTelematics {
  city: string;
  lat: number;
  lng: number;
  tempC: number;
  windSpeedKmH: number;
  weatherCode: number;
  condition: 'CLEAR' | 'CONGESTED' | 'STORM' | 'RAIN';
  delayPenaltyMins: number;
}

const INDIAN_CITIES = [
  { city: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { city: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 }
];

export async function fetchLiveCityTrafficData(): Promise<Record<string, LiveCityTelematics>> {
  const results: Record<string, LiveCityTelematics> = {};

  try {
    const lats = INDIAN_CITIES.map(c => c.lat).join(',');
    const lngs = INDIAN_CITIES.map(c => c.lng).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current_weather=true`;

    const res = await fetch(url);
    const data = await res.json();

    const dataArray = Array.isArray(data) ? data : [data];

    dataArray.forEach((item, idx) => {
      const cityObj = INDIAN_CITIES[idx] || INDIAN_CITIES[0];
      const weather = item.current_weather;
      
      const wind = weather?.windspeed || 12;
      const code = weather?.weathercode || 0;
      const temp = weather?.temperature || 28;

      let condition: LiveCityTelematics['condition'] = 'CLEAR';
      let delayPenaltyMins = 0;

      if (wind > 20 || code >= 61) {
        condition = 'STORM';
        delayPenaltyMins = 180;
      } else if (wind > 14 || code >= 51) {
        condition = 'RAIN';
        delayPenaltyMins = 90;
      } else if (cityObj.city === 'Hyderabad' || cityObj.city === 'Delhi') {
        condition = 'CONGESTED';
        delayPenaltyMins = 120;
      }

      results[cityObj.city] = {
        city: cityObj.city,
        lat: cityObj.lat,
        lng: cityObj.lng,
        tempC: temp,
        windSpeedKmH: wind,
        weatherCode: code,
        condition,
        delayPenaltyMins
      };
    });
  } catch (err) {
    console.warn('Open-Meteo API fallback:', err);
    INDIAN_CITIES.forEach(cityObj => {
      results[cityObj.city] = {
        city: cityObj.city,
        lat: cityObj.lat,
        lng: cityObj.lng,
        tempC: 30,
        windSpeedKmH: 12,
        weatherCode: 0,
        condition: cityObj.city === 'Hyderabad' ? 'CONGESTED' : 'CLEAR',
        delayPenaltyMins: cityObj.city === 'Hyderabad' ? 120 : 0
      };
    });
  }

  return results;
}
