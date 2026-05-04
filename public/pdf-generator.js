// ============================================
// AGENTE GWEN - GENERADOR DE PDFs
// Basado en formato DM-ORD-MAR-001.pdf
// ============================================

const PDF_CONFIG = {
    colors: {
        burgundy: '#5e1c2e',
        cream: '#f4f3e9',
        taupe: '#c5b8aa',
        black: '#1a1a1a',
        gray: '#666666'
    },
    // URL de la firma (base64 para evitar CORS)
    firmaUrl: 'https://raw.githubusercontent.com/DiecoMancipe99/Agente-Gwen/main/BRANDING/firma%20Dieco%20Mancipe.png'
};

const COMPANY_INFO = {
    name: 'DIECO MANCIPE',
    title: 'Productor Musical & Ingeniero de Sonido',
    email: 'diegomancipe33@gmail.com',
    phone: '+57 302 439 0098',
    location: 'Bogotá, Colombia',
    paymentData: {
        nequi: {
            titular: 'Diego Mancipe',
            telefono: '+57 302 439 0098'
        },
        bancolombia: {
            titular: 'Diego Mancipe',
            tipo: 'Cuenta de Ahorros',
            numero: '03600000714',
            celular: '302 439 0098'
        },
        paypal: {
            usuario: 'diegomancipe33@gmail.com'
        }
    }
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
        await loadJspdf();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'letter'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 25;
        const contentWidth = pageWidth - (margin * 2);

        let yPos = margin;

        // 1. HEADER - Logo/Nombre
        yPos = drawHeader(doc, pageWidth, margin, tipo, datos);

        // 2. INFORMACIÓN - Dieco (izq) y Cliente (der)
        yPos = drawInfoSection(doc, pageWidth, margin, yPos, datos);

        // 3. TABLA DE ITEMS
        yPos = drawItemsTable(doc, margin, contentWidth, yPos, datos.items, moneda);

        // 4. TOTALES
        drawTotals(doc, pageWidth, margin, contentWidth, yPos, datos, moneda, incluirIva);

        // 5. INFORMACIÓN DE PAGO
        drawPaymentInfo(doc, margin, pageHeight - 60);

        // 6. FIRMA
        await drawSignature(doc, pageWidth, pageHeight - 45);

        // 7. FOOTER
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

// ===== 1. HEADER =====
function drawHeader(doc, pageWidth, margin, tipo, datos) {
    const colors = PDF_CONFIG.colors;

    // Nombre principal centrado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(colors.burgundy);
    doc.text('DIECO', pageWidth / 2, margin + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(colors.black);
    doc.text('MANCIPE', pageWidth / 2, margin + 14, { align: 'center' });

    // Línea decorativa
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 18, pageWidth - margin, margin + 18);

    // Tipo de documento y número
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    const tipoTexto = tipo === 'orden' ? 'ORDEN DE COMPRA' : 'FACTURA';
    doc.text(tipoTexto, margin, margin + 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(colors.gray);
    doc.text(`Número: ${datos.numero || 'N/A'}`, pageWidth - margin - 40, margin + 24);
    doc.text(`Fecha: ${datos.fecha || new Date().toLocaleDateString('es-CO')}`, pageWidth - margin - 40, margin + 29);

    return margin + 38;
}

// ===== 2. INFORMACIÓN =====
function drawInfoSection(doc, pageWidth, margin, yPos, datos) {
    const colors = PDF_CONFIG.colors;

    // Columna izquierda - Dieco
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    doc.text('DIECO MANCIPE', margin, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.black);
    doc.text('Productor Musical & Ingeniero de Sonido', margin, yPos + 5);
    doc.text(COMPANY_INFO.location, margin, yPos + 10);
    doc.text(COMPANY_INFO.email, margin, yPos + 15);
    doc.text(COMPANY_INFO.phone, margin, yPos + 20);

    // Columna derecha - Cliente
    const cliente = datos.cliente || {};
    const infoX = pageWidth - margin - 60;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    doc.text('CLIENTE', infoX, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.black);

    let clienteY = yPos + 5;
    if (cliente.nombre) {
        doc.text(cliente.nombre, infoX, clienteY);
        clienteY += 5;
    }
    if (cliente.email) {
        doc.text(cliente.email, infoX, clienteY);
        clienteY += 5;
    }
    if (cliente.telefono) {
        doc.text(cliente.telefono, infoX, clienteY);
        clienteY += 5;
    }
    if (cliente.proyecto) {
        doc.text(`Proyecto: ${cliente.proyecto}`, infoX, clienteY);
    }

    return yPos + 30;
}

// ===== 3. TABLA DE ITEMS =====
function drawItemsTable(doc, margin, contentWidth, yPos, items, moneda) {
    const colors = PDF_CONFIG.colors;

    doc.autoTable({
        startY: yPos,
        head: [['#', 'Descripción', `Valor (${moneda})`]],
        body: items.map((item, index) => [
            index + 1,
            item.descripcion,
            formatCurrency(item.cantidad * item.valorUnitario, moneda)
        ]),
        theme: 'striped',
        headStyles: {
            fillColor: colors.burgundy,
            textColor: '#ffffff',
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: colors.black
        },
        alternateRowStyles: {
            fillColor: '#f9f9f9'
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 5;
}

// ===== 4. TOTALES =====
function drawTotals(doc, pageWidth, margin, contentWidth, yPos, datos, moneda, incluirIva) {
    const colors = PDF_CONFIG.colors;

    let subtotal = datos.items.reduce((sum, item) => sum + (item.cantidad * item.valorUnitario), 0);
    let iva = incluirIva ? subtotal * 0.19 : 0;
    let total = subtotal + iva;

    const tableWidth = contentWidth;
    const valueWidth = 50;
    const startX = pageWidth - margin - valueWidth;

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Subtotal:', startX, yPos);
    doc.text(formatCurrency(subtotal, moneda), pageWidth - margin, yPos, { align: 'right' });

    // IVA
    if (incluirIva) {
        yPos += 6;
        doc.text(`IVA (19%):`, startX, yPos);
        doc.text(formatCurrency(iva, moneda), pageWidth - margin, yPos, { align: 'right' });
    }

    // Total
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text(`TOTAL (${moneda}):`, startX, yPos);
    doc.text(formatCurrency(total, moneda), pageWidth - margin, yPos, { align: 'right' });

    return yPos + 20;
}

// ===== 5. INFORMACIÓN DE PAGO =====
function drawPaymentInfo(doc, margin, yPos) {
    const colors = PDF_CONFIG.colors;
    const payment = COMPANY_INFO.paymentData;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    doc.text('INFORMACIÓN DE PAGO', margin, yPos);

    let textY = yPos + 7;
    const lineHeight = 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.black);

    // Nequi
    doc.text(`💳 Nequi: ${payment.nequi.titular} - ${payment.nequi.telefono}`, margin, textY);
    textY += lineHeight;

    // Bancolombia
    doc.text(`🏦 Bancolombia: ${payment.bancolombia.titular} - ${payment.bancolombia.tipo}`, margin, textY);
    textY += lineHeight;
    doc.text(`   No. ${payment.bancolombia.numero}`, margin, textY);
    textY += lineHeight;

    // PayPal
    doc.text(`🌐 PayPal: ${payment.paypal.usuario}`, margin, textY);

    return textY + 10;
}

// ===== 6. FIRMA =====
async function drawSignature(doc, pageWidth, yPos) {
    const colors = PDF_CONFIG.colors;

    // Intentar cargar la firma
    try {
        const response = await fetch(PDF_CONFIG.firmaUrl);
        const blob = await response.blob();
        const reader = new FileReader();

        await new Promise((resolve, reject) => {
            reader.onload = resolve;
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const firmaBase64 = reader.result;
        const signatureWidth = 50;
        const signatureHeight = 20;
        const signatureX = (pageWidth - signatureWidth) / 2;

        doc.addImage(firmaBase64, 'PNG', signatureX, yPos, signatureWidth, signatureHeight);
    } catch (error) {
        console.log('[PDF] No se pudo cargar la firma, usando línea de firma');
    }

    // Línea de firma (siempre visible)
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.5);
    const lineX = (pageWidth - 80) / 2;
    doc.line(lineX, yPos + 22, lineX + 80, yPos + 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.black);
    doc.text('DIECO MANCIPE', pageWidth / 2, yPos + 28, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Productor Musical', pageWidth / 2, yPos + 32, { align: 'center' });
}

// ===== 7. FOOTER =====
function drawFooter(doc, pageWidth, pageHeight) {
    const colors = PDF_CONFIG.colors;

    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 5, pageWidth - 20, pageHeight - 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.taupe);
    doc.text('Dieco Mancipe © 2026 — Todos los derechos reservados', pageWidth / 2, pageHeight, { align: 'center' });
}

// ===== UTILIDADES =====
function formatCurrency(amount, currency) {
    if (currency === 'COP') {
        return '$ ' + new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    } else if (currency === 'USD') {
        return '$ ' + new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    return `${currency} ${amount.toFixed(2)}`;
}

async function loadJspdf() {
    return new Promise((resolve, reject) => {
        if (window.jspdf && window.jspdf.jspdfAutotable) {
            resolve();
            return;
        }

        // Cargar jsPDF
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            // Cargar autoTable
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

// Exportar globalmente
window.generarPDF = generarPDF;
window.PDF_CONFIG = PDF_CONFIG;
window.COMPANY_INFO = COMPANY_INFO;
