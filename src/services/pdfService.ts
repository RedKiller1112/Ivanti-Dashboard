import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Servicio para exportar el dashboard a PDF
 */

export const exportarAPDF = async (elementId: string): Promise<void> => {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error('No se encontró el elemento del dashboard');
  }

  const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 2));

  // Forzar tema visual de la app durante captura para mantener "esencia" (fondo, contraste, glow)
  const previousBodyBackground = document.body.style.background;
  const previousBodyColor = document.body.style.color;
  document.body.style.background =
    'radial-gradient(circle at 15% 10%, rgba(244, 123, 32, 0.24), transparent 42%), radial-gradient(circle at 85% 20%, rgba(139, 92, 246, 0.24), transparent 42%), linear-gradient(145deg, #2a3f67 0%, #365385 45%, #2b446f 100%)';
  document.body.style.color = '#f7fbff';

  // Captura completa del dashboard con dimensiones reales (sin lavado claro)
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    allowTaint: true,
    backgroundColor: '#2a3f67',
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: Math.max(document.documentElement.clientWidth, element.scrollWidth),
    windowHeight: Math.max(document.documentElement.clientHeight, element.scrollHeight),
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const clonedBody = clonedDoc.body;
      clonedBody.style.background =
        'radial-gradient(circle at 15% 10%, rgba(244, 123, 32, 0.24), transparent 42%), radial-gradient(circle at 85% 20%, rgba(139, 92, 246, 0.24), transparent 42%), linear-gradient(145deg, #2a3f67 0%, #365385 45%, #2b446f 100%)';
      clonedBody.style.color = '#f7fbff';
      const clonedElement = clonedDoc.getElementById(elementId);
      if (clonedElement) {
        clonedElement.scrollTop = 0;
        clonedElement.scrollLeft = 0;
      }
    }
  });

  // Restaurar estilos originales
  document.body.style.background = previousBodyBackground;
  document.body.style.color = previousBodyColor;

  const context = canvas.getContext('2d');
  if (context) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.globalCompositeOperation = 'source-over';
  }

  // PDF A4 horizontal con márgenes para no pegar contenido a los bordes
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 6;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;

  const imgData = canvas.toDataURL('image/png', 1.0);

  const ratio = printableWidth / canvas.width;
  const totalScaledHeight = canvas.height * ratio;
  let remainingHeight = totalScaledHeight;
  let sourceY = 0;
  const pageSourceHeightPx = Math.floor(printableHeight / ratio);

  while (remainingHeight > 0) {
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.min(pageSourceHeightPx, canvas.height - sourceY);

    const pageCtx = pageCanvas.getContext('2d');
    if (!pageCtx) break;

    pageCtx.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      pageCanvas.height,
      0,
      0,
      canvas.width,
      pageCanvas.height
    );

    const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
    const pageImgHeight = pageCanvas.height * ratio;

    if (sourceY > 0) {
      pdf.addPage();
    }

    pdf.addImage(pageImgData, 'PNG', margin, margin, printableWidth, pageImgHeight, undefined, 'FAST');

    sourceY += pageCanvas.height;
    remainingHeight -= printableHeight;
  }

  // Generar nombre de archivo con fecha
  const fecha = new Date().toISOString().split('T')[0];
  pdf.save(`Dashboard_Ivanti_${fecha}.pdf`);
};
