import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CURRENCY_META, DEFAULT_PAIRS, calcChange, fetchRate, formatPair, getAlertState, getFallbackRate } from './fx.js';
import './styles.css';

const REFRESH_SECONDS = 60;

function buildInitialRows() {
  return DEFAULT_PAIRS.map((pair, index) => {
    const rate = getFallbackRate(pair.base, pair.quote);
    const previous = rate ? rate * (1 + (index % 2 === 0 ? -0.0018 : 0.0012)) : null;
    return { ...pair, rate, previous, source: '离线基准', updatedAt: '待同步', status: 'idle' };
  });
}

function App() {
  const [rows, setRows] = useState(buildInitialRows);
  const [baseAmount, setBaseAmount] = useState(10000);
  const [filter, setFilter] = useState('all');
  const [lastSync, setLastSync] = useState('尚未同步');

  const refreshRates = useCallback(() => {
    setRows((currentRows) => {
      Promise.all(currentRows.map(async (row) => {
        try {
          const result = await fetchRate(row.base, row.quote);
          return {
            ...row,
            previous: row.rate,
            rate: result.rate,
            source: result.source,
            date: result.date,
            updatedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            status: 'ready'
          };
        } catch (error) {
          return { ...row, status: 'error', error: error.message, updatedAt: '接口异常，显示基准价' };
        }
      })).then((nextRows) => {
        setRows(nextRows);
        setLastSync(new Date().toLocaleString('zh-CN', { hour12: false }));
      });
      return currentRows.map((row) => ({ ...row, status: 'loading' }));
    });
  }, []);

  useEffect(() => {
    refreshRates();
    const timer = setInterval(refreshRates, REFRESH_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [refreshRates]);

  const visibleRows = useMemo(() => rows.filter((row) => {
    if (filter === 'all') return true;
    return getAlertState(row.rate, row).level === filter;
  }), [rows, filter]);

  const stats = useMemo(() => {
    const alerts = rows.filter((row) => getAlertState(row.rate, row).level !== 'normal').length;
    const ready = rows.filter((row) => row.status === 'ready').length;
    return { alerts, ready, total: rows.length };
  }, [rows]);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Alpha Console · FX Monitor</p>
          <h1>实时汇率监控</h1>
          <p className="hero-copy">为股市、跨境资金与量化交易场景提供核心货币对看板、阈值告警、换算和自动刷新。</p>
        </div>
        <button className="primary" onClick={refreshRates}>立即刷新</button>
      </section>

      <section className="metrics" aria-label="汇率监控摘要">
        <Metric label="监控货币对" value={stats.total} hint="默认覆盖主要股市资金货币" />
        <Metric label="已同步" value={stats.ready} hint={`最近同步：${lastSync}`} />
        <Metric label="告警数量" value={stats.alerts} hint="触发上下限会高亮显示" tone={stats.alerts ? 'hot' : 'ok'} />
      </section>

      <section className="panel controls">
        <label>
          资金换算金额
          <input type="number" min="1" value={baseAmount} onChange={(event) => setBaseAmount(Number(event.target.value))} />
        </label>
        <label>
          状态筛选
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">全部</option>
            <option value="normal">区间内</option>
            <option value="warning">跌破下限</option>
            <option value="danger">突破上限</option>
          </select>
        </label>
      </section>

      <section className="grid">
        {visibleRows.map((row) => <RateCard key={formatPair(row)} row={row} amount={baseAmount} />)}
      </section>
    </main>
  );
}

function Metric({ label, value, hint, tone = '' }) {
  return <article className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>;
}

function RateCard({ row, amount }) {
  const alert = getAlertState(row.rate, row);
  const change = calcChange(row.rate, row.previous);
  const converted = row.rate ? amount * row.rate : 0;
  const baseMeta = CURRENCY_META[row.base];
  const quoteMeta = CURRENCY_META[row.quote];

  return (
    <article className={`card ${alert.level}`}>
      <div className="card-head">
        <div><h2>{formatPair(row)}</h2><p>{baseMeta?.name} → {quoteMeta?.name}</p></div>
        <span className="badge">{alert.label}</span>
      </div>
      <div className="rate">{row.rate?.toFixed(row.rate > 20 ? 3 : 5) ?? '--'}</div>
      <div className={change >= 0 ? 'change up' : 'change down'}>{change >= 0 ? '+' : ''}{change.toFixed(3)}%</div>
      <dl>
        <div><dt>{amount.toLocaleString()} {row.base}</dt><dd>≈ {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} {row.quote}</dd></div>
        <div><dt>告警区间</dt><dd>{row.alertBelow} - {row.alertAbove}</dd></div>
        <div><dt>数据源</dt><dd>{row.source} · {row.updatedAt}</dd></div>
      </dl>
      {row.error && <p className="error">{row.error}</p>}
    </article>
  );
}

createRoot(document.getElementById('root')).render(<App />);
