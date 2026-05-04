// ============================================
// AGENTE GWEN - GENERADOR DE PDFs
// Basado en generar_orden_compra.py (DM-ORD-MAR-001)
// ============================================

const PDF_CONFIG = {
    colors: {
        burgundy: '#5e1c2e',
        cream: '#f4f3e9',
        creamLight: '#faf9f4',
        taupe: '#c5b8aa',
        dark: '#1a1a1a',
        white: '#ffffff'
    }
};

const COMPANY_INFO = {
    name: 'DIECO MANCIPE',
    title: 'Productor Musical & Ingeniero de Sonido',
    email: 'diegomancipe33@gmail.com',
    phone: '+57 (311) 537-8821',
    address: 'Calle 140 # 11-45 Of 617 Torre HHC, Bogotá',
    paymentData: {
        nequi: {
            titular: 'Diego Alejandro Mancipe Dehaquiz',
            email: 'diegomancipe33@gmail.com',
            celular: '311 5378821',
            llave: '@mancipe657'
        },
        bancolombia: {
            cuenta: '15291719101',
            swift: 'COLOCOBM',
            titular: 'Diego Alejandro Mancipe Dehaquiz',
            cc: '1052416657'
        },
        paypal: {
            email: 'diegomancipe33@gmail.com'
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
        await loadFonts();

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

        // 1. HEADER - Logo/Empresa (dos columnas)
        yPos = drawHeader(doc, pageWidth, margin, contentWidth);

        // 2. Línea divisoria
        yPos = drawDivider(doc, margin, pageWidth, yPos);

        // 3. Título ORDEN DE COMPRA + Fecha/Moneda
        yPos = drawOrderHeader(doc, pageWidth, margin, tipo, moneda, yPos);

        // 4. DATOS DEL CLIENTE - Tabla
        yPos = drawClientTable(doc, margin, contentWidth, yPos, datos.cliente);

        // 5. DETALLE DE SERVICIOS - Tabla completa
        yPos = drawServicesTable(doc, margin, contentWidth, yPos, datos.items, moneda, incluirIva);

        // 6. DATOS DE PAGO - Tabla dos columnas
        drawPaymentTable(doc, margin, contentWidth, yPos, moneda);

        // 7. Nota de pago
        drawPaymentNote(doc, pageWidth, pageHeight - 75);

        // 8. CONDICIONES Y NOTAS
        drawConditions(doc, margin, pageHeight - 65);

        // 9. FIRMAS
        drawSignatures(doc, pageWidth, pageHeight - 45, datos.cliente);

        // 10. FOOTER
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
function drawHeader(doc, pageWidth, margin, contentWidth, yPos = 20) {
    const colors = PDF_CONFIG.colors;

    // Columna izquierda: DIECO MANCIPE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(colors.burgundy);
    doc.text('DIECO MANCIPE', margin, yPos + 12);

    // Columna derecha: Info de contacto
    const infoX = pageWidth - margin - 90;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.dark);

    let infoY = yPos;
    doc.text(`Email: ${COMPANY_INFO.email}`, infoX, infoY);
    infoY += 5;
    doc.text(`Teléfono: ${COMPANY_INFO.phone}`, infoX, infoY);
    infoY += 5;
    doc.text(`Dirección: ${COMPANY_INFO.address}`, infoX, infoY);

    return yPos + 20;
}

// ===== 2. DIVIDER =====
function drawDivider(doc, margin, pageWidth, yPos) {
    const colors = PDF_CONFIG.colors;

    doc.setDrawColor(colors.burgundy);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    return yPos + 15;
}

// ===== 3. ORDER HEADER =====
function drawOrderHeader(doc, pageWidth, margin, tipo, moneda, yPos) {
    const colors = PDF_CONFIG.colors;

    // Izquierda: Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(colors.burgundy);
    const titulo = tipo === 'orden' ? 'ORDEN DE COMPRA' : 'FACTURA';
    doc.text(titulo, margin, yPos + 6);

    // Derecha: Fecha y Moneda
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.dark);
    const fecha = new Date().toLocaleDateString('es-CO');
    doc.text(`Fecha: ${fecha} | Moneda: ${moneda}`, pageWidth - margin - 40, yPos + 4);

    return yPos + 15;
}

// ===== 4. CLIENTE TABLE =====
function drawClientTable(doc, margin, contentWidth, yPos, cliente) {
    const colors = PDF_CONFIG.colors;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('DATOS DEL CLIENTE', margin, yPos);

    const tableY = yPos + 8;

    // Datos del cliente
    const rows = [
        ['NOMBRE:', cliente.nombre || '-'],
        ['EMAIL:', cliente.email || '-'],
        ['TELÉFONO:', cliente.telefono || '-']
    ];

    if (cliente.documento) {
        rows.push(['DOCUMENTO:', cliente.documento]);
    }

    // Dibujar tabla con filas alternadas
    const rowHeight = 8;
    const labelWidth = 40;
    const valueWidth = contentWidth - labelWidth;

    rows.forEach((row, index) => {
        const y = tableY + (index * rowHeight);
        const bgColor = index % 2 === 0 ? colors.creamLight : colors.white;

        // Fondo
        doc.setFillColor(bgColor);
        doc.rect(margin, y - 6, contentWidth, rowHeight, 'F');

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(colors.taupe);
        doc.text(row[0], margin + 3, y);

        // Valor
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.dark);
        doc.text(row[1], margin + labelWidth + 3, y);
    });

    // Borde de la tabla
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.rect(margin, tableY - 6, contentWidth, rows.length * rowHeight);

    return tableY + (rows.length * rowHeight) + 15;
}

