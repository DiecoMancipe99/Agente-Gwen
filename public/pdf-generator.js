// ============================================
// AGENTE GWEN - GENERADOR DE PDFs
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
        bottom: 25,
        left: 20,
        right: 20
    },
    pageWidth: 215.9,
    pageHeight: 279.4
};

const COMPANY_INFO = {
    name: 'DIECO MANCIPE',
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
        this.totalPages = 1;
        this.colors = PDF_CONFIG.colors;
    }

    getAvailableSpace() {
        return PDF_CONFIG.pageHeight - PDF_CONFIG.margins.bottom - this.y;
    }

    addPage() {
        this.doc.addPage('letter', 'portrait');
        this.y = PDF_CONFIG.margins.top;
        this.pageNum++;
        this.totalPages++;
    }

    textWrapped(text, x, y, maxWidth, lineHeight = 4, fontSize = 7) {
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

        // 5. DETALLE DE SERVICIOS - retorna la Y donde terminó
        pdf.y = drawServicesTable(pdf, datos.items, moneda, incluirIva);
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

        // 10. FOOTER
        addFooterToAllPages(doc, pdf.totalPages);

        const filename = outputName || `${tipo}_${datos.numero || 'sin_numero'}.pdf`;
        doc.save(filename);

        alert('✅ PDF generado exitosamente');
        return doc;
    } catch (error) {
        console.error('[PDF] Error:', error);
        alert('❌ Error al generar PDF: ' + error.message);
        throw error;
    }
}

// ===== 1. HEADER =====
function drawHeader(pdf) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(colors.burgundy);
    doc.text('DIECO MANCIPE', margin, y + 12);

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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(colors.burgundy);
    const titulo = tipo === 'orden' ? 'ORDEN DE COMPRA' : 'FACTURA';
    doc.text(titulo, margin, y + 6);

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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('DATOS DEL CLIENTE', margin, y);

    const tableY = y + 8;
    const rowHeight = 8;

    const rows = [
        ['NOMBRE:', cliente.nombre || '-'],
        ['EMAIL:', cliente.email || '-'],
        ['TELÉFONO:', cliente.telefono || '-']
    ];
    if (cliente.documento) rows.push(['DOCUMENTO:', cliente.documento]);

    const neededSpace = (rows.length * rowHeight) + 20;
    if (pdf.getAvailableSpace() < neededSpace) {
        pdf.addPage();
    }

    const labelWidth = 40;

    rows.forEach((row, idx) => {
        const currentY = tableY + (idx * rowHeight);
        const bgColor = idx % 2 === 0 ? colors.creamLight : colors.white;

        doc.setFillColor(bgColor);
        doc.rect(margin, currentY - 6, contentWidth, rowHeight, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(colors.taupe);
        doc.text(row[0], margin + 3, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.dark);
        const value = row[1];
        const maxWidth = contentWidth - labelWidth - 6;

        if (doc.getTextWidth(value) > maxWidth) {
            pdf.textWrapped(value, margin + labelWidth + 3, currentY, maxWidth, rowHeight, 7);
        } else {
            doc.text(value, margin + labelWidth + 3, currentY);
        }
    });

    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.rect(margin, tableY - 6, contentWidth, rows.length * rowHeight);

    pdf.y = tableY + (rows.length * rowHeight);
}

