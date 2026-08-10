import { useEffect, useRef, useState } from 'react';

/**
 * Open/closed state for a popover anchored to a trigger, dismissed the two
 * ways every popover must be: a click outside it, or Escape. Returns the ref
 * to put on the wrapper that contains both trigger and panel.
 */
export function useDismissable<T extends HTMLElement = HTMLDivElement>() {
    const [open, setOpen] = useState(false);
    const ref = useRef<T>(null);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: PointerEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return { ref, open, setOpen };
}