// ===== 5. SERVICES TABLE =====
function drawServicesTable(doc, margin, contentWidth, yPos, items, moneda, incluirIva) {
    const colors = PDF_CONFIG.colors;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('DETALLE DE SERVICIOS', margin, yPos);

    const tableY = yPos + 10;

    // Encabezados
    const headers = ['#', 'Ítem', 'Proyecto', 'ID', 'Precio Unit.', 'Cant.', 'Subtotal'];
    const colWidths = [8, 35, 35, 20, 25, 15, 30];
    const rowHeight = 7;

    // Header background
    doc.setFillColor(colors.burgundy);
    doc.rect(margin, tableY - 5, contentWidth, rowHeight, 'F');

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor('#ffffff');

    let x = margin + 3;
    headers.forEach((header, i) => {
        doc.text(header, x, tableY);
        x += colWidths[i];
    });

    // Items
    let totalSinIva = 0;
    const dataRows = [];

    items.forEach((item, idx) => {
        const precioUnit = item.precio_unitario || item.valorUnitario || 0;
        const cantidad = item.cantidad || 1;
        const subtotal = precioUnit * cantidad;
        totalSinIva += subtotal;

        dataRows.push([
            (idx + 1).toString(),
            item.nombre || item.descripcion || '',
            item.proyecto || '',
            item.id || '',
            formatCurrency(precioUnit, moneda),
            cantidad.toString(),
            formatCurrency(subtotal, moneda)
        ]);
    });

    // Dibujar filas
    const startDataY = tableY + rowHeight;
    dataRows.forEach((row, idx) => {
        const y = startDataY + (idx * rowHeight);
        const bgColor = idx % 2 === 0 ? colors.cream : colors.creamLight;

        // Fondo alternado
        doc.setFillColor(bgColor);
        doc.rect(margin, y - 5, contentWidth, rowHeight, 'F');

        // Texto
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(colors.dark);

        x = margin + 3;
        row.forEach((cell, i) => {
            const align = i >= 4 ? 'right' : 'left';
            if (align === 'right') {
                doc.text(cell, x + colWidths[i] - 3, y);
            } else {
                doc.text(cell, x, y);
            }
            x += colWidths[i];
        });
    });

    // Totales
    const totalsStartY = startDataY + (dataRows.length * rowHeight) + 5;
    let iva = 0;
    let totalFinal = totalSinIva;

    if (incluirIva && moneda === 'COP') {
        iva = totalSinIva * 0.19;
        totalFinal = totalSinIva + iva;
    }

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal:', margin + contentWidth - 55, totalsStartY);
    doc.text(formatCurrency(totalSinIva, moneda), margin + contentWidth - 5, totalsStartY, { align: 'right' });

    // IVA
    if (incluirIva && moneda === 'COP') {
        doc.text('IVA (19%):', margin + contentWidth - 55, totalsStartY + 6);
        doc.text(formatCurrency(iva, moneda), margin + contentWidth - 5, totalsStartY + 6, { align: 'right' });
    }

    // TOTAL
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.burgundy);
    doc.text(`TOTAL (${moneda}):`, margin + contentWidth - 55, totalsStartY + 14);
    doc.text(formatCurrency(totalFinal, moneda), margin + contentWidth - 5, totalsStartY + 14, { align: 'right' });

    // Borde de totales
    doc.setDrawColor(colors.dark);
    doc.setLineWidth(0.5);
    doc.line(margin + contentWidth - 60, totalsStartY + 10, margin + contentWidth, totalsStartY + 10);

    return totalsStartY + 30;
}

// ===== 6. PAYMENT TABLE =====
function drawPaymentTable(doc, margin, contentWidth, yPos, moneda) {
    const colors = PDF_CONFIG.colors;
    const payment = COMPANY_INFO.paymentData;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('DATOS PARA REALIZAR EL PAGO', margin, yPos);

    const tableY = yPos + 10;
    const colWidth = (contentWidth - 10) / 2;
    const rowHeight = 6;

    if (moneda === 'COP') {
        // COP: Nequi y Bancolombia
        const nequiData = [
            ['NEQUI', 'BANCOLOMBIA'],
            ['Titular: Diego Alejandro Mancipe Dehaquiz', 'Cuenta de Ahorros: N. 15291719101'],
            ['Email: diegomancipe33@gmail.com', 'SWIFT: COLOCOBM'],
            ['Celular: 311 5378821', 'Titular: Diego Alejandro Mancipe Dehaquiz'],
            ['Llave: @mancipe657', 'CC: 1052416657']
        ];

        drawPaymentColumns(doc, margin, tableY, colWidth, rowHeight, nequiData);
    } else {
        // USD: PayPal y Bancolombia Internacional
        const usdData = [
            ['PAYPAL', 'BANCOLOMBIA (Transferencia Internacional)'],
            [`Email: ${payment.paypal.email}`, 'Cuenta de Ahorros: N. 15291719101'],
            ['', 'SWIFT: COLOCOBM'],
            ['', 'Titular: Diego Alejandro Mancipe Dehaquiz'],
            ['', 'CC: 1052416657']
        ];

        drawPaymentColumns(doc, margin, tableY, colWidth, rowHeight, usdData);
    }

    return tableY + (6 * rowHeight) + 15;
}

