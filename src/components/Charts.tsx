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
  ResponsiveContainer
} from 'recharts';
import type { DataProcessed } from '../types';

interface ChartsProps {
  data: DataProcessed;
  hideRegionalSummaryCharts?: boolean;
  onStatusSliceClick?: (name: string, source?: 'reportes' | 'sophos' | 'ivanti') => void;
}

interface PiePoint {
  name: string;
  value: number;
}

interface Bar3DProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}

const COLORS = ['#00F0FF', '#2E7BFF', '#9B5CFF', '#FF4FD8', '#00FFA3', '#F9F871', '#4DD2FF', '#7B61FF'];
const GRID_COLOR = 'rgba(123, 208, 255, 0.26)';
const AXIS_COLOR = '#C6E7FF';

const cyberTooltipStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(4, 10, 25, 0.96), rgba(12, 28, 56, 0.96))',
  border: '1px solid rgba(88, 210, 255, 0.65)',
  borderRadius: 12,
  boxShadow: '0 0 0 1px rgba(0,229,255,0.28) inset, 0 0 18px rgba(0,229,255,0.28)',
  maxWidth: 280,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere'
};

const legendStyle: React.CSSProperties = {
  color: '#eaf7ff',
  fontSize: 13,
  fontWeight: 700,
  paddingTop: 22
};

const darkenHex = (hex: string, factor = 0.7): string => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const r = Math.max(0, Math.min(255, Math.round(parseInt(value.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(value.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(value.slice(4, 6), 16) * factor)));
  return `rgb(${r}, ${g}, ${b})`;
};

const Bar3DShape = ({ x = 0, y = 0, width = 0, height = 0, fill = '#00F0FF' }: Bar3DProps) => {
  const depth = Math.max(6, Math.min(14, width * 0.2));
  const top = `
    ${x},${y}
    ${x + depth},${y - depth}
    ${x + width + depth},${y - depth}
    ${x + width},${y}
  `;
  const side = `
    ${x + width},${y}
    ${x + width + depth},${y - depth}
    ${x + width + depth},${y + height - depth}
    ${x + width},${y + height}
  `;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />
      <polygon points={top} fill={darkenHex(fill, 1.12)} opacity={0.95} />
      <polygon points={side} fill={darkenHex(fill, 0.62)} opacity={0.95} />
    </g>
  );
};

const normalizeStatusColor = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('no report')) return '#FF2B2B';
  if (n.includes('report')) return '#00FFA3';
  return '#00F0FF';
};

const normalizeStatusLabel = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('no report')) return 'No Reportado';
  if (n.includes('report')) return 'Conectados';
  return name;
};

const abbreviateRegion = (name: string): string => {
  const map: Record<string, string> = {
    'RM Centro Norte': 'RM CN',
    'RM Occidente': 'RM Occ',
    'RM Oriente': 'RM Ori',
    'RM Sur': 'RM Sur',
    'I Tarapacá': 'I Tar',
    'II Antofagasta': 'II Ant',
    'III Atacama': 'III Ata',
    'IV Coquimbo': 'IV Coq',
    'V Valparaíso': 'V Val',
    'VI O’Higgins': 'VI OHig',
    'VII Maule': 'VII Mau',
    'VIII Biobío': 'VIII Bio',
    'IX La Araucanía': 'IX Ara',
    'X Los Lagos': 'X Lag',
    'XI Aysén': 'XI Ays',
    'XII Magallanes': 'XII Mag',
    'XIV Los Ríos': 'XIV Río',
    'XV Arica y Parinacota': 'XV Ari',
    'XVI Ñuble': 'XVI Ñub',
    'Fiscalía Nacional': 'Fisc Nal',
    'Sin Región': 'Sin Reg'
  };
  return map[name] ?? (name.length > 9 ? `${name.slice(0, 9)}…` : name);
};

