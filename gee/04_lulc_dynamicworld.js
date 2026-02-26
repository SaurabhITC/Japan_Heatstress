var japan = ee.FeatureCollection('YOUR_JAPAN_BOUNDARY_ASSET').geometry();
var region = japan.simplify(100);

var start = '2025-06-01';
var end   = '2025-09-01';

var dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
  .filterDate(start, end)
  .filterBounds(japan)
  .select('label');

var lulc_dw = dw.reduce(ee.Reducer.mode()).rename('dw_label').clip(japan);

var lulc6 = ee.Image(6)
  .where(lulc_dw.eq(0), 1)
  .where(lulc_dw.eq(4), 2)
  .where(lulc_dw.eq(6), 3)
  .where(lulc_dw.eq(1).or(lulc_dw.eq(2)).or(lulc_dw.eq(3)), 4)
  .where(lulc_dw.eq(7), 5)
  .rename('lulc_6')
  .toUint8()
  .clip(japan);

Export.image.toDrive({
  image: lulc6,
  description: 'Japan_LULC_6class_DW_Mode_JJA2025_100m',
  fileNamePrefix: 'Japan_LULC_6class_DW_Mode_JJA2025_100m',
  folder: 'YOUR_DRIVE_FOLDER',
  region: region,
  scale: 100,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});