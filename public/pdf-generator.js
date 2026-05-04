// ============================================
// AGENTE GWEN - GENERADOR DE PDFs
// Basado en generar_orden_compra.py (DM-ORD-MAR-001)
// Con soporte para múltiples páginas y text wrapping
// ============================================

const PDF_CONFIG = {
    colors: {
        burgundy: '#5e1c2e',
        cream: '#f4f3e9',
        creamLight: '#faf9f4',
        taupe: '#c5b8aa',
        dark: '#1a1a1a',
        white: '#ffffff'
    },
    margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
    },
    pageWidth: 215.9, // Letter en mm
    pageHeight: 279.4
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

// ===== CLASE PDF MANAGER =====
class PDFManager {
    constructor(doc) {
        this.doc = doc;
        this.y = PDF_CONFIG.margins.top;
        this.pageNum = 1;
        this.colors = PDF_CONFIG.colors;
    }

    // Verificar si hay espacio, si no crear nueva página
    checkSpace(neededHeight) {
        const availableSpace = PDF_CONFIG.pageHeight - PDF_CONFIG.margins.bottom - this.y;
        if (availableSpace < neededHeight) {
            this.addPage();
        }
    }

    addPage() {
        this.doc.addPage('letter', 'portrait');
        this.y = PDF_CONFIG.margins.top;
        this.pageNum++;
    }

    // Draw text con wrapping automático
    textWrapped(text, x, y, maxWidth, lineHeight = 5, fontSize = 9) {
        this.doc.setFontSize(fontSize);
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        const lines = [];

        for (let word of words) {
            const testLine = line + word + ' ';
            const testWidth = this.doc.getTextWidth(testLine);
            if (testWidth > maxWidth && line !== '') {
                lines.push(line.trim());
                line = word + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line.trim());

        lines.forEach((l, i) => {
            this.doc.text(l, x, currentY + (i * lineHeight));
        });

        return lines.length * lineHeight;
    }

    // Draw línea divisoria
    drawDivider(y) {
        this.doc.setDrawColor(this.colors.burgundy);
        this.doc.setLineWidth(0.5);
        this.doc.line(PDF_CONFIG.margins.left, y, PDF_CONFIG.pageWidth - PDF_CONFIG.margins.right, y);
    }
}

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

        const pdf = new PDFManager(doc);

        // 1. HEADER
        drawHeader(pdf);
        pdf.y += 5;

        // 2. Línea divisoria
        pdf.drawDivider(pdf.y);
        pdf.y += 15;

        // 3. Título ORDEN DE COMPRA
        drawOrderHeader(pdf, tipo, moneda);
        pdf.y += 15;

        // 4. DATOS DEL CLIENTE
        drawClientTable(pdf, datos.cliente);
        pdf.y += 15;

        // 5. DETALLE DE SERVICIOS (puede ocupar múltiples páginas)
        drawServicesTable(pdf, datos.items, moneda, incluirIva);
        pdf.y += 15;

        // 6. DATOS DE PAGO
        drawPaymentTable(pdf, moneda);
        pdf.y += 10;

        // 7. Nota de pago
        drawPaymentNote(pdf);
        pdf.y += 15;

        // 8. CONDICIONES Y NOTAS
        drawConditions(pdf);
        pdf.y += 20;

        // 9. FIRMAS
        drawSignatures(pdf, datos.cliente);

        // 10. FOOTER (en cada página)
        addFooterToAllPages(doc, pdf.pageNum);

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
function drawHeader(pdf) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;

    // Columna izquierda: DIECO MANCIPE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(colors.burgundy);
    doc.text('DIECO MANCIPE', margin, y + 12);

    // Columna derecha: Info de contacto
    const infoX = PDF_CONFIG.pageWidth - margin - 70;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.dark);

    let infoY = y;
    doc.text(`Email: ${COMPANY_INFO.email}`, infoX, infoY);
    infoY += 5;
    doc.text(`Tel: ${COMPANY_INFO.phone}`, infoX, infoY);
    infoY += 5;
    doc.text(COMPANY_INFO.address, infoX, infoY);

    pdf.y = y + 20;
}