export const Charts = ({ data, hideRegionalSummaryCharts = false, onStatusSliceClick }: ChartsProps) => {
  const allRegionsSorted = [...data.porRegion]
    .sort((a, b) => b.value - a.value)
    .map((r) => ({ ...r, shortName: abbreviateRegion(r.name) }));

  const dynamicRegionsHeight = Math.max(270, allRegionsSorted.length * 15);

  const erroresPorMotivo = Object.entries(
    data.equiposConError.reduce<Record<string, number>>((acc, item) => {
      const key = String(item.motivo || 'Sin motivo');
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({
      name,
      value,
      shortName: name.length > 38 ? `${name.slice(0, 38)}…` : name
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const renderCleanDonut = (
    pieData: PiePoint[],
    palette?: string[],
    innerRadius = 58,
    outerRadius = 92,
    enforceStatusColors = false
  ) => (
    <Pie
      data={pieData}
      cx="50%"
      cy="46%"
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      dataKey="value"
      nameKey={enforceStatusColors ? 'normalizedName' : 'name'}
      label={false}
      labelLine={false}
      stroke="#dff8ff"
      strokeWidth={2}
    >
      {pieData.map((entry, index) => (
        <Cell
          key={`face-${index}`}
          fill={
            enforceStatusColors
              ? normalizeStatusColor(entry.name)
              : (palette ?? COLORS)[index % (palette ?? COLORS).length]
          }
          style={{
            cursor: enforceStatusColors && onStatusSliceClick ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (enforceStatusColors && onStatusSliceClick) {
              onStatusSliceClick(entry.name, 'reportes');
            }
          }}
        />
      ))}
    </Pie>
  );

  return (
    <div className="charts-container chart-3d-mode">
      {!hideRegionalSummaryCharts && (
        <div className="chart-card">
          <h3 className="chart-title">Nombres Incorrectos por Motivo (Top 6)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={erroresPorMotivo}
              layout="vertical"
              margin={{ top: 12, right: 14, left: 8, bottom: 10 }}
              barCategoryGap="18%"
            >
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 6" />
              <XAxis
                type="number"
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={{ stroke: GRID_COLOR }}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                width={220}
                interval={0}
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={{ stroke: GRID_COLOR }}
              />
              <Tooltip
                contentStyle={cyberTooltipStyle}
                wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
                allowEscapeViewBox={{ x: true, y: true }}
                itemStyle={{ color: '#e7f6ff' }}
                labelStyle={{ color: '#9fd8ff' }}
                formatter={(value) => [`${value ?? 0}`, 'Nombres Incorrectos']}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { name?: string } | undefined;
                  return row?.name ?? '';
                }}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="value" fill="#FF5DD8" shape={<Bar3DShape />} name="Nombres Incorrectos" maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!hideRegionalSummaryCharts && (
        <div className="chart-card wide">
          <h3 className="chart-title">Todas las Regiones</h3>
          <ResponsiveContainer width="100%" height={dynamicRegionsHeight}>
            <BarChart
              data={allRegionsSorted}
              margin={{ top: 6, right: 10, left: 4, bottom: 58 }}
              barCategoryGap="14%"
            >
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 6" />
              <XAxis
                dataKey="shortName"
                interval={0}
                angle={-28}
                textAnchor="end"
                height={64}
                tick={{ fill: AXIS_COLOR, fontSize: 9 }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={{ stroke: GRID_COLOR }}
              />
              <YAxis
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={{ stroke: GRID_COLOR }}
              />
              <Tooltip
                contentStyle={cyberTooltipStyle}
                itemStyle={{ color: '#e7f6ff' }}
                labelStyle={{ color: '#9fd8ff' }}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { name?: string } | undefined;
                  return row?.name ?? '';
                }}
              />
              <Bar dataKey="value" fill="#00CFFF" shape={<Bar3DShape />} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="chart-card">
        <h3 className="chart-title">Estado de Reportes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart margin={{ top: 12, right: 12, left: 12, bottom: 40 }}>
            {renderCleanDonut(
              data.porEstado.map((item) => ({ ...item, normalizedName: normalizeStatusLabel(item.name) })),
              undefined,
              58,
              92,
              true
            )}
            <Tooltip contentStyle={cyberTooltipStyle} itemStyle={{ color: '#f3fbff' }} labelStyle={{ color: '#a7ddff' }} />
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Equipos No Reportados por Año</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.noReportadosPorAnio}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 6" />
            <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} tickLine={{ stroke: GRID_COLOR }} />
            <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} tickLine={{ stroke: GRID_COLOR }} />
            <Tooltip contentStyle={cyberTooltipStyle} itemStyle={{ color: '#e7f6ff' }} labelStyle={{ color: '#9fd8ff' }} />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="value" fill="#FF2B2B" shape={<Bar3DShape />} name="No reportados" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Estado del Agente Sophos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart margin={{ top: 12, right: 12, left: 12, bottom: 40 }}>
            <Pie
              data={data.porSophos}
              cx="50%"
              cy="46%"
              innerRadius={58}
              outerRadius={92}
              dataKey="value"
              label={false}
              labelLine={false}
              stroke="#dff8ff"
              strokeWidth={2}
            >
              {data.porSophos.map((entry, index) => (
                <Cell
                  key={`sophos-${index}`}
                  fill={['#1E1EFF', '#D7263D'][index % 2]}
                  style={{ cursor: onStatusSliceClick ? 'pointer' : 'default' }}
                  onClick={() => onStatusSliceClick?.(entry.name, 'sophos')}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={cyberTooltipStyle} itemStyle={{ color: '#e7f6ff' }} labelStyle={{ color: '#9fd8ff' }} />
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Estado del Agente Ivanti</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart margin={{ top: 12, right: 12, left: 12, bottom: 40 }}>
            <Pie
              data={data.porIvanti}
              cx="50%"
              cy="46%"
              innerRadius={58}
              outerRadius={92}
              dataKey="value"
              label={false}
              labelLine={false}
              stroke="#dff8ff"
              strokeWidth={2}
            >
              {data.porIvanti.map((entry, index) => (
                <Cell
                  key={`ivanti-${index}`}
                  fill={['#f47b20', '#D7263D'][index % 2]}
                  style={{ cursor: onStatusSliceClick ? 'pointer' : 'default' }}
                  onClick={() => onStatusSliceClick?.(entry.name, 'ivanti')}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={cyberTooltipStyle} itemStyle={{ color: '#e7f6ff' }} labelStyle={{ color: '#9fd8ff' }} />
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {!hideRegionalSummaryCharts && (
        <div className="chart-card">
          <h3 className="chart-title">Distribución por Tipo de Equipo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.porTipo}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 6" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={84} tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={{ stroke: GRID_COLOR }} tickLine={{ stroke: GRID_COLOR }} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={{ stroke: GRID_COLOR }} tickLine={{ stroke: GRID_COLOR }} />
              <Tooltip contentStyle={cyberTooltipStyle} itemStyle={{ color: '#e7f6ff' }} labelStyle={{ color: '#9fd8ff' }} />
              <Bar dataKey="value" fill="#00FFA3" shape={<Bar3DShape />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Charts;
