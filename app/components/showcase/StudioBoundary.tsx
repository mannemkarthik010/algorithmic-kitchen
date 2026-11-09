"use client";
import { Component, type ReactNode } from "react";

/** If the chart library throws at runtime, show the original SVG chart instead of a blank panel. */
export class StudioBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.error("ForecastStudio failed, using the fallback chart", err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
