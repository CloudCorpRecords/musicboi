import React from 'react';
import './Fader.css';

interface FaderProps {
    value: number;
    min?: number;
    max?: number;
    height?: number;
    label?: string;
    onChange: (value: number) => void;
    formatValue?: (value: number) => string;
}

export const Fader: React.FC<FaderProps> = ({
    value,
    min = 0,
    max = 1,
    height = 120,
    label,
    onChange,
    formatValue = (v) => `${Math.round(v * 100)}%`,
}) => {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef(false);

    const normalizedValue = (value - min) / (max - min);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        updateValue(e.clientY);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !trackRef.current) return;
        updateValue(e.clientY);
    };

    const updateValue = (clientY: number) => {
        if (!trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        const percentage = 1 - (clientY - rect.top) / rect.height;
        const clampedPercentage = Math.max(0, Math.min(1, percentage));
        const newValue = min + clampedPercentage * (max - min);
        onChange(newValue);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleDoubleClick = () => {
        onChange(0.8); // Reset to default
    };

    return (
        <div className="fader-container" style={{ height: height + 50 }}>
            {label && <span className="fader-label">{label}</span>}
            <div
                ref={trackRef}
                className="fader-track"
                style={{ height }}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
            >
                <div className="fader-fill" style={{ height: `${normalizedValue * 100}%` }} />
                <div
                    className="fader-handle"
                    style={{ bottom: `calc(${normalizedValue * 100}% - 8px)` }}
                />
                {/* dB scale markers */}
                <div className="fader-markers">
                    <span style={{ bottom: '100%' }}>0</span>
                    <span style={{ bottom: '75%' }}>-6</span>
                    <span style={{ bottom: '50%' }}>-12</span>
                    <span style={{ bottom: '25%' }}>-24</span>
                    <span style={{ bottom: '0%' }}>-∞</span>
                </div>
            </div>
            <span className="fader-value">{formatValue(value)}</span>
        </div>
    );
};
