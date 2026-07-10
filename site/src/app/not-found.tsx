import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="heading-machined text-6xl mb-4 text-[var(--amber-core)]">404</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          This page does not exist.
        </p>
        <Link
          href="/"
          className="metal-button px-6 py-3 text-sm rounded-lg inline-block"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
