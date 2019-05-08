function printResult(stats) {
  if (stats.toJson) {
    stats = stats.toJson();
  }

  (stats.errors || []).forEach(err => {
    console.error('error', err);
  });

  stats.assets.forEach(item => {
    const size = `${(item.size / 1024.0).toFixed(2)}kB`;
    console.log('generated', item.name, size);
  });
}

module.exports = {
  printResult,
};