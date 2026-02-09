import { useState, useEffect, RefObject } from 'react';

const useIntersectionObserver = <T extends Element>(elementRef: RefObject<T | null>, threshold = 0.1) => {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
            },
            { threshold }
        );

        observer.observe(element);
        return () => {
            observer.unobserve(element);
            observer.disconnect();
        };
    }, [elementRef, threshold]);

    return isIntersecting;
};

export default useIntersectionObserver;
