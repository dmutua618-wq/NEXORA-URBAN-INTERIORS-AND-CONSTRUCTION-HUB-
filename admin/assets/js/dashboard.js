/* admin/assets/js/dashboard.js */
NexoraAdmin.onComponentsReady(async ()=>{
    console.log('dashboard.js initialized');

    const chartEl = document.getElementById('dashboardChart');
    const actionButtons = document.querySelectorAll('.quick-actions .action-grid button');
    const stats = document.querySelectorAll('.statistics .stat-card h2');
    const routes = [
        '../pages/projects.html',
        '../pages/services.html',
        '../pages/gallery.html',
        '../pages/blog.html'
    ];

    actionButtons.forEach((button, index) => {
        const route = routes[index];
        if(!route) return;
        button.addEventListener('click', () => {
            window.location.href = route;
        });
    });

    function drawDashboardChart(data){
        if(!chartEl || !chartEl.getContext) return;
        const ctx = chartEl.getContext('2d');
        const width = chartEl.clientWidth || 640;
        const height = 300;
        chartEl.width = width * window.devicePixelRatio;
        chartEl.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.clearRect(0,0,width,height);
        const labels = Object.keys(data);
        const values = Object.values(data);
        const max = Math.max(...values, 1);
        const barWidth = (width - 80) / values.length;

        labels.forEach((label, index) => {
            const x = 50 + index * barWidth;
            const barHeight = (values[index] / max) * (height - 100);
            ctx.fillStyle = '#b8860b';
            ctx.fillRect(x, height - 60 - barHeight, barWidth * 0.7, barHeight);
            ctx.fillStyle = '#111';
            ctx.font = '14px Arial';
            ctx.fillText(values[index], x, height - 70 - barHeight);
            ctx.fillStyle = '#555';
            ctx.font = '12px Arial';
            ctx.fillText(label, x, height - 30);
        });
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(40, height - 60);
        ctx.lineTo(width - 20, height - 60);
        ctx.stroke();
    }

    async function loadDashboardSummary(){
        const fallback = { 'Total Projects': 0, 'Services': 0, 'Gallery Images': 0, 'Pending Quotations': 0 };
        try{
            const result = await NexoraAdmin.apiGet('/api/admin/dashboard-summary');
            const values = {
                'Total Projects': result.projects || fallback['Total Projects'],
                'Services': result.services || fallback['Services'],
                'Gallery Images': result.gallery || fallback['Gallery Images'],
                'Pending Quotations': result.quotations || fallback['Pending Quotations']
            };
            const summaryValues = Object.values(values);
            stats.forEach((stat, index) => {
                stat.textContent = summaryValues[index] ?? 0;
            });
            drawDashboardChart(values);
        }catch(err){
            stats.forEach((stat, index) => stat.textContent = Object.values(fallback)[index]);
            drawDashboardChart(fallback);
            console.warn('dashboard summary unavailable:', err);
        }
    }

    await loadDashboardSummary();
});
