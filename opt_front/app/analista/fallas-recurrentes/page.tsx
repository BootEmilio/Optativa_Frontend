import type { Metadata } from "next";
import RecurringFailures from "../components/RecurringFailures";

export const metadata: Metadata = {
  title: "UTM Desk | Fallas recurrentes",
  description: "Análisis de las fallas más recurrentes del campus.",
};

export const instant = false;

export default function RecurringFailuresPage() {
  return <RecurringFailures />;
}
