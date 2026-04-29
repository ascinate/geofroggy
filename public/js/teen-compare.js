document.addEventListener('DOMContentLoaded', () => {
    initSparklines();
    initMainChart();
    initBarChart();
});

function initSparklines() {
    const sparklineData = [
        [22, 23, 24, 25, 26, 26.6],
        [180, 190, 200, 205, 210, 216.4],
        [128, 127, 126, 125.5, 125, 124.6],
        [35, 38, 42, 46, 50, 54.1]
    ];

    const colors = ['#22c55e', '#22c55e', '#ef4444', '#22c55e'];

    sparklineData.forEach((data, index) => {
        const ctx = document.getElementById(`sparkline-${index + 1}`).getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => i),
                datasets: [{
                    data: data,
                    borderColor: colors[index],
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: `rgba(${index === 2 ? '239, 68, 68' : '34, 197, 94'}, 0.1)`,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    });
}

function initMainChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const years = [2000, 2004, 2008, 2012, 2016, 2020, 2024];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Australia',
                    data: [19, 20, 21, 23, 24, 25, 26.6],
                    borderColor: '#22c55e',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: '#22c55e'
                },
                {
                    label: 'Brazil',
                    data: [175, 185, 195, 202, 208, 212, 216.4],
                    borderColor: '#06b6d4',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: '#06b6d4'
                },
                {
                    label: 'Japan',
                    data: [126.8, 127.8, 128.1, 127.6, 127, 125.8, 124.6],
                    borderColor: '#f97316',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: '#f97316'
                },
                {
                    label: 'Kenya',
                    data: [31, 35, 40, 45, 49, 52, 54.1],
                    borderColor: '#a855f7',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: '#a855f7'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 20,
                        usePointStyle: true,
                        font: { family: 'Outfit', size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    usePointStyle: true
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { 
                        color: '#64748b', 
                        font: { family: 'Outfit' },
                        callback: (value) => value + 'M'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function initBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Australia', 'Brazil', 'Japan', 'Kenya'],
            datasets: [{
                data: [26.6, 216.4, 124.6, 54.1],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(6, 182, 212, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderRadius: 6,
                borderWidth: 0,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { 
                        color: '#64748b', 
                        font: { family: 'Outfit' },
                        callback: (value) => value + 'M'
                    }
                }
            }
        }
    });
}