function drawPaymentColumns(doc, x, y, colWidth, rowHeight, data) {
    const colors = PDF_CONFIG.colors;

    data.forEach((row, idx) => {
        const currentY = y + (idx * rowHeight);

        // Fondo alternado
        if (idx === 0) {
            doc.setFillColor(colors.cream);
        } else {
            doc.setFillColor(idx % 2 === 1 ? colors.creamLight : colors.white);
        }

        // Columna 1
        doc.rect(x, currentY - 4, colWidth - 5, rowHeight, 'F');
        // Columna 2
        doc.rect(x + colWidth + 5, currentY - 4, colWidth - 5, rowHeight, 'F');

        // Texto columna 1
        doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
        doc.setFontSize(idx === 0 ? 10 : 8);
        doc.setTextColor(colors.dark);
        doc.text(row[0], x + 3, currentY);

        // Texto columna 2
        doc.text(row[1], x + colWidth + 8, currentY);
    });

    // Bordes
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.rect(x, y - 4, colWidth - 5, data.length * rowHeight);
    doc.rect(x + colWidth + 5, y - 4, colWidth - 5, data.length * rowHeight);
}

// ===== 7. PAYMENT NOTE =====
function drawPaymentNote(doc, pageWidth, yPos) {
    const colors = PDF_CONFIG.colors;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(colors.taupe);
    doc.text('Nota: Por favor enviar el comprobante de pago al email diegomancipe33@gmail.com',
             pageWidth / 2, yPos, { align: 'center' });
}

// ===== 8. CONDITIONS =====
function drawConditions(doc, margin, yPos) {
    const colors = PDF_CONFIG.colors;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('CONDICIONES Y NOTAS', margin, yPos);

    const conditions = [
        'Términos de pago: 50% al inicio del proyecto, 50% contra entrega.',
        'Tiempo de entrega: A convenir según el alcance del proyecto.',
        'Revisiones: Incluye 2 rondas de revisiones por etapa.',
        'Validez: Esta orden de compra tiene validez de 15 días desde su emisión.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.dark);

    conditions.forEach((cond, idx) => {
        doc.text(cond, margin, yPos + 8 + (idx * 5));
    });
}

// ===== 9. SIGNATURES =====
function drawSignatures(doc, pageWidth, yPos, cliente) {
    const colors = PDF_CONFIG.colors;

    const leftX = (pageWidth / 2) - 40;
    const rightX = (pageWidth / 2) + 10;
    const signatureHeight = 25;

    // Línea de firma izquierda (Dieco)
    doc.setDrawColor(colors.dark);
    doc.setLineWidth(0.3);
    doc.line(leftX, yPos, leftX + 80, yPos);

    // Línea de firma derecha (Cliente)
    doc.line(rightX, yPos, rightX + 80, yPos);

    // Nombre Dieco
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    doc.text('Diego Mancipe', leftX + 40, yPos + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.taupe);
    doc.text('Proveedor / Sound Engineer', leftX + 40, yPos + 11, { align: 'center' });
    doc.text('CC: 1052416657', leftX + 40, yPos + 16, { align: 'center' });

    // Nombre Cliente
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    doc.text(cliente.nombre || 'Cliente', rightX + 40, yPos + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.taupe);
    doc.text('Cliente', rightX + 40, yPos + 11, { align: 'center' });
}

// ===== 10. FOOTER =====
function drawFooter(doc, pageWidth, yPos) {
    const colors = PDF_CONFIG.colors;

    // Línea
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.line(20, yPos - 5, pageWidth - 20, yPos - 5);

    // Texto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.taupe);
    doc.text('DIECO MANCIPE - Sound Engineer & Music Producer | diegomancipe33@gmail.com | +57 (311) 537-8821',
             pageWidth / 2, yPos, { align: 'center' });
}

// ===== UTILS =====
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

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
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

// Cargar fuentes personalizadas (opcional, para mejor apariencia)
async function loadFonts() {
    // jsPDF usa helvetica por defecto, que es suficiente para este diseño
    return Promise.resolve();
}

// Exportar globalmente
window.generarPDF = generarPDF;
window.PDF_CONFIG = PDF_CONFIG;
window.COMPANY_INFO = COMPANY_INFO;