// ===== 5. SERVICES TABLE =====
function drawServicesTable(pdf, items, moneda, incluirIva) {
    const { doc, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const contentWidth = PDF_CONFIG.pageWidth - (margin * 2);
    const rowHeight = 8;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text('DETALLE DE SERVICIOS', margin, pdf.y);

    let tableY = pdf.y + 10;

    // Headers
    const headers = ['#', 'Ítem', 'Proyecto', 'ID', 'P. Unit', 'Cant', 'Subtotal'];
    const colWidths = [8, 35, 35, 20, 25, 15, 32];

    // Preparar items
    const itemRows = items.map((item, idx) => ({
        num: idx + 1,
        nombre: item.nombre || item.descripcion || '',
        proyecto: item.proyecto || '',
        id: item.id || '',
        precio: item.precio_unitario || item.valorUnitario || 0,
        cantidad: item.cantidad || 1,
        subtotal: (item.precio_unitario || item.valorUnitario || 0) * (item.cantidad || 1)
    }));

    // Calcular espacio necesario
    const headerHeight = rowHeight + 5;
    const itemsHeight = itemRows.length * rowHeight;
    const totalsHeight = incluirIva ? 25 : 20;
    const totalNeeded = headerHeight + itemsHeight + totalsHeight + 40;

    // Si no cabe, nueva página
    if (pdf.getAvailableSpace() < totalNeeded) {
        pdf.addPage();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(colors.burgundy);
        doc.text('DETALLE DE SERVICIOS', margin, pdf.y);
        tableY = pdf.y + 10;
    }

    // Dibujar header
    drawTableHeader(doc, margin, contentWidth, tableY, rowHeight, headers, colWidths, colors);

    // Items
    let totalSinIva = 0;
    let currentY = tableY + rowHeight;

    itemRows.forEach((item, idx) => {
        // Verificar espacio para esta fila + totales
        const spaceNeeded = rowHeight + 30;
        if (currentY + spaceNeeded > PDF_CONFIG.pageHeight - PDF_CONFIG.margins.bottom) {
            pdf.addPage();
            // Redibujar header en nueva página
            const newTableY = PDF_CONFIG.margins.top + 10;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(colors.burgundy);
            doc.text('(continuación)', margin + 50, PDF_CONFIG.margins.top);
            drawTableHeader(doc, margin, contentWidth, newTableY, rowHeight, headers, colWidths, colors);
            currentY = newTableY + rowHeight;
        }

        totalSinIva += item.subtotal;
        const bgColor = idx % 2 === 0 ? colors.cream : colors.creamLight;

        doc.setFillColor(bgColor);
        doc.rect(margin, currentY - 5, contentWidth, rowHeight, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.dark);

        let x = margin + 3;
        doc.text(item.num.toString(), x, currentY);
        x += colWidths[0];

        // Ítem con wrapping
        if (doc.getTextWidth(item.nombre) > colWidths[1] - 3) {
            pdf.textWrapped(item.nombre, x, currentY - 2, colWidths[1] - 3, 3.5, 6);
        } else {
            doc.text(item.nombre, x, currentY);
        }
        x += colWidths[1];

        // Proyecto con wrapping
        if (doc.getTextWidth(item.proyecto) > colWidths[2] - 3) {
            pdf.textWrapped(item.proyecto, x, currentY - 2, colWidths[2] - 3, 3.5, 6);
        } else {
            doc.text(item.proyecto, x, currentY);
        }
        x += colWidths[2];

        doc.text(item.id, x, currentY);
        x += colWidths[3];

        doc.text(formatCurrency(item.precio, moneda), x + colWidths[4] - 3, currentY, { align: 'right' });
        x += colWidths[4];
        doc.text(item.cantidad.toString(), x + colWidths[5] - 3, currentY, { align: 'right' });
        x += colWidths[5];
        doc.text(formatCurrency(item.subtotal, moneda), x + colWidths[6] - 3, currentY, { align: 'right' });

        currentY += rowHeight;
    });

    // Totales
    const totalsY = currentY + 5;
    let iva = incluirIva && moneda === 'COP' ? totalSinIva * 0.19 : 0;
    let totalFinal = totalSinIva + iva;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal:', PDF_CONFIG.pageWidth - margin - 55, totalsY);
    doc.text(formatCurrency(totalSinIva, moneda), PDF_CONFIG.pageWidth - margin - 5, totalsY, { align: 'right' });

    if (incluirIva && moneda === 'COP') {
        doc.text('IVA (19%):', PDF_CONFIG.pageWidth - margin - 55, totalsY + 6);
        doc.text(formatCurrency(iva, moneda), PDF_CONFIG.pageWidth - margin - 5, totalsY + 6, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.burgundy);
    doc.text(`TOTAL (${moneda}):`, PDF_CONFIG.pageWidth - margin - 55, totalsY + 14);
    doc.text(formatCurrency(totalFinal, moneda), PDF_CONFIG.pageWidth - margin - 5, totalsY + 14, { align: 'right' });

    doc.setDrawColor(colors.dark);
    doc.setLineWidth(0.5);
    doc.line(PDF_CONFIG.pageWidth - margin - 60, totalsY + 10, PDF_CONFIG.pageWidth - margin, totalsY + 10);

    return totalsY + 20;
}

function drawTableHeader(doc, margin, contentWidth, y, rowHeight, headers, colWidths, colors) {
    doc.setFillColor(colors.burgundy);
    doc.rect(margin, y - 5, contentWidth, rowHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor('#ffffff');

    let x = margin + 3;
    headers.forEach((header, i) => {
        doc.text(header, x, y);
        x += colWidths[i];
    });
}

// ===== 6. PAYMENT TABLE =====
function drawPaymentTable(pdf, moneda) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const contentWidth = PDF_CONFIG.pageWidth - (margin * 2);

    if (pdf.getAvailableSpace() < 50) {
        pdf.addPage();
    }

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
        doc.setFillColor(idx === 0 ? colors.cream : (idx % 2 === 1 ? colors.creamLight : colors.white));
        doc.rect(margin, currentY - 4, colWidth - 5, rowHeight, 'F');
        doc.rect(margin + colWidth + 5, currentY - 4, colWidth - 5, rowHeight, 'F');
        doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
        doc.setFontSize(idx === 0 ? 9 : 7);
        doc.setTextColor(colors.dark);
        doc.text(row[0], margin + 3, currentY);
        doc.text(row[1], margin + colWidth + 8, currentY);
    });

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
    doc.text('Nota: Enviar comprobante a diegomancipe33@gmail.com', PDF_CONFIG.pageWidth / 2, y, { align: 'center' });
}

