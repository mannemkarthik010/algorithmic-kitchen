import type { Metadata } from "next";
import LabPage from "../components/LabPage";

export const metadata: Metadata = {
  title: "The Lab | Karthik Mannem",
  description: "Games, a bookshelf, and experiments from Karthik Mannem. The optional side of the portfolio.",
  alternates: { canonical: "/lab" },
};

export default function Page() {
  return <LabPage />;
}
