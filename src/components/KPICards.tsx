import { Monitor, CheckCircle, XCircle, Shield, ShieldCheck, AlertTriangle, Calendar } from 'lucide-react';
import type { KPIs } from '../types';

interface KPICardsProps {
  kpis: KPIs;
}

export const KPICards = ({ kpis }: KPICardsProps) => {
  const cards = [
    {
      title: 'Total de Equipos',
      value: kpis.totalEquipos.toLocaleString('es-MX'),
      icon: Monitor,
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      title: 'Equipos Conectados',
      value: kpis.equiposReportados.toLocaleString('es-MX'),
      icon: CheckCircle,
      color: '#10B981',
      bgColor: '#ECFDF5'
    },
    {
      title: 'Equipos No Reportados',
      value: kpis.equiposNoReportados.toLocaleString('es-MX'),
      icon: XCircle,
      color: '#EF4444',
      bgColor: '#FEF2F2'
    },
    {
      title: '% Cobertura Ivanti',
      value: `${kpis.porcentajeCoberturaIvanti}%`,
      icon: Shield,
      color: '#8B5CF6',
      bgColor: '#F5F3FF'
    },
    {
      title: '% Cobertura Sophos',
      value: `${kpis.porcentajeCoberturaSophos}%`,
      icon: ShieldCheck,
      color: '#F59E0B',
      bgColor: '#FFFBEB'
    },
    {
      title: 'Nombres Incorrectos',
      value: kpis.equiposConNombreIncorrecto.toLocaleString('es-MX'),
      icon: AlertTriangle,
      color: '#EC4899',
      bgColor: '#FDF2F8'
    },
    {
      title: 'Fecha de Generación',
      value: kpis.fechaGeneracion,
      icon: Calendar,
      color: '#6B7280',
      bgColor: '#F9FAFB'
    }
  ];

  return (
    <div className="kpi-cards">
      {cards.map((card, index) => (
        <div key={index} className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">{card.title}</span>
            <div 
              className="kpi-card-icon" 
              style={{ backgroundColor: card.bgColor, color: card.color }}
            >
              <card.icon size={20} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: card.color }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
