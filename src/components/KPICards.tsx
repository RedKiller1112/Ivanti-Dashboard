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
      color: '#4EA1FF',
      bgColor: 'rgba(78, 161, 255, 0.16)',
      glowColor: 'rgba(78, 161, 255, 0.32)'
    },
    {
      title: 'Equipos Conectados',
      value: kpis.equiposReportados.toLocaleString('es-MX'),
      icon: CheckCircle,
      color: '#22D3A6',
      bgColor: 'rgba(34, 211, 166, 0.16)',
      glowColor: 'rgba(34, 211, 166, 0.34)'
    },
    {
      title: 'Equipos No Reportados',
      value: kpis.equiposNoReportados.toLocaleString('es-MX'),
      icon: XCircle,
      color: '#FF5B72',
      bgColor: 'rgba(255, 91, 114, 0.16)',
      glowColor: 'rgba(255, 91, 114, 0.32)'
    },
    {
      title: '% Cobertura Ivanti',
      value: `${kpis.porcentajeCoberturaIvanti}%`,
      icon: Shield,
      color: '#A78BFA',
      bgColor: 'rgba(167, 139, 250, 0.16)',
      glowColor: 'rgba(167, 139, 250, 0.32)'
    },
    {
      title: '% Cobertura Sophos',
      value: `${kpis.porcentajeCoberturaSophos}%`,
      icon: ShieldCheck,
      color: '#FBBF24',
      bgColor: 'rgba(251, 191, 36, 0.16)',
      glowColor: 'rgba(251, 191, 36, 0.32)'
    },
    {
      title: 'Nombres Incorrectos',
      value: kpis.equiposConNombreIncorrecto.toLocaleString('es-MX'),
      icon: AlertTriangle,
      color: '#F472B6',
      bgColor: 'rgba(244, 114, 182, 0.16)',
      glowColor: 'rgba(244, 114, 182, 0.32)'
    },
    {
      title: 'Fecha de Generación',
      value: kpis.fechaGeneracion,
      icon: Calendar,
      color: '#94A3B8',
      bgColor: 'rgba(148, 163, 184, 0.16)',
      glowColor: 'rgba(148, 163, 184, 0.3)'
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
              style={{
                backgroundColor: card.bgColor,
                color: card.color,
                boxShadow: `0 0 0 1px ${card.glowColor} inset, 0 0 14px ${card.glowColor}`
              }}
            >
              <card.icon size={18} strokeWidth={2.2} />
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
