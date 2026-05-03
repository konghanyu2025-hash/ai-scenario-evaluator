import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Scenario Evaluator",
  description: "Scenario-based AI model evaluation workspace."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="text-base font-semibold text-ink">
              AI Scenario Evaluator
            </Link>
            <nav className="flex items-center gap-1 text-sm text-ink/75">
              <Link className="rounded px-3 py-2 hover:bg-white" href="/demo">
                示例
              </Link>
              <Link className="rounded px-3 py-2 hover:bg-white" href="/docs">
                文档
              </Link>
              <Link className="rounded px-3 py-2 hover:bg-white" href="/settings">
                接入
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
