var japan = ee.FeatureCollection('YOUR_JAPAN_BOUNDARY_ASSET').geometry();
var region = japan.simplify(100);

var start = '2025-06-01';
var end   = '2025-09-01';

var s2sr = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
var s2cp = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');

var joined = ee.Join.saveFirst('cloudProbImg').apply({
  primary: s2sr.filterDate(start, end).filterBounds(japan).filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 80)),
  secondary: s2cp.filterDate(start, end).filterBounds(japan),
  condition: ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})
});

function maskS2(img) {
  var cp = ee.Image(img.get('cloudProbImg'));
  var cloudProb = ee.Image(ee.Algorithms.If(cp, cp.select('probability'), ee.Image.constant(0)));
  var cloudMask = cloudProb.lt(40);

  var scl = img.select('SCL');
  var sclMask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10)).and(scl.neq(11));

  var qa = img.select('QA60');
  var qaMask = qa.bitwiseAnd(1 << 10).eq(0).and(qa.bitwiseAnd(1 << 11).eq(0));

  return img.updateMask(cloudMask).updateMask(sclMask).updateMask(qaMask).divide(10000).copyProperties(img, ['system:time_start']);
}

var summer = ee.ImageCollection(joined).map(maskS2);

var ndvi = summer.map(function(img){
  return img.normalizedDifference(['B8', 'B4']).rename('NDVI').copyProperties(img, ['system:time_start']);
}).median().clip(japan);

var mndwi = summer.map(function(img){
  return img.normalizedDifference(['B3', 'B11']).rename('MNDWI').copyProperties(img, ['system:time_start']);
}).median().clip(japan);

Export.image.toDrive({
  image: ndvi,
  description: 'Japan_S2_NDVI_Median_JJA2025_100m',
  fileNamePrefix: 'Japan_S2_NDVI_Median_JJA2025_100m',
  folder: 'YOUR_DRIVE_FOLDER',
  region: region,
  scale: 100,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: mndwi,
  description: 'Japan_S2_MNDWI_Median_JJA2025_100m',
  fileNamePrefix: 'Japan_S2_MNDWI_Median_JJA2025_100m',
  folder: 'YOUR_DRIVE_FOLDER',
  region: region,
  scale: 100,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});