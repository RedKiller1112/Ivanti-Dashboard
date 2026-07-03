import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import type { DataProcessed } from '../types';

interface ChartsProps {
  data: DataProcessed;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export const Charts = ({ data }: ChartsProps) => {
  return (
    <div className="charts-container">
      {/* Reportados vs No Reportados */}
      <div className="chart-card">
        <h3 className="chart-title">Estado de Reportes</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data.porEstado}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label
            >
              {data.porEstado.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Equipos por Región (Top 10) */}
      <div className="chart-card">
        <h3 className="chart-title">Top 10 Regiones</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.topRegiones} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Equipos por Año */}
      <div className="chart-card">
        <h3 className="chart-title">Equipos por Año</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.porAnio}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', r: 4 }}
              name="Equipos"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* No Reportados por Año */}
      <div className="chart-card">
        <h3 className="chart-title">Equipos No Reportados por Año</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.noReportadosPorAnio}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} name="No reportados" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Estado de Sophos */}
      <div className="chart-card">
        <h3 className="chart-title">Estado del Agente Sophos</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data.porSophos}
              cx="50%"
              cy="50%"
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label
            >
              {data.porSophos.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Estado de Ivanti */}
      <div className="chart-card">
        <h3 className="chart-title">Estado del Agente Ivanti</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data.porIvanti}
              cx="50%"
              cy="50%"
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label
            >
              {data.porIvanti.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Equipos por Tipo */}
      <div className="chart-card wide">
        <h3 className="chart-title">Distribución por Tipo de Equipo</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.porTipo}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#06B6D4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
