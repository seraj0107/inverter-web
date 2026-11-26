import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ order = [], children }) {
  const location = useLocation();
  const containerRef = useRef(null);
  const lastPath = useRef(location.pathname);
  const previousIndex = useRef(order.indexOf(location.pathname));

  useLayoutEffect(() => {
    const currentPath = location.pathname;
    if (lastPath.current === currentPath) return;

    const resolvedIndex = (index) => (index === -1 ? order.length : index);
    const currentIndex = resolvedIndex(order.indexOf(currentPath));
    const fromIndex = resolvedIndex(previousIndex.current);

    lastPath.current = currentPath;
    previousIndex.current = currentIndex;

    const node = containerRef.current;
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!node || typeof node.animate !== "function" || reduceMotion) {
      return;
    }

    const offset = currentIndex >= fromIndex ? 48 : -48;
    const animation = node.animate(
      [
        { transform: `translateX(${offset}px)`, opacity: 0 },
        { transform: "translateX(0px)", opacity: 1 },
      ],
      { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );

    return () => animation.cancel();
  }, [location.pathname, order]);

  return (
    <div ref={containerRef} className="min-h-full">
      {children}
    </div>
  );
}
