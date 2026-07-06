const selOrigem = document.getElementById('moedaOrigem'), selDestino = document.getElementById('moedaDestino');
const valorInput = document.getElementById('valorInput'), display = document.getElementById('resultadoDisplay');
const loader = document.getElementById('loading'), maxDisplay = document.getElementById('maxVal'), minDisplay = document.getElementById('minVal');
const trendLabel = document.getElementById('trendLabel');
let chartInstance = null, diasAtuais = 15;

async function converter() {
    const val = parseFloat(valorInput.value);
    if (selOrigem.value === selDestino.value || !val || val < 0) { display.innerText = "0.00"; return; }
    try {
        const res = await fetch(`https://economia.awesomeapi.com.br/json/last/${selOrigem.value}-${selDestino.value}`);
        const data = await res.json();
        const chave = selOrigem.value + selDestino.value;
        if (data[chave]) display.innerText = (val * data[chave].bid).toFixed(2);
    } catch (e) { display.innerText = "0.00"; }
}
function toggleCustom() { const box = document.getElementById('customPeriod'); box.style.display = box.style.display === 'block' ? 'none' : 'block'; }
async function aplicarCustom() {
    const val = document.getElementById('customInput').value;
    if (val > 0) {
        diasAtuais = parseInt(val);
        document.querySelectorAll('.period-selector button').forEach(btn => btn.classList.remove('active'));
        toggleCustom();
        await atualizarGrafico();
    }
}
async function mudarPeriodo(dias) {
    diasAtuais = dias;
    document.querySelectorAll('.period-selector button').forEach(btn => btn.classList.toggle('active', parseInt(btn.innerText) === dias));
    await atualizarGrafico();
}
async function atualizarGrafico() {
    if (selOrigem.value === selDestino.value) return;
    loader.style.display = 'flex';
    try {
        const res = await fetch(`https://economia.awesomeapi.com.br/json/daily/${selOrigem.value}-${selDestino.value}/${diasAtuais}`);
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const bids = data.map(i => parseFloat(i.bid));
        maxDisplay.innerText = Math.max(...bids).toFixed(4);
        minDisplay.innerText = Math.min(...bids).toFixed(4);
        const variacao = ((bids[0] - bids[1]) / bids[1]) * 100;
        trendLabel.innerText = `${variacao >= 0 ? '▲' : '▼'} ${Math.abs(variacao).toFixed(2)}%`;
        trendLabel.className = variacao >= 0 ? 'alta' : 'baixa';
        const ctx = document.getElementById('meuGrafico').getContext('2d');
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(i => {
                    const ts = i.timestamp ? i.timestamp * 1000 : new Date(i.create_date.replace(/-/g, '/')).getTime();
                    const d = new Date(ts);
                    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                }).reverse(),
                datasets: [{ label: `Cotação ${diasAtuais} dias`, data: bids.reverse(), borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true, tension: 0.3 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } catch (e) { console.error("Erro gráfico"); } finally { loader.style.display = 'none'; }
}
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (valorInput.value) converter();
        atualizarGrafico();
    }, 500);
});