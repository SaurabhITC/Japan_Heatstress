var japan = ee.FeatureCollection('YOUR_JAPAN_BOUNDARY_ASSET').geometry();

var start = '2025-06-01';
var end   = '2025-09-01';

var era = ee.ImageCollection('ECMWF/ERA5_LAND/DAILY_AGGR')
  .filterDate(start, end)
  .select(['temperature_2m', 'dewpoint_temperature_2m']);

function addRH(img) {
  var tC  = img.select('temperature_2m').subtract(273.15);
  var tdC = img.select('dewpoint_temperature_2m').subtract(273.15);

  var esT  = tC.expression('6.112 * exp((17.67 * T) / (T + 243.5))', {T: tC});
  var esTd = tdC.expression('6.112 * exp((17.67 * Td) / (Td + 243.5))', {Td: tdC});

  var rh = esTd.divide(esT).multiply(100).clamp(0, 100).rename('RH_pct');
  return rh.copyProperties(img, ['system:time_start']);
}

var rhSummerMean = era.map(addRH).mean().clip(japan);

Export.image.toDrive({
  image: rhSummerMean,
  description: 'Japan_ERA5Land_RH_Mean_JJA2025_pct',
  fileNamePrefix: 'Japan_ERA5Land_RH_Mean_JJA2025_pct',
  folder: 'YOUR_DRIVE_FOLDER',
  region: japan,
  scale: 11132,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});