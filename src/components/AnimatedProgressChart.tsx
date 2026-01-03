"use client";

import React, { useEffect, useState, useRef } from 'react';

interface AnimatedProgressChartProps {
    startValue: number;
    endValue: number;
    startLabel: string;
    endLabel: string;
    unit?: string;
    title?: string;
    subtitle?: string;
    delay?: number;
}

export default function AnimatedProgressChart({
    startValue,
    endValue,
    startLabel,
    endLabel,
    unit = '',
    title,
    subtitle,
    delay = 500
}: AnimatedProgressChartProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [currentValue, setCurrentValue] = useState(startValue);
    const pathRef = useRef<SVGPathElement>(null);

    // Chart dimensions
    const width = 320;
    const height = 180;
    const padding = { top: 40, right: 60, bottom: 40, left: 20 };
    const chartWidth = width - padding.left - padding.right;

    // Calculate the curved path (bezier curve similar to reference)
    const startX = padding.left;
    const startY = padding.top + 10; // Near top for high start value
    const endX = width - padding.right;
    const endY = height - padding.bottom - 10; // Near bottom for low end value

    // Control points for smooth curve
    const cp1x = startX + chartWidth * 0.3;
    const cp1y = startY + 10;
    const cp2x = startX + chartWidth * 0.6;
    const cp2y = endY - 30;

    const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

    // Area path for gradient fill
    const areaD = `${pathD} L ${endX} ${height - padding.bottom} L ${startX} ${height - padding.bottom} Z`;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimating(true);

            // Animate the counter
            const duration = 2000;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
                const value = startValue + (endValue - startValue) * eased;
                setCurrentValue(value);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setShowTooltip(true);
                }
            };
            requestAnimationFrame(animate);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay, startValue, endValue]);

    // Get path length for animation
    useEffect(() => {
        if (pathRef.current) {
            const length = pathRef.current.getTotalLength();
            pathRef.current.style.setProperty('--path-length', `${length}`);
            pathRef.current.style.strokeDasharray = `${length}`;
            pathRef.current.style.strokeDashoffset = `${length}`;
        }
    }, []);

    return (
        <div className="w-full">
            {/* Title */}
            {title && (
                <div className={`text-center mb-2 transition-all duration-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h3 className="text-lg font-medium text-gray-600">{title}</h3>
                </div>
            )}

            {/* Main Value Display */}
            <div className={`text-center mb-4 transition-all duration-700 delay-300 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="text-4xl font-black text-[#2d3a28]">
                    {currentValue.toFixed(1)}
                </span>
                <span className="text-2xl font-bold text-[#2d3a28] ml-1">{unit}</span>
                {subtitle && (
                    <span className="text-lg text-blue-500 ml-2">on {endLabel}</span>
                )}
            </div>

            {/* SVG Chart */}
            <div className="relative">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto"
                    style={{ overflow: 'visible' }}
                >
                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f87171" />
                            <stop offset="40%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path
                        d={areaD}
                        fill="url(#areaGradient)"
                        className={`transition-all duration-1000 ${isAnimating ? 'animate-area-reveal' : 'opacity-0'}`}
                    />

                    {/* Dashed vertical lines */}
                    <line
                        x1={startX}
                        y1={startY}
                        x2={startX}
                        y2={height - padding.bottom}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        className={`transition-opacity duration-500 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <line
                        x1={endX}
                        y1={endY}
                        x2={endX}
                        y2={height - padding.bottom}
                        stroke="#93c5fd"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        className={`transition-opacity duration-500 delay-1000 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Main curved line */}
                    <path
                        ref={pathRef}
                        d={pathD}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className={isAnimating ? 'animate-draw-line' : ''}
                    />

                    {/* Start point */}
                    <circle
                        cx={startX}
                        cy={startY}
                        r="6"
                        fill="#fecaca"
                        stroke="#f87171"
                        strokeWidth="2"
                        className={`transition-all duration-300 ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                        style={{ transformOrigin: `${startX}px ${startY}px` }}
                    />

                    {/* End point with pulse */}
                    <circle
                        cx={endX}
                        cy={endY}
                        r="8"
                        fill="#dbeafe"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        className={`transition-all duration-300 delay-[2000ms] ${showTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                        style={{ transformOrigin: `${endX}px ${endY}px` }}
                    />
                    {showTooltip && (
                        <circle
                            cx={endX}
                            cy={endY}
                            r="8"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            className="animate-data-pulse"
                            style={{ transformOrigin: `${endX}px ${endY}px` }}
                        />
                    )}

                    {/* Start value label */}
                    <text
                        x={startX}
                        y={startY - 15}
                        textAnchor="start"
                        className={`text-sm font-bold fill-gray-700 transition-opacity duration-500 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {startValue.toFixed(1)} {unit}
                    </text>

                    {/* X-axis labels */}
                    <text
                        x={startX}
                        y={height - padding.bottom + 25}
                        textAnchor="start"
                        className={`text-sm fill-gray-500 transition-opacity duration-500 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {startLabel}
                    </text>
                    <text
                        x={endX}
                        y={height - padding.bottom + 25}
                        textAnchor="end"
                        className={`text-sm fill-gray-500 transition-opacity duration-500 delay-1000 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {endLabel}
                    </text>
                </svg>

                {/* Floating tooltip for end value */}
                {showTooltip && (
                    <div
                        className="absolute animate-tooltip-pop"
                        style={{
                            right: `calc(${(padding.right / width) * 100}% - 30px)`,
                            top: `calc(${((endY - 50) / height) * 100}%)`
                        }}
                    >
                        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg">
                            <span className="font-bold">{endValue.toFixed(1)}</span>
                            <span className="ml-1">{unit}</span>
                        </div>
                        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-transparent border-t-blue-600 mx-auto" />
                    </div>
                )}
            </div>
        </div>
    );
}
