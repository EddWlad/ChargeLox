import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

type PrintableRecord = Record<string, unknown>;
type PdfDocument = InstanceType<typeof PDFDocument>;

type FooterOptions = {
  left: string;
  center?: string;
  rightLabel?: string;
};

type BadgeColors = {
  background: string;
  text: string;
  dot?: string;
};

const COLORS = {
  bg: '#ffffff',
  textStrong: '#15213b',
  text: '#34435e',
  textMuted: '#8593a8',
  line: '#d9e1ec',
  lineStrong: '#2f5db9',
  primary: '#247ae8',
  primaryDark: '#1d4da1',
  panel: '#f3f6fb',
  panelSoft: '#f8fafd',
};

@Injectable()
export class ReportsService {
  private readonly margin = 46;

  private stringify(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      return value;
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return `${value}`;
    }

    if (typeof value === 'symbol') {
      return value.description ?? 'symbol';
    }

    try {
      return JSON.stringify(value);
    } catch {
      return '[valor no serializable]';
    }
  }

  private parseDate(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  }

  private formatDate(value: unknown): string {
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
    ) {
      return value;
    }

    const parsed = this.parseDate(value);
    if (!parsed) {
      return this.stringify(value);
    }

    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(parsed);
  }

  private formatDateTime(value: unknown): string {
    const parsed = this.parseDate(value);
    if (!parsed) {
      return this.stringify(value);
    }

    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(parsed);
  }

  private formatTime(value: unknown): string {
    const parsed = this.parseDate(value);
    if (!parsed) {
      return this.stringify(value);
    }

    return new Intl.DateTimeFormat('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(parsed);
  }

  private formatHours(value: unknown): string {
    const numeric =
      typeof value === 'number'
        ? value
        : Number.parseFloat(this.stringify(value) || '0');

    if (Number.isNaN(numeric)) {
      return '0.00 h';
    }

    return `${numeric.toFixed(2)} h`;
  }

  private formatBytes(value: unknown): string {
    const numeric =
      typeof value === 'number'
        ? value
        : Number.parseFloat(this.stringify(value) || '0');

    if (Number.isNaN(numeric)) {
      return '0 bytes';
    }

    if (numeric < 1024) {
      return `${Math.round(numeric)} bytes`;
    }

    const kb = numeric / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  }

  private formatEnum(value: unknown): string {
    const raw = this.stringify(value);
    if (!raw) {
      return '-';
    }

    return raw.replaceAll('_', ' ').trim();
  }

  private createDocument(): PdfDocument {
    const doc = new PDFDocument({
      margin: this.margin,
      size: 'A4',
      bufferPages: true,
      autoFirstPage: true,
    });
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(10);
    return doc;
  }

  private getBottomLimit(doc: PdfDocument): number {
    return doc.page.height - doc.page.margins.bottom - 48;
  }

  private ensureSpace(doc: PdfDocument, requiredHeight: number): boolean {
    if (doc.y + requiredHeight <= this.getBottomLimit(doc)) {
      return false;
    }

    doc.addPage();
    return true;
  }

  private drawClassicHeader(
    doc: PdfDocument,
    title: string,
    subtitle: string,
  ): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const top = doc.page.margins.top - 8;

    doc.save();
    doc.roundedRect(left, top, 22, 22, 5).fill(COLORS.primaryDark);
    doc.restore();

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('C', left, top + 7, { width: 22, align: 'center', lineBreak: false });

    doc
      .fillColor(COLORS.textStrong)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('CHARGELOX', left + 30, top + 2, {
        width: 190,
        lineBreak: false,
      });

    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(8.5)
      .text('Sistemas de Monitoreo Inteligente', left, top + 29, {
        width: 240,
        lineBreak: false,
      });

    doc
      .fillColor(COLORS.primaryDark)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(title.toUpperCase(), right - 250, top + 1, {
        width: 250,
        align: 'right',
        lineBreak: false,
      });

    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(8.5)
      .text(`Generado: ${this.formatDateTime(new Date())}`, right - 250, top + 19, {
        width: 250,
        align: 'right',
      });

    const lineY = top + 47;
    doc
      .moveTo(left, lineY)
      .lineTo(right, lineY)
      .lineWidth(1.4)
      .strokeColor(COLORS.lineStrong)
      .stroke();

    doc.y = lineY + 14;
    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(9)
      .text(subtitle, left, doc.y, { width: right - left });

    doc.y += 8;
  }

  private drawListHeader(doc: PdfDocument): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const top = doc.page.margins.top - 4;

    doc.save();
    doc.roundedRect(left, top, 28, 28, 5).fill(COLORS.primary);
    doc.restore();

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('CL', left, top + 9, { width: 28, align: 'center', lineBreak: false });

    doc
      .fillColor(COLORS.textStrong)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text('Listado Público de Puntos de Carga', left + 38, top + 2, {
        width: 290,
        lineBreak: false,
      });

    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(8.8)
      .text('ChargeLox Management System', left + 38, top + 22, {
        width: 260,
      });

    doc
      .fillColor('#9ba9bd')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('FECHA DE GENERACIÓN', right - 160, top + 2, {
        width: 160,
        align: 'right',
      });

    doc
      .fillColor(COLORS.text)
      .font('Helvetica')
      .fontSize(10.2)
      .text(this.formatDate(new Date()), right - 160, top + 14, {
        width: 160,
        align: 'right',
      });

    const lineY = top + 46;
    doc
      .moveTo(left, lineY)
      .lineTo(right, lineY)
      .lineWidth(1)
      .strokeColor(COLORS.line)
      .stroke();

    doc.y = lineY + 16;
  }

  private drawFooter(doc: PdfDocument, options: FooterOptions): void {
    const range = doc.bufferedPageRange();
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const pageCount = range.count;

    for (let index = 0; index < pageCount; index += 1) {
      doc.switchToPage(index);

      const lineY = doc.page.height - doc.page.margins.bottom - 22;
      const textY = lineY + 7;

      doc
        .moveTo(left, lineY)
        .lineTo(right, lineY)
        .lineWidth(0.6)
        .strokeColor(COLORS.line)
        .stroke();

      doc
        .fillColor('#b1bccb')
        .font('Helvetica-Bold')
        .fontSize(7.2)
        .text(options.left, left, textY, { width: 170 });

      if (options.center) {
        doc
          .fillColor('#b1bccb')
          .font('Helvetica-Bold')
          .fontSize(7.2)
          .text(options.center, left + 170, textY, { width: 170, align: 'center' });
      }

      const rightLabel = options.rightLabel ?? `PÁGINA ${index + 1} DE ${pageCount}`;
      doc
        .fillColor('#b1bccb')
        .font('Helvetica-Bold')
        .fontSize(7.2)
        .text(rightLabel, right - 160, textY, { width: 160, align: 'right' });
    }
  }

  private toBuffer(doc: PdfDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => {
        reject(
          error instanceof Error ? error : new Error('Error generando PDF.'),
        );
      });
      doc.end();
    });
  }

  private resolveBadgeColors(type: 'priority' | 'connection' | 'activity', value: string): BadgeColors {
    if (type === 'priority') {
      if (value === 'ALTA') {
        return { background: '#fbe1e2', text: '#c0464a' };
      }
      if (value === 'MEDIA') {
        return { background: '#fdebd5', text: '#b77324' };
      }
      return { background: '#ebeff5', text: '#77869d' };
    }

    if (type === 'connection') {
      if (value === 'OK') {
        return { background: '#dff5e6', text: '#1e9e5f', dot: '#1e9e5f' };
      }
      if (value === 'CONECTANDO') {
        return { background: '#e5ecff', text: '#426bd4', dot: '#426bd4' };
      }
      return { background: '#f9e2e4', text: '#d06469', dot: '#bf3138' };
    }

    if (value === 'COMPLETADA') {
      return { background: '#dff5e6', text: '#1e9e5f' };
    }
    if (value === 'EN_PROCESO') {
      return { background: '#fdebd5', text: '#b77324' };
    }
    return { background: '#e7edf5', text: '#597394' };
  }

  private drawBadge(
    doc: PdfDocument,
    text: string,
    x: number,
    y: number,
    colors: BadgeColors,
    withDot = false,
  ): void {
    const label = text.trim();
    doc.font('Helvetica-Bold').fontSize(8.2);

    const textWidth = doc.widthOfString(label);
    const width = Math.max(withDot ? 54 : 44, textWidth + (withDot ? 22 : 14));
    const height = 15;

    doc.save();
    doc.roundedRect(x, y, width, height, 7).fill(colors.background);
    doc.restore();

    if (withDot && colors.dot) {
      doc.save();
      doc.circle(x + 7.2, y + height / 2, 2.3).fill(colors.dot);
      doc.restore();
    }

    const textX = withDot ? x + 12 : x;
    const textWidthAvailable = withDot ? width - 12 : width;
    doc
      .fillColor(colors.text)
      .font('Helvetica-Bold')
      .fontSize(8.2)
      .text(label, textX, y + 4, {
        width: textWidthAvailable,
        align: 'center',
        lineBreak: false,
      });
  }

  private drawSectionTitle(doc: PdfDocument, title: string): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    doc
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .text(title.toUpperCase(), left, doc.y, { width: right - left });
    doc.y += 4;
    doc
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .lineWidth(0.8)
      .strokeColor(COLORS.line)
      .stroke();
    doc.y += 10;
  }

  async buildChargingPointsListPdf(items: PrintableRecord[]): Promise<Buffer> {
    const doc = this.createDocument();
    this.drawListHeader(doc);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const widths = [130, 60, 78, 88, 92, 51];
    const rowHeight = 38;
    const headerHeight = 26;
    const drawTableHeader = () => {
      let x = left;
      const labels = ['NOMBRE', 'CÓDIGO', 'PRIORIDAD', 'ESTADO', 'CONEXIÓN', 'TIPO'];
      doc.save();
      doc.roundedRect(left, doc.y, right - left, headerHeight, 3).fill(COLORS.primary);
      doc.restore();

      labels.forEach((label, index) => {
        doc
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .fontSize(8.3)
          .text(label, x + 8, doc.y + 9, {
            width: widths[index] - 10,
            lineBreak: false,
          });
        x += widths[index];
      });

      doc.y += headerHeight + 4;
    };

    drawTableHeader();

    if (items.length === 0) {
      doc
        .fillColor(COLORS.textMuted)
        .font('Helvetica')
        .fontSize(10)
        .text('No hay puntos públicos para mostrar.', left, doc.y + 12);
    }

    items.forEach((item, index) => {
      if (this.ensureSpace(doc, rowHeight + 6)) {
        this.drawListHeader(doc);
        drawTableHeader();
      }

      const y = doc.y;
      const bg = index % 2 === 0 ? COLORS.bg : COLORS.panelSoft;
      doc.save();
      doc.roundedRect(left, y, right - left, rowHeight, 2).fill(bg);
      doc.restore();

      let x = left;
      doc
        .fillColor(COLORS.textStrong)
        .font('Helvetica-Bold')
        .fontSize(9.4)
        .text(this.stringify(item.nombre), x + 8, y + 8, {
          width: widths[0] - 14,
          height: rowHeight - 8,
        });
      x += widths[0];

      doc
        .fillColor('#7f90a9')
        .font('Helvetica-Bold')
        .fontSize(8.8)
        .text(this.stringify(item.codigoAsignado), x + 8, y + 12, {
          width: widths[1] - 12,
          lineBreak: false,
        });
      x += widths[1];

      this.drawBadge(
        doc,
        this.formatEnum(item.prioridad),
        x + 8,
        y + 11,
        this.resolveBadgeColors('priority', this.stringify(item.prioridad)),
      );
      x += widths[2];

      doc
        .fillColor('#50627e')
        .font('Helvetica')
        .fontSize(9.2)
        .text(this.formatEnum(item.estado), x + 8, y + 12, {
          width: widths[3] - 14,
          lineBreak: false,
        });
      x += widths[3];

      this.drawBadge(
        doc,
        this.formatEnum(item.estadoConexion),
        x + 8,
        y + 11,
        this.resolveBadgeColors('connection', this.stringify(item.estadoConexion)),
        true,
      );
      x += widths[4];

      doc
        .fillColor('#5c6f8c')
        .font('Helvetica')
        .fontSize(9.2)
        .text(this.formatEnum(item.tipo), x + 8, y + 12, {
          width: widths[5] - 12,
          lineBreak: false,
        });

      doc.y += rowHeight + 2;
    });

    this.drawFooter(doc, {
      left: 'CHARGELOX BY EDISON MOROCHO',
      rightLabel: 'PÁGINA 1 DE 1',
    });
    return this.toBuffer(doc);
  }

  async buildChargingPointDetailPdf(item: PrintableRecord): Promise<Buffer> {
    const doc = this.createDocument();
    this.drawClassicHeader(doc, 'Reporte Detallado', 'Estación de Carga / Electrolinera');

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    doc
      .fillColor(COLORS.textStrong)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(this.stringify(item.nombre) || 'Punto de carga', left, doc.y + 6, {
        width,
      });
    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(9)
      .text('Información técnica del punto de suministro eléctrico.', left, doc.y + 3, {
        width,
      });
    doc.y += 14;

    const cardY = doc.y;
    doc.save();
    doc.roundedRect(left, cardY, width, 58, 8).fill(COLORS.panel);
    doc.restore();

    doc
      .fillColor(COLORS.textStrong)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(this.stringify(item.nombre) || 'Sin nombre', left + 14, cardY + 16, {
        width: width - 24,
        lineBreak: false,
      });

    doc
      .fillColor(COLORS.textMuted)
      .font('Helvetica')
      .fontSize(9)
      .text('Datos operativos del equipo y estado de conexión.', left + 14, cardY + 37, {
        width: width - 24,
      });

    doc.y = cardY + 72;

    doc.save();
    doc.rotate(-45, { origin: [left + width / 2, doc.y + 160] });
    doc.fillColor('#d9e2ef').fillOpacity(0.16).font('Helvetica-Bold').fontSize(64);
    doc.text('CHARGELOX', left + 58, doc.y + 85, { lineBreak: false });
    doc.restore();
    doc.fillOpacity(1);

    const columnWidth = (width - 20) / 2;
    const leftCol = left + 4;
    const rightCol = left + columnWidth + 16;
    let y = doc.y + 8;

    const drawLabel = (label: string, value: string, x: number) => {
      doc
        .fillColor('#65758b')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(label, x, y, { width: columnWidth - 8 });
      doc
        .fillColor(COLORS.textStrong)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(value || '-', x, y + 13, {
          width: columnWidth - 8,
        });
    };

    drawLabel('NOMBRE DEL PUNTO', this.stringify(item.nombre), leftCol);
    drawLabel('CÓDIGO ASIGNADO', this.stringify(item.codigoAsignado), rightCol);
    y += 52;

    doc
      .fillColor('#65758b')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('PRIORIDAD DE ATENCIÓN', leftCol, y, { width: columnWidth - 8 });
    this.drawBadge(
      doc,
      this.formatEnum(item.prioridad),
      leftCol,
      y + 14,
      this.resolveBadgeColors('priority', this.stringify(item.prioridad)),
    );

    drawLabel('TIPO DE ESTACIÓN', this.formatEnum(item.tipo), rightCol);
    y += 52;

    doc
      .fillColor('#65758b')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('PROTOCOLO / ESTADO', leftCol, y, { width: columnWidth - 8 });

    doc.save();
    doc.circle(leftCol + 4, y + 23, 2.4).fill('#19a15e');
    doc.restore();
    doc
      .fillColor(COLORS.textStrong)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(this.formatEnum(item.estado), leftCol + 11, y + 18, {
        width: columnWidth - 18,
      });

    doc
      .fillColor('#65758b')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('ESTADO DE CONEXIÓN', rightCol, y, { width: columnWidth - 8 });
    this.drawBadge(
      doc,
      this.formatEnum(item.estadoConexion),
      rightCol,
      y + 14,
      this.resolveBadgeColors('connection', this.stringify(item.estadoConexion)),
      true,
    );

    doc.y = y + 102;

    this.drawFooter(doc, {
      left: 'DOCUMENTO OFICIAL DE AUDITORÍA - CHARGELOX E-MOBILITY',
      center: 'ChargeLox By Edison Morocho',
      rightLabel: 'PÁGINA 1 DE 1',
    });
    return this.toBuffer(doc);
  }

  async buildShiftHistoryPdf(items: PrintableRecord[]): Promise<Buffer> {
    const doc = this.createDocument();
    this.drawClassicHeader(doc, 'Historial de Turnos', 'Historial de turnos de monitoreo');

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const widths = [98, 88, 88, 98, 82];
    const rowHeight = 32;
    const headerHeight = 28;

    const drawTableHeader = () => {
      const y = doc.y;
      doc.save();
      doc.roundedRect(left, y, right - left, headerHeight, 2).fill(COLORS.panel);
      doc.restore();

      const labels = ['FECHA', 'HORA INICIO', 'HORA FIN', 'TOTAL HORAS', 'ESTADO'];
      let x = left;
      labels.forEach((label, index) => {
        doc
          .fillColor('#51627a')
          .font('Helvetica-Bold')
          .fontSize(8.6)
          .text(label, x + 8, y + 10, {
            width: widths[index] - 10,
            lineBreak: false,
          });
        x += widths[index];
      });
      doc.y += headerHeight + 3;
    };

    drawTableHeader();

    let totalHoras = 0;

    if (items.length === 0) {
      doc
        .fillColor(COLORS.textMuted)
        .font('Helvetica')
        .fontSize(10)
        .text('No hay turnos registrados para este usuario.', left, doc.y + 12);
    }

    items.forEach((item, index) => {
      if (this.ensureSpace(doc, rowHeight + 5)) {
        this.drawClassicHeader(doc, 'Historial de Turnos', 'Historial de turnos de monitoreo');
        drawTableHeader();
      }

      const y = doc.y;
      const bg = index % 2 === 0 ? COLORS.bg : COLORS.panelSoft;
      doc.save();
      doc.roundedRect(left, y, right - left, rowHeight, 2).fill(bg);
      doc.restore();

      const hoursValue = Number.parseFloat(this.stringify(item.totalHoras) || '0');
      if (!Number.isNaN(hoursValue)) {
        totalHoras += hoursValue;
      }

      const cells = [
        this.formatDate(item.fechaTurno),
        this.formatTime(item.horaInicio),
        item.horaFin ? this.formatTime(item.horaFin) : '-',
        this.formatHours(item.totalHoras),
      ];

      let x = left;
      cells.forEach((value, cellIndex) => {
        doc
          .fillColor('#4c5f7b')
          .font(cellIndex === 3 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9.4)
          .text(value, x + 8, y + 11, {
            width: widths[cellIndex] - 12,
            lineBreak: false,
          });
        x += widths[cellIndex];
      });

      this.drawBadge(
        doc,
        this.formatEnum(item.estadoTurno),
        x + 8,
        y + 9,
        this.resolveBadgeColors(
          'activity',
          this.stringify(item.estadoTurno) === 'CERRADO'
            ? 'COMPLETADA'
            : 'EN_PROCESO',
        ),
      );

      doc.y += rowHeight + 2;
    });

    this.ensureSpace(doc, 34);
    const totalX = right - 190;
    doc
      .fillColor('#5b6d86')
      .font('Helvetica-Bold')
      .fontSize(10.2)
      .text('Total Acumulado:', totalX, doc.y + 12, {
        width: 110,
        align: 'right',
      });
    doc
      .fillColor(COLORS.primaryDark)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(this.formatHours(totalHoras), totalX + 114, doc.y + 8, {
        width: 70,
        align: 'right',
      });

    this.drawFooter(doc, {
      left: 'CHARGELOX BY EDISON MOROCHO',
      center: 'DOCUMENTO OFICIAL DE AUDITORÍA',
    });
    return this.toBuffer(doc);
  }

  async buildActivityDetailPdf(payload: {
    activity: PrintableRecord;
    comments: PrintableRecord[];
    attachments: PrintableRecord[];
  }): Promise<Buffer> {
    const doc = this.createDocument();
    this.drawClassicHeader(
      doc,
      'Reporte de Actividad',
      'Gestión de Carga Eléctrica',
    );

    const activity = payload.activity;
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;
    const columnWidth = (width - 20) / 2;

    this.drawSectionTitle(doc, 'Datos de la actividad');

    let y = doc.y;
    const writeMetric = (
      label: string,
      value: string,
      x: number,
      badge?: { value: string; type: 'priority' | 'activity' },
    ) => {
      doc
        .fillColor('#63748c')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(label, x, y, { width: columnWidth - 8 });

      if (badge) {
        this.drawBadge(
          doc,
          badge.value,
          x,
          y + 14,
          this.resolveBadgeColors(badge.type, badge.value),
        );
      } else {
        doc
          .fillColor(COLORS.textStrong)
          .font('Helvetica-Bold')
          .fontSize(12)
          .text(value || '-', x, y + 13, {
            width: columnWidth - 8,
          });
      }
    };

    const chargingPointRef = (() => {
      const chargingPointNombre = this.stringify(activity.chargingPointNombre);
      if (chargingPointNombre) {
        return chargingPointNombre;
      }

      const chargingPoint = activity.chargingPoint;
      if (chargingPoint && typeof chargingPoint === 'object') {
        const name = (chargingPoint as PrintableRecord).nombre;
        if (name) {
          return this.stringify(name);
        }
      }

      return 'No asociado';
    })();

    writeMetric('TIPO DE ACTIVIDAD', this.formatEnum(activity.tipoActividad), left);
    writeMetric('PRIORIDAD', '', left + columnWidth + 20, {
      value: this.formatEnum(activity.prioridad),
      type: 'priority',
    });
    y += 54;

    writeMetric('ESTADO ACTUAL', '', left, {
      value: this.formatEnum(activity.estado),
      type: 'activity',
    });
    writeMetric('PUNTO DE CARGA', chargingPointRef, left + columnWidth + 20);
    y += 54;

    writeMetric('CREADO POR', this.stringify(activity.creadoPorNombre), left);
    writeMetric(
      'FECHA DE NOTIFICACIÓN',
      this.formatDateTime(activity.fechaNovedad ?? activity.createdAt),
      left + columnWidth + 20,
    );
    y += 58;

    doc.y = y;
    doc
      .fillColor('#63748c')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('DESCRIPCIÓN', left, doc.y, { width });

    const descriptionY = doc.y + 6;
    const descriptionHeight = Math.max(
      32,
      doc.heightOfString(this.stringify(activity.descripcion), {
        width: width - 24,
      }) + 14,
    );

    doc.save();
    doc.roundedRect(left, descriptionY, width, descriptionHeight, 4).fill(COLORS.panel);
    doc.restore();

    doc.save();
    doc
      .moveTo(left + 6, descriptionY + 5)
      .lineTo(left + 6, descriptionY + descriptionHeight - 5)
      .lineWidth(2)
      .strokeColor(COLORS.primary)
      .stroke();
    doc.restore();

    doc
      .fillColor(COLORS.text)
      .font('Helvetica-Oblique')
      .fontSize(11)
      .text(`"${this.stringify(activity.descripcion)}"`, left + 14, descriptionY + 10, {
        width: width - 24,
      });

    doc.y = descriptionY + descriptionHeight + 14;
    this.drawSectionTitle(doc, 'Comentarios de seguimiento');

    if (payload.comments.length === 0) {
      doc
        .fillColor(COLORS.textMuted)
        .font('Helvetica')
        .fontSize(10)
        .text('Sin comentarios registrados para esta actividad.', left, doc.y + 6);
      doc.y += 28;
    } else {
      payload.comments.forEach((comment) => {
        const commentText = this.stringify(comment.comentario);
        const estadoNuevo = this.stringify(comment.estadoNuevo);
        const textHeight = doc.heightOfString(commentText, { width: width - 26 });
        const cardHeight = 42 + textHeight + (estadoNuevo ? 18 : 0);

        if (this.ensureSpace(doc, cardHeight + 8)) {
          this.drawClassicHeader(
            doc,
            'Reporte de Actividad',
            'Gestión de Carga Eléctrica',
          );
          this.drawSectionTitle(doc, 'Comentarios de seguimiento');
        }

        const cardY = doc.y;
        doc.save();
        doc.roundedRect(left, cardY, width, cardHeight, 4).fill(COLORS.panelSoft);
        doc.restore();

        doc
          .fillColor(COLORS.textStrong)
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(this.stringify(comment.nombreUsuario) || 'Usuario', left + 10, cardY + 10, {
            width: width / 2,
          });

        doc
          .fillColor(COLORS.textMuted)
          .font('Helvetica')
          .fontSize(8.5)
          .text(this.formatDateTime(comment.fechaComentario), right - 170, cardY + 10, {
            width: 160,
            align: 'right',
          });

        doc
          .fillColor(COLORS.text)
          .font('Helvetica')
          .fontSize(10.4)
          .text(commentText, left + 10, cardY + 25, {
            width: width - 20,
          });

        if (estadoNuevo) {
          const statusY = cardY + 28 + textHeight;
          doc
            .fillColor('#6c7b91')
            .font('Helvetica')
            .fontSize(9)
            .text('Cambio de estado:', left + 10, statusY, {
              width: 90,
              lineBreak: false,
            });
          this.drawBadge(
            doc,
            this.formatEnum(estadoNuevo),
            left + 102,
            statusY - 4,
            this.resolveBadgeColors('activity', estadoNuevo),
          );
        }

        doc.y = cardY + cardHeight + 7;
      });
    }

    this.ensureSpace(doc, 100);
    this.drawSectionTitle(doc, 'Archivos adjuntos');

    if (payload.attachments.length === 0) {
      doc
        .fillColor(COLORS.textMuted)
        .font('Helvetica')
        .fontSize(10)
        .text('Sin archivos adjuntos.', left, doc.y + 6);
    } else {
      const headerY = doc.y;
      const widths = [250, 130, width - 380];
      doc.save();
      doc.roundedRect(left, headerY, width, 25, 3).fill(COLORS.panel);
      doc.restore();

      const labels = ['NOMBRE DEL ARCHIVO', 'TIPO', 'TAMAÑO'];
      let x = left;
      labels.forEach((label, index) => {
        doc
          .fillColor('#7b8da5')
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(label, x + 8, headerY + 9, {
            width: widths[index] - 12,
            lineBreak: false,
          });
        x += widths[index];
      });

      doc.y += 28;

      payload.attachments.forEach((attachment, index) => {
        const rowHeight = 26;
        if (this.ensureSpace(doc, rowHeight + 4)) {
          this.drawClassicHeader(
            doc,
            'Reporte de Actividad',
            'Gestión de Carga Eléctrica',
          );
          this.drawSectionTitle(doc, 'Archivos adjuntos');
        }

        const yRow = doc.y;
        const bg = index % 2 === 0 ? COLORS.bg : COLORS.panelSoft;
        doc.save();
        doc.roundedRect(left, yRow, width, rowHeight, 2).fill(bg);
        doc.restore();

        let rowX = left;
        doc
          .fillColor(COLORS.text)
          .font('Helvetica')
          .fontSize(9.2)
          .text(this.stringify(attachment.nombreOriginal), rowX + 8, yRow + 9, {
            width: widths[0] - 14,
            lineBreak: false,
          });
        rowX += widths[0];

        doc
          .fillColor('#5b6e88')
          .font('Helvetica')
          .fontSize(9.2)
          .text(this.stringify(attachment.mimeType), rowX + 8, yRow + 9, {
            width: widths[1] - 12,
            lineBreak: false,
          });
        rowX += widths[1];

        doc
          .fillColor('#5b6e88')
          .font('Helvetica')
          .fontSize(9.2)
          .text(this.formatBytes(attachment.tamano), rowX + 8, yRow + 9, {
            width: widths[2] - 12,
            lineBreak: false,
          });

        doc.y = yRow + rowHeight + 2;
      });
    }

    this.drawFooter(doc, {
      left: 'Este documento es un reporte oficial del sistema ChargeLox.',
      center: `ID de Transacción: ${this.stringify(activity.id)}`,
      rightLabel: 'CHARGELOX BY EDISON MOROCHO',
    });
    return this.toBuffer(doc);
  }
}


