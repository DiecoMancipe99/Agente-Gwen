// ============================================
// AGENTE GWEN - GENERADOR DE PDFs
// ============================================
// Generador de facturas/órdenes de compra en PDF
// Identidad visual: Burgundy (#5e1c2e), Cream (#f4f3e9), Taupe (#c5b8aa)
// ============================================

// ===== CONFIGURACIÓN =====
const PDF_CONFIG = {
    colors: {
        burgundy: '#5e1c2e',
        cream: '#f4f3e9',
        taupe: '#c5b8aa',
        yellow: '#f9f7dc',
        black: '#1a1a1a'
    },
    fonts: {
        titles: 'Cormorant Garamond',
        body: 'Space Mono'
    },
    paymentData: {
        nequi: {
            titular: 'Diego Mancipe',
            telefono: '+57 302 439 0098'
        },
        bancolombia: {
            titular: 'Diego Mancipe',
            tipo: 'Cuenta de Ahorros',
            numero: '03600000714',
            celular: '302 439 0098',
            email: 'diegomancipe33@gmail.com'
        },
        paypal: {
            usuario: 'diegomancipe33@gmail.com'
        }
    }
};

// ===== DATOS DE LA EMPRESA =====
const COMPANY_INFO = {
    name: 'DIECO MANCIPE',
    title: 'Productor Musical & Ingeniero de Sonido',
    location: 'Bogotá, Colombia',
    email: 'diegomancipe33@gmail.com',
    phone: '+57 302 439 0098'
};

// ===== FUNCIÓN PRINCIPAL =====
async function generarPDF(datos, opciones = {}) {
    const {
        tipo = 'orden',
        moneda = 'COP',
        incluirIva = false,
        outputName = null
    } = opciones;

    console.log('[PDF] Generando PDF...', { datos, opciones });

    try {
        // Cargar jsPDF dinámicamente
        await loadJspdf();

        console.log('[PDF] jsPDF cargado, creando documento...');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'letter'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        let yPos = margin;

        // ===== HEADER =====
        console.log('[PDF] Dibujando header...');
        yPos = drawHeader(doc, pageWidth, margin, tipo, datos);

        // ===== INFORMACIÓN DEL CLIENTE =====
        console.log('[PDF] Dibujando info cliente...');
        yPos = drawClientInfo(doc, margin, contentWidth, yPos, datos);

        // ===== TABLA DE ITEMS =====
        console.log('[PDF] Dibujando tabla items...');
        yPos = drawItemsTable(doc, margin, contentWidth, yPos, datos.items, moneda);

        // ===== TOTALES =====
        console.log('[PDF] Dibujando totales...');
        yPos = drawTotals(doc, pageWidth, margin, contentWidth, yPos, datos, moneda, incluirIva);

        // ===== INFORMACIÓN DE PAGO =====
        console.log('[PDF] Dibujando info pago...');
        drawPaymentInfo(doc, margin, contentWidth, yPos + 10);

        // ===== FIRMAS =====
        console.log('[PDF] Dibujando firmas...');
        drawSignatures(doc, pageWidth, margin, contentWidth, pageHeight - 40);

        // ===== FOOTER =====
        console.log('[PDF] Dibujando footer...');
        drawFooter(doc, pageWidth, pageHeight - 15);

        // Guardar PDF
        const filename = outputName || `${tipo}_${datos.numero || 'sin_numero'}.pdf`;
        console.log('[PDF] Guardando archivo:', filename);
        doc.save(filename);

        console.log('[PDF] PDF guardado exitosamente');
        alert('✅ PDF generado exitosamente');

        return doc;
    } catch (error) {
        console.error('[PDF] Error generando PDF:', error);
        alert('❌ Error al generar PDF: ' + error.message);
        throw error;
    }
}

