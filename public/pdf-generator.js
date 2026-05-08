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
        top: 15,
        bottom: 20,
        left: 15,
        right: 15
    },
    pageWidth: 215.9,
    pageHeight: 279.4,
    headerHeight: 35,
    signatureHeight: 50
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
        pdf.y += 3;

        // 2. Línea divisoria
        pdf.drawDivider(pdf.y);
        pdf.y += 12;

        // 3. Título ORDEN DE COMPRA / FACTURA
        drawOrderHeader(pdf, tipo, moneda, datos);
        pdf.y += 12;

        // 4. DATOS DEL CLIENTE
        drawClientTable(pdf, datos.cliente);
        pdf.y += 12;

        // 5. DETALLE DE SERVICIOS
        pdf.y = drawServicesTable(pdf, datos.items, moneda, incluirIva);
        pdf.y += 12;

        // 6. DATOS DE PAGO
        drawPaymentTable(pdf, moneda);
        pdf.y += 5;

        // 7. Nota de pago
        drawPaymentNote(pdf);
        pdf.y += 8;

        // 8. CONDICIONES Y NOTAS - justo después del pago
        // Verificar espacio ANTES de dibujar condiciones + firmas
        const conditionsHeight = 40;
        const signaturesHeight = 40;
        const totalNeeded = conditionsHeight + signaturesHeight;

        if (pdf.getAvailableSpace() < totalNeeded) {
            pdf.addPage();
        }
        drawConditions(pdf);
        pdf.y += 10;

        // 9. FIRMAS - van al final de la página
        drawSignatures(pdf, datos.cliente);

        // 10. FOOTER
        addFooterToAllPages(doc, pdf.totalPages);

        const filename = outputName || `${tipo}_${datos.numero || 'sin_numero'}.pdf`;
        doc.save(filename);

        console.log('✅ PDF generado:', filename);
        return doc;
    } catch (error) {
        console.error('[PDF] Error:', error);
        alert('❌ Error al generar PDF: ' + error.message);
        throw error;
    }
}

// ===== 1. HEADER =====
function drawHeader(pdf) {
    const { doc, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const y = PDF_CONFIG.margins.top;

    // Nombre principal - más grande y en negrita
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(colors.burgundy);
    doc.text('DIECO MANCIPE', margin, y + 10);

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.taupe);
    doc.text('Sound Engineer & Music Producer', margin, y + 18);

    // Información de contacto - alineada a la derecha
    const infoX = PDF_CONFIG.pageWidth - margin;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colors.dark);

    doc.text(COMPANY_INFO.email, infoX, y + 8, { align: 'right' });
    doc.text(COMPANY_INFO.phone, infoX, y + 14, { align: 'right' });
    doc.text(COMPANY_INFO.address, infoX, y + 20, { align: 'right' });

    pdf.y = y + 28;
}

// ===== 3. ORDER HEADER =====
function drawOrderHeader(pdf, tipo, moneda, datos) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(colors.burgundy);
    const titulo = tipo === 'orden' ? 'ORDEN DE COMPRA' : 'FACTURA';
    doc.text(titulo, margin, y + 5);

    // Número de documento
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.dark);
    doc.text(`No: ${datos.numero || 'N/A'}`, margin, y + 11);

    // Fecha y moneda - derecha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const fecha = new Date().toLocaleDateString('es-CO');
    doc.text(`${fecha} | ${moneda}`, PDF_CONFIG.pageWidth - margin - 35, y + 8, { align: 'right' });

    pdf.y = y + 18;
}

// ===== 4. CLIENTE TABLE =====
function drawClientTable(pdf, cliente) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const contentWidth = PDF_CONFIG.pageWidth - (margin * 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colors.burgundy);
    doc.text('DATOS DEL CLIENTE', margin, y);

    const tableY = y + 4;
    const rowHeight = 5;
    const colWidth = contentWidth / 2;

    const neededSpace = 22;
    if (pdf.getAvailableSpace() < neededSpace) {
        pdf.addPage();
    }

    // Datos del cliente
    const clienteData = [
        { label: 'Nombre', value: cliente.nombre || '-' },
        { label: 'Documento', value: cliente.documento || '-' },
        { label: 'Email', value: cliente.email || '-' },
        { label: 'Teléfono', value: cliente.telefono || '-' }
    ];

    // Dibujar celdas
    clienteData.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const xPos = margin + (col * colWidth);
        const currentY = tableY + (row * rowHeight);

        // Fondo de celda
        doc.setFillColor(colors.cream);
        doc.rect(xPos, currentY - 3, colWidth - 2, rowHeight, 'F');

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(colors.taupe);
        doc.text(item.label + ':', xPos + 2, currentY - 0.5);

        // Value - usando splitTextToSize para que nunca se salga
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.dark);

        const valueMaxWidth = colWidth - 14;
        const valueText = item.value || '-';
        const wrappedValue = doc.splitTextToSize(valueText, valueMaxWidth);
        doc.text(wrappedValue, xPos + 13, currentY - 0.5);
    });

    // Borde exterior
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.25);
    doc.rect(margin, tableY - 3, contentWidth, rowHeight * 2);

    pdf.y = tableY + (rowHeight * 2) + 4;
}

