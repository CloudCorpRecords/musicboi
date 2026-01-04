import React from 'react';
import './Knob.css';

interface KnobProps {
    value: number;
    min?: number;
    max?: number;
    size?: number;
    label?: string;
    onChange: (value: number) => void;
    formatValue?: (value: number) => string;
}

export const Knob: React.FC<KnobProps> = ({
    value,
    min = 0,
    max = 1,
    size = 40,
    label,
    onChange,
    formatValue = (v) => v.toFixed(2),
}) => {
    const knobRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef(false);
    const startY = React.useRef(0);
    const startValue = React.useRef(0);

    // Calculate rotation angle (-135 to 135 degrees)
    const normalizedValue = (value - min) / (max - min);
    const rotation = -135 + normalizedValue * 270;

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        startY.current = e.clientY;
        startValue.current = value;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;

        const delta = startY.current - e.clientY;
        const sensitivity = (max - min) / 100;
        const newValue = Math.max(min, Math.min(max, startValue.current + delta * sensitivity));
        onChange(newValue);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleDoubleClick = () => {
        // Reset to default (center or 0)
        const defaultValue = min + (max - min) / 2;
        onChange(defaultValue);
    };

    return (
        <div className="knob-container" style={{ width: size }}>
            {label && <span className="knob-label">{label}</span>}
            <div
                ref={knobRef}
                className="knob"
                style={{ width: size, height: size }}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
            >
                <svg viewBox="0 0 100 100" className="knob-svg">
                    {/* Track */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="var(--bg-tertiary)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="188.5"
                        strokeDashoffset="47"
                        transform="rotate(135 50 50)"
                    />
                    {/* Value arc */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="var(--accent-primary)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${normalizedValue * 188.5} 188.5`}
                        strokeDashoffset="0"
                        transform="rotate(135 50 50)"
                    />
                    {/* Knob body */}
                    <circle cx="50" cy="50" r="30" fill="var(--bg-elevated)" />
                    {/* Indicator line */}
                    <line
                        x1="50"
                        y1="25"
                        x2="50"
                        y2="35"
                        stroke="var(--text-primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        transform={`rotate(${rotation} 50 50)`}
                    />
                </svg>
            </div>
            <span className="knob-value">{formatValue(value)}</span>
        </div>
    );
};
