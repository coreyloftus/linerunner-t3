import { notFound } from "next/navigation";
import { ScriptImportHarness } from "./harness";

// Dev-only page to try ScriptPdfImport on its own
export default function ScriptImportDevPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ScriptImportHarness />;
}
