import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, RefreshCw } from "lucide-react";
import { geoEqualEarth, geoPath } from "d3-geo";
import countries from "i18n-iso-countries";
import { feature } from "topojson-client";
import worldTopology from "world-atlas/countries-110m.json";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyticsApi } from "../api/analytics";

const dimensions = [
  "page",
  "section",
  "event",
  "device",
  "browser",
  "os",
  "project",
  "article",
];
const date = (offset) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const number = (value) => new Intl.NumberFormat("es").format(value || 0);
const stamp = (value) =>
  value
    ? new Intl.DateTimeFormat("es", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const errorText = (error) =>
  error?.response?.data?.message || "No fue posible cargar las métricas.";
const worldCountries = feature(
  worldTopology,
  worldTopology.objects.countries,
).features;
const mapProjection = geoEqualEarth().fitSize([1000, 500], {
  type: "FeatureCollection",
  features: worldCountries,
});
const worldPath = geoPath(mapProjection);

function countryId(code) {
  const numeric = countries.alpha2ToNumeric(code?.toUpperCase());
  return numeric ? String(Number(numeric)) : null;
}

function countryName(row) {
  if (row.countryName) return row.countryName;
  try {
    return new Intl.DisplayNames("es", { type: "region" }).of(row.countryCode);
  } catch {
    return row.countryCode || "Sin país identificado";
  }
}

function intensity(value, maximum) {
  if (!value || !maximum) return "var(--bg-soft)";
  const ratio = Math.log1p(value) / Math.log1p(maximum);
  return `hsl(212 75% ${88 - ratio * 46}%)`;
}

function CountryAnalytics({ query, range }) {
  const [metric, setMetric] = useState("uniqueVisitors");
  const [hovered, setHovered] = useState(null);
  const rows = query.data || [];
  const mappedRows = rows.filter(
    (row) => row.countryCode && row.countryCode !== "unknown",
  );
  const byCountryId = new Map(
    mappedRows
      .map((row) => [countryId(row.countryCode), row])
      .filter(([id]) => id),
  );
  const maximum = Math.max(0, ...mappedRows.map((row) => row[metric] || 0));
  const selected = hovered ? byCountryId.get(hovered) : null;
  const hoveredCountry = hovered
    ? worldCountries.find((country) => String(country.id) === hovered)
    : null;

  return (
    <article className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Audiencia por país</h2>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">
            {range.from} a {range.to}. La intensidad representa{" "}
            {metric === "uniqueVisitors" ? "visitantes únicos" : "eventos"}.
          </p>
        </div>
        <div className="flex rounded-lg border border-[var(--border)] p-1 text-xs">
          <button
            onClick={() => setMetric("uniqueVisitors")}
            className={`rounded-md px-3 py-1.5 ${metric === "uniqueVisitors" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--fg-muted)]"}`}
          >
            Visitantes
          </button>
          <button
            onClick={() => setMetric("events")}
            className={`rounded-md px-3 py-1.5 ${metric === "events" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--fg-muted)]"}`}
          >
            Eventos
          </button>
        </div>
      </div>
      {query.isLoading ? (
        <p className="py-16 text-center text-sm text-[var(--fg-muted)]">
          Cargando países...
        </p>
      ) : query.isError ? (
        <div className="py-12 text-center">
          <p className="text-sm text-red-600">{errorText(query.error)}</p>
          <button
            onClick={() => query.refetch()}
            className="mt-3 text-sm font-medium"
          >
            Reintentar
          </button>
        </div>
      ) : !rows.length ? (
        <p className="py-16 text-center text-sm text-[var(--fg-muted)]">
          Sin datos geográficos para este periodo.
        </p>
      ) : (
        <>
          <div className="relative mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-2 sm:p-4">
            <svg
              viewBox="0 0 1000 500"
              role="img"
              aria-label="Mapa mundial de audiencia por país"
              className="h-auto w-full"
            >
              {worldCountries.map((country) => {
                const row = byCountryId.get(String(country.id));
                return (
                  <path
                    key={country.id}
                    d={worldPath(country) || undefined}
                    fill={intensity(row?.[metric], maximum)}
                    stroke="var(--bg-card)"
                    strokeWidth="0.7"
                    className="transition-[fill] duration-150"
                    onMouseEnter={() => setHovered(String(country.id))}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <title>
                      {row
                        ? `${countryName(row)}: ${number(row[metric])} ${metric === "events" ? "eventos" : "visitantes únicos"}`
                        : "Sin actividad"}
                    </title>
                  </path>
                );
              })}
            </svg>
            {hoveredCountry && (
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs shadow-lg">
                <p className="font-medium">
                  {selected
                    ? countryName(selected)
                    : hoveredCountry.properties.name}
                </p>
                <p className="mt-0.5 text-[var(--fg-muted)]">
                  {number(selected?.[metric])}{" "}
                  {metric === "events" ? "eventos" : "visitantes únicos"}
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--fg-faint)]">
            <span>Sin actividad</span>
            <div
              className="h-2 w-28 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, hsl(212 75% 88%), hsl(212 75% 42%))",
              }}
            />
            <span>{number(maximum)}</span>
          </div>
          <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--fg-faint)]">
                <tr>
                  <th className="p-4">País</th>
                  <th className="p-4">Código</th>
                  <th className="p-4 text-right">Únicos</th>
                  <th className="p-4 text-right">Sesiones</th>
                  <th className="p-4 text-right">Eventos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.countryCode}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="p-4 font-medium">
                      {row.countryCode === "unknown"
                        ? "Sin país identificado"
                        : countryName(row)}
                    </td>
                    <td className="p-4 font-mono text-xs text-[var(--fg-muted)]">
                      {row.countryCode === "unknown" ? "—" : row.countryCode}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {number(row.uniqueVisitors)}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {number(row.uniqueSessions)}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {number(row.events)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </article>
  );
}

