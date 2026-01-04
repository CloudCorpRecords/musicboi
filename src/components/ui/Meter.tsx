import React from 'react';
import './Meter.css';

interface MeterProps {
    level: number; // 0 to 1
    peak?: number;
    height?: number;
    stereo?: boolean;
    leftLevel?: number;
    rightLevel?: number;
}

export const Meter: React.FC<MeterProps> = ({
    level,
    peak,
    height = 100,
    stereo = false,
    leftLevel,
    rightLevel,
}) => {
    const getColor = (value: number) => {
        if (value > 0.9) return 'var(--meter-red)';
        if (value > 0.7) return 'var(--meter-yellow)';
        return 'var(--meter-green)';
    };

    const renderMeter = (value: number, peakValue?: number) => (
        <div className="meter-channel">
            <div className="meter-track" style={{ height }}>
                <div
                    className="meter-fill"
                    style={{
                        height: `${value * 100}%`,
                        background: `linear-gradient(to top, ${getColor(0.3)}, ${getColor(value)})`,
                    }}
                />
                {peakValue !== undefined && (
                    <div
                        className="meter-peak"
                        style={{ bottom: `${peakValue * 100}%` }}
                    />
                )}
                {/* LED segments */}
                <div className="meter-segments">
                    {[...Array(16)].map((_, i) => (
                        <div
                            key={i}
                            className={`meter-segment ${(i / 16) < value ? 'active' : ''}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className={`meter ${stereo ? 'stereo' : ''}`}>
            {stereo ? (
                <>
                    {renderMeter(leftLevel ?? 0)}
                    {renderMeter(rightLevel ?? 0)}
                </>
            ) : (
                renderMeter(level, peak)
            )}
        </div>
    );
};

// Hook to get real-time meter levels from an analyser node
export const useMeterLevel = (analyser: AnalyserNode | null) => {
    const [level, setLevel] = React.useState(0);
    const [peak, setPeak] = React.useState(0);
    const peakHoldTime = React.useRef(0);

    React.useEffect(() => {
        if (!analyser) return;

        const dataArray = new Float32Array(analyser.frequencyBinCount);
        let animationId: number;

        const update = () => {
            analyser.getFloatTimeDomainData(dataArray);

            // Calculate RMS
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const db = 20 * Math.log10(rms);
            const normalizedLevel = Math.max(0, Math.min(1, (db + 60) / 60));

            setLevel(normalizedLevel);

            // Peak hold
            if (normalizedLevel > peak || Date.now() - peakHoldTime.current > 1500) {
                setPeak(normalizedLevel);
                peakHoldTime.current = Date.now();
            }

            animationId = requestAnimationFrame(update);
        };

        update();

        return () => cancelAnimationFrame(animationId);
    }, [analyser, peak]);

    return { level, peak };
};
