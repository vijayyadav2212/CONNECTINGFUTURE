import { useState, useEffect } from 'react';

const useAnimatedCounter = (end: number, duration = 2000, trigger = true) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!trigger) return;

        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    }, [end, duration, trigger]);

    return count;
};

export default useAnimatedCounter;