// ===== 3. ORDER HEADER =====
function drawOrderHeader(pdf, tipo, moneda) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;

    // Izquierda: Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(colors.burgundy);
    const titulo = tipo === 'orden' ? 'ORDEN DE COMPRA' : 'FACTURA';
    doc.text(titulo, margin, y + 6);

    // Derecha: Fecha y Moneda
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.dark);
    const fecha = new Date().toLocaleDateString('es-CO');
    doc.text(`Fecha: ${fecha} | Moneda: ${moneda}`, PDF_CONFIG.pageWidth - margin - 40, y + 4);

    pdf.y = y + 10;
}

// ===== 4. CLIENTE TABLE =====
function drawClientTable(pdf, cliente) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const contentWidth = PDF_CONFIG.pageWidth - (margin * 2);

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('DATOS DEL CLIENTE', margin, y);

    const tableY = y + 8;
    const rowHeight = 8;
    const labelWidth = 40;

    // Datos del cliente
    const rows = [
        ['NOMBRE:', cliente.nombre || '-'],
        ['EMAIL:', cliente.email || '-'],
        ['TELÉFONO:', cliente.telefono || '-']
    ];

    if (cliente.documento) {
        rows.push(['DOCUMENTO:', cliente.documento]);
    }

    // Verificar espacio
    pdf.checkSpace((rows.length * rowHeight) + 20);

    // Dibujar filas
    rows.forEach((row, idx) => {
        const currentY = tableY + (idx * rowHeight);
        const bgColor = idx % 2 === 0 ? colors.creamLight : colors.white;

        // Fondo
        doc.setFillColor(bgColor);
        doc.rect(margin, currentY - 6, contentWidth, rowHeight, 'F');

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(colors.taupe);
        doc.text(row[0], margin + 3, currentY);

        // Valor (con wrapping si es muy largo)
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.dark);

        const value = row[1];
        const maxWidth = contentWidth - labelWidth - 6;

        if (doc.getTextWidth(value) > maxWidth) {
            pdf.textWrapped(value, margin + labelWidth + 3, currentY, maxWidth, rowHeight, 8);
        } else {
            doc.text(value, margin + labelWidth + 3, currentY);
        }
    });

    // Borde
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.rect(margin, tableY - 6, contentWidth, rows.length * rowHeight);

    pdf.y = tableY + (rows.length * rowHeight);
}

