import type { Metadata } from "next";
import RecurringFailures from "../components/RecurringFailures";

export const metadata: Metadata = {
  title: "UTM Desk | Fallas recurrentes",
  description: "Análisis de las fallas más recurrentes del campus.",
};

export default function RecurringFailuresPage() {
  return <RecurringFailures />;
}