function Card({ label, value, hint }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--fg-faint)]">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-tight">
        {number(value)}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--fg-muted)]">{hint}</p>}
    </article>
  );
}

function Breakdown({ title, rows, loading }) {
  const data = (rows || []).slice(0, 6).map((row) => ({
    ...row,
    label: String(row.value || "Sin dato").slice(0, 13),
  }));
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {loading ? (
        <p className="mt-5 text-sm text-[var(--fg-muted)]">Cargando...</p>
      ) : data.length ? (
        <>
          <div className="mt-4 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey="events"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {data.map((row) => (
              <div
                key={row.value}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="min-w-0 truncate text-[var(--fg-muted)]">
                  {row.value || "Sin dato"}
                </span>
                <strong className="font-mono">{number(row.events)}</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-5 text-sm text-[var(--fg-muted)]">
          Sin datos en este periodo.
        </p>
      )}
    </article>
  );
}

function Range({ range, onChange }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
      <label className="text-xs text-[var(--fg-muted)]">
        Desde
        <input
          type="date"
          value={range.from}
          max={range.to}
          onChange={(event) => onChange({ ...range, from: event.target.value })}
          className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-xs text-[var(--fg-muted)]">
        Hasta
        <input
          type="date"
          value={range.to}
          min={range.from}
          max={date(0)}
          onChange={(event) => onChange({ ...range, to: event.target.value })}
          className="mt-1 block rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
        />
      </label>
      <button
        onClick={() => onChange({ from: date(-29), to: date(0) })}
        className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--bg-soft)]"
      >
        Últimos 30 días
      </button>
    </div>
  );
}

