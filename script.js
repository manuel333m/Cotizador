document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cotizador-form');
    const monedaSelect = document.getElementById('moneda');
    const criptomonedaSelect = document.getElementById('criptomoneda');
    const cantidadInput = document.getElementById('cantidad');
    const resultadoArea = document.getElementById('resultado-area');

    const monedasFiat = [
        { codigo: 'USD', nombre: 'Dólar Estadounidense' },
        { codigo: 'EUR', nombre: 'Euros' },
        { codigo: '$', nombre: 'Pesos Argentinos' },
        { codigo: 'VES', nombre: 'Bolívares' } // Moneda local de Venezuela
    ];

    // Lista de criptomonedas populares (códigos deben coincidir con la API de CryptoCompare)
    const criptomonedas = [
        { codigo: 'BTC', nombre: 'Bitcoin' },
        { codigo: 'ETH', nombre: 'Ethereum' },
        { codigo: 'USDT', nombre: 'Tether' },
        { codigo: 'BNB', nombre: 'BNB' },
        { codigo: 'SOL', nombre: 'Solana' },
        { codigo: 'XRP', nombre: 'XRP' },
        { codigo: 'USDC', nombre: 'USD Coin' },
        { codigo: 'ADA', nombre: 'Cardano' },
        { codigo: 'DOGE', nombre: 'Dogecoin' },
        { codigo: 'AVAX', nombre: 'Avalanche' }
    ];

    function popularSelect(selectElement, items) {
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.codigo;
            option.textContent = item.nombre;
            selectElement.appendChild(option);
        });
    }

    popularSelect(monedaSelect, monedasFiat);
    popularSelect(criptomonedaSelect, criptomonedas);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        resultadoArea.innerHTML = '<div class="spinner"></div>'; // Mostrar spinner

        const monedaSeleccionada = monedaSelect.value;
        const criptoSeleccionada = criptomonedaSelect.value;
        const cantidad = parseFloat(cantidadInput.value);

        if (!monedaSeleccionada || !criptoSeleccionada) {
            mostrarError('Por favor, selecciona ambas monedas.');
            return;
        }
        if (isNaN(cantidad) || cantidad <= 0) {
            mostrarError('Por favor, ingresa una cantidad válida y mayor a cero.');
            cantidadInput.focus();
            return;
        }

        try {
            const apiUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${criptoSeleccionada}&tsyms=${monedaSeleccionada}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Error de red o API: ${response.statusText} (código: ${response.status})`);
            }
            const data = await response.json();

            if (data.Response === 'Error' || !data.DISPLAY || !data.DISPLAY[criptoSeleccionada] || !data.DISPLAY[criptoSeleccionada][monedaSeleccionada]) {
                console.error('Respuesta de API inesperada:', data);
                let apiErrorMessage = "No se pudo obtener la cotización. ";
                if (data.Message) {
                    apiErrorMessage += data.Message;
                } else {
                    apiErrorMessage += `La combinación ${criptoSeleccionada} a ${monedaSeleccionada} podría no estar disponible o hubo un problema con la respuesta.`;
                }
                mostrarError(apiErrorMessage);
                return;
            }

            const infoCriptoDisplay = data.DISPLAY[criptoSeleccionada][monedaSeleccionada];
            const infoCriptoRaw = data.RAW[criptoSeleccionada][monedaSeleccionada];

            const precioRaw = infoCriptoRaw.PRICE;
            const total = (precioRaw * cantidad);

            // Formatear el total a un número apropiado de decimales
            // Para la mayoría de las monedas fiat, 2 decimales es común.
            // Para criptomonedas o valores muy pequeños, podrías necesitar más.
            const decimalesTotal = (monedaSeleccionada === 'JPY') ? 0 : 2; // JPY no suele usar decimales
            const totalFormateado = total.toLocaleString(undefined, {
                minimumFractionDigits: decimalesTotal,
                maximumFractionDigits: monedaSeleccionada === 'BTC' || monedaSeleccionada === 'ETH' ? 8 : decimalesTotal // Más decimales si el total es en cripto
            });


            mostrarResultado(infoCriptoDisplay, monedaSeleccionada, cantidad, totalFormateado, criptoSeleccionada);

        } catch (error) {
            console.error('Error al obtener cotización:', error);
            mostrarError(`Ocurrió un error: ${error.message}. Intenta de nuevo más tarde.`);
        }
    });

    function mostrarResultado(dataDisplay, monedaFiat, cantidad, total, criptoCodigo) {
        const nombreCripto = criptomonedas.find(c => c.codigo === criptoCodigo)?.nombre || criptoCodigo;

        const html = `
            <h3>Resultado para ${nombreCripto} en ${monedaFiat}:</h3>
            <p>Precio: <strong>${dataDisplay.PRICE}</strong></p>
            <p>Precio más alto del día: <strong>${dataDisplay.HIGH24HOUR}</strong></p>
            <p>Precio más bajo del día: <strong>${dataDisplay.LOW24HOUR}</strong></p>
            <p>Variación últimas 24 horas: <strong>${dataDisplay.CHANGEPCT24HOUR}%</strong></p>
            <p>Última Actualización: <strong>${dataDisplay.LASTUPDATE}</strong></p>
            <hr>
            <p>Comprar <strong>${cantidad.toLocaleString()} ${nombreCripto} (${criptoCodigo})</strong> costaría:</p>
            <p style="font-size: 1.2em; font-weight: bold;">${total} ${monedaFiat}</p>
        `;
        resultadoArea.innerHTML = html;
    }

    function mostrarError(mensaje) {
        resultadoArea.innerHTML = `<p class="error">${mensaje}</p>`;
    }
});