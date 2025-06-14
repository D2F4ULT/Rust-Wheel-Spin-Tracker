document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/frequency')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('histChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Array.from({length: 37}, (_, i) => i),
                    datasets: [{
                        label: 'Frequency',
                        data: data.frequencies,
                        backgroundColor: 'red'
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        });
});
