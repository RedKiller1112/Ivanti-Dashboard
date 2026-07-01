import { useState, useRef } from 'react';
import { Upload as UploadIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { validarNombreArchivo, leerArchivoExcel } from '../services/excelService';
import type { DataProcessed } from '../types';

interface UploadProps {
  onDataLoaded: (data: DataProcessed) => void;
}

export const Upload = ({ onDataLoaded }: UploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setSuccess(false);
    
    // Validar extensión
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidExtension) {
      setError('Solo se aceptan archivos .xlsx o .xls');
      return;
    }
    
    // Validar nombre del archivo
    if (!validarNombreArchivo(file.name)) {
      setError('El nombre del archivo debe contener "Equipos en Ivanti"');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = await leerArchivoExcel(file);
      setSuccess(true);
      onDataLoaded(data);
    } catch (err) {
      setError('Error al procesar el archivo. Verifique el formato.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="upload-container">
      <form
        className={`upload-form ${dragActive ? 'drag-active' : ''} ${error ? 'has-error' : ''} ${success ? 'has-success' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          className="upload-input"
          accept=".xlsx,.xls"
          onChange={handleChange}
          disabled={loading}
        />
        
        {loading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Procesando archivo...</p>
          </div>
        ) : success ? (
          <div className="upload-success">
            <CheckCircle size={48} />
            <p>Archivo cargado correctamente</p>
          </div>
        ) : (
          <div className="upload-content">
            <UploadIcon size={48} />
            <p className="upload-title">Cargar archivo Excel</p>
            <p className="upload-text">
              Arrastra y suelta o haz clic para seleccionar
            </p>
            <p className="upload-hint">
              El archivo debe llamarse "Equipos en Ivanti.xlsx"
            </p>
          </div>
        )}
        
        {error && (
          <div className="upload-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default Upload;