// ===== 5. SERVICES TABLE =====
function drawServicesTable(pdf, items, moneda, incluirIva) {
    const { doc, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const contentWidth = PDF_CONFIG.pageWidth - (margin * 2);
    const rowHeight = 7;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.burgundy);
    doc.text('DETALLE DE SERVICIOS', margin, pdf.y);

    let tableY = pdf.y + 8;

    // Headers - ajustados para mejor distribución
    const headers = ['#', 'Descripción', 'Proyecto', 'Ref', 'V. Unit', 'Cant', 'Total'];
    const colWidths = [10, 45, 35, 18, 30, 15, 37];

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
    const totalsHeight = incluirIva ? 28 : 22;
    const totalNeeded = headerHeight + itemsHeight + totalsHeight + 50;

    // Si no cabe, nueva página
    if (pdf.getAvailableSpace() < totalNeeded) {
        pdf.addPage();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(colors.burgundy);
        doc.text('DETALLE DE SERVICIOS', margin, pdf.y);
        tableY = pdf.y + 8;
    }

    // Dibujar header
    drawTableHeader(doc, margin, contentWidth, tableY, rowHeight, headers, colWidths, colors);

    // Items
    let totalSinIva = 0;
    let currentY = tableY + rowHeight;

    itemRows.forEach((item, idx) => {
        // Verificar espacio para esta fila + totales
        const spaceNeeded = rowHeight + 35;
        if (currentY + spaceNeeded > PDF_CONFIG.pageHeight - PDF_CONFIG.margins.bottom) {
            pdf.addPage();
            const newTableY = PDF_CONFIG.margins.top + 8;
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
        // Número - centrado
        doc.text(item.num.toString(), x, currentY);
        x += colWidths[0];

        // Descripción - con wrapping controlado usando splitTextToSize
        const descMaxWidth = colWidths[1] - 6;
        const wrappedDesc = doc.splitTextToSize(item.nombre, descMaxWidth);
        doc.text(wrappedDesc, x + 2, currentY - 1);
        x += colWidths[1];

        // Proyecto - con wrapping usando splitTextToSize
        const proyMaxWidth = colWidths[2] - 6;
        const wrappedProy = item.proyecto ? doc.splitTextToSize(item.proyecto, proyMaxWidth) : ['-'];
        doc.text(wrappedProy, x + 2, currentY - 1);
        x += colWidths[2];

        // Referencia/ID - truncar si es muy largo
        const refText = (item.id || '-').toString();
        const refMaxWidth = colWidths[3] - 4;
        const wrappedRef = doc.splitTextToSize(refText, refMaxWidth);
        doc.text(wrappedRef, x + 2, currentY - 1);
        x += colWidths[3];

        // Valor unitario - right aligned
        const unitText = formatCurrency(item.precio, moneda);
        doc.text(unitText, x + colWidths[4] - 2, currentY, { align: 'right' });
        x += colWidths[4];

        // Cantidad - right aligned
        doc.text(item.cantidad.toString(), x + colWidths[5] - 2, currentY, { align: 'right' });
        x += colWidths[5];

        // Total - right aligned y en negrita
        doc.setFont('helvetica', 'bold');
        const totalText = formatCurrency(item.subtotal, moneda);
        const totalMaxWidth = colWidths[6] - 6;
        const wrappedTotal = doc.splitTextToSize(totalText, totalMaxWidth);
        doc.text(wrappedTotal, x + colWidths[6] - 2, currentY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        currentY += rowHeight;
    });

    // Totales - mejor presentados
    const totalsY = currentY + 6;
    let iva = incluirIva && moneda === 'COP' ? totalSinIva * 0.19 : 0;
    let totalFinal = totalSinIva + iva;

    const totalsX = PDF_CONFIG.pageWidth - margin - 70;

    // Línea superior
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.line(totalsX, totalsY - 3, PDF_CONFIG.pageWidth - margin, totalsY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Subtotal:', totalsX, totalsY + 4);
    doc.text(formatCurrency(totalSinIva, moneda), PDF_CONFIG.pageWidth - margin - 2, totalsY + 4, { align: 'right' });

    if (incluirIva && moneda === 'COP') {
        doc.text('IVA (19%):', totalsX, totalsY + 10);
        doc.text(formatCurrency(iva, moneda), PDF_CONFIG.pageWidth - margin - 2, totalsY + 10, { align: 'right' });
    }

    // Línea separadora antes del total
    doc.setDrawColor(colors.dark);
    doc.setLineWidth(0.5);
    const totalLineY = incluirIva && moneda === 'COP' ? totalsY + 14 : totalsY + 8;
    doc.line(totalsX, totalLineY, PDF_CONFIG.pageWidth - margin, totalLineY);

    // Total final - destacado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colors.burgundy);
    doc.text(`TOTAL (${moneda}):`, totalsX, totalLineY + 6);
    doc.text(formatCurrency(totalFinal, moneda), PDF_CONFIG.pageWidth - margin - 2, totalLineY + 6, { align: 'right' });

    return totalLineY + 15;
}

function drawTableHeader(doc, margin, contentWidth, y, rowHeight, headers, colWidths, colors) {
    // Header con fondo burgundy y bordes redondeados simulados
    doc.setFillColor(colors.burgundy);
    doc.rect(margin, y - 5, contentWidth, rowHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor('#ffffff');

    let x = margin + 3;
    headers.forEach((header, i) => {
        // Alineación específica por columna
        if (i === 4 || i === 5 || i === 6) { // Columnas numéricas - derecha
            doc.text(header, margin + colWidths.slice(0, i + 1).reduce((a, b) => a + b, 0) - 5, y, { align: 'right' });
        } else if (i === 0) { // Primera columna - centro
            doc.text(header, x + (colWidths[i] / 2), y, { align: 'center' });
        } else { // Resto - izquierda
            doc.text(header, x, y);
        }
        x += colWidths[i];
    });
}

// ===== 6. PAYMENT TABLE =====
function drawPaymentTable(pdf, moneda) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const contentWidth = PDF_CONFIG.pageWidth - (margin * 2);

    if (pdf.getAvailableSpace() < 55) {
        pdf.addPage();
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.burgundy);
    doc.text('DATOS PARA REALIZAR EL PAGO', margin, y);

    const tableY = y + 8;
    const colWidth = (contentWidth - 15) / 2;
    const rowHeight = 5;

    if (moneda === 'COP') {
        // Dos columnas: NEQUI y BANCOLOMBIA
        drawBankBox(pdf, margin, tableY, colWidth, rowHeight, {
            title: 'NEQUI',
            rows: [
                'Titular: D. A. Mancipe Dehaquiz',
                'Email: diegomancipe33@gmail.com',
                'Cel: 311 5378821',
                'Llave: @mancipe657'
            ]
        });
        drawBankBox(pdf, margin + colWidth + 10, tableY, colWidth, rowHeight, {
            title: 'BANCOLOMBIA',
            rows: [
                'Cta Ahorros: N. 15291719101',
                'SWIFT: COLOCOBM',
                'Titular: D. A. Mancipe Dehaquiz',
                'CC: 1052416657'
            ]
        });
    } else {
        // USD - PayPal + Bancolombia
        drawBankBox(pdf, margin, tableY, colWidth, rowHeight, {
            title: 'PAYPAL',
            rows: [
                `Email: ${COMPANY_INFO.paymentData.paypal.email}`
            ]
        });
        drawBankBox(pdf, margin + colWidth + 10, tableY, colWidth, rowHeight, {
            title: 'BANCOLOMBIA (Intl)',
            rows: [
                'Cta Ahorros: N. 15291719101',
                'SWIFT: COLOCOBM',
                'Titular: D. A. Mancipe Dehaquiz',
                'CC: 1052416657'
            ]
        });
    }

    pdf.y = tableY + 35;
}

function drawBankBox(pdf, x, y, width, rowHeight, bankData) {
    const { doc, colors } = pdf;

    // Título del banco con fondo
    doc.setFillColor(colors.burgundy);
    doc.rect(x, y - 4, width, rowHeight + 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor('#ffffff');
    doc.text(bankData.title, x + 3, y);

    // Filas de datos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(colors.dark);

    bankData.rows.forEach((row, idx) => {
        const rowY = y + 8 + (idx * rowHeight);
        doc.setFillColor(idx % 2 === 0 ? colors.creamLight : colors.white);
        doc.rect(x, rowY - 3, width, rowHeight, 'F');
        doc.text(row, x + 3, rowY);
    });

    // Borde
    doc.setDrawColor(colors.taupe);
    doc.setLineWidth(0.3);
    doc.rect(x, y - 4, width, 8 + (bankData.rows.length * rowHeight));
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
    doc.setFontSize(6);
    doc.setTextColor(colors.taupe);
    doc.text('Nota: Enviar comprobante de pago a diegomancipe33@gmail.com una vez realizado', PDF_CONFIG.pageWidth / 2, y, { align: 'center' });
}

// ===== 8. CONDITIONS =====
function drawConditions(pdf) {
    const { doc, y, colors } = pdf;
    const margin = PDF_CONFIG.margins.left;
    const contentWidth = PDF_CONFIG.pageWidth - (margin * 2);

    // Título igual que las demás secciones
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.burgundy);
    doc.text('CONDICIONES Y NOTAS', margin, y);

    const conditions = [
        '• Términos de pago: 50% al inicio, 50% contra entrega.',
        '• Tiempo de entrega: A convenir según alcance.',
        '• Revisiones: 2 rondas por etapa.',
        '• Validez: 15 días desde emisión.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.dark);
    conditions.forEach((cond, idx) => {
        doc.text(cond, margin, y + 7 + (idx * 5));
    });
}

// ===== 9. SIGNATURES =====
function drawSignatures(pdf, cliente) {
    const { doc, colors } = pdf;
    const pageWidth = PDF_CONFIG.pageWidth;
    const pageHeight = PDF_CONFIG.pageHeight;
    const margin = PDF_CONFIG.margins.left;

    // Firmas al final de la página - posición fija
    const signatureWidth = 75;
    const signatureGap = 25;
    const totalSignaturesWidth = (signatureWidth * 2) + signatureGap;
    const startX = (pageWidth - totalSignaturesWidth) / 2;

    // Posicionar firmas cerca del footer (antes del footer)
    const signatureTopY = pageHeight - 55;

    const leftX = startX;
    const rightX = startX + signatureWidth + signatureGap;

    // Líneas de firma
    doc.setDrawColor(colors.dark);
    doc.setLineWidth(0.5);
    doc.line(leftX, signatureTopY, leftX + signatureWidth, signatureTopY);
    doc.line(rightX, signatureTopY, rightX + signatureWidth, signatureTopY);

    // Diego Mancipe - izquierda
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    doc.text('Diego Mancipe', leftX + (signatureWidth / 2), signatureTopY + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colors.taupe);
    doc.text('Sound Engineer & Music Producer', leftX + (signatureWidth / 2), signatureTopY + 11, { align: 'center' });
    doc.text('CC: 1052416657', leftX + (signatureWidth / 2), signatureTopY + 16, { align: 'center' });

    // Cliente - derecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.burgundy);
    const clienteNombre = cliente.nombre || 'Cliente';

    // Texto del cliente con wrapping si es muy largo
    const maxNameWidth = signatureWidth - 10;
    if (doc.getTextWidth(clienteNombre) > maxNameWidth) {
        const truncated = doc.splitTextToSize(clienteNombre, maxNameWidth / 2);
        doc.text(truncated[0], rightX + (signatureWidth / 2), signatureTopY + 6, { align: 'center' });
        if (truncated.length > 1) {
            doc.text(truncated[1], rightX + (signatureWidth / 2), signatureTopY + 11, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(colors.taupe);
            doc.text('Cliente', rightX + (signatureWidth / 2), signatureTopY + 17, { align: 'center' });
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(colors.taupe);
            doc.text('Cliente', rightX + (signatureWidth / 2), signatureTopY + 11, { align: 'center' });
        }
    } else {
        doc.text(clienteNombre, rightX + (signatureWidth / 2), signatureTopY + 6, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(colors.taupe);
        doc.text('Cliente', rightX + (signatureWidth / 2), signatureTopY + 11, { align: 'center' });
    }

    pdf.y = signatureTopY + 25;
}

// ===== 10. FOOTER =====
function addFooterToAllPages(doc, totalPages) {
    const colors = PDF_CONFIG.colors;
    const pageWidth = PDF_CONFIG.pageWidth;
    const pageHeight = PDF_CONFIG.pageHeight;
    const margin = PDF_CONFIG.margins.left;

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Línea divisoria del footer
        doc.setDrawColor(colors.taupe);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

        // Texto central
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(colors.taupe);
        doc.text('DIECO MANCIPE - Sound Engineer & Music Producer',
                 pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text('diegomancipe33@gmail.com | +57 (311) 537-8821 | Bogotá, Colombia',
                 pageWidth / 2, pageHeight - 11, { align: 'center' });

        // Número de página
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 2, pageHeight - 15, { align: 'right' });
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
