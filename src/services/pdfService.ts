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
  
  // Configurar opciones para html2canvas
  const options = {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  };
  
  // Capturar el contenido
  const canvas = await html2canvas(element, options);
  
// Calcular dimensiones paraPDF en orientaciónhorizontal (landscape)
  const imgWidth = 297; // A4 horizontal en mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Crear elPDF
  const pdf = new jsPDF('l', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');
  
  // Agregar la imagen al PDF
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
  // Generar nombre de archivo con fecha
  const fecha = new Date().toISOString().split('T')[0];
  pdf.save(`Dashboard_Ivanti_${fecha}.pdf`);
};