export function AnalyticsOverview() {
  const [range, setRange] = useState({ from: date(-29), to: date(0) });
  const params = { ...range };
  const overview = useQuery({
    queryKey: ["analytics", "overview", params],
    queryFn: () => analyticsApi.overview(params),
  });
  const active = useQuery({
    queryKey: ["analytics", "active"],
    queryFn: analyticsApi.active,
    refetchInterval: 15000,
  });
  const series = useQuery({
    queryKey: ["analytics", "timeseries", params],
    queryFn: () => analyticsApi.timeseries({ ...params, interval: "day" }),
  });
  const countryBreakdown = useQuery({
    queryKey: ["analytics", "breakdown", "country", params],
    queryFn: () =>
      analyticsApi.breakdown({ ...params, dimension: "country", limit: 100 }),
  });
  const breakdownQueries = useQueries({
    queries: dimensions.map((dimension) => ({
      queryKey: ["analytics", "breakdown", dimension, params],
      queryFn: () =>
        analyticsApi.breakdown({ ...params, dimension, limit: 10 }),
    })),
  });
  const breakdowns = Object.fromEntries(
    dimensions.map((dimension, index) => [dimension, breakdownQueries[index]]),
  );
  const points = (series.data || []).map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat("es", {
      month: "short",
      day: "numeric",
    }).format(new Date(item.timestamp)),
  }));

  if (overview.isError)
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
        <p className="font-medium">Analítica no disponible</p>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          {errorText(overview.error)}
        </p>
        <button
          onClick={() => overview.refetch()}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw size={15} /> Reintentar
        </button>
      </div>
    );
  const data = overview.data || {};
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--fg-muted)]">
            Audiencia y comportamiento de las visitas públicas.
          </p>
        </div>
        <Range range={range} onChange={setRange} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card
          label="Activos ahora"
          value={active.data?.activeVisitors}
          hint={`${number(active.data?.activeSessions)} sesiones en 60 s`}
        />
        <Card label="Visitas" value={data.pageViews} />
        <Card label="Visitantes únicos" value={data.uniqueVisitors} />
        <Card label="Sesiones" value={data.uniqueSessions} />
        <Card
          label="Eventos"
          value={data.totalEvents}
          hint={`${number(data.conversions)} conversiones`}
        />
      </div>
      <article className="mt-5 h-80 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Tendencia diaria</h2>
            <p className="mt-1 text-xs text-[var(--fg-muted)]">
              Eventos, visitantes y sesiones del rango seleccionado.
            </p>
          </div>
          <Activity size={18} className="text-[var(--fg-faint)]" />
        </div>
        {series.isLoading ? (
          <p className="mt-10 text-sm text-[var(--fg-muted)]">
            Cargando serie...
          </p>
        ) : points.length ? (
          <ResponsiveContainer width="100%" height="82%">
            <AreaChart
              data={points}
              margin={{ top: 20, right: 6, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="analyticsArea" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "currentColor" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "currentColor" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="events"
                stroke="currentColor"
                fill="url(#analyticsArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="mt-10 text-sm text-[var(--fg-muted)]">
            Aún no hay actividad para graficar.
          </p>
        )}
      </article>
      <CountryAnalytics query={countryBreakdown} range={range} />
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Breakdown
          title="Páginas"
          rows={breakdowns.page.data}
          loading={breakdowns.page.isLoading}
        />
        <Breakdown
          title="Secciones"
          rows={breakdowns.section.data}
          loading={breakdowns.section.isLoading}
        />
        <Breakdown
          title="Eventos"
          rows={breakdowns.event.data}
          loading={breakdowns.event.isLoading}
        />
        <Breakdown
          title="Dispositivos"
          rows={breakdowns.device.data}
          loading={breakdowns.device.isLoading}
        />
        <Breakdown
          title="Navegadores"
          rows={breakdowns.browser.data}
          loading={breakdowns.browser.isLoading}
        />
        <Breakdown
          title="Sistemas operativos"
          rows={breakdowns.os.data}
          loading={breakdowns.os.isLoading}
        />
        <Breakdown
          title="Proyectos"
          rows={breakdowns.project.data}
          loading={breakdowns.project.isLoading}
        />
        <Breakdown
          title="Artículos"
          rows={breakdowns.article.data}
          loading={breakdowns.article.isLoading}
        />
      </div>
      <Link
        to="/admin/analytics/detalle"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-fg)]"
      >
        Ver eventos y sesiones <ArrowRight size={15} />
      </Link>
    </section>
  );
}