// ===== 8. CONDITIONS =====
function drawConditions(pdf) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;

    if (pdf.getAvailableSpace() < 30) {
        pdf.addPage();
    }

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
    doc.setFontSize(7);
    doc.setTextColor(colors.dark);
    conditions.forEach((cond, idx) => {
        doc.text(cond, margin, y + 8 + (idx * 5));
    });
}

// ===== 9. SIGNATURES =====
function drawSignatures(pdf, cliente) {
    const { doc, y, colors } = pdf;
    const pageWidth = PDF_CONFIG.pageWidth;

    // Verificar espacio suficiente para firmas
    if (pdf.getAvailableSpace() < 45) {
        pdf.addPage();
    }

    const leftX = (pageWidth / 2) - 45;
    const rightX = (pageWidth / 2) + 10;
    const signatureTopY = y + 10;

    // Líneas
    doc.setDrawColor(colors.dark);
    doc.setLineWidth(0.3);
    doc.line(leftX, signatureTopY, leftX + 90, signatureTopY);
    doc.line(rightX, signatureTopY, rightX + 90, signatureTopY);

    // Diego
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    doc.text('Diego Mancipe', leftX + 45, signatureTopY + 7, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colors.taupe);
    doc.text('Proveedor / Sound Engineer', leftX + 45, signatureTopY + 12, { align: 'center' });
    doc.text('CC: 1052416657', leftX + 45, signatureTopY + 17, { align: 'center' });

    // Cliente
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    const clienteNombre = cliente.nombre || 'Cliente';

    if (doc.getTextWidth(clienteNombre) > 85) {
        pdf.textWrapped(clienteNombre, rightX + 45, signatureTopY + 5, 85, 5, 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.taupe);
        doc.text('Cliente', rightX + 45, signatureTopY + 14, { align: 'center' });
    } else {
        doc.text(clienteNombre, rightX + 45, signatureTopY + 7, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.taupe);
        doc.text('Cliente', rightX + 45, signatureTopY + 12, { align: 'center' });
    }

    pdf.y = signatureTopY + 25;
}

// ===== 10. FOOTER =====
function addFooterToAllPages(doc, totalPages) {
    const colors = PDF_CONFIG.colors;
    const pageWidth = PDF_CONFIG.pageWidth;
    const pageHeight = PDF_CONFIG.pageHeight;

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(colors.taupe);
        doc.setLineWidth(0.3);
        doc.line(20, pageHeight - 18, pageWidth - 20, pageHeight - 18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.taupe);
        doc.text('DIECO MANCIPE - Sound Engineer & Music Producer | diegomancipe33@gmail.com | +57 (311) 537-8821',
                 pageWidth / 2, pageHeight - 13, { align: 'center' });
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
    return new Promise((resolve) => {
        if (window.jspdf) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

window.generarPDF = generarPDF;
window.PDF_CONFIG = PDF_CONFIG;
window.COMPANY_INFO = COMPANY_INFO;
window.PDFManager = PDFManager;
