import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BrandLogo({
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
}: BrandLogoProps) {
  return (
    <div className={joinClasses("flex items-center gap-3", className)}>
      <div className={joinClasses("relative h-9 w-11 shrink-0", markClassName)}>
        <Image
          src="/brand/logo-mark.png"
          alt="clawREFORM logo mark"
          fill
          sizes="(max-width: 768px) 44px, 56px"
          className="object-contain object-center drop-shadow-[0_10px_22px_rgba(0,0,0,0.58)]"
        />
      </div>
      {showWordmark ? (
        <div className={joinClasses("leading-none", wordmarkClassName)}>
          <span className="block text-[0.72rem] font-medium tracking-[0.16em] text-[var(--text-tertiary)] uppercase transition-colors duration-200">
            aegntic.ai
          </span>
          <span className="block text-[1.15rem] font-black tracking-[-0.04em] text-[var(--text-primary)] transition-colors duration-200">
            clawREFORM
          </span>
        </div>
      ) : null}
    </div>
  );
}