// ===== 5. SERVICES TABLE =====
function drawServicesTable(pdf, items, moneda, incluirIva) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const contentWidth = PDF_CONFIG.pageWidth - (margin * 2);

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('DETALLE DE SERVICIOS', margin, y);

    let tableY = y + 10;
    const rowHeight = 7;

    // Encabezados
    const headers = ['#', 'Ítem', 'Proyecto', 'ID', 'P. Unit', 'Cant', 'Subtotal'];
    const colWidths = [8, 40, 35, 20, 25, 15, 27];

    // Header background
    doc.setFillColor(colors.burgundy);
    doc.rect(margin, tableY - 5, contentWidth, rowHeight, 'F');

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor('#ffffff');

    let x = margin + 3;
    headers.forEach((header, i) => {
        doc.text(header, x, tableY);
        x += colWidths[i];
    });

    pdf.y = tableY + rowHeight;

    // Items
    let totalSinIva = 0;

    items.forEach((item, idx) => {
        // Verificar espacio para nueva fila
        pdf.checkSpace(rowHeight + 10);

        const currentY = pdf.y;
        const bgColor = idx % 2 === 0 ? colors.cream : colors.creamLight;

        // Fondo alternado
        doc.setFillColor(bgColor);
        doc.rect(margin, currentY - 5, contentWidth, rowHeight, 'F');

        const precioUnit = item.precio_unitario || item.valorUnitario || 0;
        const cantidad = item.cantidad || 1;
        const subtotal = precioUnit * cantidad;
        totalSinIva += subtotal;

        // Texto
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.dark);

        x = margin + 3;

        // Columnas
        doc.text((idx + 1).toString(), x, currentY);
        x += colWidths[0];

        // Ítem (con wrapping)
        const itemName = item.nombre || item.descripcion || '';
        if (doc.getTextWidth(itemName) > colWidths[1] - 3) {
            pdf.textWrapped(itemName, x, currentY - 2, colWidths[1] - 3, 3.5, 6);
        } else {
            doc.text(itemName, x, currentY);
        }
        x += colWidths[1];

        // Proyecto (con wrapping)
        const proyecto = item.proyecto || '';
        if (doc.getTextWidth(proyecto) > colWidths[2] - 3) {
            pdf.textWrapped(proyecto, x, currentY - 2, colWidths[2] - 3, 3.5, 6);
        } else {
            doc.text(proyecto, x, currentY);
        }
        x += colWidths[2];

        // ID
        doc.text(item.id || '', x, currentY);
        x += colWidths[3];

        // Precio Unit
        doc.text(formatCurrency(precioUnit, moneda), x + colWidths[4] - 3, currentY, { align: 'right' });
        x += colWidths[4];

        // Cantidad
        doc.text(cantidad.toString(), x + colWidths[5] - 3, currentY, { align: 'right' });
        x += colWidths[5];

        // Subtotal
        doc.text(formatCurrency(subtotal, moneda), x + colWidths[6] - 3, currentY, { align: 'right' });

        pdf.y = currentY + rowHeight;
    });

    // Totales
    const totalsY = pdf.y + 5;
    let iva = 0;
    let totalFinal = totalSinIva;

    if (incluirIva && moneda === 'COP') {
        iva = totalSinIva * 0.19;
        totalFinal = totalSinIva + iva;
    }

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal:', PDF_CONFIG.pageWidth - margin - 55, totalsY);
    doc.text(formatCurrency(totalSinIva, moneda), PDF_CONFIG.pageWidth - margin - 5, totalsY, { align: 'right' });

    // IVA
    if (incluirIva && moneda === 'COP') {
        doc.text('IVA (19%):', PDF_CONFIG.pageWidth - margin - 55, totalsY + 6);
        doc.text(formatCurrency(iva, moneda), PDF_CONFIG.pageWidth - margin - 5, totalsY + 6, { align: 'right' });
    }

    // TOTAL
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.burgundy);
    doc.text(`TOTAL (${moneda}):`, PDF_CONFIG.pageWidth - margin - 55, totalsY + 14);
    doc.text(formatCurrency(totalFinal, moneda), PDF_CONFIG.pageWidth - margin - 5, totalsY + 14, { align: 'right' });

    // Borde de totales
    doc.setDrawColor(colors.dark);
    doc.setLineWidth(0.5);
    doc.line(PDF_CONFIG.pageWidth - margin - 60, totalsY + 10, PDF_CONFIG.pageWidth - margin, totalsY + 10);

    pdf.y = totalsY + 20;
}

// ===== 6. PAYMENT TABLE =====
function drawPaymentTable(pdf, moneda) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const contentWidth = PDF_CONFIG.pageWidth - (margin * 2);

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('DATOS PARA REALIZAR EL PAGO', margin, y);

    const tableY = y + 10;
    const colWidth = (contentWidth - 10) / 2;
    const rowHeight = 6;

    if (moneda === 'COP') {
        const nequiData = [
            ['NEQUI', 'BANCOLOMBIA'],
            ['Titular: D. A. Mancipe Dehaquiz', 'Cta Ahorros: N. 15291719101'],
            ['Email: diegomancipe33@gmail.com', 'SWIFT: COLOCOBM'],
            ['Cel: 311 5378821', 'Titular: D. A. Mancipe Dehaquiz'],
            ['Llave: @mancipe657', 'CC: 1052416657']
        ];
        drawPaymentColumns(pdf, tableY, colWidth, rowHeight, nequiData);
    } else {
        const usdData = [
            ['PAYPAL', 'BANCOLOMBIA (Transferencia Intl)'],
            [`Email: ${COMPANY_INFO.paymentData.paypal.email}`, 'Cta Ahorros: N. 15291719101'],
            ['', 'SWIFT: COLOCOBM'],
            ['', 'Titular: D. A. Mancipe Dehaquiz'],
            ['', 'CC: 1052416657']
        ];
        drawPaymentColumns(pdf, tableY, colWidth, rowHeight, usdData);
    }

    pdf.y = tableY + (6 * rowHeight);
}

