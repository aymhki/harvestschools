import {useMemo, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import '../styles/AnalyticsDashboard.css';

const CHART_WIDTH = 720;
const CHART_HEIGHT = 200;
const CHART_PADDING = {top: 12, right: 12, bottom: 24, left: 44};
const GRID_LINES = 4;

const formatCount = (value) => Number(value).toLocaleString('en-US');

const formatDay = (isoDate) => {
    const parsed = new Date(`${isoDate}T00:00:00`);

    return Number.isNaN(parsed.getTime())
        ? isoDate
        : parsed.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
};

const describeCacheAge = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 60) {
        return 'just refreshed';
    }

    const minutes = Math.round(seconds / 60);

    return `refreshed ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
};

function TrendChart({points}) {
    const chartRef = useRef(null);
    const [hoverIndex, setHoverIndex] = useState(null);

    const geometry = useMemo(() => {
        if (points.length === 0) {
            return null;
        }

        const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
        const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
        const highest = Math.max(1, ...points.map((point) => point.value));
        const step = points.length === 1 ? 0 : plotWidth / (points.length - 1);

        const coordinates = points.map((point, index) => ({
            ...point,
            x: CHART_PADDING.left + (index * step),
            y: CHART_PADDING.top + plotHeight - ((point.value / highest) * plotHeight),
        }));

        return {coordinates, highest, plotHeight, plotWidth};
    }, [points]);

    if (!geometry) {
        return <p className={'analytics-dashboard-empty'}>No visits were recorded in this window.</p>;
    }

    const {coordinates, highest, plotHeight} = geometry;
    const linePath = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
    const baseline = CHART_PADDING.top + plotHeight;
    const areaPath = `${linePath} L${coordinates[coordinates.length - 1].x} ${baseline} L${coordinates[0].x} ${baseline} Z`;
    const hovered = hoverIndex === null ? null : coordinates[hoverIndex];

    const trackPointer = (event) => {
        const bounds = chartRef.current.getBoundingClientRect();
        const ratio = (event.clientX - bounds.left) / bounds.width;
        const position = (ratio * CHART_WIDTH) - CHART_PADDING.left;
        const step = coordinates.length === 1 ? 1 : geometry.plotWidth / (coordinates.length - 1);
        const index = Math.round(position / step);

        setHoverIndex(Math.min(coordinates.length - 1, Math.max(0, index)));
    };

    return (
        <div className={'analytics-dashboard-chart'} ref={chartRef}>
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                 role={'img'}
                 aria-label={`Active users per day, highest ${formatCount(highest)}`}
                 onMouseMove={trackPointer}
                 onMouseLeave={() => setHoverIndex(null)}>

                {Array.from({length: GRID_LINES + 1}, (unused, index) => {
                    const y = CHART_PADDING.top + ((plotHeight / GRID_LINES) * index);
                    const value = Math.round(highest - ((highest / GRID_LINES) * index));

                    return (
                        <g key={index}>
                            <line className={'analytics-dashboard-grid-line'}
                                  x1={CHART_PADDING.left} y1={y} x2={CHART_WIDTH - CHART_PADDING.right} y2={y}/>
                            <text className={'analytics-dashboard-axis-text'}
                                  x={CHART_PADDING.left - 8} y={y + 4} textAnchor={'end'}>
                                {formatCount(value)}
                            </text>
                        </g>
                    );
                })}

                <path className={'analytics-dashboard-area'} d={areaPath}/>
                <path className={'analytics-dashboard-line'} d={linePath}/>

                {hovered && (
                    <>
                        <line className={'analytics-dashboard-crosshair'}
                              x1={hovered.x} y1={CHART_PADDING.top} x2={hovered.x} y2={baseline}/>
                        <circle className={'analytics-dashboard-marker'} cx={hovered.x} cy={hovered.y} r={5}/>
                    </>
                )}

                {[0, Math.floor(coordinates.length / 2), coordinates.length - 1]
                    .filter((index, position, all) => all.indexOf(index) === position)
                    .map((index) => (
                        <text key={index}
                              className={'analytics-dashboard-axis-text'}
                              x={coordinates[index].x}
                              y={CHART_HEIGHT - 6}
                              textAnchor={index === 0 ? 'start' : (index === coordinates.length - 1 ? 'end' : 'middle')}>
                            {formatDay(coordinates[index].date)}
                        </text>
                    ))}
            </svg>

            {hovered && (
                <div className={'analytics-dashboard-tooltip'}
                     style={{left: `${(hovered.x / CHART_WIDTH) * 100}%`, top: `${(hovered.y / CHART_HEIGHT) * 100}%`}}>
                    {formatDay(hovered.date)} · {formatCount(hovered.value)} users
                </div>
            )}
        </div>
    );
}

TrendChart.propTypes = {
    points: PropTypes.arrayOf(PropTypes.shape({
        date: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
    })).isRequired,
};

function RankedBars({rows, unit}) {
    if (rows.length === 0) {
        return <p className={'analytics-dashboard-empty'}>Nothing recorded in this window.</p>;
    }

    const highest = Math.max(1, ...rows.map((row) => row.value));

    return (
        <div className={'analytics-dashboard-bars'}>
            {rows.map((row) => (
                <div className={'analytics-dashboard-bar-row'} key={row.label}>
                    <span className={'analytics-dashboard-bar-label'} title={row.label}>{row.label}</span>
                    <span className={'analytics-dashboard-bar-value'}>{formatCount(row.value)} {unit}</span>
                    <span className={'analytics-dashboard-bar-track'}>
                        <span className={'analytics-dashboard-bar-fill'}
                              style={{width: `${Math.max(2, (row.value / highest) * 100)}%`}}/>
                    </span>
                </div>
            ))}
        </div>
    );
}

RankedBars.propTypes = {
    rows: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
    })).isRequired,
    unit: PropTypes.string.isRequired,
};

function AnalyticsDashboard({totals, usersOverTime, rankings, reportingWindow, cacheAgeSeconds}) {
    return (
        <div className={'analytics-dashboard'}>
            <p className={'analytics-dashboard-heading'}>
                Website traffic
                <span>{reportingWindow} · {describeCacheAge(cacheAgeSeconds)}</span>
            </p>

            <div className={'analytics-dashboard-tiles'}>
                {totals.map((total) => (
                    <div className={'analytics-dashboard-tile'} key={total.key}>
                        <span className={'analytics-dashboard-tile-label'}>{total.label}</span>
                        <span className={'analytics-dashboard-tile-value'}>{total.last28}</span>
                        <span className={'analytics-dashboard-tile-context'}>{total.last7} in the last 7 days</span>
                    </div>
                ))}
            </div>

            <div className={'analytics-dashboard-panel'}>
                <h4 className={'analytics-dashboard-panel-title'}>Active users per day</h4>
                <TrendChart points={usersOverTime}/>
            </div>

            <div className={'analytics-dashboard-rankings'}>
                {rankings.map((ranking) => (
                    <div className={'analytics-dashboard-panel'} key={ranking.key}>
                        <h4 className={'analytics-dashboard-panel-title'}>{ranking.label}</h4>
                        <RankedBars rows={ranking.rows} unit={ranking.unit}/>
                    </div>
                ))}
            </div>
        </div>
    );
}

AnalyticsDashboard.propTypes = {
    totals: PropTypes.array.isRequired,
    usersOverTime: PropTypes.array.isRequired,
    rankings: PropTypes.array.isRequired,
    reportingWindow: PropTypes.string,
    cacheAgeSeconds: PropTypes.number,
};

export default AnalyticsDashboard;
