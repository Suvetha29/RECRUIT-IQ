import React, { useEffect, useRef, useState } from 'react';

function CountUp({
  from = 0,
  to = 0,
  separator = '',
  direction = 'up',
  duration = 1,
  className = '',
  startCounting = true,
}) {
  const [count, setCount] = useState(direction === 'up' ? from : to);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!startCounting) return;
    if (hasStarted.current) return;
    hasStarted.current = true;

    const startVal = direction === 'up' ? from : to;
    const endVal   = direction === 'up' ? to   : from;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed  = (timestamp - startTimeRef.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setCount(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endVal);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [startCounting, from, to, direction, duration]);

  // Re-trigger if `to` changes after mount (data loads)
  const prevTo = useRef(to);
  useEffect(() => {
    if (prevTo.current !== to && to > 0) {
      hasStarted.current = false;
      startTimeRef.current = null;
      prevTo.current = to;

      const startVal = direction === 'up' ? from : to;
      const endVal   = direction === 'up' ? to   : from;

      const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed  = (timestamp - startTimeRef.current) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        const current  = Math.round(startVal + (endVal - startVal) * eased);
        setCount(current);
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setCount(endVal);
        }
      };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [to, from, direction, duration]);

  const formatted = separator
    ? count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : count.toString();

  return <span className={className}>{formatted}</span>;
}

export default CountUp;