function drawPaymentColumns(pdf, y, colWidth, rowHeight, data) {
    const { doc, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;

    data.forEach((row, idx) => {
        const currentY = y + (idx * rowHeight);

        // Fondo
        if (idx === 0) {
            doc.setFillColor(colors.cream);
        } else {
            doc.setFillColor(idx % 2 === 1 ? colors.creamLight : colors.white);
        }

        // Columnas
        doc.rect(margin, currentY - 4, colWidth - 5, rowHeight, 'F');
        doc.rect(margin + colWidth + 5, currentY - 4, colWidth - 5, rowHeight, 'F');

        // Texto
        doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
        doc.setFontSize(idx === 0 ? 9 : 7);
        doc.setTextColor(colors.dark);
        doc.text(row[0], margin + 3, currentY);
        doc.text(row[1], margin + colWidth + 8, currentY);
    });

    // Bordes
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.rect(margin, y - 4, colWidth - 5, data.length * rowHeight);
    doc.rect(margin + colWidth + 5, y - 4, colWidth - 5, data.length * rowHeight);
}

// ===== 7. PAYMENT NOTE =====
function drawPaymentNote(pdf) {
    const { doc, y, colors } = pdf;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(colors.taupe);
    doc.text('Nota: Enviar comprobante de pago a diegomancipe33@gmail.com',
             PDF_CONFIG.pageWidth / 2, y, { align: 'center' });
}

// ===== 8. CONDITIONS =====
function drawConditions(pdf) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.burgundy);
    doc.text('CONDICIONES Y NOTAS', margin, y);

    const conditions = [
        'Términos de pago: 50% al inicio, 50% contra entrega.',
        'Tiempo de entrega: A convenir según alcance.',
        'Revisiones: 2 rondas por etapa.',
        'Validez: 15 días desde emisión.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.dark);

    conditions.forEach((cond, idx) => {
        doc.text(cond, margin, y + 8 + (idx * 5));
    });
}

// ===== 9. SIGNATURES =====
function drawSignatures(pdf, cliente) {
    const { doc, y, colors } = pdf;
    const pageWidth = PDF_CONFIG.pageWidth;

    const leftX = (pageWidth / 2) - 45;
    const rightX = (pageWidth / 2) + 10;

    // Verificar espacio
    pdf.checkSpace(40);

    // Líneas
    doc.setDrawColor(colors.dark);
    doc.setLineWidth(0.3);
    doc.line(leftX, y, leftX + 90, y);
    doc.line(rightX, y, rightX + 90, y);

    // Dieco
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    doc.text('Diego Mancipe', leftX + 45, y + 7, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colors.taupe);
    doc.text('Proveedor / Sound Engineer', leftX + 45, y + 12, { align: 'center' });
    doc.text('CC: 1052416657', leftX + 45, y + 17, { align: 'center' });

    // Cliente
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);

    // Nombre del cliente con wrapping
    const clienteNombre = cliente.nombre || 'Cliente';
    if (doc.getTextWidth(clienteNombre) > 85) {
        pdf.textWrapped(clienteNombre, rightX + 45, y + 5, 85, 5, 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.taupe);
        doc.text('Cliente', rightX + 45, y + 14, { align: 'center' });
    } else {
        doc.text(clienteNombre, rightX + 45, y + 7, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.taupe);
        doc.text('Cliente', rightX + 45, y + 12, { align: 'center' });
    }
}

// ===== 10. FOOTER =====
function addFooterToAllPages(doc, totalPages) {
    const colors = PDF_CONFIG.colors;
    const pageWidth = PDF_CONFIG.pageWidth;
    const pageHeight = PDF_CONFIG.pageHeight;

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Línea
        doc.setDrawColor(colors.taupe);
        doc.setLineWidth(0.3);
        doc.line(20, pageHeight - 18, pageWidth - 20, pageHeight - 18);

        // Texto
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.taupe);
        doc.text('DIECO MANCIPE - Sound Engineer & Music Producer | diegomancipe33@gmail.com | +57 (311) 537-8821',
                 pageWidth / 2, pageHeight - 13, { align: 'center' });

        // Número de página
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 25, pageHeight - 13);
    }
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
        if (window.jspdf) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Exportar globalmente
window.generarPDF = generarPDF;
window.PDF_CONFIG = PDF_CONFIG;
window.COMPANY_INFO = COMPANY_INFO;
window.PDFManager = PDFManager;
