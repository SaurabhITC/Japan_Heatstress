var japan = ee.FeatureCollection('YOUR_JAPAN_BOUNDARY_ASSET').geometry();

var start = '2025-06-01';
var end   = '2025-09-01';

var terra = ee.ImageCollection('MODIS/061/MOD11A1');
var aqua  = ee.ImageCollection('MODIS/061/MYD11A1');

function maskFromQC(qc) {
  var mandatory = qc.bitwiseAnd(3);
  var dataQual  = qc.rightShift(2).bitwiseAnd(3);
  var lstErr    = qc.rightShift(6).bitwiseAnd(3);
  return mandatory.lte(1).and(dataQual.eq(0)).and(lstErr.lte(1));
}

function prepLST(img) {
  var dayMask   = maskFromQC(img.select('QC_Day'));
  var nightMask = maskFromQC(img.select('QC_Night'));

  var dayC = img.select('LST_Day_1km')
    .multiply(0.02).subtract(273.15)
    .updateMask(dayMask)
    .rename('LST_Day_C');

  var nightC = img.select('LST_Night_1km')
    .multiply(0.02).subtract(273.15)
    .updateMask(nightMask)
    .rename('LST_Night_C');

  return dayC.addBands(nightC).copyProperties(img, ['system:time_start']);
}

var lst = terra.merge(aqua).filterDate(start, end).map(prepLST);

var dayMedian   = lst.select('LST_Day_C').median().clip(japan);
var nightMedian = lst.select('LST_Night_C').median().clip(japan);

Export.image.toDrive({
  image: dayMedian,
  description: 'Japan_LST_Day_Median_JJA2025_C',
  fileNamePrefix: 'Japan_LST_Day_Median_JJA2025_C',
  folder: 'YOUR_DRIVE_FOLDER',
  region: japan,
  scale: 1000,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: nightMedian,
  description: 'Japan_LST_Night_Median_JJA2025_C',
  fileNamePrefix: 'Japan_LST_Night_Median_JJA2025_C',
  folder: 'YOUR_DRIVE_FOLDER',
  region: japan,
  scale: 1000,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});