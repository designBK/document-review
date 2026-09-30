"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type SignaturePadProps = {
  disabled?: boolean;
  onChange: (dataUrl: string | null) => void;
  className?: string;
};

export function SignaturePad({
  disabled = false,
  onChange,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [hasInk, setHasInk] = useState(false);

  onChangeRef.current = onChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function paintSize() {
      const current = canvasRef.current;
      if (!current) return;
      const rect = current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
      const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
      if (current.width === nextWidth && current.height === nextHeight) return;

      const snapshot = hasInkRef.current ? current.toDataURL("image/png") : null;
      current.width = nextWidth;
      current.height = nextHeight;
      const context = current.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2;
      if (!snapshot) return;

      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, rect.width, rect.height);
      };
      image.src = snapshot;
    }

    paintSize();
    const observer = new ResizeObserver(paintSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  function contextFor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2;
    context.strokeStyle = getComputedStyle(canvas).color;
    return context;
  }

  function pointFromEvent(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = contextFor(canvas);
    if (!context) return;
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const point = pointFromEvent(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = contextFor(canvas);
    if (!context) return;
    const point = pointFromEvent(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      setHasInk(true);
    }
  }

  function finishStroke() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas || !hasInkRef.current) {
      onChangeRef.current(null);
      return;
    }
    onChangeRef.current(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    hasInkRef.current = false;
    setHasInk(false);
    onChangeRef.current(null);
  }

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        aria-label="Signature"
        className="h-32 w-full touch-none rounded-md border border-input bg-card text-foreground disabled:opacity-50"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />
      {hasInk ? null : (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Sign here
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute top-2 right-2"
        disabled={disabled || !hasInk}
        onClick={clear}
      >
        Clear
      </Button>
    </div>
  );
}