export function AnalyticsDetail() {
  const [kind, setKind] = useState("events");
  const [pageNumber, setPageNumber] = useState(1);
  const [eventType, setEventType] = useState("");
  const query = useQuery({
    queryKey: ["analytics", kind, pageNumber, eventType],
    queryFn: () =>
      analyticsApi[kind]({
        pageNumber,
        limit: 25,
        ...(eventType && { eventType }),
      }),
  });
  const result = query.data || { items: [], totalPages: 0 };
  const rows = result.items || [];
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--fg-muted)]">
          Registros anonimizados. No se muestran IPs ni identificadores de
          visitantes.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setKind("events");
              setPageNumber(1);
            }}
            className={`rounded-lg px-3 py-2 text-sm ${kind === "events" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "border border-[var(--border)]"}`}
          >
            Eventos
          </button>
          <button
            onClick={() => {
              setKind("sessions");
              setPageNumber(1);
            }}
            className={`rounded-lg px-3 py-2 text-sm ${kind === "sessions" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "border border-[var(--border)]"}`}
          >
            Sesiones
          </button>
        </div>
      </div>
      {kind === "events" && (
        <select
          value={eventType}
          onChange={(event) => {
            setEventType(event.target.value);
            setPageNumber(1);
          }}
          className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm"
        >
          <option value="">Todos los eventos</option>
          {[
            "page_view",
            "section_view",
            "heartbeat",
            "click",
            "conversion",
            "article",
          ].map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      )}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        {query.isLoading ? (
          <p className="p-6 text-sm text-[var(--fg-muted)]">
            Cargando registros...
          </p>
        ) : query.isError ? (
          <div className="p-6">
            <p className="text-sm text-red-600">{errorText(query.error)}</p>
            <button
              onClick={() => query.refetch()}
              className="mt-3 text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : rows.length ? (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--fg-faint)]">
              <tr>
                {kind === "events" ? (
                  <>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Página / destino</th>
                    <th className="p-4">Dispositivo</th>
                    <th className="p-4">Fecha</th>
                  </>
                ) : (
                  <>
                    <th className="p-4">Última página</th>
                    <th className="p-4">Dispositivo</th>
                    <th className="p-4">Navegador</th>
                    <th className="p-4">Última actividad</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  {kind === "events" ? (
                    <>
                      <td className="p-4 font-mono text-xs">
                        {item.eventType}
                      </td>
                      <td className="p-4">
                        <p>{item.page}</p>
                        <p className="mt-1 text-xs text-[var(--fg-faint)]">
                          {item.target || item.path}
                        </p>
                      </td>
                      <td className="p-4 text-[var(--fg-muted)]">
                        {item.device}
                      </td>
                      <td className="p-4 text-xs text-[var(--fg-muted)]">
                        {stamp(item.createdAt)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">{item.page}</td>
                      <td className="p-4 text-[var(--fg-muted)]">
                        {item.device}
                      </td>
                      <td className="p-4 text-[var(--fg-muted)]">
                        {item.browser} / {item.os}
                      </td>
                      <td className="p-4 text-xs text-[var(--fg-muted)]">
                        {stamp(item.lastSeenAt)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-sm text-[var(--fg-muted)]">
            No hay registros con estos filtros.
          </p>
        )}
      </div>
      {result.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>{number(result.total)} registros</span>
          <div className="flex gap-2">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((value) => value - 1)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 py-2">
              {pageNumber} / {result.totalPages}
            </span>
            <button
              disabled={pageNumber >= result.totalPages}
              onClick={() => setPageNumber((value) => value + 1)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