// ===== DIBUJAR HEADER =====
function drawHeader(doc, pageWidth, margin, tipo, datos) {
    const colors = PDF_CONFIG.colors;

    // Logo/título principal
    doc.setFont('Cormorant Garamond', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(colors.burgundy);
    doc.text('DIECO', pageWidth / 2, margin + 8, { align: 'center' });

    doc.setFont('Cormorant Garamond', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(colors.black);
    doc.text('MANCIPE', pageWidth / 2, margin + 14, { align: 'center' });

    // Línea decorativa
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 18, pageWidth - margin, margin + 18);

    // Tipo de documento
    doc.setFont('Space Mono', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(colors.burgundy);
    const tipoTexto = tipo === 'orden' ? 'ORDEN DE COMPRA' : 'FACTURA';
    doc.text(tipoTexto, margin, margin + 28);

    // Número y fecha
    doc.setFont('Space Mono', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(colors.black);
    doc.text(`Número: ${datos.numero || 'N/A'}`, pageWidth - margin - 50, margin + 26);
    doc.text(`Fecha: ${datos.fecha || new Date().toLocaleDateString('es-CO')}`, pageWidth - margin - 50, margin + 31);

    return margin + 42;
}

// ===== INFORMACIÓN DEL CLIENTE =====
function drawClientInfo(doc, margin, contentWidth, yPos, datos) {
    const colors = PDF_CONFIG.colors;

    doc.setFont('Space Mono', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('INFORMACIÓN DEL CLIENTE', margin, yPos);

    doc.setFont('Space Mono', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(colors.black);

    let textY = yPos + 8;
    const lineHeight = 5;

    if (datos.cliente) {
        doc.text(`Cliente: ${datos.cliente.nombre || 'N/A'}`, margin, textY);
        textY += lineHeight;

        if (datos.cliente.email) {
            doc.text(`Email: ${datos.cliente.email}`, margin, textY);
            textY += lineHeight;
        }

        if (datos.cliente.telefono) {
            doc.text(`Teléfono: ${datos.cliente.telefono}`, margin, textY);
            textY += lineHeight;
        }

        if (datos.cliente.proyecto) {
            doc.text(`Proyecto: ${datos.cliente.proyecto}`, margin, textY);
            textY += lineHeight;
        }
    }

    return textY + 8;
}

// ===== TABLA DE ITEMS =====
function drawItemsTable(doc, margin, contentWidth, yPos, items, moneda) {
    const colors = PDF_CONFIG.colors;

    doc.autoTable({
        startY: yPos,
        head: [['#', 'Descripción', 'Cantidad', `Valor Unit. (${moneda})`, `Subtotal (${moneda})`]],
        body: items.map((item, index) => [
            index + 1,
            item.descripcion,
            item.cantidad.toString(),
            formatCurrency(item.valorUnitario, moneda),
            formatCurrency(item.cantidad * item.valorUnitario, moneda)
        ]),
        theme: 'striped',
        headStyles: {
            fillColor: colors.burgundy,
            textColor: colors.cream,
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: colors.cream
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 10;
}

// ===== TOTALES =====
function drawTotals(doc, pageWidth, margin, contentWidth, yPos, datos, moneda, incluirIva) {
    const colors = PDF_CONFIG.colors;

    let subtotal = datos.items.reduce((sum, item) => sum + (item.cantidad * item.valorUnitario), 0);
    let iva = incluirIva ? subtotal * 0.19 : 0;
    let total = subtotal + iva;

    const valueWidth = contentWidth * 0.4;
    const startX = pageWidth - margin - valueWidth;

    // Subtotal
    doc.setFont('Space Mono', 'normal');
    doc.setFontSize(10);
    doc.text('Subtotal:', startX, yPos);
    doc.text(formatCurrency(subtotal, moneda), pageWidth - margin, yPos, { align: 'right' });

    // IVA (si aplica)
    if (incluirIva) {
        yPos += 6;
        doc.text(`IVA (19%):`, startX, yPos);
        doc.text(formatCurrency(iva, moneda), pageWidth - margin, yPos, { align: 'right' });
    }

    // Total
    yPos += 8;
    doc.setFont('Space Mono', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(colors.burgundy);
    doc.text(`TOTAL (${moneda}):`, startX, yPos);
    doc.text(formatCurrency(total, moneda), pageWidth - margin, yPos, { align: 'right' });

    doc.setTextColor(colors.black);
    doc.setFont('Space Mono', 'normal');
    doc.setFontSize(10);

    return yPos + 15;
}

// ===== INFORMACIÓN DE PAGO =====
function drawPaymentInfo(doc, margin, contentWidth, yPos) {
    const colors = PDF_CONFIG.colors;
    const payment = PDF_CONFIG.paymentData;

    doc.setFont('Space Mono', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('INFORMACIÓN DE PAGO', margin, yPos);

    let textY = yPos + 8;
    const lineHeight = 6;

    // Nequi
    doc.setFont('Space Mono', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.black);
    doc.text('💳 Nequi:', margin, textY);
    doc.setFont('Space Mono', 'normal');
    doc.text(`${payment.nequi.titular} - ${payment.nequi.telefono}`, margin + 25, textY);
    textY += lineHeight;

    // Bancolombia
    doc.setFont('Space Mono', 'bold');
    doc.text('🏦 Bancolombia:', margin, textY);
    doc.setFont('Space Mono', 'normal');
    doc.text(`${payment.bancolombia.titular} - ${payment.bancolombia.tipo}`, margin + 30, textY);
    textY += lineHeight;
    doc.setFont('Space Mono', 'normal');
    doc.text(`No. ${payment.bancolombia.numero}`, margin + 30, textY);
    textY += lineHeight;

    // PayPal
    doc.setFont('Space Mono', 'bold');
    doc.text('🌐 PayPal:', margin, textY);
    doc.setFont('Space Mono', 'normal');
    doc.text(payment.paypal.usuario, margin + 20, textY);

    return textY + 10;
}

// ===== FIRMAS =====
function drawSignatures(doc, pageWidth, margin, contentWidth, yPos) {
    const colors = PDF_CONFIG.colors;
    const signatureWidth = 60;
    const gap = 40;
    const totalWidth = (signatureWidth * 2) + gap;
    const startX = (pageWidth - totalWidth) / 2;

    // Línea de firma 1
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.5);
    doc.line(startX, yPos, startX + signatureWidth, yPos);

    doc.setFont('Cormorant Garamond', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(colors.black);
    doc.text('DIECO MANCIPE', startX + signatureWidth / 2, yPos + 5, { align: 'center' });
    doc.setFont('Space Mono', 'normal');
    doc.setFontSize(9);
    doc.text('Productor Musical', startX + signatureWidth / 2, yPos + 9, { align: 'center' });

    // Línea de firma 2
    doc.setDrawColor(colors.taupe);
    doc.line(startX + signatureWidth + gap, yPos, startX + signatureWidth * 2 + gap, yPos);

    doc.setFont('Cormorant Garamond', 'normal');
    doc.setFontSize(11);
    doc.text('CLIENTE', startX + signatureWidth + gap + signatureWidth / 2, yPos + 5, { align: 'center' });
    doc.setFont('Space Mono', 'normal');
    doc.setFontSize(9);
    doc.text('Aceptado por', startX + signatureWidth + gap + signatureWidth / 2, yPos + 9, { align: 'center' });
}

// ===== FOOTER =====
function drawFooter(doc, pageWidth, pageHeight) {
    const colors = PDF_CONFIG.colors;

    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 5, pageWidth - 20, pageHeight - 5);

    doc.setFont('Space Mono', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.taupe);
    doc.text('DIECO MANCIPE © 2026 — Todos los derechos reservados', pageWidth / 2, pageHeight, { align: 'center' });
}

// ===== UTILIDADES =====
function formatCurrency(amount, currency) {
    if (currency === 'COP') {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    } else if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    return `${currency} ${amount.toFixed(2)}`;
}

// ===== CARGAR JSPDF =====
async function loadJspdf() {
    return new Promise((resolve, reject) => {
        if (window.jspdf) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            // Cargar autoTable también
            const autoTableScript = document.createElement('script');
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
            autoTableScript.onload = resolve;
            autoTableScript.onerror = reject;
            document.head.appendChild(autoTableScript);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ===== EXPORTAR PARA USO GLOBAL =====
window.generarPDF = generarPDF;
window.PDF_CONFIG = PDF_CONFIG;
window.COMPANY_INFO = COMPANY_INFO;
