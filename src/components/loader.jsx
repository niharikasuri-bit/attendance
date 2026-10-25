import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import lottie from "lottie-web/build/player/lottie_light";
import dotsLight from "@/assets/loader-dots-light.json";

/**
 * The DIGIT design system's overlay loader (design.digit.org/docs/components/loader): it dims the page
 * and blocks it while content loads or an action runs, like generating or uploading. It uses DIGIT's own
 * animation, dots chasing round a circle, in white.
 * - `Loader`: while a page's content loads.
 * - `useOverlayLoader()`: while an action runs.
 */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function Animation({ data, size }) {
  const ref = useRef(null);
  useEffect(() => {
    const anim = lottie.loadAnimation({ container: ref.current, renderer: "svg", loop: true, autoplay: true, animationData: data });
    return () => anim.destroy();
  }, [data]);
  return <div ref={ref} aria-hidden="true" style={{ width: size, height: size }} />;
}

/** Loader for content that's loading, shown on the same dimmed overlay as every other loader. */
export function Loader({ text }) {
  return <OverlayLoader text={text} />;
}

/** Shows the default loader for a moment when a page opens, as if its data were being fetched. */
export function usePageLoading(ms = 800) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

function OverlayLoader({ text }) {
  const ref = useRef(null);
  // Block the page underneath: nothing behind the overlay can be clicked or tabbed to.
  useEffect(() => {
    const root = document.getElementById("root");
    const active = document.activeElement;
    root?.setAttribute("inert", "");
    ref.current?.focus();
    return () => {
      root?.removeAttribute("inert");
      if (active instanceof HTMLElement && document.contains(active)) active.focus();
    };
  }, []);
  return createPortal(
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-live="assertive"
      className="pointer-events-auto fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-1 bg-[rgb(11_12_12/0.7)] outline-none backdrop-blur-[2px] animate-in fade-in motion-reduce:animate-none"
    >
      <Animation data={dotsLight} size="7.5rem" />
      {text && <p className="px-6 text-center text-base font-medium text-white">{text}</p>}
    </div>,
    document.body,
  );
}

const LoaderCtx = createContext(null);

export function LoaderProvider({ children }) {
  const [text, setText] = useState(null);
  // Shows the overlay loader for `minMs` (the time the work would take), then runs `task`, so its
  // result, like a download or the updated list, appears as the overlay closes.
  const withLoader = useCallback(async (loaderText, task, minMs = 1000) => {
    setText(loaderText);
    try {
      await wait(minMs);
      return await task?.();
    } finally {
      setText(null);
    }
  }, []);
  return (
    <LoaderCtx.Provider value={withLoader}>
      {children}
      {text && <OverlayLoader text={text} />}
    </LoaderCtx.Provider>
  );
}

/** `withLoader(text, task, minMs)`: show the overlay loader while `task` runs. */
export const useOverlayLoader = () => useContext(LoaderCtx);
