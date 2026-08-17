const maroon = '#7B1113';
const maroonLight = 'rgba(123, 17, 19, 0.15)';
const white = '#FFFFFF';
const yellow = '#fabe25';

const dataEl = document.getElementById('analytics-data');
const searchLabels = JSON.parse(dataEl.getAttribute('data-search-labels'));
const searchCounts = JSON.parse(dataEl.getAttribute('data-search-counts'));
const downloadLabels = JSON.parse(dataEl.getAttribute('data-download-labels'));
const downloadCounts = JSON.parse(dataEl.getAttribute('data-download-counts'));

new Chart(document.getElementById('searchTermsChart'), {
    type: 'bar',
    data: {
        labels: searchLabels,
        datasets: [{
            label: 'Search Count',
            data: searchCounts,
            backgroundColor: maroonLight,
            borderColor: maroon,
            borderWidth: 2,
            borderRadius: 4
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
});

new Chart(document.getElementById('downloadsChart'), {
    exportEnabled: true,
	animationEnabled: true,
    type: 'doughnut',
    data: {
        labels: downloadLabels,
        showInLegend: true,
		toolTipContent: 'downloadLabels',
		indexLabel: downloadLabels,
        datasets: [{
            label: 'Downloads',
            data: downloadCounts,
            // backgroundColor: yellow,
            // borderColor: white,
            borderWidth: 10,
            borderRadius: 4,
            dataPoints: [
			{ y: downloadCounts, name: "downloadLabels", exploded: true },]}]
    },
    options: {
        responsive: true,
        plugins: { legend: { cursor: "pointer", itemclick: explodePie } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
});

function explodePie (e) {
	if(typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === "undefined" || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
		e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
	} else {
		e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
	}
	e.chart.render();
}