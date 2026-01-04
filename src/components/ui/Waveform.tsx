import React from 'react';
import './Waveform.css';

interface WaveformProps {
    data: number[];
    width: number;
    height: number;
    color?: string;
    backgroundColor?: string;
    progress?: number;
}

export const Waveform: React.FC<WaveformProps> = ({
    data,
    width,
    height,
    color = 'var(--accent-primary)',
    backgroundColor = 'transparent',
    progress,
}) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set actual size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Draw waveform
        const barWidth = width / data.length;
        const centerY = height / 2;

        ctx.fillStyle = color;

        data.forEach((value, i) => {
            const barHeight = value * height * 0.8;
            const x = i * barWidth;
            const y = centerY - barHeight / 2;

            ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight);
        });

        // Draw progress overlay
        if (progress !== undefined && progress > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, 0, width * progress, height);
        }
    }, [data, width, height, color, backgroundColor, progress]);

    return (
        <canvas
            ref={canvasRef}
            className="waveform-canvas"
            style={{ width, height }}
        />
    );
};
